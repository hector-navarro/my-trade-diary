import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const createToken = (userId: number) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
};
