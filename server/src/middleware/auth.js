import jwt from 'jsonwebtoken';

export function verifyAuth(req, res, next) {
  const token = (req.cookies && req.cookies.token) ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.substring('Bearer '.length)
      : null);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
