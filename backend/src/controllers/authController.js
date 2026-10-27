import * as authService from '../services/authService.js';
import { verifyAdmin } from '../middleware/auth.js';

export async function login(req, res, next) {
  try {
    const result = await authService.loginAdmin(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ detail: error.message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
}

export function verify(req, res) {
  const isValid = verifyAdmin(req);
  return res.status(200).json({ valid: isValid, admin: isValid });
}
