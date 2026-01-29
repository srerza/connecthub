import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Loader2, User, Bot, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  requires_admin: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface Message {
  id: string;
  sender_type: 'user' | 'bot' | 'admin';
  sender_id: string | null;
  message: string;
  created_at: string;
}

export const SupportTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`admin-support-${selectedConv.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `conversation_id=eq.${selectedConv.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('support_conversations')
      .select('*, profiles(full_name, email)')
      .order('requires_admin', { ascending: false })
      .order('updated_at', { ascending: false });

    if (data) {
      setConversations(data as unknown as Conversation[]);
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
    if (!newMessage.trim() || !selectedConv || !user) return;

    setSending(true);

    const { error } = await supabase.from('support_messages').insert({
      conversation_id: selectedConv.id,
      sender_type: 'admin',
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } else {
      // Mark as no longer requiring admin if we've responded
      if (selectedConv.requires_admin) {
        await supabase
          .from('support_conversations')
          .update({ requires_admin: false })
          .eq('id', selectedConv.id);
        
        setSelectedConv({ ...selectedConv, requires_admin: false });
        fetchConversations();
      }
      setNewMessage('');
    }

    setSending(false);
  };

  const markResolved = async (convId: string) => {
    const { error } = await supabase
      .from('support_conversations')
      .update({ status: 'resolved' })
      .eq('id', convId);

    if (!error) {
      toast({ title: 'Conversation marked as resolved' });
      fetchConversations();
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Support Conversations
        </CardTitle>
        <CardDescription>Respond to user support requests forwarded from the chatbot</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 h-[500px]">
          {/* Conversation List */}
          <div className="border border-border rounded-lg overflow-hidden">
            <ScrollArea className="h-full">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-secondary/50 ${
                        selectedConv?.id === conv.id ? 'bg-secondary' : ''
                      }`}
                      onClick={() => setSelectedConv(conv)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">
                          {conv.profiles?.full_name || conv.profiles?.email || 'Unknown'}
                        </span>
                        {conv.requires_admin && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Needs Response
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.updated_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 border border-border rounded-lg flex flex-col">
            {selectedConv ? (
              <>
                {/* Header */}
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedConv.profiles?.full_name || selectedConv.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.profiles?.email}
                    </p>
                  </div>
                  {selectedConv.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markResolved(selectedConv.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Mark Resolved
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${msg.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            msg.sender_type === 'admin' 
                              ? 'bg-primary text-primary-foreground' 
                              : msg.sender_type === 'bot'
                              ? 'bg-secondary'
                              : 'bg-accent'
                          }`}>
                            {msg.sender_type === 'admin' ? (
                              <User className="w-4 h-4" />
                            ) : msg.sender_type === 'bot' ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              msg.sender_type === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your response..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a conversation to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
