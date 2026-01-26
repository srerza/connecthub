import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Trash2, Star, Loader2, Building2, MapPin } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  is_featured: boolean;
  created_at: string;
  companies?: {
    name: string;
  };
}

export const JobsTab = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, companies:company_id(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load jobs.',
        variant: 'destructive',
      });
    } else {
      setJobs(data as unknown as Job[]);
    }
    setLoading(false);
  };

  const toggleFeatured = async (jobId: string, isFeatured: boolean) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_featured: isFeatured })
      .eq('id', jobId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update job.',
        variant: 'destructive',
      });
    } else {
      toast({ title: isFeatured ? 'Job featured!' : 'Job unfeatured' });
      fetchJobs();
    }
  };

  const deleteJob = async (jobId: string) => {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Job deleted' });
      fetchJobs();
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
          <Briefcase className="w-5 h-5" />
          Jobs Management
        </CardTitle>
        <CardDescription>Moderate job listings and manage featured items</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No jobs posted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{job.title}</h4>
                    {job.is_featured && (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building2 className="w-3 h-3" />
                    {job.companies?.name || 'Unknown Company'}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {job.location && (
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {job.location}
                      </Badge>
                    )}
                    {job.job_type && (
                      <Badge variant="secondary">{job.job_type}</Badge>
                    )}
                    {job.salary_range && (
                      <span className="text-sm text-muted-foreground">{job.salary_range}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${job.is_featured ? 'text-warning' : 'text-muted-foreground'}`} />
                    <Switch
                      checked={job.is_featured || false}
                      onCheckedChange={(checked) => toggleFeatured(job.id, checked)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteJob(job.id)}
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
