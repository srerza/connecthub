import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, ArrowLeft, Loader2, User, Users } from 'lucide-react';
import { z } from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().optional(),
  accountType: z.enum(['user', 'company']),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signUp, signIn } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const typeParam = searchParams.get('type');
  
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    companyName: '',
    accountType: typeParam === 'company' ? 'company' : 'user' as 'user' | 'company'
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      signInSchema.parse(signInData);
      
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      signUpSchema.parse(signUpData);
      
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account exists',
            description: 'An account with this email already exists. Please sign in instead.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        // Get the newly created user
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          // Create role based on account type selection
          if (signUpData.accountType === 'company' && signUpData.companyName) {
            await supabase.from('companies').insert({
              user_id: newUser.id,
              name: signUpData.companyName,
              status: 'pending',
            });
            
            // Add company role
            await supabase.from('user_roles').insert({
              user_id: newUser.id,
              role: 'company',
            });
          } else {
            // Add user role for regular clients
            await supabase.from('user_roles').insert({
              user_id: newUser.id,
              role: 'user',
            });
          }
        }
        
        toast({
          title: 'Account created!',
          description: signUpData.accountType === 'company' 
            ? 'Your company registration is pending approval.' 
            : 'Welcome to ConnectHub!',
        });
        
        // Redirect based on account type
        if (signUpData.accountType === 'company') {
          navigate('/dashboard');
        } else {
          navigate('/my-dashboard');
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-50" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">
              Welcome to ConnectHub
            </CardTitle>
            <CardDescription>
              Sign in or create an account to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Account Type Selection */}
                  <div className="space-y-3">
                    <Label>I want to register as:</Label>
                    <RadioGroup
                      value={signUpData.accountType}
                      onValueChange={(value: 'user' | 'company') => 
                        setSignUpData({ ...signUpData, accountType: value })
                      }
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="relative">
                        <RadioGroupItem
                          value="user"
                          id="account-user"
                          className="sr-only peer"
                        />
                        <label
                          htmlFor="account-user"
                          className="flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                        >
                          <User className="w-8 h-8 text-primary" />
                          <span className="font-medium">Client</span>
                          <span className="text-xs text-muted-foreground text-center">Browse & apply</span>
                        </label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem
                          value="company"
                          id="account-company"
                          className="sr-only peer"
                        />
                        <label
                          htmlFor="account-company"
                          className="flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                        >
                          <Building2 className="w-8 h-8 text-primary" />
                          <span className="font-medium">Company</span>
                          <span className="text-xs text-muted-foreground text-center">Post jobs & products</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  
                  {signUpData.accountType === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-company">Company Name</Label>
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Acme Inc."
                        value={signUpData.companyName}
                        onChange={(e) => setSignUpData({ ...signUpData, companyName: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {signUpData.accountType === 'company' ? 'Register Company' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t border-border text-center">
              <Link 
                to="/admin-login" 
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
              >
                🔐 Admin Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
