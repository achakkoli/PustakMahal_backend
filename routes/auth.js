const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// PostgreSQL pool (update connectionString or use config object)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Register Route
router.post('/register', async (req, res) => {
    const { name, username, email, password } = req.body;

    // Basic validation
    if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Please fill all fields' });
    }

    try {
        // Check for existing email or username
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email or Username already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        const result = await pool.query(
            'INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, username, email',
            [name, username, email, hashedPassword]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Please provide username and password' });
    }

    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (!userResult.rows.length) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Compare password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error during login' });
    }
});

module.exports = router;
