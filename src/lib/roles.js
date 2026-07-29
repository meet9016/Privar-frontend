export const unwrapApiData = (response, fallback = []) => response?.data?.data ?? response?.data ?? fallback

export const normalizeRole = (role = {}) => {
  const id = role.id || role._id || ''
  const permissions = Array.isArray(role.permissions) ? role.permissions : []

  return {
    ...role,
    id: String(id),
    name: role.name || role.role_name || '',
    description: role.description || '',
    permissions,
    permission_count: Number(role.permission_count ?? permissions.length),
    status: Number(role.status ?? 1)
  }
}

export const normalizeRoles = (value) => {
  const roles = Array.isArray(value) ? value : []
  return roles.map(normalizeRole).filter((role) => role.id && role.name)
}

export const normalizeRoleId = (role) => {
  if (!role) return ''
  if (typeof role === 'string') return role
  return String(role.id || role._id || '')
}

export const getUserRoleLabel = (user = {}) => {
  const assignedRole = user.role_name || user.role?.name || user.role_id?.name
  if (assignedRole) return assignedRole
  if (user.committee_role || user.designation) return user.committee_role || user.designation
  if (user.is_committee) return 'Committee'
  if (user.role) return String(user.role)
  return 'Member'
}

const ACTION_ORDER = ['list', 'add', 'edit', 'delete']

export const buildPermissionGroups = (config = {}) => {
  const baseActions = Array.isArray(config.actions) && config.actions.length > 0
    ? config.actions
    : ACTION_ORDER.map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1) }))

  const permissions = Array.isArray(config.permissions) ? config.permissions : []
  const actionsByKey = new Map(baseActions.map((action) => [action.key, action]))
  const modulesByKey = new Map()

  permissions.forEach((permission) => {
    const moduleKey = permission.module || permission.key?.split('.')[0] || 'general'
    const moduleLabel = permission.module_label || permission.label || moduleKey
    const actionKey = permission.action || permission.key?.split('.')[1] || 'list'

    if (!actionsByKey.has(actionKey)) {
      actionsByKey.set(actionKey, {
        key: actionKey,
        label: permission.action_label || actionKey.charAt(0).toUpperCase() + actionKey.slice(1)
      })
    }

    if (!modulesByKey.has(moduleKey)) {
      modulesByKey.set(moduleKey, {
        key: moduleKey,
        label: moduleLabel,
        permissions: []
      })
    }

    modulesByKey.get(moduleKey).permissions.push({
      key: permission.key,
      label: permission.action_label || permission.label,
      action: actionKey
    })
  })

  if (modulesByKey.size === 0 && Array.isArray(config.modules)) {
    config.modules.forEach((module) => {
      modulesByKey.set(module.key, {
        ...module,
        permissions: Array.isArray(module.permissions) ? module.permissions : []
      })
    })
  }

  const actions = Array.from(actionsByKey.values())
  const actionIndex = new Map(actions.map((action, index) => [action.key, index]))
  const modules = Array.from(modulesByKey.values()).map((module) => ({
    ...module,
    permissions: module.permissions
      .filter((permission) => permission.key)
      .sort((a, b) => (actionIndex.get(a.action) ?? 99) - (actionIndex.get(b.action) ?? 99))
  }))

  return { actions, modules }
}
