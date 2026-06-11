import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Student } from '../models/Student.js';

export function signStudentToken(student) {
  return jwt.sign(
    {
      sub: String(student._id),
      email: student.email,
      collegeDomainKey: student.collegeDomainKey,
    },
    env.jwtSecret,
    { expiresIn: '7d' },
  );
}

export async function requireStudent(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const student = await Student.findById(payload.sub);

    if (!student) {
      return res.status(401).json({ error: 'Student no longer exists' });
    }

    req.student = student;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

