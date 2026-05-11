import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DashboardLayout, WidgetConfig } from '../types';
import { WidgetType, widgetService } from './widgetService';

/**
 * StripeItSavedLayoutSystem
 * Persistence and state management for user dashboard layouts.
 */

export const dashboardService = {
  /**
   * Save a user's dashboard layout to Firestore
   */
  async saveUserLayout(userId: string, layout: DashboardLayout): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      dashboardPreference: {
        layout,
        lastUpdated: Date.now()
      }
    });
  },

  /**
   * Generates a fresh default layout for a new user
   */
  generateDefaultLayout(): DashboardLayout {
    const defaultOrder = widgetService.getDefaultLayout();
    const widgets: WidgetConfig[] = defaultOrder.map((type, index) => ({
      id: `widget-${type}-${Date.now()}-${index}`,
      type,
      visible: true,
      order: index
    }));

    return { widgets };
  },

  /**
   * Reorder widgets logic (client-side helper)
   */
  reorderWidgets(widgets: WidgetConfig[], oldIndex: number, newIndex: number): WidgetConfig[] {
    const result = Array.from(widgets);
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    
    // Update order property
    return result.map((w, i) => ({ ...w, order: i }));
  },

  /**
   * Toggle widget visibility
   */
  toggleVisibility(widgets: WidgetConfig[], widgetId: string): WidgetConfig[] {
    return widgets.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
  }
};
