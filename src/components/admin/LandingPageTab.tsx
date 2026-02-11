import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MediaUpload } from '@/components/MediaUpload';
import { Loader2, Save, Layout, Image as ImageIcon, Type } from 'lucide-react';

interface ContentItem {
  id: string;
  key: string;
  value: string;
}

export const LandingPageTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_background_url: '',
    cta_title: '',
    cta_subtitle: '',
    stat_companies: '',
    stat_companies_label: '',
    stat_jobs: '',
    stat_jobs_label: '',
    stat_users: '',
    stat_users_label: '',
    stat_satisfaction: '',
    stat_satisfaction_label: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('*');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load landing page content.',
        variant: 'destructive',
      });
    } else if (data) {
      setContent(data);
      const contentMap: Record<string, string> = {};
      data.forEach((item) => {
        contentMap[item.key] = item.value;
      });
      setFormData({
        hero_title: contentMap['hero_title'] || '',
        hero_subtitle: contentMap['hero_subtitle'] || '',
        hero_background_url: contentMap['hero_background_url'] || '',
        cta_title: contentMap['cta_title'] || '',
        cta_subtitle: contentMap['cta_subtitle'] || '',
        stat_companies: contentMap['stat_companies'] || '500+',
        stat_companies_label: contentMap['stat_companies_label'] || 'Companies',
        stat_jobs: contentMap['stat_jobs'] || '10K+',
        stat_jobs_label: contentMap['stat_jobs_label'] || 'Job Listings',
        stat_users: contentMap['stat_users'] || '50K+',
        stat_users_label: contentMap['stat_users_label'] || 'Users',
        stat_satisfaction: contentMap['stat_satisfaction'] || '98%',
        stat_satisfaction_label: contentMap['stat_satisfaction_label'] || 'Satisfaction',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const updates = Object.entries(formData).map(async ([key, value]) => {
      const existing = content.find((c) => c.key === key);
      if (existing) {
        return supabase
          .from('landing_page_content')
          .update({ value })
          .eq('key', key);
      } else {
        return supabase
          .from('landing_page_content')
          .insert({ key, value });
      }
    });

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast({
        title: 'Error',
        description: 'Failed to save some content.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Landing page content saved!' });
      fetchContent();
    }

    setSaving(false);
  };

  const handleBackgroundUpload = (url: string) => {
    setFormData({ ...formData, hero_background_url: url });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Hero Section
          </CardTitle>
          <CardDescription>
            Customize the main hero section of the landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Hero Title
            </Label>
            <Input
              value={formData.hero_title}
              onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
              placeholder="Connect. Grow. Succeed."
            />
          </div>

          <div className="space-y-2">
            <Label>Hero Subtitle</Label>
            <Textarea
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              placeholder="The ultimate platform connecting companies..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Hero Background Image
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <MediaUpload
                  bucket="product-media"
                  existingMedia={
                    formData.hero_background_url
                      ? [{ url: formData.hero_background_url, type: 'image' as const }]
                      : []
                  }
                  onUpload={(url) => handleBackgroundUpload(url)}
                  onRemove={() => setFormData({ ...formData, hero_background_url: '' })}
                  maxFiles={1}
                />
              </div>
              {formData.hero_background_url && (
                <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
                  <img
                    src={formData.hero_background_url}
                    alt="Hero background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for the default gradient background
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Call-to-Action Section</CardTitle>
          <CardDescription>
            Customize the CTA section at the bottom of the landing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CTA Title</Label>
            <Input
              value={formData.cta_title}
              onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
              placeholder="Ready to Grow Your Business?"
            />
          </div>

          <div className="space-y-2">
            <Label>CTA Subtitle</Label>
            <Textarea
              value={formData.cta_subtitle}
              onChange={(e) => setFormData({ ...formData, cta_subtitle: e.target.value })}
              placeholder="Join thousands of companies..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            📊 Stats Section
          </CardTitle>
          <CardDescription>
            Edit the statistics displayed on the landing page (e.g. "500+ Companies")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Stat 1 Value</Label>
              <Input value={formData.stat_companies} onChange={(e) => setFormData({ ...formData, stat_companies: e.target.value })} placeholder="500+" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 1 Label</Label>
              <Input value={formData.stat_companies_label} onChange={(e) => setFormData({ ...formData, stat_companies_label: e.target.value })} placeholder="Companies" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 2 Value</Label>
              <Input value={formData.stat_jobs} onChange={(e) => setFormData({ ...formData, stat_jobs: e.target.value })} placeholder="10K+" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 2 Label</Label>
              <Input value={formData.stat_jobs_label} onChange={(e) => setFormData({ ...formData, stat_jobs_label: e.target.value })} placeholder="Job Listings" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 3 Value</Label>
              <Input value={formData.stat_users} onChange={(e) => setFormData({ ...formData, stat_users: e.target.value })} placeholder="50K+" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 3 Label</Label>
              <Input value={formData.stat_users_label} onChange={(e) => setFormData({ ...formData, stat_users_label: e.target.value })} placeholder="Users" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 4 Value</Label>
              <Input value={formData.stat_satisfaction} onChange={(e) => setFormData({ ...formData, stat_satisfaction: e.target.value })} placeholder="98%" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Stat 4 Label</Label>
              <Input value={formData.stat_satisfaction_label} onChange={(e) => setFormData({ ...formData, stat_satisfaction_label: e.target.value })} placeholder="Satisfaction" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="hero" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
};
