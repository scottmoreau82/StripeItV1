import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform, useInView } from 'motion/react';
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

// Typewriter component
const TypewriterText = ({ text, speed = 60 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState('');
  const [key, setKey] = useState(0);
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [key, text, speed]);
  return (
    <div className="flex items-center gap-1">
      <Typography variant="h2" className="text-brand-primary font-black italic text-3xl tracking-tighter">
        {displayed}
      </Typography>
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-8 bg-brand-primary"
      />
      <button
        onClick={() => setKey(k => k + 1)}
        className="ml-4 text-[9px] text-text-muted uppercase font-black border border-border-subtle rounded px-2 py-1 hover:border-brand-primary/50 transition-colors"
      >
        Replay
      </button>
    </div>
  );
};

// Text scramble component
const ScrambleText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  const scramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayed(text.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < iteration) return text[i];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      iteration += 0.5;
      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayed(text);
        setIsScrambling(false);
      }
    }, 40);
  };
  return (
    <div
      onClick={scramble}
      className="cursor-pointer group"
    >
      <Typography variant="h2" className="text-brand-primary font-black italic text-3xl tracking-tighter font-mono group-hover:text-brand-primary/80 transition-colors">
        {displayed}
      </Typography>
      <Typography variant="mono" className="text-[9px] text-text-muted mt-1">Click to scramble</Typography>
    </div>
  );
};

// 3D tilt card component
const TiltCard = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2) * -12;
    const y = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2) * 12;
    setTilt({ x, y });
  };
  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 800 }}
      className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 cursor-pointer max-w-xs"
    >
      <div style={{ transform: 'translateZ(20px)' }}>
        <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">PINCKNEY</Typography>
        <Typography variant="h2" className="text-text-primary font-black italic text-2xl">$565</Typography>
        <Typography variant="mono" className="text-[9px] text-brand-primary">EST. PAYOUT • NEW</Typography>
      </div>
    </motion.div>
  );
};

// Spotlight card component
const SpotlightCard = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  return (
    <div
      onMouseMove={handleMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-bg-elevated border border-border-subtle rounded-2xl p-6 overflow-hidden cursor-pointer max-w-xs"
    >
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(200px circle at ${pos.x}px ${pos.y}px, rgba(var(--color-brand-primary-rgb, 0,212,255), 0.08), transparent 70%)`,
          }}
        />
      )}
      <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black relative z-10">Hover over me</Typography>
      <Typography variant="h2" className="text-text-primary font-black italic text-2xl relative z-10">Spotlight Effect</Typography>
      <Typography variant="mono" className="text-[9px] text-brand-primary relative z-10">Light follows cursor</Typography>
    </div>
  );
};

// Scroll fade-in wrapper
const ScrollFadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Confetti burst
const ConfettiBurst = () => {
  const [particles, setParticles] = useState<{id:number;x:number;y:number;color:string;angle:number;speed:number}[]>([]);
  const colors = ['#00D4FF','#AAFF00','#FF0080','#D4A574','#7C3AED','#22C55E','#F59E0B'];
  const fire = () => {
    const newParticles = Array.from({length: 40}, (_, i) => ({
      id: Date.now() + i,
      x: 50,
      y: 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      speed: 60 + Math.random() * 80,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1200);
  };
  return (
    <div className="space-y-4">
      <Button onClick={fire} size="sm" variant="outline">🎉 Fire Confetti</Button>
      <div className="relative h-32 bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden">
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 1, scale: 1 }}
              animate={{
                x: `${p.x + Math.cos(p.angle * Math.PI/180) * p.speed}%`,
                y: `${p.y + Math.sin(p.angle * Math.PI/180) * p.speed}%`,
                opacity: 0,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ position: 'absolute', width: 6, height: 6, borderRadius: 2, backgroundColor: p.color }}
            />
          ))}
        </AnimatePresence>
        {particles.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Click button to fire</Typography>
          </div>
        )}
      </div>
      <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add confetti on deal save" or "Add confetti on goal hit" to implement</Typography>
    </div>
  );
};

// SVG checkmark draw
const CheckmarkDraw = () => {
  const [key, setKey] = useState(0);
  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => setKey(k => k+1)}>Replay</Button>
      <div className="flex items-center gap-6">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg key={key} width="32" height="32" viewBox="0 0 32 32" fill="none">
            <motion.path
              d="M6 16 L13 23 L26 9"
              stroke="#22C55E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
        </div>
        <div>
          <Typography variant="label" className="text-text-primary block font-black text-sm">Deal Saved!</Typography>
          <Typography variant="mono" className="text-[9px] text-text-muted">SVG path draws itself on success</Typography>
        </div>
      </div>
      <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add checkmark draw to deal save success" to implement</Typography>
    </div>
  );
};

// Number odometer flip
const OdometerFlip = () => {
  const [value, setValue] = useState(11);
  const [key, setKey] = useState(0);
  const digits = String(value).padStart(2, '0').split('');
  const increment = () => {
    setValue(v => v + 1);
    setKey(k => k+1);
  };
  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={increment}>+ Add Unit</Button>
      <div className="flex items-center gap-2">
        {digits.map((digit, i) => (
          <div key={i} className="h-16 w-12 bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden flex items-center justify-center relative">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${key}-${i}-${digit}`}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute"
              >
                <Typography variant="h2" className="text-brand-primary font-black italic text-3xl">{digit}</Typography>
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
        <Typography variant="mono" className="text-[10px] text-text-muted uppercase font-black ml-2">Units</Typography>
      </div>
      <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add odometer flip to unit count on dashboard" to implement</Typography>
    </div>
  );
};

// Aurora background
const AuroraPreview = () => (
  <div className="relative h-48 rounded-xl overflow-hidden bg-bg-deep">
    <motion.div
      animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.2, 0.9, 1] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[-30%] left-[-20%] w-80 h-80 rounded-full blur-[100px]"
      style={{ backgroundColor: 'rgba(0,212,255,0.2)' }}
    />
    <motion.div
      animate={{ x: [0, -30, 50, 0], y: [0, 40, -20, 0], scale: [1, 0.8, 1.3, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      className="absolute top-[-20%] right-[-20%] w-72 h-72 rounded-full blur-[100px]"
      style={{ backgroundColor: 'rgba(124,58,237,0.2)' }}
    />
    <motion.div
      animate={{ x: [0, 20, -40, 0], y: [0, 30, -10, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      className="absolute bottom-[-30%] left-[20%] w-64 h-64 rounded-full blur-[80px]"
      style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
    />
    <div className="relative z-10 flex items-center justify-center h-full">
      <Typography variant="mono" className="text-[10px] text-text-primary uppercase font-black tracking-widest">Aurora Background</Typography>
    </div>
  </div>
);

// Particle field
const ParticleField = () => {
  const particles = Array.from({length: 20}, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 4 + Math.random() * 8,
    delay: Math.random() * 4,
  }));
  return (
    <div className="relative h-48 rounded-xl overflow-hidden bg-bg-deep border border-border-subtle">
      {particles.map(p => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          className="absolute rounded-full bg-brand-primary"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
        />
      ))}
      <div className="relative z-10 flex items-center justify-center h-full">
        <Typography variant="mono" className="text-[10px] text-text-primary uppercase font-black tracking-widest">Particle Field</Typography>
      </div>
    </div>
  );
};

// Scanline animation
const ScanlinePreview = () => (
  <div className="relative h-48 rounded-xl overflow-hidden bg-bg-card border border-border-subtle">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
    <motion.div
      animate={{ top: ['-10%', '110%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-x-0 h-16 pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,212,255,0.06), transparent)' }}
    />
    <div className="relative z-10 flex items-center justify-center h-full">
      <Typography variant="mono" className="text-[10px] text-text-primary uppercase font-black tracking-widest">Scanline Effect</Typography>
    </div>
  </div>
);

// Glassmorphism
const GlassmorphismPreview = () => (
  <div className="relative h-48 rounded-xl overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #0A0E1A, #1A2235)' }}>
    <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-brand-primary/30 blur-xl" />
    <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-purple-500/20 blur-xl" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-2 shadow-2xl">
        <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black">Glass Card</Typography>
        <Typography variant="h2" className="text-text-primary font-black italic text-2xl">$5,530</Typography>
        <Typography variant="mono" className="text-[9px] text-brand-primary">Frosted glass surface</Typography>
      </div>
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

      {/* 11. SCROLL PROGRESS BAR */}
      <PreviewSection title="Scroll Progress Bar" icon={Layers} description="Thin line at top showing scroll progress — not yet implemented">
        <div className="space-y-3">
          <div className="relative h-2 bg-bg-elevated rounded-full overflow-hidden border border-border-subtle">
            <motion.div
              className="absolute inset-y-0 left-0 bg-brand-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '65%' }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          <Typography variant="mono" className="text-[9px] text-text-muted">Simulated at 65% scroll • would track real scroll position app-wide</Typography>
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add scroll progress bar" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 12. SCROLL-TRIGGERED FADE IN */}
      <PreviewSection title="Scroll-Triggered Fade In" icon={Layers} description="Sections animate in as they enter the viewport — scroll down to see">
        <div className="space-y-3">
          {['First item fades in', 'Second item follows', 'Third item last'].map((text, i) => (
            <div key={i}>
              <ScrollFadeIn delay={i * 0.1}>
                <div className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3">
                  <Typography variant="mono" className="text-[10px] text-text-primary font-black">{text}</Typography>
                </div>
              </ScrollFadeIn>
            </div>
          ))}
          <Typography variant="mono" className="text-[9px] text-text-muted">Scroll away and back to replay • Say "Add scroll fade-in to landing page" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 13. TYPEWRITER */}
      <PreviewSection title="Typewriter Text" icon={Layers} description="Text types itself out character by character">
        <div className="space-y-3">
          <TypewriterText text="OWN YOUR DEALS." speed={50} />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add typewriter to landing page hero" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 14. TEXT SCRAMBLE */}
      <PreviewSection title="Text Scramble" icon={Layers} description="Characters randomize before resolving — telemetry/cyberpunk feel">
        <div className="space-y-3">
          <ScrambleText text="PERFORMANCE OVERVIEW" />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add scramble to page headers" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 15. 3D TILT CARD */}
      <PreviewSection title="3D Tilt on Hover" icon={Layers} description="Card tilts toward cursor — holographic card effect">
        <div className="space-y-3">
          <TiltCard />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add 3D tilt to metric cards" or "Add 3D tilt to deal cards" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 16. SPOTLIGHT */}
      <PreviewSection title="Spotlight Effect" icon={Layers} description="Light follows cursor across card surface">
        <div className="space-y-3">
          <SpotlightCard />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add spotlight to dashboard cards" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 17. CONFETTI BURST */}
      <PreviewSection title="Confetti Burst" icon={Sparkles} description="Particle explosion on achievement — deal saved, goal hit">
        <ConfettiBurst />
      </PreviewSection>

      {/* 18. SVG CHECKMARK DRAW */}
      <PreviewSection title="SVG Checkmark Draw" icon={Zap} description="Path draws itself on success — satisfying completion feedback">
        <CheckmarkDraw />
      </PreviewSection>

      {/* 19. ODOMETER FLIP */}
      <PreviewSection title="Number Odometer Flip" icon={BarChart3} description="Digits flip like airport departures board when value changes">
        <OdometerFlip />
      </PreviewSection>

      {/* 20. AURORA */}
      <PreviewSection title="Aurora Background" icon={Layers} description="Slow moving gradient waves — Northern Lights aesthetic">
        <div className="space-y-3">
          <AuroraPreview />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add aurora to dashboard background" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 21. PARTICLE FIELD */}
      <PreviewSection title="Particle Field" icon={Layers} description="Subtle floating dots in the background">
        <div className="space-y-3">
          <ParticleField />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add particle field to dashboard" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 22. SCANLINE */}
      <PreviewSection title="Scanline Animation" icon={Layers} description="Moving horizontal light sweep — telemetry/radar aesthetic">
        <div className="space-y-3">
          <ScanlinePreview />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add scanline to metric cards" to implement</Typography>
        </div>
      </PreviewSection>

      {/* 23. GLASSMORPHISM */}
      <PreviewSection title="Glassmorphism" icon={Box} description="Frosted glass cards with backdrop blur and light refraction">
        <div className="space-y-3">
          <GlassmorphismPreview />
          <Typography variant="mono" className="text-[9px] text-text-muted">Say "Add glassmorphism to dashboard cards" to implement</Typography>
        </div>
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
