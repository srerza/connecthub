import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FeaturedSection } from '@/components/FeaturedSection';
import { Building2, Users, Briefcase, ShoppingBag, ArrowRight, CheckCircle2, Star } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Building2,
      title: 'For Companies',
      description: 'Register your business, showcase products, and post job opportunities to reach the right talent.',
    },
    {
      icon: Users,
      title: 'For Job Seekers',
      description: 'Discover exciting career opportunities from verified companies across various industries.',
    },
    {
      icon: ShoppingBag,
      title: 'For Customers',
      description: 'Browse products and services from trusted businesses in our curated marketplace.',
    },
    {
      icon: Briefcase,
      title: 'Verified Network',
      description: 'All companies are verified by our team, ensuring quality and trust in every interaction.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Companies' },
    { value: '10K+', label: 'Job Listings' },
    { value: '50K+', label: 'Users' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">ConnectHub</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">Products</Link>
            <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">Jobs</Link>
            <Link to="/companies" className="text-muted-foreground hover:text-foreground transition-colors">Companies</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/auth?mode=register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse-slow" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Star className="w-4 h-4" />
              Trusted by thousands of businesses
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Connect. <span className="text-gradient">Grow.</span> Succeed.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The ultimate platform connecting companies, job seekers, and customers. 
              Build your network, find opportunities, and grow your business.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=register">
                  Start for Free <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for businesses and professionals to thrive
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products & Jobs */}
      <FeaturedSection />

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-3xl gradient-dark overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
            
            <div className="relative z-10 px-8 py-16 md:py-24 text-center">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of companies already using ConnectHub to find talent and reach customers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="accent" size="xl" asChild>
                  <Link to="/auth?mode=register&type=company">
                    Register Company <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Free to get started</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">ConnectHub</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
              <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
              <Link to="/companies" className="hover:text-foreground transition-colors">Companies</Link>
              <Link to="/admin-login" className="hover:text-foreground transition-colors">Admin</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ConnectHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
