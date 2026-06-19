const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRY = process.env.JWT_EXPIRY || '7d';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
