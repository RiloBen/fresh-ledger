const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production';

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AuthCtrl] Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;
  const userId = req.user.id;

  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'old_password and new_password are required' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'new_password must be at least 6 characters long' });
  }

  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password lama salah' });
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[AuthCtrl] Error during changePassword:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
