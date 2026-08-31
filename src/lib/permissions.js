const legacyPermissionFor = (permission) => {
  const legacyMap = {
    'members.': 'users.manage',
    'committee.': 'committee.manage',
    'roles.': 'roles.manage',
    'festivals.': 'festivals.manage',
    'events.': 'events.manage',
    'gallery.': 'gallery.manage',
    // 'banners.': 'banners.manage',
    'businesses.': 'businesses.manage',
    'news.': 'news.manage',
    'posts.': 'posts.manage',
    'matrimonies.': 'matrimonies.manage',
    'contact-inquiries.': 'contact-inquiries.manage',
    'settings.': 'settings.manage',
    'country.': 'masters.manage',
    'state.': 'masters.manage',
    'district.': 'masters.manage',
    'taluka.': 'masters.manage',
    'city.': 'masters.manage',
    'village.': 'masters.manage',
    'area.': 'masters.manage',
    'blood-group.': 'masters.manage',
    'event-category.': 'event-category.manage',
    'donations.': 'donations.manage',
    'feedback.': 'feedback.manage',
    'birthday.': 'users.manage',
    'job-vacancy.': 'job-vacancy.manage',
    'expenses.': 'expenses.manage',
    'expense-category.': 'expense-category.manage',
  }

  return Object.entries(legacyMap).find(([prefix]) => permission.startsWith(prefix))?.[1] || permission
}

export const hasPermission = (user, permission) => {
  if (!permission) return true;
  
  // Superadmin or Admin roles have unrestricted access
  if (
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.is_super_admin === true ||
    user?.committee_role === 'President' ||
    user?.committee_role === 'Admin' ||
    user?.role_name?.toLowerCase() === 'admin' ||
    user?.role_name?.toLowerCase() === 'super admin' ||
    !!user?.role_id
  ) {
    return true;
  }

  const required = Array.isArray(permission) ? permission : [permission];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  if (permissions.length === 0) {
    return false;
  }

  return required.some((item) => permissions.includes(item) || permissions.includes(legacyPermissionFor(item)));
};
