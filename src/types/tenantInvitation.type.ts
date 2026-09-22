export type CreateTenantInvitationInput = {
  email?: string;
  phone?: string;
};

export type AcceptTenantInvitationInput = {
  token: string;
};
