import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { Skeleton, MetricCardSkeleton, DealRowSkeleton, DealCardSkeleton } from '../ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, Zap, MousePointer, Layers, BarChart3, Box } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const MOCK_BARS = [
  { name: 'Jan', value: 4 },
  { name: 'Feb', value: 7 },
  { name: 'Mar', value: 5 },
  { name: 'Apr', value: 9 },
  { name: 'May', value: 11 },
  { name: 'Jun', value: 8 },
];

const PreviewSection = ({ title, icon: Icon, description, children }: {
  title: string; icon: any; description: string; children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
      <div className="h-9 w-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
        <Icon size={18} className="text-brand-primary" />
      </div>
      <div>
        <Typography variant="label" className="text-text-primary block text-sm font-black uppercase tracking-widest">{title}</Typography>
        <Typography variant="small" className="text-text-muted text-[10px]">{description}</Typography>
      </div>
    </div>
    <div className="bg-bg-card/30 border border-border-subtle rounded-2xl p-6">
      {children}
    </div>
  </div>
);

export const EffectsPreview: React.FC = () => {
  // State for each section
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [staggerKey, setStaggerKey] = useState(0);
  const [sharedSelected, setSharedSelected] = useState<number | null>(null);
  const [glowPulsing, setGlowPulsing] = useState(false);
  const [borderFlashing, setBorderFlashing] = useState(false);

  // Magnetic button logic
  const magnetRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });
  const handleMagnetMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const handleMagnetLeave = () => { x.set(0); y.set(0); };

  const STAGGER_ITEMS = ['PINCKNEY • NEW • $2,260', 'PUFFENBERGER • USED • $1,738', 'CASTER JR. • CPO • $4,800', 'GARCIA • NEW • $-94', 'RAMIREZ • USED • $10,655'];

  const header = (
    <PageHeader
      title="Effects Preview"
      subtitle="Animation lab • admin only"
      icon={Sparkles}
    />
  );

  const main = (
    <div className="space-y-12 pb-20">

      {/* 1. PAGE TRANSITIONS */}
      <PreviewSection title="Page Transitions" icon={Layers} description="Fade + scale on every route change — already active app-wide">
        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 rounded-xl bg-bg-elevated border border-border-subtle text-center">
            <Typography variant="mono" className="text-[10px] text-text-muted uppercase font-black">Current Config</Typography>
            <Typography variant="small" className="text-text-primary block mt-1 font-bold">y:16 scale:0.98 → y:0 scale:1 • 250ms ease-out</Typography>
          </div>
          <div className="text-text-muted text-[10px] font-black uppercase">Active ✓</div>
        </div>
      </PreviewSection>

      {/* 2. SKELETON LOADERS */}
      <PreviewSection title="Skeleton Loaders" icon={Box} description="GPU-accelerated shimmer placeholders while data loads">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setShowSkeletons(s => !s)}>
              {showSkeletons ? 'Show Real Content' : 'Show Skeletons'}
            </Button>
            <Typography variant="mono" className="text-[10px] text-text-muted uppercase">Toggle to compare</Typography>
          </div>
          {showSkeletons ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
              <div className="space-y-2">
                <DealCardSkeleton />
                <DealCardSkeleton />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-bg-card border border-border-subtle p-5 space-y-3 min-h-[140px]">
                  <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Units</Typography>
                  <Typography variant="h1" className="text-text-primary text-4xl font-black italic">11.5</Typography>
                  <Typography variant="mono" className="text-[9px] text-brand-primary">12.7/mo pacing</Typography>
                </div>
                <div className="rounded-2xl bg-bg-card border border-border-subtle p-5 space-y-3 min-h-[140px]">
                  <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Est. Payout</Typography>
                  <Typography variant="h1" className="text-text-primary text-4xl font-black italic">$5,530</Typography>
                  <Typography variant="mono" className="text-[9px] text-emerald-400">+$480 spiffs</Typography>
                </div>
              </div>
              <div className="space-y-2">
                {['PINCKNEY • NEW • $565', 'PUFFENBERGER • NEW • $434'].map((label, i) => (
                  <div key={i} className="bg-bg-card border border-border-subtle rounded-xl p-3 flex items-center justify-between">
                    <Typography variant="mono" className="text-[10px] text-text-primary font-black">{label}</Typography>
                    <Typography variant="mono" className="text-[9px] text-text-muted">05/28/26</Typography>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PreviewSection>

      {/* 3. STAGGERED LIST */}
      <PreviewSection title="Staggered List Entrance" icon={Layers} description="Deal rows feed in sequentially — active in Sales Log">
        <div className="space-y-3">
          <Button size="sm" variant="outline" onClick={() => setStaggerKey(k => k + 1)}>
            Replay Animation
          </Button>
          <AnimatePresence mode="wait">
            <motion.div key={staggerKey} className="space-y-2">
              {STAGGER_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.2, ease: 'easeOut' }}
                  className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3"
                >
                  <Typography variant="mono" className="text-[10px] text-text-primary font-black">{item}</Typography>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </PreviewSection>

      {/* 4. SHARED ELEMENT TRANSITION */}
      <PreviewSection title="Shared Element Transition" icon={Layers} description="Card expands into detail view with a fluid morphing animation">
        <div className="space-y-4">
          <Typography variant="mono" className="text-[10px] text-text-muted uppercase">Click a deal card to expand it</Typography>
          <AnimatePresence mode="wait">
            {sharedSelected !== null ? (
              <motion.div
                layoutId={`card-${sharedSelected}`}
                className="bg-bg-elevated border border-brand-primary/30 rounded-2xl p-8 space-y-4 cursor-pointer"
                onClick={() => setSharedSelected(null)}
              >
                <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Deal Detail • Click to collapse</Typography>
                <Typography variant="h2" className="text-text-primary font-black italic text-3xl">{STAGGER_ITEMS[sharedSelected].split(' • ')[0]}</Typography>
                <div className="grid grid-cols-3 gap-4">
                  {['NEW', '$2,260 FRONT', '$565 PAYOUT'].map((stat, i) => (
                    <div key={i} className="bg-bg-card rounded-xl p-3 text-center">
                      <Typography variant="mono" className="text-[9px] text-brand-primary font-black">{stat}</Typography>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    layoutId={`card-${i}`}
                    onClick={() => setSharedSelected(i)}
                    className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 cursor-pointer hover:border-brand-primary/30 transition-colors"
                  >
                    <Typography variant="mono" className="text-[10px] text-text-primary font-black">{STAGGER_ITEMS[i]}</Typography>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </PreviewSection>

      {/* 5. CHART ANIMATIONS */}
      <PreviewSection title="Chart Animations" icon={BarChart3} description="Bars grow from bottom on mount — replay to see entrance">
        <div className="space-y-3">
          <Button size="sm" variant="outline" onClick={() => setChartKey(k => k + 1)}>
            Replay Entrance
          </Button>
          <div key={chartKey} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_BARS}>
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 10 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-brand-primary)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </PreviewSection>

      {/* 6. BUTTON EFFECTS */}
      <PreviewSection title="Button Effects" icon={Zap} description="All 5 click effects — configurable per user in Settings → Button Effects">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">None (Default)</Typography>
            <Button size="sm" variant="outline" className="w-full">Click Me</Button>
          </div>
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Glow Pulse</Typography>
            <motion.button
              onClick={() => { setGlowPulsing(true); setTimeout(() => setGlowPulsing(false), 400); }}
              animate={{ boxShadow: glowPulsing ? '0 0 35px 8px var(--color-brand-primary)' : '0 0 0px 0px transparent' }}
              transition={{ duration: 0.2 }}
              className="w-full h-9 px-4 rounded-xl border border-border-subtle text-text-primary text-[10px] font-black uppercase tracking-widest bg-transparent cursor-pointer"
            >
              Click Me
            </motion.button>
          </div>
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Border Flash</Typography>
            <motion.button
              onClick={() => { setBorderFlashing(true); setTimeout(() => setBorderFlashing(false), 350); }}
              animate={{ borderColor: borderFlashing ? 'var(--color-brand-primary)' : 'var(--color-border)' }}
              transition={{ duration: 0.15 }}
              className="w-full h-9 px-4 rounded-xl border border-border-subtle text-text-primary text-[10px] font-black uppercase tracking-widest bg-transparent cursor-pointer"
            >
              Click Me
            </motion.button>
          </div>
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Ripple</Typography>
            <div className="relative overflow-hidden rounded-xl">
              <RippleButton />
            </div>
          </div>
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Scale + Color</Typography>
            <motion.button
              whileTap={{ scale: 0.92, backgroundColor: 'var(--color-brand-secondary)' }}
              className="w-full h-9 px-4 rounded-xl border border-border-subtle text-text-primary text-[10px] font-black uppercase tracking-widest bg-transparent cursor-pointer"
            >
              Click Me
            </motion.button>
          </div>
        </div>
      </PreviewSection>

      {/* 7. MAGNETIC BUTTON */}
      <PreviewSection title="Magnetic Button" icon={MousePointer} description="Button subtly follows the cursor — active on primary/outline buttons app-wide">
        <div className="flex items-center justify-center py-8">
          <motion.div
            onMouseMove={handleMagnetMove}
            onMouseLeave={handleMagnetLeave}
            style={{ x: springX, y: springY }}
            className="inline-block"
          >
            <Button>Hover Near Me</Button>
          </motion.div>
        </div>
      </PreviewSection>

      {/* 8. COUNT-UP */}
      <PreviewSection title="Count-Up Animation" icon={BarChart3} description="Metric values roll up from 0 or previous value on change — active on dashboard">
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Units', value: '11.5' }, { label: 'Front End', value: '$32,700' }, { label: 'Est. Payout', value: '$5,530' }].map((m, i) => (
            <div key={i} className="bg-bg-elevated border border-border-subtle rounded-xl p-4 text-center space-y-1">
              <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">{m.label}</Typography>
              <Typography variant="h2" className="text-brand-primary font-black italic text-2xl">{m.value}</Typography>
              <Typography variant="mono" className="text-[8px] text-text-muted">Animates on change</Typography>
            </div>
          ))}
        </div>
      </PreviewSection>

      {/* 9. GRADIENT MESH */}
      <PreviewSection title="Gradient Mesh Background" icon={Layers} description="Animated color blobs behind content — not yet implemented, available to add">
        <div className="relative h-48 rounded-xl overflow-hidden bg-bg-deep">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-20%] left-[-10%] w-64 h-64 rounded-full blur-[80px]"
            style={{ backgroundColor: 'var(--color-brand-primary)', opacity: 0.15 }}
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-[-20%] right-[-10%] w-64 h-64 rounded-full blur-[80px]"
            style={{ backgroundColor: 'var(--color-brand-secondary)', opacity: 0.12 }}
          />
          <div className="relative z-10 flex items-center justify-center h-full">
            <Typography variant="mono" className="text-[10px] text-text-primary uppercase font-black tracking-widest">Gradient Mesh Preview</Typography>
          </div>
        </div>
        <Typography variant="mono" className="text-[9px] text-text-muted mt-2">Say "Add gradient mesh to dashboard" to implement</Typography>
      </PreviewSection>

      {/* 10. NOISE TEXTURE */}
      <PreviewSection title="Noise Texture Overlay" icon={Layers} description="Subtle grain on card surfaces — not yet implemented, available to add">
        <div className="relative h-32 rounded-xl overflow-hidden bg-bg-card border border-border-subtle">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px'
            }}
          />
          <div className="relative z-10 flex items-center justify-center h-full">
            <Typography variant="mono" className="text-[10px] text-text-primary uppercase font-black tracking-widest">Noise Texture on Card</Typography>
          </div>
        </div>
        <Typography variant="mono" className="text-[9px] text-text-muted mt-2">Say "Add noise texture to cards" to implement</Typography>
      </PreviewSection>

    </div>
  );

  return <DashboardLayout header={header} stats={null} main={main} />;
};

// Ripple button sub-component for the effects preview
const RippleButton = () => {
  const [ripples, setRipples] = useState<{id:number;x:number;y:number;size:number}[]>([]);
  const ref = useRef<HTMLButtonElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left - size/2, y: e.clientY - rect.top - size/2, size }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  };
  return (
    <button
      ref={ref}
      onClick={handleClick}
      className="relative overflow-hidden w-full h-9 px-4 rounded-xl border border-border-subtle text-text-primary text-[10px] font-black uppercase tracking-widest bg-transparent cursor-pointer"
    >
      Click Me
      <AnimatePresence>
        {ripples.map(r => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ position:'absolute', left:r.x, top:r.y, width:r.size, height:r.size, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.35)', pointerEvents:'none' }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
};
