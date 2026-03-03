import jwt from 'jsonwebtoken';

export const generateAccesToken = (req,res) => {
    jwt.verify(
        { id },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        {expiresIn: '15m'}
    )
}

export const generateRefreshToken = (req,res) => {
    jwt.verify(
        { id },
        process.env.JWT_REFRESH_TOKEN_SECRET,
        {expiresIn: '7d'}
    )
}