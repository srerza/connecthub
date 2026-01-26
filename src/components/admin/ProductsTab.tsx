import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Trash2, Star, Loader2, Building2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_featured: boolean;
  created_at: string;
  companies?: {
    name: string;
  };
}

export const ProductsTab = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, companies:company_id(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products.',
        variant: 'destructive',
      });
    } else {
      setProducts(data as unknown as Product[]);
    }
    setLoading(false);
  };

  const toggleFeatured = async (productId: string, isFeatured: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: isFeatured })
      .eq('id', productId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product.',
        variant: 'destructive',
      });
    } else {
      toast({ title: isFeatured ? 'Product featured!' : 'Product unfeatured' });
      fetchProducts();
    }
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Product deleted' });
      fetchProducts();
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
          <ShoppingBag className="w-5 h-5" />
          Products Management
        </CardTitle>
        <CardDescription>Moderate products and manage featured items</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{product.name}</h4>
                    {product.is_featured && (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building2 className="w-3 h-3" />
                    {product.companies?.name || 'Unknown Company'}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.price && (
                      <span className="text-sm font-medium text-primary">${product.price}</span>
                    )}
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${product.is_featured ? 'text-warning' : 'text-muted-foreground'}`} />
                    <Switch
                      checked={product.is_featured || false}
                      onCheckedChange={(checked) => toggleFeatured(product.id, checked)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
