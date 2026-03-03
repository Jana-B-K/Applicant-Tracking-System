import {
  registerService,
  loginService,
  socialLoginService,
  refreshAccessTokenService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/auth.service.js";

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

// export const login = async (req, res, next) => {
//   try {
//     const result = await loginService(req.body);

//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       data: result,
//     });
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

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
      accessToken: data.accessToken,
      user: data.user,
    });

  } catch (error) {
    next(error);
  }
};

// export const refreshToken = async (req, res, next) => {
//   try {
//     const { refreshToken } = req.body;

//     const result = await refreshAccessTokenService(refreshToken);

//     return res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     return res.status(403).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    const data = await refreshAccessTokenService(token);

    res.status(200).json({
      success: true,
      accessToken: data.accessToken,
    });

  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const data = await socialLoginService({
      provider: "google",
      accessToken: req.body.accessToken,
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 6 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const microsoftLogin = async (req, res, next) => {
  try {
    const data = await socialLoginService({
      provider: "microsoft",
      accessToken: req.body.accessToken,
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 6 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
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
    return res.status(500).json({
      success: false,
      message: "Unable to process forgot password request",
    });
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
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
