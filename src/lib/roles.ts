/**
 * Role-based access control definitions for Jove admin panel
 */

export type Role = 'admin' | 'admin_designer' | 'customer';

export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const ROLES: Record<Role, RoleDefinition> = {
  admin: {
    name: 'admin',
    displayName: 'Admin',
    description: 'Full access to all admin features',
    icon: 'Crown',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100',
  },
  admin_designer: {
    name: 'admin_designer',
    displayName: 'Designer',
    description: 'Access to design and content management',
    icon: 'Palette',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  customer: {
    name: 'customer',
    displayName: 'Customer',
    description: 'Regular customer account',
    icon: 'User',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

// Admin panel sections and their required roles
export interface NavPermission {
  path: string;
  allowedRoles: Role[];
}

export const NAV_PERMISSIONS: NavPermission[] = [
  // Full access sections (admin only)
  { path: '/admin', allowedRoles: ['admin', 'admin_designer'] }, // Dashboard
  { path: '/admin/pricing', allowedRoles: ['admin'] },
  { path: '/admin/orders', allowedRoles: ['admin'] },
  { path: '/admin/users', allowedRoles: ['admin'] },
  { path: '/admin/email', allowedRoles: ['admin'] },
  { path: '/admin/promo-codes', allowedRoles: ['admin'] },
  { path: '/admin/customers', allowedRoles: ['admin'] },
  { path: '/admin/leads', allowedRoles: ['admin'] },
  { path: '/admin/analytics', allowedRoles: ['admin'] },
  { path: '/admin/giveaways', allowedRoles: ['admin'] },
  { path: '/admin/chat', allowedRoles: ['admin'] },
  
  // Designer accessible sections
  { path: '/admin/categories', allowedRoles: ['admin', 'admin_designer'] },
  { path: '/admin/product-management', allowedRoles: ['admin', 'admin_designer'] },
  { path: '/admin/presets', allowedRoles: ['admin', 'admin_designer'] },
  { path: '/admin/website-customization', allowedRoles: ['admin', 'admin_designer'] },
  { path: '/admin/media-library', allowedRoles: ['admin', 'admin_designer'] },
  { path: '/admin/descriptions', allowedRoles: ['admin', 'admin_designer'] },
];

/**
 * Check if a user with given roles can access a specific path
 */
export function canAccessPath(userRoles: string[], path: string): boolean {
  // Find the most specific permission for this path
  const sortedPermissions = NAV_PERMISSIONS
    .filter(p => path.startsWith(p.path))
    .sort((a, b) => b.path.length - a.path.length);
  
  const permission = sortedPermissions[0];
  
  if (!permission) {
    // If no explicit permission, default to admin only
    return userRoles.includes('admin');
  }
  
  return permission.allowedRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has any admin-level role (admin or admin_designer)
 */
export function hasAdminAccess(userRoles: string[]): boolean {
  return userRoles.includes('admin') || userRoles.includes('admin_designer');
}

/**
 * Check if user has full admin role
 */
export function isFullAdmin(userRoles: string[]): boolean {
  return userRoles.includes('admin');
}

/**
 * Get the highest privilege role from a list of roles
 */
export function getHighestRole(userRoles: string[]): Role | null {
  if (userRoles.includes('admin')) return 'admin';
  if (userRoles.includes('admin_designer')) return 'admin_designer';
  if (userRoles.includes('customer')) return 'customer';
  return null;
}

/**
 * Get all assignable roles (for admin UI)
 */
export function getAssignableRoles(): RoleDefinition[] {
  return Object.values(ROLES);
}
