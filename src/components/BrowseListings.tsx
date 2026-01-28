import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { InterestModal } from './InterestModal';
import { 
  ShoppingBag, Briefcase, MapPin, DollarSign, Building2, 
  Search, Loader2, Play, Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  company_id: string;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  product_media: {
    media_url: string;
    media_type: string;
  }[];
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  company_id: string;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  job_media: {
    media_url: string;
    media_type: string;
  }[];
}

export const BrowseListings = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [interestModal, setInterestModal] = useState<{
    open: boolean;
    type: 'product' | 'job';
    itemId: string;
    itemName: string;
    companyId: string;
    companyName: string;
  } | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const [productsResult, jobsResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          companies!inner(id, name, logo_url, status),
          product_media(media_url, media_type)
        `)
        .eq('companies.status', 'approved')
        .order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select(`
          *,
          companies!inner(id, name, logo_url, status),
          job_media(media_url, media_type)
        `)
        .eq('companies.status', 'approved')
        .order('created_at', { ascending: false }),
    ]);

    if (productsResult.data) setProducts(productsResult.data as unknown as Product[]);
    if (jobsResult.data) setJobs(jobsResult.data as unknown as Job[]);
    setLoading(false);
  };

  const getMediaPreview = (media: { media_url: string; media_type: string }[]) => {
    if (media.length === 0) return null;
    return media[0];
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companies.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.companies.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.location && j.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products, jobs, or companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Products ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Jobs ({filteredJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const media = getMediaPreview(product.product_media);
                return (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all">
                    <div className="aspect-video relative bg-secondary overflow-hidden">
                      {media ? (
                        media.media_type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={media.media_url}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center">
                                <Play className="w-4 h-4 text-primary" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={media.media_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                      )}
                      {product.product_media.length > 1 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 text-xs">
                          <ImageIcon className="w-3 h-3" />
                          {product.product_media.length}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{product.companies.name}</span>
                      </div>
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        {product.price && (
                          <span className="font-bold text-primary">${product.price}</span>
                        )}
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                        )}
                      </div>
                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setInterestModal({
                            open: true,
                            type: 'product',
                            itemId: product.id,
                            itemName: product.name,
                            companyId: product.companies.id,
                            companyName: product.companies.name,
                          })
                        }
                      >
                        I'm Interested
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No jobs found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => {
                const media = getMediaPreview(job.job_media);
                return (
                  <Card key={job.id} className="group overflow-hidden hover:shadow-lg transition-all">
                    {media && (
                      <div className="aspect-video relative bg-secondary overflow-hidden">
                        {media.media_type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={media.media_url}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center">
                                <Play className="w-4 h-4 text-primary" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={media.media_url}
                            alt={job.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        {job.job_media.length > 1 && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 text-xs">
                            <ImageIcon className="w-3 h-3" />
                            {job.job_media.length}
                          </div>
                        )}
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{job.companies.name}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {job.job_type && (
                          <Badge variant="secondary" className="text-xs">{job.job_type}</Badge>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            {job.salary_range}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {job.description}
                        </p>
                      )}
                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setInterestModal({
                            open: true,
                            type: 'job',
                            itemId: job.id,
                            itemName: job.title,
                            companyId: job.companies.id,
                            companyName: job.companies.name,
                          })
                        }
                      >
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {interestModal && (
        <InterestModal
          open={interestModal.open}
          onOpenChange={(open) => setInterestModal(open ? interestModal : null)}
          type={interestModal.type}
          itemId={interestModal.itemId}
          itemName={interestModal.itemName}
          companyId={interestModal.companyId}
          companyName={interestModal.companyName}
        />
      )}
    </div>
  );
};
