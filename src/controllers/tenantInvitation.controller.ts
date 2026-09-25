import type { Request, Response } from "express";

import {
  acceptTenantInvitationSchema,
  createTenantInvitationSchema,
} from "../routes/tenantInvitation.route.js";
import { tenantInvitationService } from "../services/tenantInvitation.service.js";

export const tenantInvitationController = {
  create: async (req: Request, res: Response) => {
    const input = createTenantInvitationSchema.parse(req.body);

    const result = await tenantInvitationService.createInvitation(
      req.user!.id,
      input,
    );

    return res.status(201).json({
      success: true,
      message: "Tenant invitation created successfully",
      data: result,
    });
  },

  accept: async (req: Request, res: Response) => {
    const input = acceptTenantInvitationSchema.parse(req.body);

    const result = await tenantInvitationService.acceptInvitation(
      req.user!.id,
      input,
    );

    return res.status(200).json({
      success: true,
      message: "Tenant invitation accepted successfully",
      data: result,
    });
  },

  getInvitationByToken: async (req: Request, res: Response) => {
    const { token } = req.params;

    const invitation = await tenantInvitationService.getInvitationByToken(
      token as string,
    );

    return res.status(200).json({
      success: true,
      data: invitation,
    });
  },

  cancel: async (req: Request, res: Response) => {
    const result = await tenantInvitationService.cancelInvitation(
      req.user!.id,
      req.params.id as string,
    );

    return res.status(200).json({
      success: true,
      message: "Tenant invitation cancelled successfully",
      data: result,
    });
  },

  getAll: async (req: Request, res: Response) => {
    const invitations = await tenantInvitationService.getMyInvitations(
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: invitations,
    });
  },
};
