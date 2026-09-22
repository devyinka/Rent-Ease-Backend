export const socketRooms = {
  user: (userId: string) => `user:${userId}`,

  conversation: (conversationId: string) => `conversation:${conversationId}`,

  property: (propertyId: string) => `property:${propertyId}`,

  maintenance: (maintenanceId: string) => `maintenance:${maintenanceId}`,
};
