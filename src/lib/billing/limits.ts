import { plans, type PlanId } from "../../config/plans";

export type AccountUsage = { activeTools: number; admins: number; storageBytes: number };
export type LimitStatus = { tools: boolean; admins: boolean; storage: boolean; overLimit: boolean };

export function getLimitStatus(planId: PlanId, usage: AccountUsage): LimitStatus {
  const plan = plans[planId];
  const tools = usage.activeTools >= plan.toolLimit;
  const admins = usage.admins >= plan.adminLimit;
  const storage = usage.storageBytes >= plan.storageLimitBytes;
  return { tools, admins, storage, overLimit: usage.activeTools > plan.toolLimit || usage.admins > plan.adminLimit || usage.storageBytes > plan.storageLimitBytes };
}

export function canCreateTool(planId: PlanId, usage: AccountUsage): boolean {
  return !getLimitStatus(planId, usage).tools;
}

export function canUploadFile(planId: PlanId, usage: AccountUsage, fileSizeBytes: number): boolean {
  return fileSizeBytes > 0 && usage.storageBytes + fileSizeBytes <= plans[planId].storageLimitBytes;
}
