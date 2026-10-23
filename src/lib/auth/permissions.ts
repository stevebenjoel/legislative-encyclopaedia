export const roles = [
  "SUPER_ADMIN", "INSTITUTION_ADMIN", "LEGISLATOR", "LEGISLATIVE_CLERK",
  "COMMITTEE_CHAIRPERSON", "COMMITTEE_SECRETARY", "LEGISLATIVE_RESEARCHER",
  "LEGAL_ADVISER", "POLICY_ANALYST", "ACADEMY_INSTRUCTOR", "ACADEMY_STUDENT",
  "CIVIL_SOCIETY_REPRESENTATIVE", "REGISTERED_CITIZEN", "DATA_VERIFICATION_OFFICER",
] as const;

export type PlatformRole = (typeof roles)[number];
export type Permission = "bill:read" | "bill:create" | "bill:event:record" | "bill:event:verify" | "document:read" | "document:manage" | "committee:manage" | "institution:manage" | "audit:read" | "ai:use" | "ai:review" | "workflow:read" | "workflow:manage" | "performance:read" | "performance:manage";

const grants: Record<PlatformRole, readonly Permission[]> = {
  SUPER_ADMIN: ["bill:read", "bill:create", "bill:event:record", "bill:event:verify", "document:read", "document:manage", "committee:manage", "institution:manage", "audit:read", "ai:use", "ai:review", "workflow:read", "workflow:manage", "performance:read", "performance:manage"],
  INSTITUTION_ADMIN: ["bill:read", "bill:create", "bill:event:record", "document:read", "document:manage", "committee:manage", "institution:manage", "audit:read", "ai:use", "ai:review", "workflow:read", "workflow:manage", "performance:read", "performance:manage"],
  LEGISLATOR: ["bill:read", "bill:create", "bill:event:record", "document:read", "ai:use", "workflow:read", "performance:read"],
  LEGISLATIVE_CLERK: ["bill:read", "bill:create", "bill:event:record", "document:read", "document:manage", "committee:manage", "ai:use", "workflow:read", "workflow:manage", "performance:read"],
  COMMITTEE_CHAIRPERSON: ["bill:read", "bill:event:record", "document:read", "committee:manage", "ai:use", "workflow:read", "workflow:manage", "performance:read"],
  COMMITTEE_SECRETARY: ["bill:read", "bill:event:record", "document:read", "document:manage", "committee:manage", "ai:use", "workflow:read", "workflow:manage", "performance:read"],
  LEGISLATIVE_RESEARCHER: ["bill:read", "document:read", "document:manage", "ai:use", "ai:review", "workflow:read", "workflow:manage", "performance:read", "performance:manage"],
  LEGAL_ADVISER: ["bill:read", "bill:event:verify", "document:read", "ai:use", "ai:review", "workflow:read", "performance:read"],
  POLICY_ANALYST: ["bill:read", "document:read", "ai:use", "ai:review", "workflow:read", "performance:read", "performance:manage"],
  ACADEMY_INSTRUCTOR: ["bill:read", "document:read"],
  ACADEMY_STUDENT: ["bill:read", "document:read"],
  CIVIL_SOCIETY_REPRESENTATIVE: ["bill:read", "document:read", "performance:read"],
  REGISTERED_CITIZEN: ["bill:read", "document:read", "performance:read"],
  DATA_VERIFICATION_OFFICER: ["bill:read", "bill:event:verify", "document:read", "document:manage", "ai:review", "performance:read", "performance:manage"],
};

export function can(role: PlatformRole, permission: Permission) {
  return grants[role].includes(permission);
}

export function canAccessInstitution(role: PlatformRole, assignedInstitutionId: string, requestedInstitutionId: string) {
  return role === "SUPER_ADMIN" || assignedInstitutionId === requestedInstitutionId;
}
