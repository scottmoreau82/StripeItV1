import React, { useState, useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { feedbackService } from '@/src/services/feedbackService';
import { FeedbackReport, FeedbackStatus, FeedbackType, FeedbackSeverity } from '@/src/types';
import { Search, Bug, Lightbulb, ExternalLink, User, Smartphone, Globe, Trash2, Archive, ArchiveRestore, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { PageHeader } from '../ui/PageHeader';
import { Button } from '../ui/Button';

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
  const [viewMode, setViewMode] = useState<'active' | 'archived-bugs' | 'archived-features'>('active');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // Fetch all reports to allow local filtering by archive status/type
      const data = await feedbackService.getReports(true);
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
      const isClosed = status === FeedbackStatus.CLOSED;
      setReports(prev => prev.map(r => r.id === reportId ? { 
        ...r, 
        status,
        archived: isClosed ? true : r.archived 
      } : r));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleArchive = async (reportId: string, archived: boolean) => {
    try {
      await feedbackService.setArchived(reportId, archived);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, archived } : r));
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await feedbackService.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredReports = reports.filter(r => {
    // Phase 1: View Mode logic
    if (viewMode === 'active') {
      if (r.archived) return false;
    } else if (viewMode === 'archived-bugs') {
      if (!r.archived || r.type !== FeedbackType.BUG) return false;
    } else if (viewMode === 'archived-features') {
      if (!r.archived || r.type !== FeedbackType.FEATURE) return false;
    }

    // Phase 2: User-defined filters
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20 px-6">
      <PageHeader
        title="Technical Review"
        subtitle="Feedback Control Center • User Signals"
        icon={Bug}
      >
        <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl shadow-2xl">
           <div className="flex bg-bg-deep p-1 rounded-2xl border border-white/5">
             <button 
               onClick={() => setViewMode('active')}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 viewMode === 'active' ? "bg-brand-primary text-white shadow-glow glow-primary/20" : "text-slate-500 hover:text-slate-300"
               )}
             >
               Active
             </button>
             <button 
               onClick={() => setViewMode('archived-bugs')}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 viewMode === 'archived-bugs' ? "bg-rose-500 text-white shadow-glow glow-rose-500/20" : "text-slate-500 hover:text-slate-300"
               )}
             >
               Archived Bugs
             </button>
             <button 
               onClick={() => setViewMode('archived-features')}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 viewMode === 'archived-features' ? "bg-cyan-500 text-white shadow-glow glow-cyan-500/20" : "text-slate-500 hover:text-slate-300"
               )}
             >
               Archived Features
             </button>
           </div>

           <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

           <div className="w-40 text-left">
             <Select 
                label=""
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: FeedbackType.BUG, label: 'Bugs' },
                  { value: FeedbackType.FEATURE, label: 'Features' }
                ]}
             />
           </div>
           <div className="w-48 text-left">
             <Select 
                label=""
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
                placeholder="Filter by title or user..."
                className="bg-bg-deep border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-sm text-white w-64 md:w-80 focus:border-brand-primary outline-none transition-all placeholder:text-slate-600 focus:bg-white/[0.02]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </PageHeader>

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
              <ReportCard 
                key={report.id} 
                report={report} 
                onStatusChange={handleStatusChange}
                onArchive={handleArchive}
                onDeleteReq={() => setDeleteConfirmId(report.id)}
              />
            ))}
            {filteredReports.length === 0 && (
              <div className="col-span-full py-32 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center gap-4">
                <div className="h-20 w-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-700">
                  <Search className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <Typography variant="p" className="text-slate-500 font-black uppercase tracking-widest text-xs">No records found</Typography>
                  <Typography variant="small" className="text-slate-600 block">Queue is currently clear for this filter set.</Typography>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl space-y-8"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">Confirm Erasure</Typography>
                  <Typography variant="p" className="text-slate-400">
                    Are you sure you want to permanently delete this report? This action bypasses the archive and cannot be undone.
                  </Typography>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-2xl py-6 uppercase tracking-widest text-[11px] font-black"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 rounded-2xl py-6 uppercase tracking-widest text-[11px] font-black bg-rose-600 hover:bg-rose-500 border-none shadow-glow glow-rose-600/20"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Permanently Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ReportCardProps {
  report: FeedbackReport;
  onStatusChange: (reportId: string, status: FeedbackStatus) => Promise<void> | void;
  onArchive: (reportId: string, archived: boolean) => Promise<void> | void;
  onDeleteReq: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange, onArchive, onDeleteReq }) => {
  const isBug = report.type === FeedbackType.BUG;
  const isArchived = report.archived;
  
  return (
    <Card className={cn(
      "p-8 bg-bg-card/30 border-white/[0.05] hover:border-brand-primary/20 transition-all flex flex-col gap-8 group relative overflow-hidden backdrop-blur-md",
      isArchived && "opacity-80 grayscale-[0.3]"
    )}>
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
            <div className="flex items-center gap-3">
              <Typography variant="h3" className="text-white font-black truncate max-w-xs group-hover:text-brand-primary transition-colors text-xl leading-snug">{report.title}</Typography>
              {isArchived && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  <Archive className="h-3 w-3 text-slate-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Archived</span>
                </div>
              )}
            </div>
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
        
        <div className="flex flex-col gap-3 w-full sm:w-48 shrink-0">
          <div className="relative group/select">
            <select 
              value={report.status}
              onChange={(e) => onStatusChange(report.id, e.target.value as FeedbackStatus)}
              className={cn(
                "w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-[11px] font-black text-white uppercase tracking-widest focus:border-brand-primary outline-none transition-all cursor-pointer shadow-lg appearance-none",
                report.status === FeedbackStatus.NEW && "border-brand-primary shadow-glow glow-primary/20",
                report.status === FeedbackStatus.CLOSED && "border-green-500/40 text-green-500"
              )}
            >
              {Object.values(FeedbackStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-hover/select:text-brand-primary text-slate-600">
               {report.status === FeedbackStatus.CLOSED ? <CheckCircle2 className="h-4 w-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onArchive(report.id, !isArchived)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest",
                isArchived 
                  ? "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white" 
                  : "bg-white/5 border-white/10 text-slate-500 hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:text-brand-primary"
              )}
              title={isArchived ? "Restore to Active" : "Move to Archive"}
            >
              {isArchived ? (
                <><ArchiveRestore className="h-3.5 w-3.5" /> Restore</>
              ) : (
                <><Archive className="h-3.5 w-3.5" /> Archive</>
              )}
            </button>
            <button 
              onClick={onDeleteReq}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-900/10"
              title="Permanently Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 flex-1">
        <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/[0.03] shadow-inner flex flex-col gap-4">
          <Typography variant="p" className="text-slate-400 block whitespace-pre-wrap leading-relaxed text-sm font-medium">
            {report.description}
          </Typography>
          {report.notes && (
            <div className="pt-4 border-t border-white/[0.05] mt-2">
               <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black tracking-widest block mb-2">Internal Dev Notes</Typography>
               <Typography variant="small" className="text-slate-500 italic block">{report.notes}</Typography>
            </div>
          )}
        </div>

        {report.screenshotUrl && (
          <div className="space-y-2">
            <Typography variant="mono" className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] ml-2 block">Evidence Asset</Typography>
            <a 
              href={report.screenshotUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative rounded-3xl overflow-hidden border border-white/10 hover:border-brand-primary/50 transition-all group/img bg-slate-950 shadow-2xl"
            >
              <img src={report.screenshotUrl} alt="Visual Report" className="w-full h-56 object-contain opacity-70 group-hover/img:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all bg-black/40">
                 <div className="bg-brand-primary/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-brand-primary/40 text-brand-primary font-black uppercase text-[11px] tracking-widest flex items-center gap-3 shadow-glow glow-primary/30">
                   <ExternalLink className="h-5 w-5" /> 
                   Launch Asset
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
