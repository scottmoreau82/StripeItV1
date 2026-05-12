import React, { useState, useMemo } from 'react';
import { Deal, DealStatus, PayPlan, UserProfile } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { DealSearch } from './DealSearch';
import { DealFilters } from './DealFilters';
import { DealSummaryCard } from '../home/DealSummaryCard';
import { DealDetailView } from './DealDetailView';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { motion, AnimatePresence } from 'motion/react';
import { History, LayoutGrid, List, ShieldCheck, Target, Calculator } from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { DashboardLayout } from '../layout/DashboardLayout';
import { ContextHint } from '../onboarding/ContextHint';
import { randomDealService } from '@/src/services/randomDealService';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';

import { EmptyState } from '../ui/EmptyState';

/**
 * StripeItSalesLogSystem
 * The primary view for browsing, searching, and managing all car deals.
 */

interface SalesLogViewProps {
  onEdit?: (deal: Deal) => void;
  onConfigPayPlan?: () => void;
}

export const SalesLogView: React.FC<SalesLogViewProps> = ({
  onEdit,
  onConfigPayPlan,
}) => {
  const { 
    deals, 
    payPlan, 
    isLoading, 
    handleDeleteDeal, 
    handleUpdateDealStatus 
  } = useAppData();
  
  const { profile, isAdmin, user } = useAuth();
  const { isMobile } = useResponsive();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Sync selected deal if deals list updates (e.g. status change)
  const currentSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find(d => d.id === selectedDeal.id) || selectedDeal;
  }, [deals, selectedDeal]);

  // Filtering Logic
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const searchMatch = !search || 
        deal.customerName.toLowerCase().includes(search.toLowerCase()) ||
        deal.dealNumber?.toLowerCase().includes(search.toLowerCase()) ||
        deal.stockNumber?.toLowerCase().includes(search.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || deal.status === statusFilter;
      const typeMatch = typeFilter === 'all' || deal.newOrUsed === typeFilter;

      return searchMatch && statusMatch && typeMatch;
    });
  }, [deals, search, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const header = (
    <div className="flex flex-col gap-2">
      <Typography variant="h1" className="text-white">Sales Log</Typography>
      <div className="flex items-center gap-3">
        <Typography variant="p" className="text-slate-500">
          {profile?.displayName}'s personal history: {deals.length} deals total
        </Typography>
        <button 
          onClick={onConfigPayPlan}
          className="p-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-95 shadow-glow glow-primary/5"
          title="Commission Matrix"
          aria-label="Commission Matrix"
        >
          <Calculator size={14} />
        </button>
      </div>
    </div>
  );

  // Deal Detail Modal/Flow
  const handleCreateRandomDeal = () => {
    const randomDeal = randomDealService.generateRandomDeal();
    if (window.confirm(`Create random deal for ${randomDeal.customerName}?`)) {
      window.dispatchEvent(new CustomEvent('stripeit:create-random-deal'));
    }
  };

  const testingTools = (isAdmin || user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase()) ? (
    <div className="mt-12 pt-8 border-t border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-brand-primary" />
        <Typography variant="mono" className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
          Testing Tools (Admin Only)
        </Typography>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <Typography variant="h4" className="text-white mb-1">Generate Demo Data</Typography>
          <Typography variant="small" className="text-slate-500">
            Instantly create a realistic car deal to test calculations, totalizers, and dashboard visualizations.
          </Typography>
        </div>
        <Button 
          variant="secondary"
          className="bg-white/5 border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all gap-2"
          onClick={handleCreateRandomDeal}
        >
          <Target className="h-4 w-4" />
          Create Random Deal
        </Button>
      </div>
    </div>
  ) : null;

  const mainContent = (
    <div className="space-y-8 pb-32">
      <ContextHint 
        id="hint-sales-log" 
        title="Institutional Memory" 
        message="Search by customer name or stock number to recall deal details months later. The history grows with you."
        className="mb-0"
      />
      {/* Search & Filters Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DealSearch value={search} onChange={setSearch} />
        </div>
        <DealFilters 
          status={statusFilter}
          onStatusChange={setStatusFilter}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          onClear={clearFilters}
        />
      </div>

      {/* Results Meta */}
      <div className="flex items-center justify-between">
        <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-500">
          Showing {filteredDeals.length} of {deals.length} deals
        </Typography>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredDeals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <DealSummaryCard 
                  deal={deal} 
                  payPlan={payPlan}
                  showGross={!isMobile}
                  onClick={() => setSelectedDeal(deal)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={History}
            title="No results found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            }
          />
        )}
      </div>

      {testingTools}

      {/* Deal Detail Modal/Flow */}
      <AnimatePresence>
        {currentSelectedDeal && (
          isMobile ? (
            <FullscreenMobileFlow
              isOpen={!!currentSelectedDeal}
              onClose={() => setSelectedDeal(null)}
              title="Deal Details"
            >
              <DealDetailView 
                deal={currentSelectedDeal}
                payPlan={payPlan}
                onClose={() => setSelectedDeal(null)}
                onEdit={onEdit}
                onDelete={async (deal) => {
                  await handleDeleteDeal?.(deal.id);
                  setSelectedDeal(null);
                }}
                onStatusChange={(deal, status) => handleUpdateDealStatus(deal.id, status)}
              />
            </FullscreenMobileFlow>
          ) : (
            <Modal
              isOpen={!!currentSelectedDeal}
              onClose={() => setSelectedDeal(null)}
              title="Deal Record"
            >
              <DealDetailView 
                deal={currentSelectedDeal}
                payPlan={payPlan}
                onClose={() => setSelectedDeal(null)}
                onEdit={onEdit}
                onDelete={async (deal) => {
                  await handleDeleteDeal?.(deal.id);
                  setSelectedDeal(null);
                }}
                onStatusChange={(deal, status) => handleUpdateDealStatus(deal.id, status)}
              />
            </Modal>
          )
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};
