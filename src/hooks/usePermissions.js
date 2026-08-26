import { useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function usePermissions(moduleKey) {
  const { user } = useContext(AuthContext);

  const permissions = useMemo(() => {
    const isSuperAdmin = user?.role === 'superadmin' || user?.is_super_admin === true || user?.committee_role === 'President' || user?.committee_role === 'Admin';
    
    if (isSuperAdmin) {
      return { 
        canList: true, 
        canAdd: true, 
        canEdit: true, 
        canDelete: true, 
        canView: true, 
        hasAny: true,
        isSuperAdmin: true,
        raw: user?.permissions || []
      };
    }

    const perms = Array.isArray(user?.permissions) ? user.permissions : [];
    
    if (!moduleKey) {
      return { 
        raw: perms,
        isSuperAdmin: false 
      };
    }

    return {
      canList: perms.includes(`${moduleKey}.list`),
      canAdd: perms.includes(`${moduleKey}.add`) || perms.includes(`${moduleKey}.create`),
      canEdit: perms.includes(`${moduleKey}.edit`),
      canDelete: perms.includes(`${moduleKey}.delete`),
      canView: perms.includes(`${moduleKey}.view`),
      hasAny: perms.some(p => p.startsWith(`${moduleKey}.`)),
      isSuperAdmin: false,
      raw: perms
    };
  }, [user, moduleKey]);

  return permissions;
}
