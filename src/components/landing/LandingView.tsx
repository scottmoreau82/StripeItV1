import React from 'react';
import { useNavigate } from 'react-router-dom';
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

const MOCK_GRAPH_DATA = [
  { name: 'Jan', val: 4000 },
  { name: 'Feb', val: 3000 },
  { name: 'Mar', val: 5000 },
  { name: 'Apr', val: 4500 },
  { name: 'May', val: 6500 },
  { name: 'Jun', val: 8000 },
];

const FeatureItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group">
    <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-glow glow-primary/5">
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <div className="space-y-1">
      <Typography variant="label" className="text-white block">{title}</Typography>
      <Typography variant="small" className="text-slate-500 leading-tight">
        {description}
      </Typography>
    </div>
  </div>
);

export const LandingView: React.FC<{ isInitializing?: boolean }> = ({ isInitializing }) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const handleSignUp = () => navigate('/signup');
  const handleLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-bg-deep selection:bg-brand-primary/30 selection:text-white overflow-hidden relative">
      {/* Initialization Progress Bar (Subtle) */}
      {isInitializing && (
        <div className="fixed top-0 left-0 w-full h-[2px] bg-brand-primary/20 z-[100]">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-brand-primary shadow-glow glow-primary"
          />
        </div>
      )}

      {/* Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[100px] rounded-full" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
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
              <button 
                onClick={handleLogin}
                className="text-[10px] text-slate-500 hover:text-white uppercase font-black tracking-[0.2em] transition-colors"
                id="landing-login-btn-top"
              >
                Login
              </button>
            )}
            <Button 
              onClick={handleSignUp}
              className="h-10 px-6 text-[10px] uppercase font-black tracking-widest shadow-glow glow-primary"
              id="landing-signup-btn-top"
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className={isMobile ? 'flex flex-col gap-16' : 'grid grid-cols-1 lg:grid-cols-2 gap-20 items-center'}>
          
          {/* Left Column: Messaging */}
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary">
                The Performance Log for Pros
              </div>
              
              <Typography 
                variant="h1" 
                className={isMobile ? "text-5xl text-white italic font-black uppercase leading-[0.85] tracking-tighter" : "text-7xl text-white italic font-black uppercase leading-[0.85] tracking-tighter"}
              >
                Track. <br />
                Analyze. <br />
                <span className="text-brand-primary">Close More.</span>
              </Typography>
              
              <Typography variant="p" className="text-slate-400 text-lg max-w-lg leading-relaxed font-medium">
                The elite dealership performance toolkit. Secure deal logging, 
                real-time commission tracking, and professional sales intelligence 
                built for high-performance automotive sales teams.
              </Typography>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                onClick={handleSignUp}
                className="h-14 px-10 text-base font-black italic uppercase tracking-tighter shadow-glow glow-primary group"
                id="landing-hero-signup-btn"
              >
                Start Free Account
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogin}
                className="h-14 px-10 text-base font-black italic uppercase tracking-tighter border-white/10 hover:bg-white/5"
                id="landing-hero-login-btn"
              >
                Log In
              </Button>
            </motion.div>

            {/* Features List */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-10 border-t border-white/5"
            >
              <FeatureItem 
                icon={TrendingUp} 
                title="Track Deals" 
                description="Securely log and track every car deal from your mobile device."
              />
              <FeatureItem 
                icon={Target} 
                title="Set Goals" 
                description="Establish performance targets and track your progress daily."
              />
              <FeatureItem 
                icon={Zap} 
                title="Live Payouts" 
                description="Calculate commissions and SPIFFs instantly as you log deals."
              />
              <FeatureItem 
                icon={BarChart3} 
                title="Deep Insights" 
                description="High-fidelity analytics to visualize your sales trajectory."
              />
            </motion.div>
          </div>

          {/* Right Column: Visuals */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -inset-10 bg-brand-primary/5 blur-[80px] rounded-full pointer-events-none" />
              
              <Card className="p-0 border-white/10 bg-bg-card/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                {/* Mock Dashboard Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-brand-primary/20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                    </div>
                    <Typography variant="mono" className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                      Live Performance Stream
                    </Typography>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-white/5" />
                    <div className="h-2 w-2 rounded-full bg-white/5" />
                    <div className="h-2 w-2 rounded-full bg-white/5" />
                  </div>
                </div>

                {/* Mock Stats */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-white/5">
                  {[
                    { label: 'Units', val: '42' },
                    { label: 'Gross', val: '$184K' },
                    { label: 'Comm', val: '$12.4K' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-bg-deep p-4 space-y-1">
                      <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-bold">{stat.label}</Typography>
                      <Typography variant="h3" className="text-white italic font-black uppercase text-2xl tracking-tighter">
                        {stat.val}
                      </Typography>
                    </div>
                  ))}
                </div>

                {/* Mock Graph */}
                <div className="h-64 mt-4 px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_GRAPH_DATA}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Telemetry Footer */}
                <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span className="text-[8px] text-slate-500 uppercase font-black">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-brand-primary" />
                      <span className="text-[8px] text-slate-500 uppercase font-black">Real-time</span>
                    </div>
                  </div>
                  <Typography variant="mono" className="text-[7px] text-slate-600 uppercase font-black">
                     StripeIt v2.4.0 Engine
                  </Typography>
                </div>
              </Card>

              {/* Floating Accents */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-8 p-4 bg-bg-card/80 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp size={14} />
                  </div>
                  <Typography variant="label" className="text-white text-[11px]">+24% Above Goal</Typography>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-6 -right-6 p-4 bg-bg-card/80 border border-white/10 backdrop-blur-xl rounded-2xl shadow-xl"
              >
                <div className="flex items-center gap-2">
                   <MousePointer2 className="text-brand-primary h-4 w-4" />
                   <div className="h-3 w-20 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '80%' }}
                        transition={{ duration: 1, delay: 1 }}
                        className="h-full bg-brand-primary" 
                      />
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Mobile UI Preview Aspect (Simple Stat Cards) */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="p-4 bg-white/5 border-white/10">
                <Typography variant="mono" className="text-[8px] text-slate-400 uppercase mb-2">Deal Velocity</Typography>
                <Typography variant="h3" className="text-white italic font-black text-2xl tracking-tighter">8.4x</Typography>
                <div className="h-1 w-full bg-brand-primary/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-brand-primary w-[70%]" />
                </div>
              </Card>
              <Card className="p-4 bg-white/5 border-white/10">
                <Typography variant="mono" className="text-[8px] text-slate-400 uppercase mb-2">Active Payout</Typography>
                <Typography variant="h3" className="text-brand-primary italic font-black text-2xl tracking-tighter">$4.2K</Typography>
                <div className="flex gap-1 mt-2">
                   {[1,2,3,4].map(i => <div key={i} className="h-1 flex-1 bg-brand-primary animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Credentials Footer */}
        <div className="mt-32 pt-12 border-t border-white/5 text-center space-y-6">
           <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} />
                <span className="text-[10px] uppercase font-black tracking-widest text-white">Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={16} />
                <span className="text-[10px] uppercase font-black tracking-widest text-white">Private Data Log</span>
              </div>
              <div className="flex items-center gap-2">
                <AppWindow size={16} />
                <span className="text-[10px] uppercase font-black tracking-widest text-white">Performance Engine</span>
              </div>
           </div>
           
           <Typography variant="mono" className="text-[9px] uppercase tracking-[0.2em] text-slate-600 block">
              © 2024 StripeIt Tech • Unified Dealership Intelligence Systems
           </Typography>
        </div>
      </main>
    </div>
  );
};
