import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FeaturedSection } from '@/components/FeaturedSection';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Briefcase, ShoppingBag, ArrowRight, CheckCircle2, Star, LayoutDashboard, Sparkles } from 'lucide-react';

interface LandingContent {
  hero_title: string;
  hero_subtitle: string;
  hero_background_url: string;
  cta_title: string;
  cta_subtitle: string;
}

const smoothEase = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: smoothEase as unknown as [number, number, number, number] }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: smoothEase as unknown as [number, number, number, number] }
  })
};

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const { scrollYProgress } = useScroll();
  const navBg = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const [navOpacity, setNavOpacity] = useState(0);

  const [content, setContent] = useState<LandingContent>({
    hero_title: 'Connect. Grow. Succeed.',
    hero_subtitle: 'The ultimate platform connecting companies, job seekers, and customers. Build your network, find opportunities, and grow your business.',
    hero_background_url: '',
    cta_title: 'Ready to Grow Your Business?',
    cta_subtitle: 'Join thousands of companies already using ConnectHub to find talent and reach customers.',
  });

  const [stats, setStats] = useState([
    { value: '500+', label: 'Companies' },
    { value: '10K+', label: 'Job Listings' },
    { value: '50K+', label: 'Users' },
    { value: '98%', label: 'Satisfaction' },
  ]);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', v => setNavOpacity(Math.min(v * 20, 1)));
    return unsub;
  }, [scrollYProgress]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data } = await supabase
      .from('landing_page_content')
      .select('*');

    if (data) {
      const contentMap: Record<string, string> = {};
      data.forEach((item: { key: string; value: string }) => {
        contentMap[item.key] = item.value;
      });
      setContent({
        hero_title: contentMap['hero_title'] || content.hero_title,
        hero_subtitle: contentMap['hero_subtitle'] || content.hero_subtitle,
        hero_background_url: contentMap['hero_background_url'] || '',
        cta_title: contentMap['cta_title'] || content.cta_title,
        cta_subtitle: contentMap['cta_subtitle'] || content.cta_subtitle,
      });
      setStats([
        { value: contentMap['stat_companies'] || '500+', label: contentMap['stat_companies_label'] || 'Companies' },
        { value: contentMap['stat_jobs'] || '10K+', label: contentMap['stat_jobs_label'] || 'Job Listings' },
        { value: contentMap['stat_users'] || '50K+', label: contentMap['stat_users_label'] || 'Users' },
        { value: contentMap['stat_satisfaction'] || '98%', label: contentMap['stat_satisfaction_label'] || 'Satisfaction' },
      ]);
    }
  };

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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl"
        style={{ backgroundColor: `hsl(var(--background) / ${navOpacity * 0.9 + 0.1})` }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="font-display font-bold text-xl">ConnectHub</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {['Products', 'Jobs', 'Companies'].map(item => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                className="relative text-muted-foreground hover:text-foreground transition-colors group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {userRole === 'superadmin' ? (
                  <Button variant="hero" asChild>
                    <Link to="/admin"><LayoutDashboard className="w-4 h-4 mr-2" />Admin Dashboard</Link>
                  </Button>
                ) : userRole === 'company' ? (
                  <Button variant="hero" asChild>
                    <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Company Dashboard</Link>
                  </Button>
                ) : (
                  <Button variant="hero" asChild>
                    <Link to="/my-dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />My Dashboard</Link>
                  </Button>
                )}
              </motion.div>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/auth">Sign In</Link></Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="hero" asChild><Link to="/auth?mode=register">Get Started</Link></Button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-4 relative overflow-hidden"
        style={content.hero_background_url ? {
          backgroundImage: `url(${content.hero_background_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {!content.hero_background_url && (
          <>
            <div className="absolute inset-0 gradient-hero opacity-50" />
            <motion.div
              className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
              animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
              animate={{ y: [0, 20, 0], scale: [1, 0.9, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            />
          </>
        )}
        {content.hero_background_url && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        )}
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Trusted by thousands of businesses
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              {content.hero_title.includes('.') ? (
                <>
                  {content.hero_title.split('.')[0]}. <span className="text-gradient">{content.hero_title.split('.')[1]?.trim()}.</span> {content.hero_title.split('.').slice(2).join('.')}
                </>
              ) : (
                content.hero_title
              )}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              {content.hero_subtitle}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/auth?mode=register">
                    Start for Free <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/jobs">Browse Jobs</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="text-center group"
              >
                <motion.div
                  className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for businesses and professionals to thrive
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-default"
              >
                <motion.div
                  className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products & Jobs */}
      <FeaturedSection />

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative rounded-3xl gradient-dark overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
            
            {/* Animated glow orbs */}
            <motion.div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 7, repeat: Infinity }}
            />

            <div className="relative z-10 px-8 py-16 md:py-24 text-center">
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
                className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6"
              >
                {content.cta_title}
              </motion.h2>
              <motion.p
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={1}
                className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto"
              >
                {content.cta_subtitle}
              </motion.p>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={2}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="accent" size="xl" asChild>
                    <Link to="/auth?mode=register&type=company">
                      Register Company <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </motion.div>
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Free to get started</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </motion.div>
              <span className="font-display font-bold">ConnectHub</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {[
                { to: '/products', label: 'Products' },
                { to: '/jobs', label: 'Jobs' },
                { to: '/companies', label: 'Companies' },
                { to: '/admin-login', label: 'Admin' },
              ].map(link => (
                <Link key={link.to} to={link.to} className="relative hover:text-foreground transition-colors group">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
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
