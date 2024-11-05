// server/index.js

import bodyParser from 'body-parser'; // Middleware for parsing JSON bodies
import cors from 'cors'; // Middleware for enabling CORS
import dotenv from 'dotenv'; // Importing dotenv for environment variables
import express from 'express'; // Importing express
import session from 'express-session'; // Middleware for handling sessions
import path from 'path'; // Importing path for serving static files
import { Pool } from 'pg'; // Importing PostgreSQL client

dotenv.config(); // Load environment variables from .env file

// Database connection setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Allow CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Session middleware
app.use(session({
    secret: 'your_secret_key', // Change this in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Connect to PostgreSQL database
pool.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Stop the server if the connection fails
    } else {
        console.log('Connected to PostgreSQL');

        // ---------------------- API Routes ----------------------

        // GET: Retrieve all blog posts
        app.get('/api/posts', async (req, res) => {
            try {
                const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
                res.status(200).json(result.rows); // Send the rows as a JSON response
            } catch (error) {
                console.error('Error fetching posts:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // POST: Create a new blog post
        app.post('/api/posts', async (req, res) => {
            const { title, body, creator_name, creator_user_id } = req.body;
            try {
                const result = await pool.query(
                    'INSERT INTO blogs (title, body, creator_name, creator_user_id, date_created) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
                    [title, body, creator_name, creator_user_id]
                );
                res.status(201).json(result.rows[0]); // Respond with the newly created post
            } catch (error) {
                console.error('Error creating post:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // PUT: Update an existing blog post
        app.put('/api/posts/:id', async (req, res) => {
            const { id } = req.params; 
            const { title, body, creator_name } = req.body; 
            try {
                const result = await pool.query(
                    'UPDATE blogs SET title = $1, body = $2, creator_name = $3 WHERE blog_id = $4 RETURNING *',
                    [title, body, creator_name, id]
                );
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Post not found' });
                }
                res.status(200).json(result.rows[0]); 
            } catch (error) {
                console.error('Error updating post:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // DELETE: Delete a blog post
        app.delete('/api/posts/:id', async (req, res) => {
            const { id } = req.params; 
            try {
                const result = await pool.query('DELETE FROM blogs WHERE blog_id = $1 RETURNING *', [id]);
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Post not found' });
                }
                res.status(204).send(); // Respond with 204 No Content on successful deletion
            } catch (error) {
                console.error('Error deleting post:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // ---------------------- Authentication Routes ----------------------

        app.get('/signup', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build/index.html')); // Serve React app
        });

        app.post('/signup', async (req, res) => {
            const { user_id, password, name } = req.body;
            try {
                const checkUser = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
                if (checkUser.rows.length > 0) {
                    return res.status(400).json({ error: 'User ID is already taken. Please choose a different one.' });
                }

                await pool.query(
                    'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
                    [user_id, password, name]
                );
                res.status(201).json({ message: 'User created successfully' });
            } catch (err) {
                console.error('Error inserting new user:', err);
                res.status(500).json({ error: 'An error occurred. Please try again.' });
            }
        });

        app.get('/signin', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build/index.html')); // Serve React app
        });

        app.post('/signin', async (req, res) => {
            const { user_id, password } = req.body;
            try {
                const user = await pool.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [user_id, password]);
                if (user.rows.length === 0) {
                    return res.status(401).json({ error: 'Invalid User ID or Password. Please try again.' });
                }
                req.session.user_id = user_id; // Storing the user_id in session after successful sign-in
                res.status(200).json({ message: 'Sign in successful' });
            } catch (err) {
                console.error('Error during sign-in:', err);
                res.status(500).json({ error: 'An error occurred. Please try again.' });
            }
        });

        // Serve the React app for any unknown routes
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/build/index.html'));
        });

        // ---------------------- Starting the Server ----------------------
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
});
