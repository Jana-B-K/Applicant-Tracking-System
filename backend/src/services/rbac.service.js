import RbacPolicy from "../models/rbacPolicy.model.js";

export const ROLE_KEYS = ["superadmin", "hrrecruiter", "hiringmanager", "interviewpanel", "management"];

export const PERMISSION_KEYS = [
  "viewDashboard",
  "viewJobs",
  "createJobs",
  "editJobs",
  "deleteJobs",
  "viewCandidates",
  "addCandidates",
  "editCandidates",
  "manageCandidateStages",
  "manageUsers",
];

const DEFAULT_POLICY_NAME = "default";

export const DEFAULT_PERMISSION_MATRIX = {
  viewDashboard: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: true,
    interviewpanel: true,
    management: true,
  },
  viewJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  createJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  editJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  deleteJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  viewCandidates: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: true,
    interviewpanel: true,
    management: false,
  },
  addCandidates: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  editCandidates: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  manageCandidateStages: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  manageUsers: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
};

const normalizePolicyResponse = (doc) => ({
  id: doc._id,
  name: doc.name,
  permissions: doc.permissions,
  updatedAt: doc.updatedAt,
});

const ensureDefaultPolicy = async () => {
  let policy = await RbacPolicy.findOne({ name: DEFAULT_POLICY_NAME });
  if (!policy) {
    policy = await RbacPolicy.create({
      name: DEFAULT_POLICY_NAME,
      permissions: DEFAULT_PERMISSION_MATRIX,
    });
  }
  return policy;
};

const isBoolean = (value) => typeof value === "boolean";

const sanitizePermissionPatch = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("permissions object is required");
  }

  const sanitized = {};

  for (const permissionKey of Object.keys(input)) {
    if (!PERMISSION_KEYS.includes(permissionKey)) {
      throw new Error(`Invalid permission key: ${permissionKey}`);
    }

    const roleFlags = input[permissionKey];
    if (!roleFlags || typeof roleFlags !== "object" || Array.isArray(roleFlags)) {
      throw new Error(`Permission '${permissionKey}' must be an object`);
    }

    sanitized[permissionKey] = {};

    for (const roleKey of Object.keys(roleFlags)) {
      if (!ROLE_KEYS.includes(roleKey)) {
        throw new Error(`Invalid role key: ${roleKey}`);
      }
      if (!isBoolean(roleFlags[roleKey])) {
        throw new Error(`Permission '${permissionKey}.${roleKey}' must be boolean`);
      }
      sanitized[permissionKey][roleKey] = roleFlags[roleKey];
    }
  }

  return sanitized;
};

export const getRbacPolicyService = async () => {
  const policy = await ensureDefaultPolicy();
  return normalizePolicyResponse(policy);
};

export const updateRbacPolicyService = async ({ permissions }) => {
  const patch = sanitizePermissionPatch(permissions);
  const policy = await ensureDefaultPolicy();

  for (const permissionKey of Object.keys(patch)) {
    for (const roleKey of Object.keys(patch[permissionKey])) {
      policy.permissions[permissionKey][roleKey] = patch[permissionKey][roleKey];
    }
  }

  await policy.save();
  return normalizePolicyResponse(policy);
};

export const resetRbacPolicyService = async () => {
  const policy = await ensureDefaultPolicy();
  policy.permissions = DEFAULT_PERMISSION_MATRIX;
  await policy.save();
  return normalizePolicyResponse(policy);
};

export const getRolePermissionsService = async (role) => {
  const policy = await ensureDefaultPolicy();
  const rolePermissions = {};

  for (const permissionKey of PERMISSION_KEYS) {
    rolePermissions[permissionKey] = Boolean(policy.permissions?.[permissionKey]?.[role]);
  }

  return rolePermissions;
};

const toPlainPermissionObject = (permissions) => {
  if (permissions && typeof permissions.toObject === "function") {
    return permissions.toObject();
  }
  return permissions;
};

export const normalizePermissionOverrides = (permissions = {}, options = {}) => {
  const { strict = true } = options;
  const rawPermissions = toPlainPermissionObject(permissions);

  if (rawPermissions === null || typeof rawPermissions === "undefined") {
    return {};
  }

  if (typeof rawPermissions !== "object" || Array.isArray(rawPermissions)) {
    throw new Error("permissions must be an object");
  }

  const normalized = {};
  for (const key of Object.keys(rawPermissions)) {
    if (!PERMISSION_KEYS.includes(key)) {
      if (strict) {
        throw new Error(`Invalid permission key: ${key}`);
      }
      continue;
    }

    if (typeof rawPermissions[key] !== "boolean") {
      if (strict) {
        throw new Error(`Permission '${key}' must be boolean`);
      }
      continue;
    }

    normalized[key] = rawPermissions[key];
  }

  return normalized;
};

export const resolveUserPermissionsService = async ({ role, permissions = {} }) => {
  const rolePermissions = await getRolePermissionsService(role);
  const overrides = normalizePermissionOverrides(permissions, { strict: false });

  return {
    ...rolePermissions,
    ...overrides,
  };
};

export const buildRoleDiffOverridesService = async ({ role, permissions = {} }) => {
  const requested = normalizePermissionOverrides(permissions);
  const rolePermissions = await getRolePermissionsService(role);
  const overrides = {};

  for (const key of Object.keys(requested)) {
    if (requested[key] !== rolePermissions[key]) {
      overrides[key] = requested[key];
    }
  }

  return overrides;
};
