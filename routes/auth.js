const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'BlogDB',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

// Render sign-up page
router.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// Handle sign-up form submission
router.post('/signup', async (req, res) => {
    const { user_id, password, name } = req.body;

    try {
        // Check if the user_id already exists
        const checkUser = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        if (checkUser.rows.length > 0) {
            // If user_id exists, return an error message
            return res.render('signup', { error: 'User ID is already taken. Please choose a different one.' });
        }

        // Insert the new user into the database
        await pool.query(
            'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
            [user_id, password, name]
        );

        // Redirect to sign-in page after successful sign-up
        res.redirect('/signin');
    } catch (err) {
        console.error('Error inserting new user:', err);
        res.render('signup', { error: 'An error occurred. Please try again.' });
    }
});

// Render sign-in page
router.get('/signin', (req, res) => {
    res.render('signin', { error: null });
});

// Handle sign-in form submission
router.post('/signin', async (req, res) => {
    const { user_id, password } = req.body;

    try {
        // Check if the user_id and password match
        const user = await pool.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [user_id, password]);

        if (user.rows.length === 0) {
            // If no matching user is found, return an error message
            return res.render('signin', { error: 'Invalid User ID or Password. Please try again.' });
        }

        // Redirect to the blog feed if credentials are valid
        res.redirect('/blog');
    } catch (err) {
        console.error('Error during sign-in:', err);
        res.render('signin', { error: 'An error occurred. Please try again.' });
    }
});

module.exports = router;
