const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function (req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const { id, password } = req.body || {};

    if (!id || !password) {
      return res.status(400).json({ detail: 'Admin ID and password are required.' });
    }

    // Validate admin ID (compared directly — not a secret, just a username)
    const validAdminId = process.env.ADMIN_ID;
    if (!validAdminId || id !== validAdminId) {
      return res.status(401).json({ detail: 'Invalid Admin ID or Password.' });
    }

    // Validate password using bcrypt
    const storedHash = process.env.ADMIN_PW_HASH;
    if (!storedHash) {
      console.error('ADMIN_PW_HASH environment variable is not set.');
      return res.status(500).json({ detail: 'Server authentication not configured.' });
    }

    const passwordMatch = await bcrypt.compare(password, storedHash);
    if (!passwordMatch) {
      return res.status(401).json({ detail: 'Invalid Admin ID or Password.' });
    }

    // Generate JWT token (expires in 24 hours)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set.');
      return res.status(500).json({ detail: 'Server authentication not configured.' });
    }

    const token = jwt.sign(
      { admin: true, id: validAdminId },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ detail: 'Internal Server Error' });
  }
};
