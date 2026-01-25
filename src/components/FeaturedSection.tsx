import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { InterestModal } from './InterestModal';
import { 
  ArrowRight, Briefcase, ShoppingBag, MapPin, DollarSign,
  Building2, Play, Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  image_url: string | null;
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

export const FeaturedSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [interestModal, setInterestModal] = useState<{
    open: boolean;
    type: 'product' | 'job';
    itemId: string;
    itemName: string;
    companyId: string;
    companyName: string;
  } | null>(null);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    // Fetch featured products with media
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        companies!inner(id, name, logo_url, status),
        product_media(media_url, media_type)
      `)
      .eq('companies.status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);

    // Fetch featured jobs with media
    const { data: jobsData } = await supabase
      .from('jobs')
      .select(`
        *,
        companies!inner(id, name, logo_url, status),
        job_media(media_url, media_type)
      `)
      .eq('companies.status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);

    if (productsData) setProducts(productsData as unknown as Product[]);
    if (jobsData) setJobs(jobsData as unknown as Job[]);
    setLoading(false);
  };

  const getMediaPreview = (media: { media_url: string; media_type: string }[]) => {
    if (media.length === 0) return null;
    const first = media[0];
    return first;
  };

  if (loading) {
    return (
      <div className="py-16 animate-pulse">
        <div className="container mx-auto px-4">
          <div className="h-10 bg-secondary rounded w-64 mx-auto mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-secondary rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0 && jobs.length === 0) {
    return null;
  }

  return (
    <>
      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Featured Products
                </h2>
                <p className="text-muted-foreground">Discover quality products from verified companies</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/products">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const media = getMediaPreview(product.product_media);
                return (
                  <Card 
                    key={product.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
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
                              <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                                <Play className="w-5 h-5 text-primary" />
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
                      ) : product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
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
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{product.companies.name}</span>
                      </div>
                      
                      <h3 className="font-display font-semibold text-lg mb-1">{product.name}</h3>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {product.price && (
                          <span className="font-bold text-lg text-primary">${product.price}</span>
                        )}
                        {product.category && (
                          <Badge variant="secondary">{product.category}</Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setInterestModal({
                          open: true,
                          type: 'product',
                          itemId: product.id,
                          itemName: product.name,
                          companyId: product.companies.id,
                          companyName: product.companies.name,
                        })}
                      >
                        I'm Interested
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Jobs */}
      {jobs.length > 0 && (
        <section className="py-16 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Latest Opportunities
                </h2>
                <p className="text-muted-foreground">Find your next career move</p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/jobs">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const media = getMediaPreview(job.job_media);
                return (
                  <Card 
                    key={job.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
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
                              <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                                <Play className="w-5 h-5 text-primary" />
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
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{job.companies.name}</span>
                      </div>
                      
                      <h3 className="font-display font-semibold text-lg mb-2">{job.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {job.job_type && (
                          <Badge variant="secondary">{job.job_type}</Badge>
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
                        onClick={() => setInterestModal({
                          open: true,
                          type: 'job',
                          itemId: job.id,
                          itemName: job.title,
                          companyId: job.companies.id,
                          companyName: job.companies.name,
                        })}
                      >
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Interest Modal */}
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
    </>
  );
};
