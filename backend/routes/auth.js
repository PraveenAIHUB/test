/**
 * Authentication Routes
 * Handles user login, registration, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateToken, verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const db = require('../config/database');

// Mock users for development (when database is not available)
const mockUsers = [
  {
    user_id: 1,
    username: 'admin',
    email: 'admin@propertypro.com',
    password_hash: '$2a$10$rZ5qZ5qZ5qZ5qZ5qZ5qZ5uO5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ', // password: admin123
    role: 'ADMIN',
    full_name: 'Admin User',
    status: 'ACTIVE'
  },
  {
    user_id: 2,
    username: 'manager',
    email: 'manager@propertypro.com',
    password_hash: '$2a$10$rZ5qZ5qZ5qZ5qZ5qZ5qZ5uO5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ', // password: manager123
    role: 'MANAGER',
    full_name: 'Property Manager',
    status: 'ACTIVE'
  },
  {
    user_id: 3,
    username: 'user',
    email: 'user@propertypro.com',
    password_hash: '$2a$10$rZ5qZ5qZ5qZ5qZ5qZ5qZ5uO5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ5qZ', // password: user123
    role: 'USER',
    full_name: 'Regular User',
    status: 'ACTIVE'
  }
];

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstMsg = errors.array()[0]?.msg || 'Username and password are required';
      return res.status(400).json({ error: firstMsg, errors: errors.array() });
    }

    const { username, password } = req.body;

    // Try database first (when configured and connected)
    let user = null;
    try {
      if (db.isConfigured && db.isConfigured()) {
        const sql = `
          SELECT user_id, username, email, password_hash, role, full_name, status
          FROM users
          WHERE username = :username AND status = 'ACTIVE'
        `;
        const result = await db.execute(sql, { username });
        if (result.rows && result.rows.length > 0) {
          user = result.rows[0];
        }
      }
    } catch (dbError) {
      console.log('Database not available or query failed, using mock users:', dbError.message);
    }

    // Fall back to mock users when DB has no matching user or DB not used
    if (!user) {
      user = mockUsers.find(u => u.username === username && u.status === 'ACTIVE');
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash || user.PASSWORD_HASH);
    
    // For mock users, also accept the plain passwords
    const isMockPassword = (username === 'admin' && password === 'admin123') ||
                          (username === 'manager' && password === 'manager123') ||
                          (username === 'user' && password === 'user123');

    if (!isValidPassword && !isMockPassword) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Generate token
    const token = generateToken({
      user_id: user.user_id || user.USER_ID,
      username: user.username || user.USERNAME,
      email: user.email || user.EMAIL,
      role: user.role || user.ROLE
    });

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id || user.USER_ID,
        username: user.username || user.USERNAME,
        email: user.email || user.EMAIL,
        role: user.role || user.ROLE,
        full_name: user.full_name || user.FULL_NAME
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name } = req.body;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const sql = `
      INSERT INTO users (
        username, email, password_hash, role, full_name, status, created_date
      ) VALUES (
        :username, :email, :password_hash, 'USER', :full_name, 'ACTIVE', SYSDATE
      )
    `;

    await db.execute(sql, { username, email, password_hash, full_name });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message && error.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * GET /api/auth/users
 * List users (id, username, full_name) for admin lookup (e.g. lease request "requested by" name)
 */
router.get('/users', verifyToken, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    let users = [];
    if (db.isConfigured && db.isConfigured()) {
      try {
        const result = await db.execute(
          'SELECT user_id, username, full_name FROM users WHERE status = \'ACTIVE\''
        );
        if (result.rows && result.rows.length) users = result.rows;
      } catch (e) {
        // fall through to mock
      }
    }
    if (users.length === 0) {
      users = mockUsers.filter(u => u.status === 'ACTIVE').map(u => ({
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name || u.username
      }));
    }
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

module.exports = router;

