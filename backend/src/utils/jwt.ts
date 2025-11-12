import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const createToken = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
};
