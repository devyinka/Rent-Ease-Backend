export const calculateExpiryDate = (duration: string): Date => {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error("Invalid token expiry format");
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + amount * multipliers[unit]);
};
