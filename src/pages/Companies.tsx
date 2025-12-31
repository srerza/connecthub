import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Search, Globe, Briefcase, ShoppingBag, CheckCircle2 
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  _count?: {
    products: number;
    jobs: number;
  };
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Fetch counts for each company
      const companiesWithCounts = await Promise.all(
        data.map(async (company) => {
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          
          const { count: jobsCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);
          
          return {
            ...company,
            _count: {
              products: productsCount || 0,
              jobs: jobsCount || 0,
            }
          };
        })
      );
      
      setCompanies(companiesWithCounts);
    }
    setLoading(false);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">ConnectHub</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">Products</Link>
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">Jobs</Link>
            <Link to="/companies" className="text-foreground font-medium">Companies</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth?mode=register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-24 pb-12 px-4 gradient-hero">
        <div className="container mx-auto">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Verified <span className="text-gradient">Companies</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Explore trusted businesses in our network
            </p>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                className="pl-12 h-14 text-lg bg-card"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold">
              {filteredCompanies.length} Companies
            </h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new companies'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-semibold truncate group-hover:text-primary transition-colors">
                            {company.name}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {company.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="secondary" className="gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {company._count?.products || 0} Products
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Briefcase className="w-3 h-3" />
                        {company._count?.jobs || 0} Jobs
                      </Badge>
                    </div>
                    
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        Visit Website
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Companies;
