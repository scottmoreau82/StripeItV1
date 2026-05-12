import React, { useState, useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { feedbackService } from '@/src/services/feedbackService';
import { FeedbackReport, FeedbackStatus, FeedbackType, FeedbackSeverity } from '@/src/types';
import { Search, Bug, Lightbulb, ExternalLink, User, Smartphone, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '@/src/lib/utils';

/**
 * StripeItFeedbackReviewPage
 * Admin-only dashboard for managing user reports and feature requests.
 * Restricted to bootstrap admin email: scottmoreau82@gmail.com
 */
export const FeedbackReviewPage: React.FC = () => {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await feedbackService.getReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load feedback reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (reportId: string, status: FeedbackStatus) => {
    try {
      await feedbackService.updateStatus(reportId, status);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20 px-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse shadow-glow glow-primary" />
            <Typography variant="mono" className="text-[10px] text-brand-primary uppercase font-black tracking-[0.2em]">Feedback Control Center</Typography>
          </div>
          <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">Technical Review</Typography>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl shadow-2xl">
           <div className="w-40">
             <Select 
                label="Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: FeedbackType.BUG, label: 'Bugs' },
                  { value: FeedbackType.FEATURE, label: 'Features' }
                ]}
             />
           </div>
           <div className="w-48">
             <Select 
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  ...Object.values(FeedbackStatus).map(s => ({ value: s, label: s }))
                ]}
             />
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                placeholder="Search email, title, or content..."
                className="bg-bg-deep border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-sm text-white w-64 md:w-80 focus:border-brand-primary outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.02]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="py-32 flex flex-col items-center gap-6"
          >
             <div className="h-16 w-16 border-[5px] border-brand-primary/10 border-t-brand-primary rounded-full animate-spin shadow-glow glow-primary/20" />
             <div className="space-y-1 text-center">
               <Typography variant="mono" className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em]">Synchronizing Feedback Feed</Typography>
               <Typography variant="small" className="text-slate-600 block italic">Authenticating Secure Proxy...</Typography>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} onStatusChange={handleStatusChange} />
            ))}
            {filteredReports.length === 0 && (
              <div className="col-span-full py-32 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center gap-4">
                <div className="h-20 w-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-700">
                  <Search className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <Typography variant="p" className="text-slate-500 font-black uppercase tracking-widest text-xs">No records found</Typography>
                  <Typography variant="small" className="text-slate-600 block">Try adjusting your filters or search terms.</Typography>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ReportCardProps {
  report: FeedbackReport;
  onStatusChange: (reportId: string, status: FeedbackStatus) => Promise<void> | void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange }) => {
  const isBug = report.type === FeedbackType.BUG;
  
  return (
    <Card className="p-8 bg-bg-card/30 border-white/[0.05] hover:border-brand-primary/20 transition-all flex flex-col gap-8 group relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-0 group-hover:opacity-5 blur-[100px] transition-opacity pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
            isBug ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
          )}>
            {isBug ? <Bug className="h-7 w-7" /> : <Lightbulb className="h-7 w-7" />}
          </div>
          <div className="space-y-1.5 min-w-0">
            <Typography variant="h3" className="text-white font-black truncate max-w-md group-hover:text-brand-primary transition-colors text-xl leading-snug">{report.title}</Typography>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500/80">
                {format(report.createdAt, 'MMM d, yyyy · HH:mm')}
              </span>
              <div className="h-1 w-1 rounded-full bg-slate-800" />
              <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm", 
                isBug ? "bg-rose-500/5 text-rose-500 border-rose-500/10" : "bg-cyan-500/5 text-cyan-500 border-cyan-500/10"
              )}>
                {isBug ? `Severity: ${report.severity}` : `Importance: ${report.importance}`}
              </span>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <select 
            value={report.status}
            onChange={(e) => onStatusChange(report.id, e.target.value as FeedbackStatus)}
            className={cn(
              "w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black text-white uppercase tracking-widest focus:border-brand-primary outline-none transition-all cursor-pointer shadow-lg",
              report.status === FeedbackStatus.NEW && "border-brand-primary shadow-glow glow-primary/20"
            )}
          >
            {Object.values(FeedbackStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-5 flex-1">
        <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/[0.03] space-y-4 shadow-inner">
          <Typography variant="p" className="text-slate-400 block whitespace-pre-wrap leading-relaxed text-sm font-medium">
            {report.description}
          </Typography>
        </div>

        {report.screenshotUrl && (
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em] ml-2 block">Evidence Asset</Typography>
            <a 
              href={report.screenshotUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative rounded-3xl overflow-hidden border border-white/10 hover:border-brand-primary/50 transition-all group/img bg-slate-950 shadow-2xl"
            >
              <img src={report.screenshotUrl} alt="Visual Report" className="w-full h-56 object-contain opacity-70 group-hover/img:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all bg-black/50">
                 <div className="bg-brand-primary/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-brand-primary/40 text-brand-primary font-black uppercase text-[11px] tracking-widest flex items-center gap-3 shadow-glow glow-primary/30">
                   <ExternalLink className="h-5 w-5" /> 
                   Launch Asset Fullscreen
                 </div>
              </div>
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/[0.05]">
        <InfoItem icon={User} label="Protocol User" value={report.userEmail} />
        <InfoItem icon={Globe} label="Vector Area" value={report.pageArea} />
        <InfoItem icon={Smartphone} label="OS / Device" value={`${report.deviceInfo.os} (${report.deviceInfo.browser})`} />
        <InfoItem icon={Search} label="License Tier" value={report.developerOverrideTier ? `DEV (${report.developerOverrideTier})` : report.subscriptionTier.toUpperCase()} />
      </div>
    </Card>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="space-y-1.5 min-w-0">
    <Typography variant="mono" className="text-[9px] text-slate-600 uppercase font-black tracking-[0.1em] flex items-center gap-2">
      <Icon className="h-3 w-3 text-slate-700" />
      {label}
    </Typography>
    <Typography variant="small" className="text-white block font-black truncate text-[11px] tracking-tight">{value}</Typography>
  </div>
);
