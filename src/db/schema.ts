import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

/* =========================================================
   ENUMS
========================================================= */

export const userRoleEnum = pgEnum("user_role", [
  "LANDLORD",
  "AGENT",
  "TENANT",
  "TECHNICIAN",
]);

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INVITED",
  "SUSPENDED",
  "DEACTIVATED",
]);

export const unitTypeEnum = pgEnum("unit_type", [
  "FLAT",
  "APARTMENT",
  "DUPLEX",
  "ROOM",
  "SHOP",
  "OFFICE",
  "OTHER",
]);

export const rentFrequencyEnum = pgEnum("rent_frequency", [
  "MONTHLY",
  "QUARTERLY",
  "BI_ANNUAL",
  "ANNUAL",
  "CUSTOM",
]);

export const tenancyStatusEnum = pgEnum("tenancy_status", [
  "PENDING",
  "ACTIVE",
  "ENDED",
  "TERMINATED",
  "CANCELLED",
]);

export const authSessionStatusEnum = pgEnum("auth_session_status", [
  "ACTIVE",
  "REVOKED",
  "EXPIRED",
]);

export const tenantInvitationStatusEnum = pgEnum("tenant_invitation_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
]);

/* =========================================================
   USERS
========================================================= */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", { length: 255 }),

    phone: varchar("phone", { length: 30 }),

    passwordHash: text("password_hash"),

    firstName: varchar("first_name", { length: 100 }).notNull(),

    lastName: varchar("last_name", { length: 100 }).notNull(),

    role: userRoleEnum("role").notNull(),

    status: userStatusEnum("status").notNull().default("ACTIVE"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),

    phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),

    emailOrPhoneRequired: check(
      "users_email_or_phone_required",
      sql`${table.email} IS NOT NULL OR ${table.phone} IS NOT NULL`,
    ),
  }),
);

/* =========================================================
   LANDLORDS
========================================================= */

export const landlords = pgTable(
  "landlords",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("landlords_user_unique").on(table.userId),
  }),
);

/* =========================================================
   PROPERTIES
========================================================= */

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    landlordId: uuid("landlord_id")
      .notNull()
      .references(() => landlords.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    address: text("address").notNull(),

    city: varchar("city", { length: 100 }).notNull(),

    state: varchar("state", { length: 100 }).notNull(),

    country: varchar("country", { length: 100 }).notNull().default("Nigeria"),

    description: text("description"),

    imageUrl: text("image_url"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameNotEmpty: check(
      "properties_name_not_empty",
      sql`length(trim(${table.name})) > 0`,
    ),
  }),
);

/* =========================================================
   UNITS
========================================================= */

export const units = pgTable(
  "units",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    unitNumber: varchar("unit_number", { length: 50 }).notNull(),

    unitType: unitTypeEnum("unit_type").notNull(),

    floor: integer("floor"),

    bedrooms: smallint("bedrooms").notNull().default(0),

    bathrooms: smallint("bathrooms").notNull().default(0),

    rentAmount: numeric("rent_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),

    rentFrequency: rentFrequencyEnum("rent_frequency").notNull(),

    serviceCharge: numeric("service_charge", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),

    depositAmount: numeric("deposit_amount", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    propertyUnitUnique: uniqueIndex("units_property_unit_unique").on(
      table.propertyId,
      table.unitNumber,
    ),

    unitNumberNotEmpty: check(
      "units_unit_number_not_empty",
      sql`length(trim(${table.unitNumber})) > 0`,
    ),

    validBedrooms: check(
      "units_bedrooms_non_negative",
      sql`${table.bedrooms} >= 0`,
    ),

    validBathrooms: check(
      "units_bathrooms_non_negative",
      sql`${table.bathrooms} >= 0`,
    ),

    validAmounts: check(
      "units_amounts_non_negative",
      sql`
        ${table.rentAmount} >= 0
        AND ${table.serviceCharge} >= 0
        AND ${table.depositAmount} >= 0
      `,
    ),
  }),
);

/* =========================================================
   TENANTS
========================================================= */

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("tenants_user_unique").on(table.userId),
  }),
);

/* =========================================================
   TENANTS INVITATIONS
========================================================= */

export const tenantInvitations = pgTable(
  "tenant_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    landlordId: uuid("landlord_id")
      .notNull()
      .references(() => landlords.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    email: varchar("email", { length: 255 }),

    phone: varchar("phone", { length: 30 }),

    tokenHash: text("token_hash").notNull(),

    status: tenantInvitationStatusEnum("status").notNull().default("PENDING"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    acceptedAt: timestamp("accepted_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("tenant_invitations_token_hash_unique").on(
      table.tokenHash,
    ),

    landlordIndex: index("tenant_invitations_landlord_id_idx").on(
      table.landlordId,
    ),

    statusIndex: index("tenant_invitations_status_idx").on(table.status),

    validRecipient: check(
      "tenant_invitations_email_or_phone_required",
      sql`
        ${table.email} IS NOT NULL
        OR ${table.phone} IS NOT NULL
      `,
    ),
  }),
);

/* =========================================================
   TENANCIES
========================================================= */

export const tenancies = pgTable(
  "tenancies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }).notNull(),

    endDate: timestamp("end_date", {
      withTimezone: true,
    }),

    status: tenancyStatusEnum("status").notNull().default("PENDING"),

    rentAmount: numeric("rent_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),

    rentFrequency: rentFrequencyEnum("rent_frequency").notNull(),

    depositAmount: numeric("deposit_amount", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),

    serviceCharge: numeric("service_charge", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),

    moveOutReason: text("move_out_reason"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    /*
     * One unit can have only one ACTIVE tenancy.
     */
    oneActiveTenancyPerUnit: uniqueIndex("tenancies_one_active_per_unit")
      .on(table.unitId)
      .where(sql`${table.status} = 'ACTIVE'`),

    validDates: check(
      "tenancies_valid_dates",
      sql`
        ${table.endDate} IS NULL
        OR ${table.endDate} >= ${table.startDate}
      `,
    ),

    validAmounts: check(
      "tenancies_amounts_non_negative",
      sql`
        ${table.rentAmount} >= 0
        AND ${table.depositAmount} >= 0
        AND ${table.serviceCharge} >= 0
      `,
    ),
  }),
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    refreshTokenHash: text("refresh_token_hash").notNull(),

    status: authSessionStatusEnum("status").notNull().default("ACTIVE"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("auth_sessions_user_id_idx").on(table.userId),

    refreshTokenHashUnique: uniqueIndex(
      "auth_sessions_refresh_token_hash_unique",
    ).on(table.refreshTokenHash),
  }),
);

/* =========================================================
   RELATIONS
========================================================= */

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  landlord: one(landlords),
  tenant: one(tenants),
  authSessions: many(authSessions),
}));

export const landlordsRelations = relations(landlords, ({ one, many }) => ({
  user: one(users, {
    fields: [landlords.userId],
    references: [users.id],
  }),
  properties: many(properties),
  tenantInvitations: many(tenantInvitations),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  landlord: one(landlords, {
    fields: [properties.landlordId],
    references: [landlords.id],
  }),

  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),

  tenancies: many(tenancies),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(users, {
    fields: [tenants.userId],
    references: [users.id],
  }),

  tenancies: many(tenancies),
}));

export const tenanciesRelations = relations(tenancies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenancies.tenantId],
    references: [tenants.id],
  }),

  unit: one(units, {
    fields: [tenancies.unitId],
    references: [units.id],
  }),
}));

export const tenantInvitationsRelations = relations(
  tenantInvitations,
  ({ one }) => ({
    landlord: one(landlords, {
      fields: [tenantInvitations.landlordId],
      references: [landlords.id],
    }),
  }),
);

/* =========================================================
   TYPES
========================================================= */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Landlord = typeof landlords.$inferSelect;
export type NewLandlord = typeof landlords.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Tenancy = typeof tenancies.$inferSelect;
export type NewTenancy = typeof tenancies.$inferInsert;

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

export type TenantInvitation = typeof tenantInvitations.$inferSelect;
export type NewTenantInvitation = typeof tenantInvitations.$inferInsert;
