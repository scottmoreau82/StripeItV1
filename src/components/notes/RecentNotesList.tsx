import React from 'react';
import { QuickNote } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { StickyNote, Trash2, Clock } from 'lucide-react';
import { formatDateSafe } from '@/src/lib/utils';

/**
 * StripeItQuickNoteSystem - RecentNotesList
 * Reusable list for viewing and managing recent quick notes.
 */

interface RecentNotesListProps {
  notes: QuickNote[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export const RecentNotesList: React.FC<RecentNotesListProps> = ({ notes, onDelete, isLoading }) => {
  if (notes.length === 0 && !isLoading) {
    return (
      <div className="py-10 text-center">
         <Typography variant="p" className="text-slate-600 text-sm italic">No recent notes found.</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.slice(0, 5).map((note) => (
        <Card key={note.id} className="p-4 bg-white/[0.01] border-white/5 hover:border-white/10 transition-all group">
          <div className="flex justify-between items-start gap-4">
             <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                   <StickyNote size={14} className="text-brand-primary" />
                   <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">
                      {formatDateSafe(note.createdAt, 'MMM d, h:mm a', 'Recently')}
                   </Typography>
                </div>
                <Typography variant="p" className="text-white text-sm leading-relaxed antialiased">
                   {note.text}
                </Typography>
                {(note.customerName || note.stockNumber) && (
                   <div className="flex flex-wrap gap-3">
                      {note.customerName && (
                         <div className="flex items-center gap-1">
                            <Typography variant="mono" className="text-[8px] text-slate-600 uppercase">Customer:</Typography>
                            <Typography variant="small" className="text-brand-primary text-[10px] font-bold">{note.customerName}</Typography>
                         </div>
                      )}
                      {note.stockNumber && (
                         <div className="flex items-center gap-1">
                            <Typography variant="mono" className="text-[8px] text-slate-600 uppercase">Stock #:</Typography>
                            <Typography variant="small" className="text-emerald-500 text-[10px] font-bold">{note.stockNumber}</Typography>
                         </div>
                      )}
                   </div>
                )}
                {note.reminderDate && (
                   <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/5 border border-amber-500/10 rounded-md w-fit">
                      <Clock size={10} className="text-amber-500" />
                      <Typography variant="mono" className="text-[9px] text-amber-500 uppercase font-bold">Reminder: {formatDateSafe(note.reminderDate, 'MMM d')}</Typography>
                   </div>
                )}
             </div>
             {onDelete && (
                <button 
                  onClick={() => onDelete(note.id)}
                  className="p-2 rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                   <Trash2 size={14} />
                </button>
             )}
          </div>
        </Card>
      ))}
    </div>
  );
};
