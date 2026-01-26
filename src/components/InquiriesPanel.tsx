import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChatWindow } from './ChatWindow';
import { 
  MessageCircle, ShoppingBag, Briefcase, User, Clock, 
  CheckCircle2, Loader2, Bell
} from 'lucide-react';
import { format } from 'date-fns';

interface Inquiry {
  id: string;
  user_id: string;
  company_id: string;
  product_id: string | null;
  job_id: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
  products?: {
    name: string;
  } | null;
  jobs?: {
    title: string;
  } | null;
}

interface InquiriesPanelProps {
  companyId: string;
}

export const InquiriesPanel = ({ companyId }: InquiriesPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();

    // Subscribe to new inquiries
    const channel = supabase
      .channel(`inquiries-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiries',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          toast({
            title: 'New Inquiry!',
            description: 'Someone just expressed interest in your listing.',
          });
          fetchInquiries();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inquiries',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchInquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        profiles:user_id(full_name, email),
        products:product_id(name),
        jobs:job_id(title)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load inquiries.',
        variant: 'destructive',
      });
    } else {
      setInquiries(data as unknown as Inquiry[]);
    }
    setLoading(false);
  };

  const markAsRead = async (inquiryId: string) => {
    await supabase
      .from('inquiries')
      .update({ status: 'read' })
      .eq('id', inquiryId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'replied':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'read':
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

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
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Inquiries
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Users interested in your products and jobs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No inquiries yet</p>
              <p className="text-sm">When users show interest, they'll appear here</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      inquiry.status === 'pending'
                        ? 'border-warning/50 bg-warning/5'
                        : 'border-border bg-secondary/30 hover:bg-secondary/50'
                    } ${activeChat?.id === inquiry.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      setActiveChat(inquiry);
                      if (inquiry.status === 'pending') {
                        markAsRead(inquiry.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {inquiry.profiles?.full_name || inquiry.profiles?.email || 'Unknown User'}
                        </span>
                      </div>
                      {getStatusIcon(inquiry.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {inquiry.products ? (
                        <>
                          <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{inquiry.products.name}</span>
                        </>
                      ) : inquiry.jobs ? (
                        <>
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{inquiry.jobs.title}</span>
                        </>
                      ) : null}
                    </div>
                    
                    {inquiry.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {inquiry.message}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(inquiry.created_at), 'MMM d, HH:mm')}
                      </span>
                      <Button size="sm" variant="ghost">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Chat Panel */}
      <div>
        {activeChat ? (
          <ChatWindow
            inquiry={activeChat}
            otherPartyName={activeChat.profiles?.full_name || activeChat.profiles?.email || 'User'}
            onClose={() => setActiveChat(null)}
          />
        ) : (
          <Card className="h-[500px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select an inquiry to start chatting</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
