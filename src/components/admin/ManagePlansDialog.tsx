import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Loader2, Save } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  max_jobs: number;
  max_products: number;
}

interface ManagePlansDialogProps {
  plans: Plan[];
  onUpdated: () => void;
}

export const ManagePlansDialog = ({ plans, onUpdated }: ManagePlansDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editPlans, setEditPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditPlans(plans.map(p => ({ ...p })));
  }, [plans, open]);

  const updatePlanField = (index: number, field: keyof Plan, value: string | number) => {
    setEditPlans(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;

    for (const plan of editPlans) {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          price: plan.price,
          duration_days: plan.duration_days,
          max_jobs: plan.max_jobs,
          max_products: plan.max_products,
        } as any)
        .eq('id', plan.id);

      if (error) hasError = true;
    }

    setSaving(false);

    if (hasError) {
      toast({ title: 'Error', description: 'Failed to update some plans.', variant: 'destructive' });
    } else {
      toast({ title: 'Plans updated successfully!' });
      setOpen(false);
      onUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-1" />
          Manage Plans
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Subscription Plans</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {editPlans.map((plan, index) => (
            <div key={plan.id} className="p-4 rounded-lg border border-border space-y-3">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Price (UGX)</Label>
                  <Input
                    type="number"
                    value={plan.price}
                    onChange={(e) => updatePlanField(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duration (days)</Label>
                  <Input
                    type="number"
                    value={plan.duration_days}
                    onChange={(e) => updatePlanField(index, 'duration_days', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Jobs</Label>
                  <Input
                    type="number"
                    value={plan.max_jobs}
                    onChange={(e) => updatePlanField(index, 'max_jobs', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Products</Label>
                  <Input
                    type="number"
                    value={plan.max_products}
                    onChange={(e) => updatePlanField(index, 'max_products', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
