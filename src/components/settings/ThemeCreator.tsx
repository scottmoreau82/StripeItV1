import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme, applyCustomTheme, clearCustomTheme } from '@/src/contexts/ThemeContext';
import { CustomThemeConfig, SubscriptionTier } from '@/src/types';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Typography } from '@/src/components/ui/Typography';
import { cn } from '@/src/lib/utils';
import { Palette, RotateCcw, Save, Eye, Lock } from 'lucide-react';

const THEME_PRESETS: Record<string, Omit<CustomThemeConfig, 'savedAt'>> = {
  dark: {
    bgDeep: '#0A0E1A',
    bgSurface: '#0F1623',
    bgCard: '#141B2D',
    bgElevated: '#1A2235',
    brandPrimary: '#00D4FF',
    brandSecondary: '#7C3AED',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#475569',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    baseTheme: 'dark'
  },
  prowarm: {
    bgDeep: '#1C1917',
    bgSurface: '#211F1C',
    bgCard: '#292522',
    bgElevated: '#312E2A',
    brandPrimary: '#D4A574',
    brandSecondary: '#B8864E',
    textPrimary: '#E8E3DC',
    textSecondary: '#9C9489',
    textMuted: '#6B6459',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    baseTheme: 'prowarm'
  },
  prog: {
    bgDeep: '#0A0E1A',
    bgSurface: '#0F1623',
    bgCard: '#141B2D',
    bgElevated: '#1A2235',
    brandPrimary: '#AAFF00',
    brandSecondary: '#88CC00',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#475569',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    baseTheme: 'prog'
  },
  propink: {
    bgDeep: '#0A0E1A',
    bgSurface: '#0F1623',
    bgCard: '#141B2D',
    bgElevated: '#1A2235',
    brandPrimary: '#FF0080',
    brandSecondary: '#CC0066',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#475569',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    baseTheme: 'propink'
  },
  light: {
    bgDeep: '#E8ECF0',
    bgSurface: '#DDE2E8',
    bgCard: '#F0F3F7',
    bgElevated: '#FFFFFF',
    brandPrimary: '#00D4FF',
    brandSecondary: '#7C3AED',
    textPrimary: '#0F1923',
    textSecondary: '#2D3748',
    textMuted: '#64748B',
    borderColor: 'rgba(0, 0, 0, 0.10)',
    baseTheme: 'light'
  },
  progray: {
    bgDeep: '#1A1A1A',
    bgSurface: '#212121',
    bgCard: '#282828',
    bgElevated: '#2F2F2F',
    brandPrimary: '#00D4FF',
    brandSecondary: '#7C3AED',
    textPrimary: '#F0F0F0',
    textSecondary: '#909090',
    textMuted: '#5A5A5A',
    borderColor: 'rgba(255,255,255,0.07)',
    baseTheme: 'progray' as any
  },
  lightTeal: {
    bgDeep: '#E8ECF0',
    bgSurface: '#DDE2E8',
    bgCard: '#F0F3F7',
    bgElevated: '#FFFFFF',
    brandPrimary: '#0891B2',
    brandSecondary: '#0E7490',
    textPrimary: '#0F1923',
    textSecondary: '#2D3748',
    textMuted: '#64748B',
    borderColor: 'rgba(0,0,0,0.10)',
    baseTheme: 'lightTeal'
  },
  lightBlue: {
    bgDeep: '#E8ECF0',
    bgSurface: '#DDE2E8',
    bgCard: '#F0F3F7',
    bgElevated: '#FFFFFF',
    brandPrimary: '#0077CC',
    brandSecondary: '#005FA3',
    textPrimary: '#0F1923',
    textSecondary: '#2D3748',
    textMuted: '#64748B',
    borderColor: 'rgba(0,0,0,0.10)',
    baseTheme: 'lightBlue'
  }
};

export const ThemeCreator = ({ isMobile }: { isMobile?: boolean }) => {
  const { profile, updateProfileData, addToast } = useAuth();
  const { theme, setTheme } = useTheme();

  const isFreeTier = profile?.subscriptionTier === SubscriptionTier.FREE;

  const [config, setConfig] = useState<CustomThemeConfig>(() => {
    if (profile?.customTheme) {
      return profile.customTheme;
    }
    return {
      ...THEME_PRESETS.dark,
      savedAt: Date.now()
    } as CustomThemeConfig;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [selectedBase, setSelectedBase] = useState<string>(() => {
    return profile?.customTheme?.baseTheme || 'dark';
  });

  const isLivePreviewing = theme === 'custom';

  const handleLoadPreset = (presetId: string) => {
    const preset = THEME_PRESETS[presetId];
    const newConfig: CustomThemeConfig = {
      ...preset,
      savedAt: Date.now()
    };
    setConfig(newConfig);
    setSelectedBase(presetId);
    if (theme === 'custom') {
      applyCustomTheme(newConfig);
    }
  };

  const handleColorChange = (field: keyof Omit<CustomThemeConfig, 'savedAt' | 'baseTheme'>, value: string) => {
    const newConfig = {
      ...config,
      [field]: value
    };
    setConfig(newConfig);
    if (theme === 'custom') {
      applyCustomTheme(newConfig);
    }
  };

  const handleTogglePreview = () => {
    if (!isLivePreviewing) {
      setTheme('custom');
      applyCustomTheme(config);
    } else {
      setTheme(selectedBase as any);
    }
  };

  const handleReset = () => {
    const preset = THEME_PRESETS[selectedBase] || THEME_PRESETS.dark;
    const newConfig = {
      ...preset,
      savedAt: Date.now()
    } as CustomThemeConfig;
    setConfig(newConfig);
    if (theme === 'custom') {
      applyCustomTheme(newConfig);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalConfig = {
        ...config,
        savedAt: Date.now()
      };
      await updateProfileData({
        customTheme: finalConfig,
        themePreference: 'custom'
      });
      localStorage.setItem('stripeit-custom-theme', JSON.stringify(finalConfig));
      setTheme('custom');
      applyCustomTheme(finalConfig);
      addToast('Custom theme saved!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to save theme', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
            <Palette className="text-brand-primary" size={20} />
          </div>
          <div>
            <Typography variant="label" className="text-[var(--color-text-primary)] block text-sm uppercase">THEME CREATOR</Typography>
            <Typography variant="small" className="text-slate-500 text-[10px] uppercase">CUSTOMIZE COLOR SCHEME</Typography>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded bg-amber-500 text-black text-[8px] font-black tracking-wider uppercase leading-none shadow-sm flex items-center gap-1">
          <Lock size={10} />
          PRO EXCLUSIVE
        </div>
      </div>

      {/* Main Base Card */}
      <div className="relative">
        <Card className={cn("p-5 space-y-4 bg-bg-card/20 border-border-subtle", isFreeTier && "select-none")}>
          {/* Start From Presets */}
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-text-muted">
              START FROM
            </Typography>
            <select
              disabled={isFreeTier}
              value={selectedBase}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-[11px] font-black text-text-primary uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="lightTeal">LT Teal</option>
              <option value="lightBlue">LT Blue</option>
              <option value="prog">Pro Green</option>
              <option value="propink">Pro Pink</option>
              <option value="prowarm">Pro Warm</option>
              <option value="progray">Pro Gray</option>
            </select>
          </div>

          <div className="border-t border-border-subtle my-0" />

          {/* Color Row Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Column 1: Brand & Text */}
            <div className="space-y-4">
              <div>
                <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 block">
                  ACCENT & BRAND
                </Typography>
                <div className="space-y-1">
                  {[
                    { label: 'Accent Color', field: 'brandPrimary' },
                    { label: 'Accent Secondary', field: 'brandSecondary' }
                  ].map((row) => (
                    <div key={row.field} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{row.label}</span>
                      <input
                        type="color"
                        disabled={isFreeTier}
                        value={(config as any)[row.field]}
                        onChange={(e) => handleColorChange(row.field as any, e.target.value)}
                        className="h-8 w-12 rounded-md cursor-pointer border border-border-subtle bg-bg-card appearance-none p-0 outline-none overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 block">
                  TEXT
                </Typography>
                <div className="space-y-1">
                  {[
                    { label: 'Text Primary', field: 'textPrimary' },
                    { label: 'Text Secondary', field: 'textSecondary' },
                    { label: 'Text Muted', field: 'textMuted' }
                  ].map((row) => (
                    <div key={row.field} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{row.label}</span>
                      <input
                        type="color"
                        disabled={isFreeTier}
                        value={(config as any)[row.field]}
                        onChange={(e) => handleColorChange(row.field as any, e.target.value)}
                        className="h-8 w-12 rounded-md cursor-pointer border border-border-subtle bg-bg-card appearance-none p-0 outline-none overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Backgrounds */}
            <div>
              <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 block">
                BACKGROUNDS
              </Typography>
              <div className="space-y-1">
                {[
                  { label: 'Background', field: 'bgDeep' },
                  { label: 'Surface', field: 'bgSurface' },
                  { label: 'Card', field: 'bgCard' },
                  { label: 'Elevated', field: 'bgElevated' }
                ].map((row) => (
                  <div key={row.field} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{row.label}</span>
                    <input
                      type="color"
                      disabled={isFreeTier}
                      value={(config as any)[row.field]}
                      onChange={(e) => handleColorChange(row.field as any, e.target.value)}
                      className="h-8 w-12 rounded-md cursor-pointer border border-border-subtle bg-bg-card appearance-none p-0 outline-none overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border-subtle my-0" />

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={isFreeTier}
                onClick={handleTogglePreview}
                className={cn(
                  "gap-2 text-[10px] uppercase font-black tracking-widest",
                  isLivePreviewing && "border-brand-primary text-brand-primary bg-brand-primary/10 shadow-glow"
                )}
              >
                <Eye size={14} />
                {isLivePreviewing ? 'Preview Active' : 'Preview Live'}
              </Button>
              <Button
                variant="outline"
                disabled={isFreeTier}
                onClick={handleReset}
                className="gap-2 text-[10px] uppercase font-black tracking-widest"
              >
                <RotateCcw size={14} />
                Reset
              </Button>
            </div>

            <Button
              variant="primary"
              disabled={isFreeTier}
              onClick={handleSave}
              isLoading={isSaving}
              className="gap-2 text-[10px] uppercase font-black tracking-widest px-6"
            >
              <Save size={14} />
              Save Theme
            </Button>
          </div>
        </Card>

        {/* Pro Upgrading Gate overlay */}
        {isFreeTier && (
          <div className="absolute inset-0 bg-bg-deep/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-6 text-center z-10 border border-brand-primary/20">
            <Lock className="text-amber-500 mb-3 animate-pulse" size={32} />
            <Typography variant="h4" className="text-white font-black uppercase tracking-tight mb-1">PRO EXCLUSIVE</Typography>
            <Typography variant="small" className="text-slate-400 max-w-xs mb-4">
              Unlock the real-time Theme Creator, customize every color value, and build your own custom skin.
            </Typography>
            <Button
              variant="primary"
              onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-upgrade'))}
              className="text-xs uppercase font-black tracking-widest px-6"
            >
              Upgrade to Pro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
