import React, { useState, useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { dealerRequestService } from '@/src/services/dealerRequestService';
import { DealerAccessRequest, DealerRequestStatus } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Globe, 
  UserCircle2, 
  Mail, 
  PhoneCall,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { COLLECTIONS } from '@/src/constants';

/**
 * DealerAccessRequestFlow
 * High-fidelity authorization request protocol for dealership scaling.
 * Replaces direct Dealer creation with a controlled approval workflow.
 */
export const DealerAccessRequestFlow: React.FC = () => {
  const { profile, user, addToast } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<DealerAccessRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    dealershipName: '',
    workEmail: '',
    roleTitle: '',
    website: '',
    phoneNumber: '',
    notes: ''
  });

  useEffect(() => {
    const fetchExisting = async () => {
      if (!user?.uid) return;
      try {
        const req = await dealerRequestService.getRequestByUserId(user.uid);
        setExistingRequest(req);
      } catch (error) {
        console.error("Error fetching existing request:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExisting();
  }, [user?.uid]);

  useEffect(() => {
    const isValid = !!(
      formData.dealershipName && 
      formData.workEmail && 
      formData.roleTitle && 
      formData.phoneNumber
    );
    setIsFormValid(isValid);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    
    setIsSubmitting(true);
    try {
      const requestId = await dealerRequestService.submitRequest({
        userId: user.uid,
        userEmail: user.email || '',
        userName: profile.displayName || 'Anonymous User',
        ...formData
      });
      
      const newRequest = await dealerRequestService.getRequestByUserId(user.uid);
      setExistingRequest(newRequest);
      addToast('Request transmitted successfully.', 'success');
    } catch (error) {
      addToast('Transmission failure. Please retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConsumerEmail = (email: string) => {
    const consumerDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    const domain = email.split('@')[1];
    return consumerDomains.includes(domain?.toLowerCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (existingRequest) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="bg-bg-card/40 border-white/10 backdrop-blur-xl p-10 text-center relative overflow-hidden">
          {existingRequest.status === DealerRequestStatus.PENDING && (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/50" />
              <div className="h-20 w-20 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-8 shadow-glow glow-primary">
                <Clock className="h-10 w-10 text-brand-primary animate-pulse" />
              </div>
              <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter mb-4 text-3xl">
                Request Pending Review
              </Typography>
              <Typography variant="p" className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Your dealer authorization request for <span className="text-white font-bold">{existingRequest.dealershipName}</span> is currently in the security queue.
              </Typography>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center max-w-sm mx-auto">
                 <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Estimated Triage Time</Typography>
                 <Typography variant="h3" className="text-white italic font-black uppercase">24-48 Hours</Typography>
              </div>
            </>
          )}

          {existingRequest.status === DealerRequestStatus.REJECTED && (
            <>
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8 shadow-glow glow-red-500/20">
                <ShieldAlert className="h-10 w-10 text-red-500" />
              </div>
              <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter mb-4 text-3xl">
                Authorization Declined
              </Typography>
              <Typography variant="p" className="text-slate-400 text-lg mb-6">
                Your request was reviewed and could not be approved at this time.
              </Typography>
              {existingRequest.adminNotes && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-8 text-left">
                   <Typography variant="mono" className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-2">Reviewer Notes</Typography>
                   <Typography variant="p" className="text-red-100/70 italic text-sm">{existingRequest.adminNotes}</Typography>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full border-white/10" 
                onClick={() => setExistingRequest(null)}
              >
                Submit New Request
              </Button>
            </>
          )}

          {existingRequest.status === DealerRequestStatus.APPROVED && (
            <>
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 shadow-glow glow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter mb-4 text-3xl">
                Authorized
              </Typography>
              <Typography variant="p" className="text-slate-400 text-lg mb-8">
                Your dealer tier upgrade is complete. You now have full operational administrative access.
              </Typography>
              <Button 
                className="w-full h-14 bg-brand-primary text-bg-deep font-black uppercase tracking-widest shadow-glow glow-primary"
                onClick={() => window.location.href = '/'}
              >
                Enter Dealership Console
              </Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex flex-col gap-10">
        <div className="space-y-4 text-center">
          <div className="inline-flex px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary mx-auto">
            Authorized Dealer Network
          </div>
          <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter text-4xl md:text-6xl leading-[0.85]">
            Scale Your <br />
            <span className="text-brand-primary">Dealership Floor.</span>
          </Typography>
          <Typography variant="p" className="text-slate-400 text-lg max-w-2xl mx-auto">
            Transition from private deal tracking to a unified dealership performance hub. 
            Connect your team, unify your logs, and dominate the market.
          </Typography>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          <Card className="bg-bg-card/40 border-white/10 backdrop-blur-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={16} className="text-brand-primary" />
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Store Information</Typography>
                  </div>
                  <Input 
                    label="Dealership Name"
                    placeholder="e.g. Skyline Toyota"
                    value={formData.dealershipName}
                    onChange={(e) => setFormData({...formData, dealershipName: e.target.value})}
                    required
                    className="bg-white/5 border-white/10 h-14"
                  />
                  <div className="relative">
                    <Input 
                      label="Dealer Website"
                      placeholder="www.skylinetoyota.com"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="bg-white/5 border-white/10 h-14 pl-12"
                    />
                    <Globe className="absolute left-4 top-[3.25rem] text-slate-500 h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCircle2 size={16} className="text-brand-primary" />
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Personal Authority</Typography>
                  </div>
                  <Input 
                    label="Your Professional Role"
                    placeholder="General Manager, Desk Manager, Owner"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({...formData, roleTitle: e.target.value})}
                    required
                    className="bg-white/5 border-white/10 h-14"
                  />
                  <div className="relative">
                    <Input 
                      label="Contact Phone"
                      placeholder="Professional direct line"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      required
                      className="bg-white/5 border-white/10 h-14 pl-12"
                    />
                    <PhoneCall className="absolute left-4 top-[3.25rem] text-slate-500 h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-brand-primary" />
                  <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Verification</Typography>
                </div>
                <div className="relative">
                  <Input 
                    label="Official Work Email"
                    placeholder="yourname@dealership.com"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
                    required
                    className="bg-white/5 border-white/10 h-14 pl-12"
                  />
                  <Mail className="absolute left-4 top-[3.25rem] text-slate-500 h-4 w-4" />
                </div>
                
                <AnimatePresence>
                  {formData.workEmail && isConsumerEmail(formData.workEmail) && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3"
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                      <Typography variant="p" className="text-orange-200/70 text-[11px]">
                        Using a personal email <span className="text-orange-400 font-bold">(gmail/yahoo)</span> may delay the verification protocol. Work emails are preferred.
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Operational Context (Optional)</Typography>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-1 focus:ring-brand-primary outline-none min-h-[120px] transition-all"
                  placeholder="Tell us about your team size, expected throughput, or special configuration needs..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <Button 
                disabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
                className="w-full h-16 shadow-glow glow-primary text-lg font-black uppercase tracking-tighter italic"
              >
                Transmit Dealer Access Request
                <Send className="ml-3 h-5 w-5" />
              </Button>

              <Typography variant="mono" className="text-slate-600 text-[10px] uppercase text-center block tracking-widest">
                StripeIt Security Tier One Processing 
              </Typography>
            </form>
          </Card>

          <div className="space-y-6">
            <Typography variant="h3" className="text-white italic font-black uppercase tracking-tight">Dealer Privileges</Typography>
            
            <div className="space-y-4">
              {[
                { title: 'Org-Wide Consensus', desc: 'Single source of truth for the entire sales floor.' },
                { title: 'Manager Overrides', desc: 'Approve, edit, and audit deals with master control.' },
                { title: 'High-Density Logs', desc: 'Professional telemetry grids for large volume tracking.' },
                { title: 'Advanced Governance', desc: 'Secure manager roles and precise authorization.' },
                { title: 'StripeIt Performance Skin', desc: 'The pure black operational aesthetic.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <Typography variant="label" className="text-white font-black uppercase text-[11px] block mb-1">{item.title}</Typography>
                    <Typography variant="p" className="text-slate-500 text-[11px] leading-tight">{item.desc}</Typography>
                  </div>
                </div>
              ))}
            </div>

            <Card className="bg-brand-primary/5 border-brand-primary/20 p-6 space-y-4">
               <Typography variant="h4" className="text-brand-primary italic font-black uppercase text-sm">Security Policy</Typography>
               <Typography variant="p" className="text-slate-400 text-[11px] leading-relaxed">
                  StripeIt maintains a verification-first architecture. All Dealer-level organizations are audited before activation to ensure data integrity and platform security for professional teams.
               </Typography>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
