import {
  deleteUserService,
  getUserByIdService,
  getUsersService,
  updateUserByIdService,
} from "../services/user.service.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await getUsersService(req.query);
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    const user = await updateUserByIdService(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "Email already in use") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const user = await deleteUserService(req.params.id);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};
