import { and, eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import { db } from "../db/index.js";
import { tenants, tenancies } from "../db/schema.js";

export async function requireTenantAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const requestedTenancyId = (req.params.tenancyId ?? req.params.id) as
    | string
    | undefined;

  try {
    const tenancy = await db
      .select({ tenancyId: tenancies.id })
      .from(tenancies)
      .innerJoin(tenants, eq(tenancies.tenantId, tenants.id))
      .where(
        requestedTenancyId
          ? and(
              eq(tenancies.id, requestedTenancyId),
              eq(tenants.userId, req.user.id),
              eq(tenancies.status, "ACTIVE"),
            )
          : and(
              eq(tenants.userId, req.user.id),
              eq(tenancies.status, "ACTIVE"),
            ),
      )
      .limit(1);

    if (tenancy.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenancy not found",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
