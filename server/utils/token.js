import jwt from 'jsonwebtoken';
export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
