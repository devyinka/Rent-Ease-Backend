import type { Request, Response } from "express";

import { agentInvitationService } from "../services/agentInvitation.service.js";

import type { CreateAgentInvitationInput } from "../types/agent.type.js";

export const agentInvitationController = {
  // CREATE AGENT INVITATION
  createInvitation: async (req: Request, res: Response) => {
    const input = req.body as CreateAgentInvitationInput;

    const result = await agentInvitationService.createInvitation(
      req.user!.id,
      input,
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  },

  // GET INVITATION BY TOKEN
  getInvitationByToken: async (req: Request, res: Response) => {
    const { token } = req.params;

    const invitation = await agentInvitationService.getInvitationByToken(
      token as string,
    );

    return res.status(200).json({
      success: true,
      data: invitation,
    });
  },

  // GET MY INVITATIONS
  getMyInvitations: async (req: Request, res: Response) => {
    const invitations = await agentInvitationService.getMyInvitations(
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: invitations,
    });
  },

  // ACCEPT AGENT INVITATION
  acceptInvitation: async (req: Request, res: Response) => {
    const { invitationId } = req.params;

    const result = await agentInvitationService.acceptInvitation(
      req.user!.id,
      invitationId as string,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },

  // DECLINE AGENT INVITATION
  declineInvitation: async (req: Request, res: Response) => {
    const { invitationId } = req.params;

    const result = await agentInvitationService.declineInvitation(
      req.user!.id,
      invitationId as string,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },

  // CANCEL AGENT INVITATION
  cancelInvitation: async (req: Request, res: Response) => {
    const { invitationId } = req.params;

    const result = await agentInvitationService.cancelInvitation(
      req.user!.id,
      invitationId as string,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },
};
