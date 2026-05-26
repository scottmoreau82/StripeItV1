import React from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowUpRight, CheckCircle2, Star, Zap, Shield } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { Feature, featureAccessService } from '@/src/services/featureAccessService';
import { SubscriptionTier } from '@/src/types';

/**
 * StripeItUpgradeAccessScreenSystem
 * Intentional, premium paywall screen for restricted features.
 */

interface UpgradeAccessScreenProps {
  feature: Feature;
  tierRequired?: SubscriptionTier;
  onUpgrade?: () => void;
}

export const UpgradeAccessScreen: React.FC<UpgradeAccessScreenProps> = ({ 
  feature, 
  tierRequired = SubscriptionTier.PRO,
  onUpgrade
}) => {
  const navigate = useNavigate();
  const getFeatureDetails = (f: Feature) => {
    switch (f) {
      case Feature.ACTIVITY_FEED:
        return {
          title: "Real-Time Activity Feed",
          description: "Monitor every deal and note as they happen. Stay synced with the floor pulse.",
          icon: Zap,
          benefits: ["Live Deal Stream", "Instant Team Updates", "Activity Notifications"]
        };
      case Feature.ADVANCED_ANALYTICS:
        return {
          title: "Advanced Deal Analytics",
          description: "Unlock deep performance insights and trend metrics. Drive data-backed decisions.",
          icon: Star,
          benefits: ["Gross Profit Trends", "Closing Ratio Deep-Dives", "Predictive Forecasting"]
        };
      case Feature.GOALS:
        return {
          title: "Premium Goal Management",
          description: "Set, track, and crush your sales milestones with high-fidelity visualization.",
          icon: Shield,
          benefits: ["Personal Success KPI", "Team Sync Milestones", "Performance Alerts"]
        };
      case Feature.INVENTORY_MANAGEMENT:
        return {
          title: "Inventory Intelligence",
          description: "Full-scale inventory tracking and aging analysis for maximized turn speed.",
          icon: Lock,
          benefits: ["Unit Aging Alerts", "Inventory Gross Analysis", "Stock Level Sync"]
        };
      default:
        return {
          title: "Premium Feature Access",
          description: "Unlock professional-grade sales tools and synchronized team intelligence.",
          icon: Shield,
          benefits: ["Professional Layouts", "Tiered Data Insights", "Priority Cloud Sync"]
        };
    }
  };

  const details = getFeatureDetails(feature);

  return (
    <div className="min-h-full w-full flex items-center justify-center p-6 md:p-12 bg-bg-deep relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full z-10"
      >
        <Card className="bg-bg-card/40 border-white/10 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden shadow-glow glow-primary/5">
          {/* Feature Icon Header */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary">
                <details.icon className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-slate-900 border-2 border-brand-primary flex items-center justify-center shadow-lg">
                <Lock className="h-4 w-4 text-brand-primary" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-10">
            <Typography variant="mono" className="text-brand-primary uppercase tracking-[0.3em] font-black italic text-xs mb-3">
              Upgrade Required • {tierRequired} Tier
            </Typography>
            <Typography variant="h1" className="text-white font-black italic uppercase tracking-tighter mb-4 text-3xl md:text-5xl leading-tight">
              {details.title}
            </Typography>
            <Typography variant="body" className="text-slate-400 text-lg max-w-lg mx-auto">
              {details.description}
            </Typography>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {details.benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-5 py-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <Typography variant="mono" className="text-[11px] text-slate-200 uppercase font-bold tracking-wider">
                  {benefit}
                </Typography>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {tierRequired === SubscriptionTier.ORGANIZATION ? (
              <Button 
                className="w-full sm:w-auto px-10 py-7 bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black rounded-2xl shadow-glow glow-primary text-base uppercase tracking-widest flex items-center justify-center gap-3 group"
                onClick={() => navigate('/dealer/request')}
              >
                Request Dealer Access
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            ) : (
              <Button 
                className="w-full sm:w-auto px-10 py-7 bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black rounded-2xl shadow-glow glow-primary text-base uppercase tracking-widest flex items-center justify-center gap-3 group"
                onClick={onUpgrade}
              >
                Unlock This Feature
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            )}
            
            {tierRequired === SubscriptionTier.ORGANIZATION ? (
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Verification Required
              </Typography>
            ) : (
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Starting from $9.95/mo
              </Typography>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
