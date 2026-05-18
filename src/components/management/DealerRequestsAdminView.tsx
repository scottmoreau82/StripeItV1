import React, { useState, useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { dealerRequestService } from '@/src/services/dealerRequestService';
import { DealerAccessRequest, DealerRequestStatus } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Globe, 
  Mail, 
  Phone,
  User,
  ExternalLink,
  MessageSquare,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';

/**
 * DealerRequestsAdminView
 * Administrative interface for reviewing dealer access requests.
 * Secure gateway for promoting accounts to Organization tier.
 */
export const DealerRequestsAdminView: React.FC = () => {
  const { user, addToast } = useAuth();
  const [requests, setRequests] = useState<DealerAccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DealerRequestStatus | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DealerAccessRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await dealerRequestService.getRequests();
      setRequests(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      addToast('Failed to load requests.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    setIsProcessing(requestId);
    try {
      await dealerRequestService.approveRequest(requestId, user.uid, adminNotes);
      addToast('Request approved and Dealer account initialized.', 'success');
      await fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      addToast('Approval failed.', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;
    setIsProcessing(requestId);
    try {
      await dealerRequestService.rejectRequest(requestId, user.uid, adminNotes);
      addToast('Request declined.', 'info');
      await fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      addToast('Rejection failed.', 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.dealershipName.toLowerCase().includes(search.toLowerCase()) ||
      req.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      req.workEmail.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || req.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 h-full">
      {/* Header & Controls */}
      <PageHeader
        title="Dealer Triage"
        subtitle="Review and Authorize Organizational Promotion"
        icon={Building2}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search dealership/email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-white/[0.02] border-white/10 w-64 h-11"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-bold uppercase tracking-widest h-11 focus:ring-1 focus:ring-brand-primary outline-none"
          >
            <option value="all">All States</option>
            <option value={DealerRequestStatus.PENDING}>Pending</option>
            <option value={DealerRequestStatus.APPROVED}>Approved</option>
            <option value={DealerRequestStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List of Requests */}
        <div className="lg:col-span-12">
          {isLoading ? (
            <div className="flex py-20 items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-20 text-center bg-white/[0.02] border-white/5">
              <Typography variant="p" className="text-slate-500 italic">No authorization requests found matching the current filters.</Typography>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRequests.map(req => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card 
                      className={cn(
                        "p-6 cursor-pointer transition-all duration-300",
                        selectedRequest?.id === req.id ? "ring-2 ring-brand-primary bg-brand-primary/[0.03]" : "hover:bg-white/[0.04] border-white/10"
                      )}
                      onClick={() => {
                        setSelectedRequest(req);
                        setAdminNotes(req.adminNotes || '');
                      }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-primary">
                          <Building2 size={20} />
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
                          req.status === DealerRequestStatus.PENDING ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                          req.status === DealerRequestStatus.APPROVED ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                          {req.status === 'pending_review' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Typography variant="h3" className="text-white italic font-black uppercase truncate leading-none mb-1">
                            {req.dealershipName}
                          </Typography>
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                            {req.roleTitle}
                          </Typography>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <Mail size={12} className="text-slate-600" />
                             <Typography variant="p" className="text-[11px] text-slate-400 truncate">{req.workEmail}</Typography>
                          </div>
                          <div className="flex items-center gap-2">
                             <Phone size={12} className="text-slate-600" />
                             <Typography variant="p" className="text-[11px] text-slate-400 truncate">{req.phoneNumber}</Typography>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                           <Typography variant="mono" className="text-[9px] text-slate-600 uppercase">Submitted {new Date(req.createdAt).toLocaleDateString()}</Typography>
                           <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest">Details</Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Selected Request Sidebar / Modal View */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedRequest(null);
              }}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="max-w-4xl w-full"
                onClick={e => e.stopPropagation()}
              >
                <Card className="bg-bg-card/90 border-white/10 p-0 overflow-hidden shadow-2xl">
                  {/* Banner */}
                  <div className={cn(
                    "h-2 w-full",
                    selectedRequest.status === DealerRequestStatus.PENDING ? "bg-orange-500" :
                    selectedRequest.status === DealerRequestStatus.APPROVED ? "bg-emerald-500" :
                    "bg-red-500"
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 space-y-8 border-r border-white/5">
                      <div>
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-4">Request Lifecycle Management</Typography>
                        <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter text-3xl mb-1">
                          {selectedRequest.dealershipName}
                        </Typography>
                        <Typography variant="p" className="text-brand-primary text-sm font-bold">{selectedRequest.roleTitle}</Typography>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <DetailRow icon={Mail} label="Work Email" value={selectedRequest.workEmail} />
                          <DetailRow icon={Phone} label="Contact Phone" value={selectedRequest.phoneNumber} />
                          <DetailRow icon={Globe} label="Website" value={selectedRequest.website} isLink />
                          <DetailRow icon={User} label="Requester" value={`${selectedRequest.userName} (${selectedRequest.userEmail})`} />
                        </div>
                      </div>

                      {selectedRequest.notes && (
                        <div className="space-y-2 pt-6 border-t border-white/5">
                           <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2">
                              <MessageSquare size={12} /> Requester Notes
                           </Typography>
                           <Typography variant="p" className="text-slate-300 text-sm leading-relaxed italic">
                             "{selectedRequest.notes}"
                           </Typography>
                        </div>
                      )}
                    </div>

                    <div className="p-8 bg-black/20 flex flex-col justify-between">
                       <div className="space-y-6">
                        <Typography variant="h3" className="text-white italic font-black uppercase text-lg">Action Console</Typography>
                        
                        <div className="space-y-4">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold mb-2">Reviewer Feedback (Internal/External)</Typography>
                          <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-1 focus:ring-brand-primary outline-none min-h-[150px] transition-all"
                            placeholder="Add notes for approval or rejection reason..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            disabled={selectedRequest.status !== DealerRequestStatus.PENDING}
                          />
                        </div>

                        {selectedRequest.status !== DealerRequestStatus.PENDING && (
                           <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase">Review Metadata</Typography>
                              <Typography variant="p" className="text-[11px] text-slate-400">
                                Reviewed on {new Date(selectedRequest.reviewedAt!).toLocaleString()} by {selectedRequest.reviewedBy || 'System Admin'}
                              </Typography>
                           </div>
                        )}
                       </div>

                       <div className="pt-8 space-y-4">
                        {selectedRequest.status === DealerRequestStatus.PENDING ? (
                          <div className="flex gap-4">
                            <Button 
                              variant="outline" 
                              className="flex-1 border-white/10 text-red-500 hover:bg-red-500/10"
                              onClick={() => handleReject(selectedRequest.id)}
                              isLoading={isProcessing === selectedRequest.id}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 shadow-glow glow-emerald-500/20"
                              onClick={() => handleApprove(selectedRequest.id)}
                              isLoading={isProcessing === selectedRequest.id}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Promo
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            className="w-full text-slate-500"
                            onClick={() => setSelectedRequest(null)}
                          >
                            Close Details
                          </Button>
                        )}
                       </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value, isLink }: { icon: any, label: string, value: string, isLink?: boolean }) => (
  <div className="group flex flex-col space-y-1">
    <Typography variant="mono" className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{label}</Typography>
    <div className="flex items-center gap-3">
       <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
          <Icon size={14} />
       </div>
       {isLink ? (
         <a 
          href={value.startsWith('http') ? value : `https://${value}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white text-sm hover:text-brand-primary flex items-center gap-2 transition-colors"
         >
           {value} <ExternalLink size={12} className="opacity-40" />
         </a>
       ) : (
         <Typography variant="p" className="text-white text-sm">{value}</Typography>
       )}
    </div>
  </div>
);
