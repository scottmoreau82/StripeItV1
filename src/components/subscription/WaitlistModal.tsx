import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, getFriendlyErrorMessage } from '@/src/lib/firebase';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { CheckCircle2 } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '' });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setMessage('');
      setErrors({ name: '', email: '' });
      setSubmitError('');
      setState('form');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const validationErrors = { name: '', email: '' };
    let hasError = false;

    if (!name.trim()) {
      validationErrors.name = 'Name is required';
      hasError = true;
    }
    if (!email.trim()) {
      validationErrors.email = 'Email is required';
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = 'Please enter a valid email address';
      hasError = true;
    }

    setErrors(validationErrors);
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'waitlist'), {
        name: name.trim(),
        email: email.trim(),
        message: message.trim() || '',
        createdAt: serverTimestamp(),
        source: 'upgrade_prompt',
      });
      setState('success');
    } catch (err: any) {
      console.error('Error submitting waitlist:', err);
      // Inline error shown on submit failure, do not close
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {state === 'form' ? (
        <div className="flex flex-col">
          {/* Custom Header Matching the Visual Spec */}
          <div className="space-y-1 mb-6">
            <Typography variant="mono" className="text-brand-primary block">
              PRO ACCESS
            </Typography>
            <Typography variant="h2" className="text-slate-500 font-display font-bold uppercase">
              JOIN THE WAITLIST
            </Typography>
          </div>

          <p className="text-slate-400 text-sm mb-6">
            Pro is coming soon. Drop your info and you'll be first to know when payments go live.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={errors.name}
              disabled={isSubmitting}
            />

            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={errors.email}
              disabled={isSubmitting}
            />

            <div className="flex flex-col gap-1.5">
              <Typography variant="label" className="text-slate-400">
                Message
              </Typography>
              <textarea
                rows={4}
                className="flex w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all duration-200 resize-none disabled:opacity-50"
                placeholder="Anything you'd like us to know?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {submitError && (
              <Typography variant="mono" className="text-orange-400 text-[10px] uppercase font-bold tracking-wider mt-2 block">
                {submitError}
              </Typography>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full text-xs font-bold uppercase tracking-widest py-3 mt-4"
            >
              {isSubmitting ? 'JOINING...' : 'JOIN WAITLIST'}
            </Button>
          </form>
        </div>
      ) : (
        /* Success State */
        <div className="flex flex-col items-center text-center py-6">
          <div className="h-16 w-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          
          <Typography variant="h2" className="text-brand-primary italic font-display font-black uppercase tracking-tight mb-2">
            YOU'RE ON THE LIST
          </Typography>
          
          <p className="text-slate-400 text-sm mb-8 max-w-sm">
            We'll reach out as soon as Pro is available.
          </p>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full uppercase font-black text-xs tracking-widest text-slate-300 border-white/10 hover:text-white"
          >
            GOT IT
          </Button>
        </div>
      )}
    </Modal>
  );
};
