import "dotenv/config";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  allowOrigins: process.env.ALLOWED_ORIGINS || "http://localhost:3000",

  databaseUrl: requiredEnv("DATABASE_URL"),

  jwtAccessSecret: requiredEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requiredEnv("JWT_REFRESH_SECRET"),

  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
};
