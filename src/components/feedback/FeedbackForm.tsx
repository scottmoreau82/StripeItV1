import React, { useState } from 'react';
import { 
  FeedbackType, 
  FeedbackSeverity, 
  FeedbackImportance, 
  SubscriptionTier
} from '@/src/types';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Button } from '@/src/components/ui/Button';
import { Typography } from '@/src/components/ui/Typography';
import { useAuth } from '@/src/contexts/AuthContext';
import { feedbackService } from '@/src/services/feedbackService';
import { useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

/**
 * StripeItFeedbackForm - Core input system for reports and requests.
 * Captures user input and handles optional file attachments.
 */
interface FeedbackFormProps {
  type: FeedbackType;
  onSuccess: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ type, onSuccess }) => {
  const { profile, addToast, tierOverride } = useAuth();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageArea, setPageArea] = useState('');
  const [severity, setSeverity] = useState<FeedbackSeverity>(FeedbackSeverity.MEDIUM);
  const [importance, setImportance] = useState<FeedbackImportance>(FeedbackImportance.IMPORTANT);

  const getDeviceInfo = () => {
    return {
      browser: navigator.userAgent.split(' ').pop() || 'Unknown',
      os: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      isMobile: window.innerWidth < 768
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!title.trim() || !description.trim()) {
      addToast('Please fill in required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        type,
        title: title.trim(),
        description: description.trim(),
        pageArea: pageArea.trim() || 'General',
        severity: type === FeedbackType.BUG ? severity : undefined,
        importance: type === FeedbackType.FEATURE ? importance : undefined,
        userId: profile.uid,
        userEmail: profile.email,
        displayName: profile.displayName,
        subscriptionTier: profile.subscriptionTier,
        developerOverrideTier: tierOverride || undefined,
        route: location.pathname,
        deviceInfo: getDeviceInfo(),
      });

      addToast(type === FeedbackType.BUG ? 'Bug report submitted.' : 'Feature request submitted.', 'success');
      onSuccess();
    } catch (err: any) {
      console.error('Feedback Submit Error:', err);
      addToast('Failed to submit, please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <Typography variant="small" className="text-slate-500 block leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-xl">
          {type === FeedbackType.BUG 
            ? "Use this when something is broken, not saving, displaying incorrectly, or behaving differently than expected."
            : "Use this when you want Stripe It to add, improve, or expand something."
          }
        </Typography>

        <Input 
          label="Short Summary" 
          placeholder={type === FeedbackType.BUG ? "e.g. Sales Log pagination broken" : "e.g. Export to PDF feature"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <Typography variant="label" className="text-slate-400">
            {type === FeedbackType.BUG ? "What went wrong?" : "What would you like added?"}
          </Typography>
          <textarea 
            className="flex min-h-[120px] w-full rounded-2xl border border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus-visible:outline-none focus:border-brand-primary/50 transition-all placeholder:text-slate-600 outline-none"
            placeholder={type === FeedbackType.BUG ? "Describe the steps to reproduce the issue..." : "Describe the feature and how it would help you..."}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Page or Area" 
            placeholder="e.g. Dashboard"
            value={pageArea}
            onChange={(e) => setPageArea(e.target.value)}
          />
          {type === FeedbackType.BUG ? (
            <Select 
              label="Severity"
              options={Object.values(FeedbackSeverity).map(s => ({ value: s, label: s }))}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as FeedbackSeverity)}
            />
          ) : (
            <Select 
              label="Importance"
              options={Object.values(FeedbackImportance).map(i => ({ value: i, label: i }))}
              value={importance}
              onChange={(e) => setImportance(e.target.value as FeedbackImportance)}
            />
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black uppercase tracking-[0.15em] text-xs shadow-glow glow-primary"
        isLoading={isSubmitting}
      >
        Submit {type === FeedbackType.BUG ? 'Bug Report' : 'Feature Request'}
      </Button>
    </form>
  );
};
