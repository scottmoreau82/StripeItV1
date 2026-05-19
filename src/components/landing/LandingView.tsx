import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  DollarSign, 
  ChevronRight,
  MousePointer2,
  Lock,
  AppWindow
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Typography } from '@/src/components/ui/Typography';
import { Card } from '@/src/components/ui/Card';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useResponsive } from '@/src/hooks/useResponsive';
import { cn } from '@/src/lib/utils';

const MOCK_GRAPH_DATA = [
  { name: 'Jan', val: 4000 },
  { name: 'Feb', val: 3000 },
  { name: 'Mar', val: 5000 },
  { name: 'Apr', val: 4500 },
  { name: 'May', val: 6500 },
  { name: 'Jun', val: 8000 },
];

const FeatureItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex gap-5 p-5 rounded-[24px] hover:bg-white/[0.03] transition-all duration-300 border border-transparent hover:border-white/10 group">
    <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-glow glow-primary/0 group-hover:glow-primary/10 transition-all">
      <Icon size={22} strokeWidth={2} />
    </div>
    <div className="space-y-1.5 pt-1">
      <Typography variant="label" className="text-white block font-bold text-sm">{title}</Typography>
      <Typography variant="small" className="text-slate-500 leading-relaxed text-[11px] font-medium">
        {description}
      </Typography>
    </div>
  </div>
);

const CommissionArchitectSimulation = () => {
  const [units, setUnits] = React.useState(8);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Simulation logic
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setUnits(prev => prev >= 10 ? 8 : prev + 1);
        setIsAnimating(false);
      }, 800);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const baseFront = units >= 10 ? 0.25 : 0.20;
  const retroAmount = units >= 10 ? 1250 : 0;
  const frontGross = 24500;
  const backGross = 8200;
  const frontComm = frontGross * baseFront;
  const backComm = backGross * 0.05;
  const volumeBonus = units >= 10 ? 1000 : 0;
  const totalComm = frontComm + backComm + volumeBonus + retroAmount;

  return (
    <Card className="p-0 border-white/10 bg-bg-card/40 backdrop-blur-xl relative overflow-hidden shadow-2xl group/card">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-brand-primary/10 to-transparent" />
      
      {/* Scanning Line Effect */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-20 bg-gradient-to-b from-brand-primary/[0.02] to-transparent pointer-events-none z-10"
      />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full bg-brand-primary/20 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
          </div>
          <Typography variant="mono" className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
            Commission Architect • Live Simulation
          </Typography>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
             <div className="h-1 w-1 rounded-full bg-emerald-500" />
             <span className="text-[8px] text-emerald-500 uppercase font-black">Active Logic</span>
           </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-white/5">
        {[
          { label: 'Units Sold', val: units, sub: units >= 10 ? 'Tier 2 Active' : 'Tier 1' },
          { label: 'Front %', val: `${(baseFront * 100).toFixed(0)}%`, sub: units >= 10 ? '+5% Retro' : 'Base' },
          { label: 'Monthly Gross', val: `$${((frontGross + backGross) / 1000).toFixed(1)}K`, sub: 'Pacing Goal' },
          { label: 'Projected Pay', val: `$${(totalComm / 1000).toFixed(2)}K`, highlight: true }
        ].map((stat, i) => (
          <div key={i} className="bg-bg-deep p-4 space-y-1">
            <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-bold">{stat.label}</Typography>
            <motion.div
              key={stat.val}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "italic font-black uppercase text-xl sm:text-2xl tracking-tighter transition-colors",
                stat.highlight ? "text-brand-primary" : "text-white"
              )}
            >
              {stat.val}
            </motion.div>
            <Typography variant="mono" className="text-[7px] text-slate-600 uppercase font-black">{stat.sub}</Typography>
          </div>
        ))}
      </div>

      {/* Live Breakdown Terminal */}
      <div className="p-6 space-y-4 min-h-[220px]">
        <div className="flex items-center justify-between">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black">Calculation Output</Typography>
          <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-slate-400 font-mono">
            {units} Units Validated
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center group">
            <Typography variant="small" className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Front End Commission</Typography>
            <Typography variant="label" className="text-white text-[11px] font-black">${frontComm.toLocaleString()}</Typography>
          </div>
          
          <div className="flex justify-between items-center">
            <Typography variant="small" className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Back End (5% Flat)</Typography>
            <Typography variant="label" className="text-white text-[11px] font-black">${backComm.toLocaleString()}</Typography>
          </div>

          <motion.div 
            animate={units >= 10 ? { opacity: 1, x: 0 } : { opacity: 0.3, x: 0 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <Typography variant="small" className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Volume Bonus</Typography>
              {units >= 10 && (
                <div className="px-1.5 py-0.5 rounded-sm bg-brand-primary/10 border border-brand-primary/20 text-[7px] text-brand-primary font-black uppercase">
                  Unlocked
                </div>
              )}
            </div>
            <Typography variant="label" className={cn("text-[11px] font-black", units >= 10 ? "text-brand-primary" : "text-slate-600")}>
              +${volumeBonus}
            </Typography>
          </motion.div>

          <motion.div 
            animate={units >= 10 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            className="flex justify-between items-center p-4 rounded-2xl bg-brand-primary/[0.04] border border-brand-primary/10 shadow-inner"
          >
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary shadow-glow glow-primary/10">
                <Zap size={16} />
              </div>
              <div className="space-y-0.5">
                <Typography variant="mono" className="text-[10px] text-brand-primary uppercase font-black tracking-widest leading-none">Retroactive Pay Active</Typography>
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-tight mt-1 opacity-70">Recalculating Units 1-9 at 25%</div>
              </div>
            </div>
            <Typography variant="label" className="text-brand-primary text-sm font-black italic tracking-tighter">
              +${retroAmount}
            </Typography>
          </motion.div>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <AppWindow className="h-3 w-3 text-brand-primary" />
            <span className="text-[8px] text-slate-500 uppercase font-black">Pay Plan: Custom Architect v2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[8px] text-slate-500 uppercase font-black">Performance: Optimal</span>
          </div>
        </div>
        <Typography variant="mono" className="text-[7px] text-slate-600 uppercase font-black">
           Engine Verified • Secure Stream
        </Typography>
      </div>

      {isAnimating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-primary/5 pointer-events-none flex items-center justify-center"
        >
          <div className="px-4 py-2 bg-brand-primary text-bg-deep text-[10px] font-black uppercase italic tracking-tighter skew-x-[-12deg] shadow-glow glow-primary">
            Unit {units} Logged • Recalculating...
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export const LandingView: React.FC<{ isInitializing?: boolean }> = ({ isInitializing }) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const handleSignUp = () => navigate('/signup');
  const handleLogin = () => navigate('/login');

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
        {/* Atmosphere for minimal splash */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative z-10 flex flex-col items-center gap-8"
        >
          <div className="h-16 w-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-glow glow-primary">
            <DollarSign className="text-white h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <Typography variant="h3" className="text-white italic font-black uppercase tracking-tighter text-2xl">StripeIt</Typography>
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
              Performance Log • Authenticating
            </Typography>
          </div>

          <div className="w-32 h-[1px] bg-white/5 relative overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-brand-primary to-transparent"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep selection:bg-brand-primary/30 selection:text-white overflow-hidden relative">
      {/* Initialization Progress Bar removed from here as we use the early return splash ^ */}

      {/* Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-primary/[0.08] blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/[0.06] blur-[140px] rounded-full" />
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-emerald-500/[0.04] blur-[180px] rounded-full" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-bg-deep/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-glow glow-primary">
              <DollarSign className="text-white h-5 w-5" />
            </div>
            <Typography variant="h3" className="text-white italic font-black uppercase tracking-tighter">StripeIt</Typography>
          </div>
          
            <div className="flex items-center gap-4">
              {!isMobile && (
                <Link 
                  to="/login"
                  className="text-[10px] text-slate-500 hover:text-white uppercase font-black tracking-[0.2em] transition-colors"
                  id="landing-login-btn-top"
                >
                  Login
                </Link>
              )}
              <Link to="/signup">
                <Button 
                  className="h-10 px-6 text-[10px] uppercase font-black tracking-widest shadow-glow glow-primary"
                  id="landing-signup-btn-top"
                >
                  Sign Up Free
                </Button>
              </Link>
            </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative pt-32 lg:pt-48 pb-32 px-6 max-w-7xl mx-auto">
        <div className={isMobile ? 'flex flex-col gap-24' : 'grid grid-cols-1 lg:grid-cols-12 gap-24 items-center'}>
          
          {/* Left Column: Messaging */}
          <div className={cn("space-y-12", !isMobile && "lg:col-span-12 xl:col-span-5")}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary backdrop-blur-sm">
                The Performance Log for Pros
              </div>
              
              <Typography 
                variant="h1" 
                className={isMobile ? "text-5xl text-white italic font-black uppercase leading-[0.85] tracking-tighter" : "text-7xl lg:text-8xl text-white italic font-black uppercase leading-[0.85] tracking-tighter"}
              >
                Own <br />
                Your <br />
                <span className="text-brand-primary">Deals.</span>
              </Typography>
              
              <Typography variant="p" className="text-slate-400 text-lg lg:text-xl max-w-lg leading-relaxed font-medium">
                The first platform built for complex automotive pay plans. Real-time commission visibility with retroactive tier logic and unit ladder support.
              </Typography>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link to="/signup" className="contents">
                <Button 
                  className="h-16 px-12 text-base font-black italic uppercase tracking-tighter shadow-glow glow-primary group w-full sm:w-auto"
                  id="landing-hero-signup-btn"
                >
                  Start My Account
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login" className="contents">
                <Button 
                  variant="outline"
                  className="h-16 px-12 text-base font-black italic uppercase tracking-tighter border-white/10 hover:bg-white/5 w-full sm:w-auto"
                  id="landing-hero-login-btn"
                >
                  Log In
                </Button>
              </Link>
            </motion.div>

            {/* Features List */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 max-w-2xl pt-20 border-t border-white/5 relative"
            >
              <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-brand-primary/60 to-transparent" />
              <FeatureItem 
                icon={TrendingUp} 
                title="Exact Modeling" 
                description="Customize your front and back-end percentages to match your actual paycheck."
              />
              <FeatureItem 
                icon={Target} 
                title="Unit Ladders" 
                description="Set multiple volume tiers with specific bonuses and commission increases."
              />
              <FeatureItem 
                icon={Zap} 
                title="Retroactive Logic" 
                description="Automatically recalculates previous deals when you reach new volume milestones."
              />
              <FeatureItem 
                icon={BarChart3} 
                title="Paycheck Pacing" 
                description="Real-time projection of your monthly earnings based on current deal flow."
              />
            </motion.div>
          </div>

          {/* Right Column: Visuals */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative lg:col-span-12 xl:col-span-7 pt-12 xl:pt-0"
            >
              <div className="absolute -inset-10 bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[120%] bg-white/[0.01] rounded-full border border-white/5 pointer-events-none" />
              
              <div className="relative z-10 scale-[1.05] xl:scale-110 origin-center">
                <CommissionArchitectSimulation />
              </div>

              {/* Floating Accents */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-12 -left-12 p-6 bg-bg-card/80 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-3xl space-y-3 max-w-[240px] z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-glow glow-emerald-500/20">
                    <TrendingUp size={18} />
                  </div>
                  <Typography variant="label" className="text-white text-xs font-black uppercase tracking-widest italic">Dynamic Retro-Pay</Typography>
                </div>
                <Typography variant="small" className="text-slate-500 text-[10px] leading-relaxed font-medium">Real-time settlement logic across all previous production tiers.</Typography>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-12 -right-12 p-6 bg-bg-card/85 border border-white/15 backdrop-blur-2xl rounded-3xl shadow-3xl z-20"
              >
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-8 w-8 rounded-full bg-slate-800 border-2 border-bg-deep flex items-center justify-center text-[10px] font-black text-slate-500 italic">
                          S
                        </div>
                      ))}
                   </div>
                   <div className="space-y-0.5">
                      <div className="text-[10px] text-white font-black uppercase tracking-widest italic">Shared Ledger</div>
                      <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Dealer Tier Synchronized</div>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Mobile UI Preview Aspect (Commission Focus) */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6 pt-12 border-t border-white/5"
            >
              <Card className="p-8 bg-white/5 border-white/10 overflow-hidden relative group rounded-[32px]">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={64} className="text-brand-primary" />
                </div>
                <Typography variant="mono" className="text-[10px] text-slate-400 uppercase mb-6 tracking-[0.3em] font-black">Commission Architect</Typography>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <Typography variant="small" className="text-slate-500 uppercase font-black text-[11px] block mb-2 tracking-widest">Projected Payout</Typography>
                    <Typography variant="h3" className="text-white italic font-black text-5xl tracking-tighter leading-none">$12,420</Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="small" className="text-brand-primary uppercase font-black text-[11px] block mb-2 tracking-widest">Tier 2 Active</Typography>
                    <Typography variant="mono" className="text-white font-black text-2xl leading-none italic">25% Front</Typography>
                  </div>
                </div>
                <div className="space-y-3 pt-6 border-t border-white/5">
                   <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-[0.15em] text-slate-500">
                      <span>Base Comm</span>
                      <span className="text-slate-200">$10,170</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-[0.15em] text-brand-primary">
                      <span>Retro Bonus</span>
                      <span className="font-black">+$1,250</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-[0.15em] text-brand-primary">
                      <span>Volume Goal</span>
                      <span className="font-black">+$1,000</span>
                   </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      {/* Dealer Solution Section - Moved to separate section for better vertical rhythm */}
      <section className="relative py-24 lg:py-48 px-6 bg-content-subtle/20 border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-deep via-transparent to-bg-deep opacity-80" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
             initial={{ opacity: 0, y: 40 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="max-w-4xl mx-auto"
          >
            <div className="p-1 lg:p-2 bg-white/5 rounded-[48px] border border-white/10 shadow-3xl backdrop-blur-xl">
              <div className="p-10 lg:p-16 rounded-[40px] bg-bg-deep/40 space-y-12 relative overflow-hidden group">
                <div className="absolute -right-32 -top-32 h-80 w-80 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-brand-primary/20 transition-all duration-1000" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                  <div className="flex items-center gap-8">
                    <div className="h-20 w-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-glow glow-primary/10 group-hover:scale-105 transition-transform duration-500">
                      <AppWindow size={40} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                      <Typography variant="h3" className="text-white italic font-black uppercase text-3xl lg:text-4xl leading-none tracking-tight">Dealership Solutions</Typography>
                      <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.4em] mt-2">Enterprise Command Tier Active</Typography>
                    </div>
                  </div>
                </div>

                <Typography variant="p" className="text-slate-400 text-lg leading-relaxed italic max-w-2xl relative z-10">
                  Manage the entire floor. Unified logs, manager overrides, and dealership-wide performance telemetry for professional automotive groups.
                </Typography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-12 border-t border-white/5 relative z-10">
                  <div className="space-y-3">
                    <Typography variant="label" className="text-white text-base font-bold flex items-center gap-2">
                       <ShieldCheck size={18} className="text-brand-primary" />
                       Manager Oversight
                    </Typography>
                    <Typography variant="p" className="text-slate-500 text-sm font-medium leading-relaxed">Centralized dashboard for management to track team performance, unit ladders, and individual production logs.</Typography>
                  </div>
                  <div className="space-y-3">
                    <Typography variant="label" className="text-white text-base font-bold flex items-center gap-2">
                       <TrendingUp size={18} className="text-brand-primary" />
                       Production Visibility
                    </Typography>
                    <Typography variant="p" className="text-slate-500 text-sm font-medium leading-relaxed">Real-time visibility into the entire sales floor with custom dealer-specific payout logic and retroactive volume settlement.</Typography>
                  </div>
                </div>

                <div className="pt-8 relative z-10">
                  <Link to="/dealer/request">
                    <Button 
                       variant="ghost" 
                       className="w-full lg:w-auto h-16 px-12 bg-white/[0.05] hover:bg-brand-primary hover:text-bg-deep text-xs font-black uppercase tracking-[0.3em] italic border border-white/10 shadow-2xl transition-all duration-500"
                    >
                       Request Dealer Access
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Credentials Footer */}
      <footer className="relative pt-32 pb-16 px-6 text-center space-y-12">
         <div className="flex flex-wrap justify-center gap-16 lg:gap-24 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-white" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-white" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Private Data Log</span>
            </div>
            <div className="flex items-center gap-3">
              <AppWindow size={18} className="text-white" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Performance Engine</span>
            </div>
         </div>
         
         <div className="space-y-4">
           <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" />
           <Typography variant="mono" className="text-[9px] uppercase tracking-[0.3em] text-slate-700 block font-black">
              © 2026 VisionForged Ventures • All Channels Secured
           </Typography>
         </div>
      </footer>
    </div>
  );
};
