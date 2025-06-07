const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
  static async create({ username, email, password }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(error.code === 'ER_DUP_ENTRY' ? 'Email already exists' : 'Error creating user');
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Error finding user');
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw new Error('Error finding user');
    }
  }

  static async setResetToken(userId) {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      await db.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
        [hashedToken, resetTokenExpiry, userId]
      );

      return resetToken; // Return the unhashed token to be sent via email
    } catch (error) {
      console.error('Error setting reset token:', error);
      throw new Error('Error setting reset token');
    }
  }

  static async findByResetToken(token) {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const [rows] = await db.execute(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
        [hashedToken]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw new Error('Error finding user');
    }
  }

  static async resetPassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [hashedPassword, userId]
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      throw new Error('Error resetting password');
    }
  }

  static async getAllUsers() {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      console.error('Error details:', {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
      throw new Error(`Error getting users: ${error.sqlMessage || error.message}`);
    }
  }

  static async deleteUser(id) {
    try {
      const [result] = await db.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Error deleting user');
    }
  }

  static async updateUser(id, { username, email, role }) {
    try {
      const updates = [];
      const values = [];

      if (username) {
        updates.push('username = ?');
        values.push(username);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (role) {
        updates.push('role = ?');
        values.push(role);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const [result] = await db.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(error.code === 'ER_DUP_ENTRY' ? 'Email already exists' : 'Error updating user');
    }
  }
}

module.exports = User; 