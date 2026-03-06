import jwt from 'jsonwebtoken';

export const generateAccessToken = (id) => jwt.sign(
    { id },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '60m' }
);

export const generateRefreshToken = (id) => jwt.sign(
    { id },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
);
