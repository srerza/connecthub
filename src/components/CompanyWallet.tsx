import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Plus, Clock, CheckCircle2, XCircle, Loader2, Phone, Copy } from 'lucide-react';
import { format } from 'date-fns';

interface WalletData {
  id: string;
  balance: number;
  company_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  mobile_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CompanyWalletProps {
  companyId: string;
}

export const CompanyWallet = ({ companyId }: CompanyWalletProps) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositData, setDepositData] = useState({ amount: '', mobileNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  const DEPOSIT_NUMBER = '+256740327473';

  useEffect(() => {
    fetchWalletData();
  }, [companyId]);

  const fetchWalletData = async () => {
    setLoading(true);
    
    const { data: walletData } = await supabase
      .from('company_wallets')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (walletData) {
      setWallet(walletData);

      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txData) setTransactions(txData);
    }

    setLoading(false);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = parseFloat(depositData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      amount,
      transaction_type: 'deposit',
      mobile_number: depositData.mobileNumber,
      status: 'pending',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit deposit request.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deposit request submitted!',
        description: `Please send UGX ${amount.toLocaleString()} to ${DEPOSIT_NUMBER} from ${depositData.mobileNumber}. Your balance will be updated once confirmed.`,
      });
      setDepositData({ amount: '', mobileNumber: '' });
      setIsDepositOpen(false);
      fetchWalletData();
    }

    setSubmitting(false);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(DEPOSIT_NUMBER);
    toast({ title: 'Number copied!' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Virtual Wallet
            </CardTitle>
            <CardDescription>Manage your company funds</CardDescription>
          </div>
          
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
                <DialogDescription>
                  Send mobile money to the number below and submit your deposit request.
                </DialogDescription>
              </DialogHeader>
              
              {/* Deposit Instructions */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                <p className="text-sm font-medium">Send money to:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-background border border-border font-mono text-lg">
                    {DEPOSIT_NUMBER}
                  </div>
                  <Button variant="outline" size="icon" onClick={copyNumber}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  After sending, fill in the form below with your details.
                </p>
              </div>
              
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (UGX)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                    required
                    min="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your Mobile Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="e.g. +256700000000"
                      value={depositData.mobileNumber}
                      onChange={(e) => setDepositData({ ...depositData, mobileNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Deposit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Balance */}
        <div className="p-6 rounded-xl gradient-primary text-primary-foreground mb-6">
          <p className="text-sm opacity-80">Current Balance</p>
          <p className="text-4xl font-bold font-display">
            UGX {wallet?.balance?.toLocaleString() || '0'}
          </p>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="font-medium mb-3">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium">
                      {tx.transaction_type === 'deposit' ? '+' : '-'} UGX {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.mobile_number && `From: ${tx.mobile_number} • `}
                      {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  {getStatusBadge(tx.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
