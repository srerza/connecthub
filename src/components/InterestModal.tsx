import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle, UserPlus, CheckCircle2, LayoutDashboard } from 'lucide-react';

interface InterestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'product' | 'job';
  itemId: string;
  itemName: string;
  companyId: string;
  companyName: string;
}

export const InterestModal = ({
  open,
  onOpenChange,
  type,
  itemId,
  itemName,
  companyId,
  companyName,
}: InterestModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setSubmitting(true);

    const baseData = {
      user_id: user.id,
      company_id: companyId,
      message: message || `I'm interested in ${itemName}`,
    };

    const inquiryData = type === 'product' 
      ? { ...baseData, product_id: itemId }
      : { ...baseData, job_id: itemId };

    const { error } = await supabase.from('inquiries').insert(inquiryData);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send your interest. Please try again.',
        variant: 'destructive',
      });
    } else {
      setSubmitted(true);
      setMessage('');
    }

    setSubmitting(false);
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create an Account
            </DialogTitle>
            <DialogDescription>
              Sign up to express your interest in this {type} and connect with {companyName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium mb-1">{itemName}</h4>
              <p className="text-sm text-muted-foreground">by {companyName}</p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Creating an account allows you to:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Express interest in products and jobs</li>
              <li>• Chat directly with companies</li>
              <li>• Track your applications</li>
            </ul>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1"
                onClick={() => navigate(`/auth?mode=register&redirect=${encodeURIComponent(window.location.pathname)}`)}
              >
                Sign Up
              </Button>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button 
                className="text-primary hover:underline"
                onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)}
              >
                Sign in
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSubmitted(false);
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" />
              Interest Sent!
            </DialogTitle>
            <DialogDescription>
              {companyName} has been notified of your interest in {itemName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm">
                You can track your inquiry and chat with the company from your dashboard.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setSubmitted(false);
                onOpenChange(false);
              }}>
                Continue Browsing
              </Button>
              <Button variant="hero" className="flex-1" asChild>
                <Link to="/my-dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  My Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Express Interest
          </DialogTitle>
          <DialogDescription>
            Let {companyName} know you're interested in this {type}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <h4 className="font-medium mb-1">{itemName}</h4>
            <p className="text-sm text-muted-foreground">by {companyName}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder={`Tell ${companyName} why you're interested...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="hero" 
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Interest
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
