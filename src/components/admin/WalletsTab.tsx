import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, Building2, Loader2, CheckCircle2, XCircle, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface WalletWithCompany {
  id: string;
  balance: number;
  company_id: string;
  companies: {
    name: string;
    status: string;
  };
}

interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  transaction_type: string;
  mobile_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const WalletsTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletWithCompany[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editWallet, setEditWallet] = useState<WalletWithCompany | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [walletsResult, transactionsResult] = await Promise.all([
      supabase
        .from('company_wallets')
        .select('*, companies(name, status)')
        .order('balance', { ascending: false }),
      supabase
        .from('wallet_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    if (walletsResult.data) {
      setWallets(walletsResult.data as unknown as WalletWithCompany[]);
    }
    if (transactionsResult.data) {
      setPendingTransactions(transactionsResult.data);
    }

    setLoading(false);
  };

  const handleUpdateBalance = async () => {
    if (!editWallet) return;

    const balance = parseFloat(newBalance);
    if (isNaN(balance) || balance < 0) {
      toast({
        title: 'Invalid balance',
        description: 'Please enter a valid balance.',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);

    const { error } = await supabase
      .from('company_wallets')
      .update({ balance })
      .eq('id', editWallet.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update balance.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Balance updated successfully!' });
      setEditWallet(null);
      setNewBalance('');
      fetchData();
    }

    setUpdating(false);
  };

  const handleTransactionAction = async (transactionId: string, walletId: string, amount: number, action: 'approved' | 'rejected') => {
    // Update transaction status
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .update({ 
        status: action, 
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (txError) {
      toast({
        title: 'Error',
        description: 'Failed to update transaction.',
        variant: 'destructive',
      });
      return;
    }

    // If approved, add to wallet balance
    if (action === 'approved') {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        await supabase
          .from('company_wallets')
          .update({ balance: wallet.balance + amount })
          .eq('id', walletId);
      }
    }

    toast({ title: `Transaction ${action}!` });
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
    <div className="space-y-6">
      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-warning">
              <Clock className="w-5 h-5" />
              Pending Deposit Requests ({pendingTransactions.length})
            </CardTitle>
            <CardDescription>Review and approve deposit requests from companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransactions.map((tx) => {
                const wallet = wallets.find(w => w.id === tx.wallet_id);
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{wallet?.companies?.name || 'Unknown'}</span>
                      </div>
                      <p className="text-lg font-bold text-success">
                        +UGX {tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        From: {tx.mobile_number} • {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleTransactionAction(tx.id, tx.wallet_id, tx.amount, 'approved')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleTransactionAction(tx.id, tx.wallet_id, tx.amount, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Company Wallets
          </CardTitle>
          <CardDescription>View and manage company wallet balances</CardDescription>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No company wallets yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{wallet.companies?.name}</p>
                      <Badge variant={wallet.companies?.status === 'approved' ? 'default' : 'secondary'}>
                        {wallet.companies?.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold font-display">
                        UGX {wallet.balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            setEditWallet(wallet);
                            setNewBalance(wallet.balance.toString());
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Wallet Balance</DialogTitle>
                          <DialogDescription>
                            Update the balance for {editWallet?.companies?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>New Balance (UGX)</Label>
                            <Input
                              type="number"
                              value={newBalance}
                              onChange={(e) => setNewBalance(e.target.value)}
                              min="0"
                            />
                          </div>
                          <Button 
                            onClick={handleUpdateBalance} 
                            className="w-full"
                            disabled={updating}
                          >
                            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Balance
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
