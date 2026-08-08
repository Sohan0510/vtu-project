const jwt = require('jsonwebtoken');

module.exports = async function (req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ valid: false });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set.');
      return res.status(200).json({ valid: false });
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (decoded && decoded.admin === true) {
      return res.status(200).json({ valid: true, admin: true });
    }

    res.status(200).json({ valid: false });
  } catch (error) {
    // Token expired or invalid signature — not an error, just invalid
    res.status(200).json({ valid: false });
  }
};
