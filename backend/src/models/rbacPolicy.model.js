import mongoose from "mongoose";

const ROLE_KEYS = ["superadmin", "hrrecruiter", "hiringmanager", "interviewpanel", "management"];

const buildRolePermissionShape = () => {
  const shape = {};
  for (const role of ROLE_KEYS) {
    shape[role] = { type: Boolean, default: false };
  }
  return shape;
};

const rolePermissionSchema = new mongoose.Schema(buildRolePermissionShape(), { _id: false });

const permissionKeys = [
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

const permissionShape = {};
for (const key of permissionKeys) {
  permissionShape[key] = { type: rolePermissionSchema, required: true };
}

const rbacPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    permissions: {
      type: new mongoose.Schema(permissionShape, { _id: false }),
      required: true,
    },
  },
  { timestamps: true }
);

const RbacPolicy = mongoose.model("RbacPolicy", rbacPolicySchema);

export default RbacPolicy;
