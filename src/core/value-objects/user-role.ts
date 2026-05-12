export const USER_ROLES = ["customer", "employee", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isStaffRole(role: UserRole): boolean {
  return role === "admin" || role === "employee";
}
