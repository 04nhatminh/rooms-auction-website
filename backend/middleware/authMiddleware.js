// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function extractToken(req) {
  // 1) Cookie HttpOnly
  if (req.cookies?.bidstay_token) return req.cookies.bidstay_token;
  // 2) Authorization: Bearer ...
  const h = req.get('Authorization');
  if (h?.startsWith('Bearer ')) return h.slice(7);
  // 3) (tùy chọn) query token
  if (typeof req.query.token === 'string') return req.query.token;
  return null;
}

const verifyToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Không có token xác thực.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Chưa xác thực.' });
  const role = req.user.role || 'guest';
  const ok = Array.isArray(roles) ? roles.includes(role) : role === roles;
  if (!ok) return res.status(403).json({ message: 'Không đủ quyền.' });
  next();
};

const isAdmin = requireRole('admin');

module.exports = { verifyToken, isAdmin, requireRole };
