import jwt from 'jsonwebtoken';

export function verifyAdmin(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  if (!token) return false;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set.');
    return false;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return Boolean(decoded && decoded.admin === true);
  } catch (err) {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  if (!verifyAdmin(req)) {
    return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
  }
  next();
}
