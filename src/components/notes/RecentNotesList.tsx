import React, { useState } from 'react';
import { QuickNote } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { StickyNote, Trash2, Clock, Pencil } from 'lucide-react';
import { formatDateSafe } from '@/src/lib/utils';

/**
 * StripeItQuickNoteSystem - RecentNotesList
 * Reusable list for viewing and managing recent quick notes.
 */

interface RecentNotesListProps {
  notes: QuickNote[];
  onDelete?: (id: string) => void;
  onEdit?: (note: QuickNote) => void;
  isLoading?: boolean;
}

export const RecentNotesList: React.FC<RecentNotesListProps> = ({ notes, onDelete, onEdit, isLoading }) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
        <Card key={note.id} className="p-4 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-border)] transition-all group">
          <div className="flex justify-between items-start gap-4">
             <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                   <StickyNote size={14} className="text-brand-primary" />
                   <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">
                      {formatDateSafe(note.createdAt, 'MMM d, h:mm a', 'Recently')}
                   </Typography>
                </div>
                <Typography variant="p" className="text-[var(--color-text-primary)] text-sm leading-relaxed antialiased">
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
             {(onDelete || onEdit) && (
                <div className="shrink-0">
                  {pendingDeleteId !== note.id && (
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                          className="p-2 rounded-lg text-slate-700 hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                        >
                           <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPendingDeleteId(note.id); }}
                          className="p-2 rounded-lg text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                           <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
             )}
          </div>
          
          {pendingDeleteId === note.id && (
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border-subtle">
              <button 
                onClick={(e) => { e.stopPropagation(); setPendingDeleteId(null); }}
                className="text-[10px] uppercase font-black text-text-muted px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle transition-all active:scale-95"
              >
                 Cancel
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(note.id); setPendingDeleteId(null); }}
                className="text-[10px] uppercase font-black text-rose-400 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-all active:scale-95"
              >
                 Delete
              </button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
