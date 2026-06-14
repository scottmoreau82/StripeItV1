import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { AmbientEffect } from '@/src/types';
import { cn } from '@/src/lib/utils';

const AuroraEffect = () => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ x: [0, 60, -30], y: [0, -40, 30], scale: [1, 1.3, 0.85], opacity: 1 }}
      transition={{ x: { duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }, y: { duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }, scale: { duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }, opacity: { duration: 2, ease: 'easeInOut' } }}
      className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-primary) 18%, transparent)' }}
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ x: [0, -40, 60], y: [0, 50, -30], scale: [1, 0.8, 1.2], opacity: 1 }}
      transition={{ x: { duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 4 }, y: { duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 4 }, scale: { duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 4 }, opacity: { duration: 2, ease: 'easeInOut', delay: 4 } }}
      className="absolute top-[-10%] right-[-15%] w-[500px] h-[500px] rounded-full blur-[120px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-secondary) 15%, transparent)' }}
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ x: [0, 30, -50], y: [0, 40, -20], opacity: 1 }}
      transition={{ x: { duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 8 }, y: { duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 8 }, opacity: { duration: 2, ease: 'easeInOut', delay: 8 } }}
      className="absolute bottom-[-20%] left-[20%] w-[450px] h-[450px] rounded-full blur-[120px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-primary) 10%, transparent)' }}
    />
  </>
);

const GradientMeshEffect = () => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ x: [0, 40], y: [0, -30], opacity: 1 }}
      transition={{ x: { duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }, y: { duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }, opacity: { duration: 2, ease: 'easeInOut' } }}
      className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full blur-[100px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-primary) 12%, transparent)' }}
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ x: [0, -30], y: [0, 40], opacity: 1 }}
      transition={{ x: { duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 2 }, y: { duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 2 }, opacity: { duration: 2, ease: 'easeInOut', delay: 2 } }}
      className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full blur-[90px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-secondary) 10%, transparent)' }}
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ x: [0, 20, -20], y: [0, -20, 20], opacity: 1 }}
      transition={{ x: { duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 5 }, y: { duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 5 }, opacity: { duration: 2, ease: 'easeInOut', delay: 5 } }}
      className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full blur-[80px]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-primary) 8%, transparent)' }}
    />
  </>
);

const ParticleFieldEffect = () => {
  const particles = useMemo(() => Array.from({length: 25}, (_, i) => ({
    id: i,
    x: (i * 37 + 13) % 100,
    y: (i * 59 + 7) % 100,
    size: 1 + (i % 3),
    duration: 5 + (i % 8),
    delay: (i * 0.4) % 6,
  })), []);

  return (
    <>
      {particles.map(p => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -15, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: 'var(--color-brand-primary)',
          }}
        />
      ))}
    </>
  );
};

export const AmbientEffectsLayer: React.FC = () => {
  const { profile } = useAuth();
  const { isMobile } = useResponsive();
  const activeEffects = profile?.preferences?.ambientEffects || [];
  const hasParticles = activeEffects.includes(AmbientEffect.PARTICLES);
  const hasAurora = activeEffects.includes(AmbientEffect.AURORA);
  const hasMesh = activeEffects.includes(AmbientEffect.GRADIENT_MESH);

  // Heavy full-screen effects (canvas/animation) are disabled on mobile to avoid
  // jank and battery drain on phones.
  if (isMobile) return null;
  if (!hasParticles && !hasAurora && !hasMesh) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {hasAurora && <AuroraEffect />}
      {hasMesh && <GradientMeshEffect />}
      {hasParticles && <ParticleFieldEffect />}
    </div>
  );
};
