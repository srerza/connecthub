import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle2, XCircle, Trash2, Loader2, CreditCard, CalendarDays } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ManagePlansDialog } from './ManagePlansDialog';

interface Company {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
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
  max_jobs: number;
  max_products: number;
}

export const CompaniesTab = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionDialog, setSubscriptionDialog] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [companiesRes, plansRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*').order('price', { ascending: true }),
    ]);

    if (companiesRes.error) {
      toast({ title: 'Error', description: 'Failed to load companies.', variant: 'destructive' });
    } else {
      setCompanies(companiesRes.data as unknown as Company[]);
    }
    if (plansRes.data) setPlans(plansRes.data as unknown as SubscriptionPlan[]);
    setLoading(false);
  };

  const updateCompanyStatus = async (companyId: string, status: string) => {
    const { error } = await supabase.from('companies').update({ status }).eq('id', companyId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update company status.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Company ${status === 'approved' ? 'approved' : 'rejected'} successfully.` });
      fetchData();
    }
  };

  const assignSubscription = async (companyId: string) => {
    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    const now = new Date();
    const expiresAt = addDays(now, plan.duration_days);

    const { error } = await supabase.from('companies').update({
      subscription_plan_id: plan.id,
      subscription_started_at: now.toISOString(),
      subscription_expires_at: expiresAt.toISOString(),
    }).eq('id', companyId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to assign subscription.', variant: 'destructive' });
    } else {
      toast({ title: 'Subscription assigned!', description: `${plan.name} plan expires ${format(expiresAt, 'MMM d, yyyy')}` });
      setSubscriptionDialog(null);
      setSelectedPlanId('');
      fetchData();
    }
  };

  const deleteCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete company.', variant: 'destructive' });
      return;
    }
    if (company?.user_id) {
      await supabase.functions.invoke('delete-user', { body: { userId: company.user_id } });
    }
    toast({ title: 'Company and associated account deleted' });
    fetchData();
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Applications
            </CardTitle>
            <CardDescription>Review, manage registrations, and assign subscription plans</CardDescription>
          </div>
          <ManagePlansDialog plans={plans} onUpdated={fetchData} />
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No company applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => {
              const currentPlan = plans.find(p => p.id === company.subscription_plan_id);
              const isExpired = company.subscription_expires_at && new Date(company.subscription_expires_at) < new Date();

              return (
                <div
                  key={company.id}
                  className="flex flex-col p-4 rounded-lg border border-border bg-secondary/30 gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {company.status === 'pending' && (
                        <>
                          <Button size="sm" variant="default" onClick={() => updateCompanyStatus(company.id, 'approved')}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateCompanyStatus(company.id, 'rejected')}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {company.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => updateCompanyStatus(company.id, 'suspended')}>
                          Deactivate
                        </Button>
                      )}
                      {company.status === 'suspended' && (
                        <Button size="sm" variant="default" onClick={() => updateCompanyStatus(company.id, 'approved')}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Activate
                        </Button>
                      )}
                      
                      <Dialog open={subscriptionDialog === company.id} onOpenChange={(open) => {
                        setSubscriptionDialog(open ? company.id : null);
                        if (!open) setSelectedPlanId('');
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <CreditCard className="w-4 h-4 mr-1" /> Subscription
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Subscription - {company.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {currentPlan && (
                              <div className="p-3 rounded-lg bg-secondary/50 border">
                                <p className="font-medium">Current: {currentPlan.name}</p>
                                {company.subscription_expires_at && (
                                  <p className="text-sm text-muted-foreground">
                                    Expires: {format(new Date(company.subscription_expires_at), 'MMM d, yyyy')}
                                    {isExpired && <Badge variant="destructive" className="ml-2">Expired</Badge>}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Assign Plan</Label>
                              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - UGX {plan.price.toLocaleString()} ({plan.duration_days} days)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              className="w-full"
                              disabled={!selectedPlanId}
                              onClick={() => assignSubscription(company.id)}
                            >
                              <CalendarDays className="w-4 h-4 mr-2" />
                              Assign & Set Expiry
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" variant="destructive" onClick={() => deleteCompany(company.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Subscription Info Row */}
                  {currentPlan && (
                    <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-sm">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">{currentPlan.name}</span>
                      </div>
                      {company.subscription_expires_at && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                            {isExpired ? 'Expired' : 'Expires'}: {format(new Date(company.subscription_expires_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};