import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Target, 
  Smartphone, 
  Search, 
  LayoutDashboard, 
  ArrowRight,
  ShieldCheck,
  Plus,
  StickyNote,
  ChevronRight,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '@/src/lib/utils';

/**
 * StripeItLandingPage
 * Premium pre-login marketing experience for automotive salespeople.
 */

const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}> = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card className="p-6 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-brand-primary/20 transition-all group overflow-hidden relative">
      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-brand-primary/5 blur-3xl rounded-full transition-all group-hover:bg-brand-primary/10" />
      <div className="h-10 w-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5 text-brand-primary" />
      </div>
      <Typography variant="h3" className="text-white text-lg font-bold mb-2 uppercase tracking-tight">
        {title}
      </Typography>
      <Typography variant="p" className="text-slate-400 text-sm leading-relaxed">
        {description}
      </Typography>
    </Card>
  </motion.div>
);

const MockupDashboard = () => (
  <div className="relative w-full aspect-[16/10] bg-bg-deep rounded-2xl border border-white/10 shadow-2xl overflow-hidden group">
    {/* Sidebar mock */}
    <div className="absolute left-0 top-0 bottom-0 w-16 md:w-20 bg-bg-deep border-r border-white/5 p-4 flex flex-col gap-6 items-center">
      <div className="h-8 w-8 rounded-lg bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
        <TrendingUp className="h-4 w-4 text-brand-primary" />
      </div>
      {[LayoutDashboard, Search, BarChart3, Target, StickyNote].map((Icon, i) => (
        <div key={i} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      ))}
    </div>

    {/* Header mock */}
    <div className="absolute left-16 md:left-20 top-0 right-0 h-16 bg-white/[0.02] border-b border-white/5 px-6 flex items-center justify-between">
      <div className="h-4 w-32 bg-white/5 rounded" />
      <div className="flex gap-4">
        <div className="h-6 w-20 bg-brand-primary/20 border border-brand-primary/30 rounded-full" />
        <div className="h-8 w-8 rounded-full bg-slate-800" />
      </div>
    </div>

    {/* Content mock */}
    <div className="absolute left-16 md:left-20 top-16 right-0 bottom-0 p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
      {/* Metrics */}
      <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Deals Closed', val: '24', color: 'brand-primary' },
          { label: 'Gross Profit', val: '$32,450', color: 'emerald-500' },
          { label: 'Commissions', val: '$8,125', color: 'brand-primary' },
        ].map((m, i) => (
          <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
            <div className="h-2 w-16 bg-slate-600/50 rounded" />
            <div className={cn("h-6 w-20 rounded", `bg-${m.color}/20`)} />
          </div>
        ))}
      </div>

      {/* Main Chart area */}
      <div className="col-span-2 h-40 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 flex items-end gap-2 p-4">
          {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-brand-primary/20 border-t border-brand-primary/40 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Side card */}
      <div className="hidden lg:block space-y-4">
        <div className="h-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
          <div className="h-6 w-full bg-brand-primary shadow-glow glow-primary rounded-lg flex items-center justify-center">
            <Plus className="h-3 w-3 text-bg-deep" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-full bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Glow effects */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 bg-brand-primary/10 blur-[100px] pointer-events-none" />
  </div>
);

const MobileMockup = () => (
  <div className="relative w-48 aspect-[9/19] bg-bg-deep rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-800 rounded-b-xl z-20" />
    
    <div className="p-4 pt-10 space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 w-12 bg-white/10 rounded" />
        <div className="h-6 w-6 rounded-full bg-brand-primary/20" />
      </div>
      
      <div className="p-4 bg-brand-primary shadow-glow glow-primary rounded-2xl flex flex-col items-center gap-1">
        <Typography variant="mono" className="text-[8px] text-bg-deep uppercase font-black">Commission</Typography>
        <Typography variant="h3" className="text-bg-deep text-lg font-black">$4,250</Typography>
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 w-full bg-white/5 border border-white/5 rounded-xl p-2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-16 bg-white/10 rounded" />
              <div className="h-1.5 w-10 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-10 w-full bg-brand-primary rounded-xl mt-4" />
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg-deep selection:bg-brand-primarySelection:text-bg-deep">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow">
            <TrendingUp className="text-white h-6 w-6" />
          </div>
          <Typography variant="h3" className="font-display font-black italic text-white uppercase tracking-tighter">
            StripeIt
          </Typography>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link to="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Features</Link>
          <Link to="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Pricing</Link>
          <Link to="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Why Stripe It</Link>
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Button 
                variant="ghost" 
                className="text-xs font-black uppercase tracking-widest text-white hover:bg-white/5"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button 
                className="bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs shadow-glow glow-primary h-10 px-6 rounded-lg"
                onClick={() => navigate('/login')}
              >
                Start Free
              </Button>
            </>
          ) : (
            <Button 
              className="bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs shadow-glow glow-primary h-10 px-6 rounded-lg"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
              <Zap className="h-3 w-3 text-brand-primary" />
              <Typography variant="mono" className="text-[10px] text-brand-primary uppercase font-black tracking-widest">
                Built for car salespeople. Designed to help you win.
              </Typography>
            </div>
            
            <div className="space-y-4">
              <Typography variant="h1" className="text-5xl md:text-7xl font-display font-black text-white italic tracking-tighter leading-[0.9]">
                Track every deal.<br />
                <span className="text-brand-primary drop-shadow-[0_0_20px_rgba(0,242,255,0.3)]">Know every dollar.</span><br />
                Own your month.
              </Typography>
              <Typography variant="p" className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
                Stripe It gives automotive salespeople real-time visibility into deals, commissions, goals, and performance — so they can sell more, earn more, and finish strong.
              </Typography>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="h-14 px-8 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-sm shadow-glow glow-primary hover:scale-105 transition-all rounded-xl"
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                {user ? 'Go to Dashboard' : 'Start Tracking Free'} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                className="h-14 px-8 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-sm rounded-xl"
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                {user ? 'View Performance' : 'Log Into Dashboard'}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative lg:h-[600px] flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full">
              <MockupDashboard />
              <div className="absolute -bottom-10 -left-10 hidden sm:block">
                <MobileMockup />
              </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-brand-primary/10 blur-[120px] rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={TrendingUp}
            title="Track Deals"
            description="Log deals in seconds and keep everything organized in a professional log."
            delay={0.1}
          />
          <FeatureCard 
            icon={DollarSign}
            title="Commission Clarity"
            description="Know exactly what you earned without digging through complex spreadsheets."
            delay={0.2}
          />
          <FeatureCard 
            icon={Target}
            title="Goal Progress"
            description="Set targets, track your monthly pace, and stay locked in until the close."
            delay={0.3}
          />
          <FeatureCard 
            icon={Smartphone}
            title="Mobile Entry"
            description="Log deals and capture critical notes from anywhere, directly on any device."
            delay={0.4}
          />
        </div>
      </div>

      {/* New vs Returning Section */}
      <div className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex flex-col items-center text-center gap-6 group hover:border-brand-primary/20 transition-all"
          >
            <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="space-y-3">
              <Typography variant="h2" className="text-white text-3xl font-display font-black uppercase tracking-tight italic">
                Start your month strong.
              </Typography>
              <Typography variant="p" className="text-slate-400">
                Set your goals, log your first deal, and build momentum from day one.
              </Typography>
            </div>
            <Button 
              className="mt-4 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs h-12 px-10 rounded-xl"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              {user ? 'Go to Dashboard' : 'Start Free Today'}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center gap-6 group hover:border-brand-primary/20 transition-all"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutDashboard className="h-8 w-8 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-3">
              <Typography variant="h2" className="text-white text-3xl font-display font-black uppercase tracking-tight italic">
                Jump back in.
              </Typography>
              <Typography variant="p" className="text-slate-400">
                Your performance dashboard is ready. Pick up exactly where you left off.
              </Typography>
            </div>
            <Button 
              variant="outline"
              className="mt-4 border-white/10 hover:bg-white/5 text-white font-black uppercase tracking-widest text-xs h-12 px-10 rounded-xl"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              {user ? 'Open Dashboard' : 'Log Into Account'}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="pb-32 px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-8 bg-white/[0.02] border border-white/5 px-8 py-4 rounded-2xl"
        >
          <div className="flex items-center gap-3 text-emerald-500">
            <ShieldCheck className="h-5 w-5" />
            <Typography variant="mono" className="text-xs uppercase font-black tracking-widest">
              Secure. Private. Professional.
            </Typography>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/10" />
          <Typography variant="p" className="text-slate-500 text-xs font-medium">
            Your deal data stays yours. Built for your numbers.
          </Typography>
        </motion.div>
      </div>

      <footer className="py-12 border-t border-white/5 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <TrendingUp className="text-white h-4 w-4" />
            <Typography variant="mono" className="text-[10px] text-white uppercase font-black tracking-widest">
              StripeIt • Powered by Performance
            </Typography>
          </div>
          <Typography variant="mono" className="text-[10px] text-slate-600 uppercase tracking-widest">
            © 2026 StripeIt Deal Tracker. Engineered for automotive dominance.
          </Typography>
        </div>
      </footer>
    </div>
  );
};
