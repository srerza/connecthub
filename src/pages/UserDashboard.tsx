import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChatWindow } from '@/components/ChatWindow';
import { 
  User, MessageCircle, ShoppingBag, Briefcase, 
  Clock, CheckCircle2, LogOut, Home, Loader2
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

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, signOut, loading } = useAuth();
  
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeChat, setActiveChat] = useState<Inquiry | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '' });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToInquiries();
    }
  }, [user]);

  const subscribeToInquiries = () => {
    const channel = supabase
      .channel(`user-inquiries-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiries',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchInquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    await Promise.all([fetchProfile(), fetchInquiries()]);
    setLoadingData(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single();
    
    if (data) {
      setProfile(data);
      setProfileForm({ full_name: data.full_name || '' });
    }
  };

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        companies:company_id(name),
        products:product_id(name),
        jobs:job_id(title)
      `)
      .eq('user_id', user!.id)
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
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileForm.full_name })
      .eq('id', user!.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Profile updated!' });
      setEditingProfile(false);
      fetchProfile();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingReplies = inquiries.filter(i => i.status === 'replied').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">My Dashboard</h1>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Welcome, {profile?.full_name || 'User'}!
                </h2>
                <p className="text-muted-foreground">
                  Track your inquiries and chat with companies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="inquiries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inquiries" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              My Inquiries
              {pendingReplies > 0 && (
                <Badge variant="destructive" className="ml-1">{pendingReplies}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">My Inquiries</CardTitle>
                  <CardDescription>
                    Products and jobs you've expressed interest in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {inquiries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No inquiries yet</p>
                      <p className="text-sm">Browse products and jobs to get started</p>
                      <Button variant="hero" size="sm" className="mt-4" asChild>
                        <Link to="/">Browse Listings</Link>
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {inquiries.map((inquiry) => (
                          <div
                            key={inquiry.id}
                            className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                              inquiry.status === 'replied'
                                ? 'border-success/50 bg-success/5'
                                : 'border-border bg-secondary/30 hover:bg-secondary/50'
                            } ${activeChat?.id === inquiry.id ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setActiveChat(inquiry)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {inquiry.companies?.name || 'Company'}
                                </span>
                              </div>
                              {getStatusBadge(inquiry.status)}
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
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getStatusIcon(inquiry.status)}
                              </div>
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
                    otherPartyName={activeChat.companies?.name || 'Company'}
                    onClose={() => setActiveChat(null)}
                  />
                ) : (
                  <Card className="h-[500px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Select an inquiry to view chat</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle className="font-display">Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ''} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {editingProfile ? (
                    <div className="flex gap-2">
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                      <Button onClick={updateProfile}>Save</Button>
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input value={profile?.full_name || 'Not set'} disabled />
                      <Button variant="outline" onClick={() => setEditingProfile(true)}>
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
