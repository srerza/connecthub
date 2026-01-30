import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Loader2, X, Bot, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender_type: 'user' | 'bot' | 'admin';
  message: string;
  created_at: string;
}

export const SupportChatbot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      initConversation();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`support-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates by checking both id and message content
            if (prev.find(m => m.id === newMsg.id || (m.message === newMsg.message && m.sender_type === newMsg.sender_type))) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const initConversation = async () => {
    if (!user) return;
    setLoading(true);

    // Check for existing active conversation
    const { data: existing } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
      await fetchMessages(existing.id);
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('support_conversations')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to start support chat.',
          variant: 'destructive',
        });
      } else if (newConv) {
        // Add welcome message first
        const welcomeMessage = {
          id: crypto.randomUUID(),
          sender_type: 'bot' as const,
          message: "👋 Hello! I'm ConnectHub's support assistant. How can I help you today?\n\nI can help with:\n- Platform navigation\n- Registration questions\n- Wallet & deposits\n- Job and product listings\n\nIf you need to speak with a human, just type **'talk to admin'**.",
          created_at: new Date().toISOString(),
        };
        
        // Set welcome message immediately in UI
        setMessages([welcomeMessage]);
        setConversationId(newConv.id);
        
        // Then persist to database (don't await to avoid blocking UI)
        supabase.from('support_messages').insert({
          conversation_id: newConv.id,
          sender_type: 'bot',
          message: welcomeMessage.message,
        });
      }
    }

    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistically add user message to UI immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender_type: 'user',
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to database
    const { error: msgError } = await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      sender_type: 'user',
      sender_id: user.id,
      message: messageText,
    });

    if (msgError) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setSending(false);
      return;
    }

    // Get AI response
    try {
      const response = await supabase.functions.invoke('support-chat', {
        body: {
          message: messageText,
          conversationId,
          userId: user.id,
        },
      });

      if (response.error) {
        throw response.error;
      }

      // Add bot response to UI immediately
      if (response.data?.response) {
        const botMessage: Message = {
          id: crypto.randomUUID(),
          sender_type: 'bot',
          message: response.data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMessage]);

        // Persist bot response to database (background)
        supabase.from('support_messages').insert({
          conversation_id: conversationId,
          sender_type: 'bot',
          message: response.data.response,
        });
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      // Add error message to UI
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender_type: 'bot',
        message: "I'm having trouble processing your request right now. Please try again or type 'talk to admin' to speak with our support team.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Persist error message to database
      supabase.from('support_messages').insert({
        conversation_id: conversationId,
        sender_type: 'bot',
        message: errorMessage.message,
      });
    }

    setSending(false);
  };

  const getSenderIcon = (type: string) => {
    switch (type) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'bot':
        return <Bot className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-card rounded-xl border border-border shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium text-sm">Support Chat</span>
                <p className="text-xs text-muted-foreground">We're here to help</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.sender_type === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          msg.sender_type === 'admin' 
                            ? 'bg-primary text-primary-foreground' 
                            : msg.sender_type === 'bot'
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-accent text-accent-foreground'
                        }`}>
                          {getSenderIcon(msg.sender_type)}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl ${
                            isUser
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : msg.sender_type === 'admin'
                              ? 'bg-primary/10 border border-primary/20 rounded-bl-sm'
                              : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                          }`}
                        >
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.message}</ReactMarkdown>
                          </div>
                          <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="px-3 py-2 rounded-2xl bg-secondary rounded-bl-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || loading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
