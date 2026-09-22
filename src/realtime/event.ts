export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  MESSAGE_READ: "message:read",
  MESSAGE_TYPING: "message:typing",

  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",

  MAINTENANCE_UPDATED: "maintenance:updated",

  PAYMENT_UPDATED: "payment:updated",

  TENANCY_UPDATED: "tenancy:updated",
} as const;
