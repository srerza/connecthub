import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MediaUpload } from '@/components/MediaUpload';
import { InquiriesPanel } from '@/components/InquiriesPanel';
import { CompanyWallet } from '@/components/CompanyWallet';
import { 
  Building2, Plus, Briefcase, ShoppingBag, LogOut, Home,
  Clock, CheckCircle2, XCircle, Loader2, MessageCircle, Image as ImageIcon, Trash2, Wallet, CreditCard, Star, Zap, Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Company {
  id: string;
  name: string;
  description: string | null;
  status: string;
  subscription_plan_id: string | null;
  subscription_expires_at: string | null;
  subscription_started_at: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
}

interface ProductMedia {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  product_media?: ProductMedia[];
}

interface JobMedia {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  job_media?: JobMedia[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, signOut, loading } = useAuth();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productMedia, setProductMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [jobMedia, setJobMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category: ''
  });
  
  const [newJob, setNewJob] = useState({
    title: '', description: '', location: '', job_type: 'full-time', salary_range: '', requirements: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    // Fetch subscription plans
    const { data: plansData } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });
    if (plansData) setSubscriptionPlans(plansData as unknown as SubscriptionPlan[]);

    // Fetch user's company
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (companyData) {
      setCompany(companyData as unknown as Company);
      
      // Fetch products with media
      const { data: productsData } = await supabase
        .from('products')
        .select('*, product_media(*)')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });
      
      if (productsData) setProducts(productsData as unknown as Product[]);
      
      // Fetch jobs with media
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, job_media(*)')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });
      
      if (jobsData) setJobs(jobsData as unknown as Job[]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || company.status !== 'approved') return;
    
    setIsSubmitting(true);
    
    const { data: productData, error } = await supabase.from('products').insert({
      company_id: company.id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price ? parseFloat(newProduct.price) : null,
      category: newProduct.category,
    }).select().single();
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add product.',
        variant: 'destructive',
      });
    } else {
      // Add media files
      if (productMedia.length > 0 && productData) {
        const mediaInserts = productMedia.map(media => ({
          product_id: productData.id,
          media_url: media.url,
          media_type: media.type,
        }));
        await supabase.from('product_media').insert(mediaInserts);
      }
      
      toast({ title: 'Product added successfully!' });
      setNewProduct({ name: '', description: '', price: '', category: '' });
      setProductMedia([]);
      setIsProductDialogOpen(false);
      fetchCompanyData();
    }
    
    setIsSubmitting(false);
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || company.status !== 'approved') return;
    
    setIsSubmitting(true);
    
    const { data: jobData, error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: newJob.title,
      description: newJob.description,
      location: newJob.location,
      job_type: newJob.job_type as 'full-time' | 'part-time' | 'contract' | 'remote',
      salary_range: newJob.salary_range,
      requirements: newJob.requirements,
    }).select().single();
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add job.',
        variant: 'destructive',
      });
    } else {
      // Add media files
      if (jobMedia.length > 0 && jobData) {
        const mediaInserts = jobMedia.map(media => ({
          job_id: jobData.id,
          media_url: media.url,
          media_type: media.type,
        }));
        await supabase.from('job_media').insert(mediaInserts);
      }
      
      toast({ title: 'Job posted successfully!' });
      setNewJob({ title: '', description: '', location: '', job_type: 'full-time', salary_range: '', requirements: '' });
      setJobMedia([]);
      setIsJobDialogOpen(false);
      fetchCompanyData();
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    // Delete associated media first
    await supabase.from('product_media').delete().eq('product_id', productId);
    // Delete the product
    const { error } = await supabase.from('products').delete().eq('id', productId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Product deleted successfully!' });
      fetchCompanyData();
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    // Delete associated media first
    await supabase.from('job_media').delete().eq('job_id', jobId);
    // Delete the job
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Job deleted successfully!' });
      fetchCompanyData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Dashboard</h1>
              <p className="text-xs text-muted-foreground">{company?.name || 'ConnectHub'}</p>
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
        {!company ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>No Company Registered</CardTitle>
              <CardDescription>
                You haven't registered a company yet. Register one to start posting products and jobs.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="hero" asChild>
                <Link to="/auth?mode=register&type=company">Register Company</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Company Status */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">{company.name}</h2>
                      <p className="text-muted-foreground">{company.description || 'No description'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(company.status)}
                    <Badge
                      variant={
                        company.status === 'approved' ? 'default' :
                        company.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                {company.status === 'pending' && (
                  <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-sm text-warning">
                      Your company registration is pending approval. You'll be able to post products and jobs once approved.
                    </p>
                  </div>
                )}
                
                {company.status === 'rejected' && (
                  <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                      Your company registration was rejected. Please contact support for more information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {company.status === 'approved' && (
              <Tabs defaultValue="subscription" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="subscription" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Subscription
                  </TabsTrigger>
                  <TabsTrigger value="listings" className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Products & Jobs
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Wallet
                  </TabsTrigger>
                  <TabsTrigger value="inquiries" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Inquiries
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="subscription">
                  <div className="space-y-6">
                    {/* Current Plan Status */}
                    {company.subscription_plan_id && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-display">Current Subscription</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-lg">
                                {subscriptionPlans.find(p => p.id === company.subscription_plan_id)?.name || 'Active Plan'}
                              </p>
                              {company.subscription_expires_at && (
                                <p className="text-sm text-muted-foreground">
                                  Expires: {format(new Date(company.subscription_expires_at), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            <Badge className={
                              company.subscription_expires_at && new Date(company.subscription_expires_at) > new Date()
                                ? 'bg-success/10 text-success'
                                : 'bg-destructive/10 text-destructive'
                            }>
                              {company.subscription_expires_at && new Date(company.subscription_expires_at) > new Date()
                                ? 'Active'
                                : 'Expired'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Plan Selection */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {subscriptionPlans.map((plan, index) => {
                        const icons = [<Star key="s" className="w-6 h-6" />, <Zap key="z" className="w-6 h-6" />, <Crown key="c" className="w-6 h-6" />];
                        const isCurrentPlan = company.subscription_plan_id === plan.id;
                        
                        return (
                          <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${index === 2 ? 'border-primary' : ''}`}>
                            {index === 2 && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                              </div>
                            )}
                            <CardHeader className="text-center">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                                {icons[index] || icons[0]}
                              </div>
                              <CardTitle className="font-display">{plan.name}</CardTitle>
                              <div className="mt-2">
                                <span className="text-3xl font-bold">UGX {plan.price.toLocaleString()}</span>
                                <span className="text-muted-foreground">/{plan.duration_days} days</span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              <Button
                                variant={isCurrentPlan ? 'outline' : 'hero'}
                                className="w-full"
                                disabled={isCurrentPlan}
                              >
                                {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      To subscribe, deposit funds to your wallet and contact admin for plan activation.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="wallet">
                  <CompanyWallet companyId={company.id} />
                </TabsContent>
                
                <TabsContent value="listings">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Products Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-display flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Products
                      </CardTitle>
                      <CardDescription>{products.length} products listed</CardDescription>
                    </div>
                    
                    <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Product</DialogTitle>
                          <DialogDescription>Add a product to your catalog</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Product Name</Label>
                            <Input
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={newProduct.description}
                              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Input
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Photos & Videos</Label>
                            <MediaUpload
                              bucket="product-media"
                              existingMedia={productMedia}
                              onUpload={(url, type) => setProductMedia([...productMedia, { url, type }])}
                              onRemove={(url) => setProductMedia(productMedia.filter(m => m.url !== url))}
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Add Product
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No products yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.map((product) => (
                          <div key={product.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{product.name}</h4>
                                  {product.price && (
                                    <span className="font-semibold text-primary">${product.price}</span>
                                  )}
                                </div>
                                {product.category && (
                                  <Badge variant="secondary" className="mt-2">{product.category}</Badge>
                                )}
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Jobs Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-display flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Job Listings
                      </CardTitle>
                      <CardDescription>{jobs.length} jobs posted</CardDescription>
                    </div>
                    
                    <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Post Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Post New Job</DialogTitle>
                          <DialogDescription>Create a job listing for your company</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddJob} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                              value={newJob.title}
                              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={newJob.description}
                              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Location</Label>
                              <Input
                                value={newJob.location}
                                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Job Type</Label>
                              <Select
                                value={newJob.job_type}
                                onValueChange={(v) => setNewJob({ ...newJob, job_type: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full-time">Full-time</SelectItem>
                                  <SelectItem value="part-time">Part-time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="remote">Remote</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Salary Range</Label>
                            <Input
                              placeholder="e.g., $50,000 - $70,000"
                              value={newJob.salary_range}
                              onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Photos & Videos</Label>
                            <MediaUpload
                              bucket="job-media"
                              existingMedia={jobMedia}
                              onUpload={(url, type) => setJobMedia([...jobMedia, { url, type }])}
                              onRemove={(url) => setJobMedia(jobMedia.filter(m => m.url !== url))}
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Post Job
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {jobs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No jobs posted yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {jobs.map((job) => (
                          <div key={job.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{job.title}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  {job.job_type && <Badge variant="secondary">{job.job_type}</Badge>}
                                  {job.location && (
                                    <span className="text-xs text-muted-foreground">{job.location}</span>
                                  )}
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Job</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{job.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteJob(job.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
                </TabsContent>
                
                <TabsContent value="inquiries">
                  <InquiriesPanel companyId={company.id} />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
