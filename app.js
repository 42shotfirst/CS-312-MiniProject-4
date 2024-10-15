const express = require('express');
const { Pool } = require('pg');
const session = require('express-session'); // Assuming you are using sessions
require('dotenv').config(); // Use dotenv to handle environment variables
const app = express();
const blogRoutes = require('./routes/blog');

// PostgreSQL connection setup
const pool = new Pool({
    user: process.env.DB_USER || 'postgres', // Use env variables or fallback
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'blogdb', // Ensure database name is lowercase "blogdb"
    password: process.env.DB_PASSWORD || 'your_password', // Use env variable
    port: process.env.DB_PORT || 5432,
});

// Middleware for sessions (assuming you want to track user sessions)
app.use(session({
    secret: 'your_secret_key', // Change this in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Connect to PostgreSQL database
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Stop the server if the connection fails
    } else {
        console.log('Connected to blogdb');

        // Routes

        // Retrieve and display all blog posts on the homepage
        app.get('/', async (req, res) => {
            try {
                const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
                const posts = result.rows;
                res.render('index', { posts, error: null });
            } catch (err) {
                console.error('Error retrieving blog posts:', err);
                res.render('index', { posts: [], error: 'An error occurred while retrieving blog posts.' });
            }
        });

        // ---------------------- Blog Post Creation Route ----------------------
        app.post('/create-post', async (req, res) => {
            const { title, body, creator_name, creator_user_id } = req.body;
            try {
                await pool.query(
                    'INSERT INTO blogs (title, body, creator_name, creator_user_id, date_created) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
                    [title, body, creator_name, creator_user_id]
                );
                res.redirect('/');
            } catch (err) {
                console.error('Error inserting blog post:', err);
                res.render('index', { error: 'An error occurred while creating the blog post. Please try again.' });
            }
        });

        // ---------------------- Authentication Routes ----------------------
        app.get('/signup', (req, res) => {
            res.render('signup', { error: null });
        });

        app.post('/signup', async (req, res) => {
            const { user_id, password, name } = req.body;
            try {
                const checkUser = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
                if (checkUser.rows.length > 0) {
                    return res.render('signup', { error: 'User ID is already taken. Please choose a different one.' });
                }

                await pool.query(
                    'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
                    [user_id, password, name]
                );
                res.redirect('/signin');
            } catch (err) {
                console.error('Error inserting new user:', err);
                res.render('signup', { error: 'An error occurred. Please try again.' });
            }
        });

        app.get('/signin', (req, res) => {
            res.render('signin', { error: null });
        });

        app.post('/signin', async (req, res) => {
            const { user_id, password } = req.body;
            try {
                const user = await pool.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [user_id, password]);
                if (user.rows.length === 0) {
                    return res.render('signin', { error: 'Invalid User ID or Password. Please try again.' });
                }
                req.session.user_id = user_id; // Storing the user_id in session after successful sign-in
                res.redirect('/');
            } catch (err) {
                console.error('Error during sign-in:', err);
                res.render('signin', { error: 'An error occurred. Please try again.' });
            }
        });

        // ---------------------- Edit Post Route ----------------------
        app.get('/blog/edit/:id', async (req, res) => {
            const postId = req.params.id;
            const currentUserId = req.session.user_id; // Assuming you store the user_id in session
            try {
                const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [postId]);
                const post = result.rows[0];
                if (post.creator_user_id !== currentUserId) {
                    return res.status(403).send('You are not authorized to edit this post.');
                }
                res.render('edit-post', { post, error: null });
            } catch (err) {
                console.error('Error loading the post for editing:', err);
                res.render('index', { error: 'Error loading the post for editing.' });
            }
        });

        // Handle post update form submission
        app.post('/blog/edit/:id', async (req, res) => {
            const postId = req.params.id;
            const { title, body } = req.body;
            const currentUserId = req.session.user_id;
            try {
                const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [postId]);
                const post = result.rows[0];
                if (post.creator_user_id !== currentUserId) {
                    return res.status(403).send('You are not authorized to edit this post.');
                }
                await pool.query('UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3', [title, body, postId]);
                res.redirect('/');
            } catch (err) {
                console.error('Error updating the post:', err);
                res.render('edit-post', { post, error: 'Error updating the post. Please try again.' });
            }
        });

        // ---------------------- Delete Post Route ----------------------
        app.post('/blog/delete/:id', async (req, res) => {
            const postId = req.params.id;
            const currentUserId = req.session.user_id;
            try {
                const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [postId]);
                const post = result.rows[0];
                if (post.creator_user_id !== currentUserId) {
                    return res.status(403).send('You are not authorized to delete this post.');
                }
                await pool.query('DELETE FROM blogs WHERE blog_id = $1', [postId]);
                res.redirect('/');
            } catch (err) {
                console.error('Error deleting the post:', err);
                res.render('index', { error: 'Error deleting the post. Please try again.' });
            }
        });

        // Start the server on the specified port
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    }
});
