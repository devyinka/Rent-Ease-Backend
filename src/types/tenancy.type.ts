import type { rentFrequencyEnum } from "../db/schema.js";

export type CreateTenancyInput = {
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate?: string;
  status?: "PENDING" | "ACTIVE";
  rentAmount?: string;
  rentFrequency?: "MONTHLY" | "QUARTERLY" | "BI_ANNUAL" | "ANNUAL" | "CUSTOM";
  depositAmount?: string;
  serviceCharge?: string;
};

export type UpdateTenancyInput = {
  startDate?: string;
  endDate?: string | null;
  rentAmount?: string;
  rentFrequency?: "MONTHLY" | "QUARTERLY" | "BI_ANNUAL" | "ANNUAL" | "CUSTOM";
  depositAmount?: string;
  serviceCharge?: string;
};
