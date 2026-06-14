import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PayPlan, PayPlanTemplate } from '../types';
import { COLLECTIONS } from '../constants';
import { payPlanService } from './payPlanService';

/**
 * StripeItPayPlanTemplateSystem (Dealer tier)
 *
 * Org-level pay plan templates + assignment + resolve-at-read.
 *
 * Design (see Dealer Tier spec):
 * - Templates live at organizations/{orgId}/payPlanTemplates/{templateId}.
 * - A salesperson's pay plan stores only `sourceTemplateId` + optional `override`,
 *   NOT a full copy. The effective plan is resolved at read time by layering the
 *   override over the template. This makes the template->salesperson link "live":
 *   editing a template updates everyone on it automatically (overrides excluded).
 */

// Firestore rejects any write containing `undefined`. The Commission Architect's
// payload can include undefined optional fields (and the regular save path only
// gets away with it because it uses setDoc merge:true). Strip them recursively.
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out as T;
  }
  return value;
}

const templatesCol = (orgId: string) =>
  collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.PAY_PLAN_TEMPLATES);

const templateDoc = (orgId: string, templateId: string) =>
  doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.PAY_PLAN_TEMPLATES, templateId);

export const payPlanTemplateService = {
  /**
   * Create a new template (e.g. from Commission Architect "Save as Template").
   * Returns the new template id.
   */
  async createTemplate(
    orgId: string,
    templateName: string,
    plan: Omit<PayPlanTemplate, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'templateName' | 'assignedCount'>
  ): Promise<string> {
    const ref = doc(templatesCol(orgId));
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.PAY_PLAN_TEMPLATES}/${ref.id}`;
    try {
      const payload = stripUndefinedDeep({
        ...plan,
        id: ref.id,
        organizationId: orgId,
        templateName,
        assignedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(ref, payload);
      return ref.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Update an existing template. Because plans resolve at read time, this
   * automatically propagates to every linked salesperson (overrides excluded).
   */
  async updateTemplate(
    orgId: string,
    templateId: string,
    updates: Partial<Omit<PayPlanTemplate, 'id' | 'createdAt' | 'organizationId'>>
  ): Promise<void> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.PAY_PLAN_TEMPLATES}/${templateId}`;
    try {
      const payload = stripUndefinedDeep({
        ...updates,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(templateDoc(orgId, templateId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async getTemplate(orgId: string, templateId: string): Promise<PayPlanTemplate | null> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.PAY_PLAN_TEMPLATES}/${templateId}`;
    try {
      const snap = await getDoc(templateDoc(orgId, templateId));
      return snap.exists() ? (snap.data() as PayPlanTemplate) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  },

  async listTemplates(orgId: string): Promise<PayPlanTemplate[]> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.PAY_PLAN_TEMPLATES}`;
    try {
      const snap = await getDocs(templatesCol(orgId));
      return snap.docs.map(d => d.data() as PayPlanTemplate);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  },

  async deleteTemplate(orgId: string, templateId: string): Promise<void> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.PAY_PLAN_TEMPLATES}/${templateId}`;
    try {
      await deleteDoc(templateDoc(orgId, templateId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  /**
   * Link a single salesperson's pay plan to a template.
   * Stores only the reference (no copy). Clears any previous override.
   */
  async assignTemplateToUser(orgId: string, userId: string, templateId: string): Promise<void> {
    await payPlanService.savePayPlanLink(orgId, userId, {
      sourceTemplateId: templateId,
      override: undefined,
      isOverridden: false,
    });
  },

  /**
   * Bulk assign a template to many salespeople in one action.
   */
  async assignTemplateToUsers(orgId: string, userIds: string[], templateId: string): Promise<void> {
    await Promise.all(userIds.map(uid => this.assignTemplateToUser(orgId, uid, templateId)));
  },

  /**
   * Resolve a salesperson's EFFECTIVE pay plan.
   * - If the plan is linked to a template and NOT overridden -> return the template
   *   (cast to a PayPlan for this user) so edits to the template flow through live.
   * - If overridden -> layer the override patch over the template.
   * - If not linked to a template -> return the stored personal plan as-is.
   */
  async resolveEffectivePayPlan(orgId: string, userId: string): Promise<PayPlan | null> {
    const stored = await payPlanService.getPrimaryPayPlan(orgId, userId);
    if (!stored) return null;

    if (!stored.sourceTemplateId) {
      // Not template-driven: personal plan.
      return stored;
    }

    const template = await payPlanTemplateService.getTemplate(orgId, stored.sourceTemplateId);
    if (!template) {
      // Template was deleted; fall back to whatever is stored.
      return stored;
    }

    // Compose the template into a PayPlan for this user.
    const base: PayPlan = {
      ...(template as unknown as PayPlan),
      id: 'primary',
      userId,
      organizationId: orgId,
      sourceTemplateId: stored.sourceTemplateId,
      isOverridden: stored.isOverridden,
    };

    if (stored.isOverridden && stored.override) {
      return { ...base, ...stored.override };
    }
    return base;
  },
};
