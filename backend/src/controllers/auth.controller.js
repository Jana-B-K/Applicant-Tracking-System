import {
  registerService,
  loginService,
  refreshAccessTokenService,
} from "../services/auth.service.js";
import { updateProfileService } from "../services/user.service.js";
import {
  forgotPasswordService,
  resetPasswordService,
  verifyResetTokenService,
} from "../services/password.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerService(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const data = await loginService({ email, password });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 6 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: data.accessToken,
      user: data.user,
    });

  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies.refreshToken;

    const data = await refreshAccessTokenService(token);

    res.status(200).json({
      success: true,
      accessToken: data.accessToken,
    });

  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await resetPasswordService(req.body);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyResetToken = async (req, res, next) => {
  try {
    const result = await verifyResetTokenService(req.body);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        ...req.user.toObject(),
        permissions: req.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;
    const updatedUser = await updateProfileService(req.user.id, { firstName, lastName, email });
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
