export type WorkOrderStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface CreateWorkOrderInput {
  unitId?: string;
  technicianId?: string;
  title: string;
  description?: string;
}

export interface UpdateWorkOrderStatusInput {
  status: Exclude<WorkOrderStatus, "OPEN">;
}
