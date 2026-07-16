import type { UserRole } from "@/types/database";

export function hasRole(roles: readonly UserRole[], role: UserRole): boolean {
  return roles.includes(role);
}

export function isAdmin(roles: readonly UserRole[]): boolean {
  return hasRole(roles, "ADMIN");
}
