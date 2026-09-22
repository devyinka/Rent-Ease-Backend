import type { unitTypeEnum, rentFrequencyEnum } from "../db/schema.js";

export type UnitType = (typeof unitTypeEnum.enumValues)[number];

export type RentFrequency = (typeof rentFrequencyEnum.enumValues)[number];

export type CreateUnitInput = {
  unitNumber: string;
  unitType: UnitType;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  rentAmount: string;
  rentFrequency: RentFrequency;
  serviceCharge?: string;
  depositAmount?: string;
  notes?: string;
};

export type UpdateUnitInput = {
  unitNumber?: string;
  unitType?: UnitType;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  rentAmount?: string;
  rentFrequency?: RentFrequency;
  serviceCharge?: string;
  depositAmount?: string;
  notes?: string;
};
