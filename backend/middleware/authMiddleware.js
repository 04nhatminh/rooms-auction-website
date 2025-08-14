const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không có token xác thực.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Gắn thông tin user từ token vào request
    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc hết hạn.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin được phép truy cập.' });
  }
  return next();
};

module.exports = { verifyToken, isAdmin };
