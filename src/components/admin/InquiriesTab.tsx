import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, ShoppingBag, Briefcase, Building2, User, Clock, CheckCircle2, Loader2 } from 'lucide-react';
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
  profiles?: {
    full_name: string | null;
    email: string;
  };
  companies?: {
    name: string;
  };
  products?: {
    name: string;
  } | null;
  jobs?: {
    title: string;
  } | null;
}

export const InquiriesTab = () => {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        profiles:user_id(full_name, email),
        companies:company_id(name),
        products:product_id(name),
        jobs:job_id(title)
      `)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'replied':
        return <Badge className="bg-success/10 text-success border-success/20">Replied</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    }
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Platform Inquiries
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Monitor all engagement across the platform</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {inquiries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No inquiries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {inquiry.profiles?.full_name || inquiry.profiles?.email || 'Unknown User'}
                      </span>
                      {getStatusIcon(inquiry.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span>→ {inquiry.companies?.name || 'Unknown Company'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {inquiry.products ? (
                        <>
                          <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">Product: {inquiry.products.name}</span>
                        </>
                      ) : inquiry.jobs ? (
                        <>
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">Job: {inquiry.jobs.title}</span>
                        </>
                      ) : null}
                    </div>
                    
                    {inquiry.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">
                        "{inquiry.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(inquiry.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(inquiry.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
