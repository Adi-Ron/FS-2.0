import express from 'express';
import Setting from '../models/Setting.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Get portal status
router.get('/', async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) setting = await Setting.create({});
  res.json({ portalEnabled: setting.portalEnabled });
});

// Toggle portal
router.post('/toggle', authAdmin, async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) setting = await Setting.create({});
  setting.portalEnabled = !setting.portalEnabled;
  await setting.save();
  res.json({ portalEnabled: setting.portalEnabled });
});

export default router;
