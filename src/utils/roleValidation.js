// Role validation utilities

export const VALID_ROLES = {
  ADMIN: 'admin',
  WARDEN: 'warden', 
  STUDENT: 'student'
};

export const ROLE_HIERARCHY = {
  [VALID_ROLES.ADMIN]: 3,
  [VALID_ROLES.WARDEN]: 2,
  [VALID_ROLES.STUDENT]: 1
};

export const isValidRole = (role) => {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().trim();
  return Object.values(VALID_ROLES).includes(normalizedRole);
};

export const normalizeRole = (role) => {
  if (!role) return null;
  return role.toLowerCase().trim();
};

export const hasMinimumRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  
  const userLevel = ROLE_HIERARCHY[normalizeRole(userRole)] || 0;
  const requiredLevel = ROLE_HIERARCHY[normalizeRole(requiredRole)] || 0;
  
  return userLevel >= requiredLevel;
};

export const canAccessRoute = (userRole, requiredRole) => {
  if (!requiredRole) return true; // Public route
  if (!userRole) return false;  // Not authenticated
  
  return normalizeRole(userRole) === normalizeRole(requiredRole);
};

export const getRoleDisplayName = (role) => {
  const normalizedRole = normalizeRole(role);
  
  switch (normalizedRole) {
    case VALID_ROLES.ADMIN:
      return 'Administrator';
    case VALID_ROLES.WARDEN:
      return 'Warden';
    case VALID_ROLES.STUDENT:
      return 'Student';
    default:
      return 'Unknown';
  }
};

export const getRolePermissions = (role) => {
  const normalizedRole = normalizeRole(role);
  
  switch (normalizedRole) {
    case VALID_ROLES.ADMIN:
      return {
        canManageUsers: true,
        canManageWardens: true,
        canViewAllOutpasses: true,
        canApproveOutpasses: true,
        canDeleteOutpasses: true,
        canAccessAdminPanel: true
      };
      
    case VALID_ROLES.WARDEN:
      return {
        canManageUsers: false,
        canManageWardens: false,
        canViewAllOutpasses: true,
        canApproveOutpasses: true,
        canDeleteOutpasses: false,
        canAccessAdminPanel: false
      };
      
    case VALID_ROLES.STUDENT:
      return {
        canManageUsers: false,
        canManageWardens: false,
        canViewAllOutpasses: false,
        canApproveOutpasses: false,
        canDeleteOutpasses: false,
        canAccessAdminPanel: false
      };
      
    default:
      return {
        canManageUsers: false,
        canManageWardens: false,
        canViewAllOutpasses: false,
        canApproveOutpasses: false,
        canDeleteOutpasses: false,
        canAccessAdminPanel: false
      };
  }
};
