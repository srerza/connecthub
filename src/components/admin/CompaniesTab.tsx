import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle2, XCircle, Trash2, Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

export const CompaniesTab = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load companies.',
        variant: 'destructive',
      });
    } else {
      setCompanies(data);
    }
    setLoading(false);
  };

  const updateCompanyStatus = async (companyId: string, status: string) => {
    const { error } = await supabase
      .from('companies')
      .update({ status })
      .eq('id', companyId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update company status.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Company ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
      });
      fetchCompanies();
    }
  };

  const deleteCompany = async (companyId: string) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete company.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Company deleted' });
      fetchCompanies();
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
          <Building2 className="w-5 h-5" />
          Company Applications
        </CardTitle>
        <CardDescription>Review and manage company registrations</CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No company applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{company.name}</h3>
                    <Badge
                      variant={
                        company.status === 'approved' ? 'default' :
                        company.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {company.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {company.description || 'No description provided'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registered: {new Date(company.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {company.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateCompanyStatus(company.id, 'approved')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateCompanyStatus(company.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {company.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCompanyStatus(company.id, 'suspended')}
                    >
                      Deactivate
                    </Button>
                  )}
                  {company.status === 'suspended' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateCompanyStatus(company.id, 'approved')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCompany(company.id)}
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
