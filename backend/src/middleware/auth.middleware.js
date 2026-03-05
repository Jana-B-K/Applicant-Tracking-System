import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { getRolePermissionsService } from "../services/rbac.service.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET)
    const user = await User.findById(decoded.id).select('-password -refreshToken -accessToken -passwordResetTokenHash -passwordResetTokenExpiresAt')
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    req.permissions = await getRolePermissionsService(user.role)
    next()
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

export const requirePermission = (permissionKey) => (req, res, next) => {
  if (!req.permissions?.[permissionKey]) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};
