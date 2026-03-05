import {
  getRbacPolicyService,
  resetRbacPolicyService,
  updateRbacPolicyService,
} from "../services/rbac.service.js";

export const getRbacPolicy = async (req, res, next) => {
  try {
    const data = await getRbacPolicyService();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateRbacPolicy = async (req, res, next) => {
  try {
    const data = await updateRbacPolicyService(req.body);
    return res.status(200).json({
      success: true,
      message: "RBAC policy updated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetRbacPolicy = async (req, res, next) => {
  try {
    const data = await resetRbacPolicyService();
    return res.status(200).json({
      success: true,
      message: "RBAC policy reset to defaults",
      data,
    });
  } catch (error) {
    return next(error);
  }
};
