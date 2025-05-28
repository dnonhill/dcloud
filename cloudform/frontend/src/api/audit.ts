interface AuditUser {
  id: number;
  username: string;
  fullname: string;
}

export type AuditProperty = {
  createdBy: AuditUser;
  createdAt: string;
  updatedBy: AuditUser;
  updatedAt: string;
};
