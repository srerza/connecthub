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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Plus, Briefcase, ShoppingBag, LogOut, Home,
  Clock, CheckCircle2, XCircle, Loader2
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, signOut, loading } = useAuth();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    // Fetch user's company
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (companyData) {
      setCompany(companyData);
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });
      
      if (productsData) setProducts(productsData);
      
      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });
      
      if (jobsData) setJobs(jobsData);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || company.status !== 'approved') return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('products').insert({
      company_id: company.id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price ? parseFloat(newProduct.price) : null,
      category: newProduct.category,
    });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add product.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Product added successfully!' });
      setNewProduct({ name: '', description: '', price: '', category: '' });
      setIsProductDialogOpen(false);
      fetchCompanyData();
    }
    
    setIsSubmitting(false);
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || company.status !== 'approved') return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: newJob.title,
      description: newJob.description,
      location: newJob.location,
      job_type: newJob.job_type as 'full-time' | 'part-time' | 'contract' | 'remote',
      salary_range: newJob.salary_range,
      requirements: newJob.requirements,
    });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add job.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Job posted successfully!' });
      setNewJob({ title: '', description: '', location: '', job_type: 'full-time', salary_range: '', requirements: '' });
      setIsJobDialogOpen(false);
      fetchCompanyData();
    }
    
    setIsSubmitting(false);
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
                            <h4 className="font-medium">{job.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              {job.job_type && <Badge variant="secondary">{job.job_type}</Badge>}
                              {job.location && (
                                <span className="text-xs text-muted-foreground">{job.location}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
