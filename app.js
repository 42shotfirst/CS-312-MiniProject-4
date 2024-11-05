import bodyParser from 'body-parser'; // Middleware for parsing JSON bodies
import 'bootstrap/dist/css/bootstrap.min.css';
import cors from 'cors'; // Middleware for enabling CORS
import dotenv from 'dotenv'; // For loading environment variables
import express from 'express'; // Express framework
import session from 'express-session'; // Middleware for handling sessions
import path from 'path'; // For serving static files
import { Pool } from 'pg'; // PostgreSQL client

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
    cookie: { secure: false }, // Set to true in production with HTTPS
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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

        // ---------------------- Template Routes ----------------------

        // Render homepage with blog posts
        app.get('/', async (req, res) => {
            try {
                const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
                res.render('index', { posts: result.rows, error: null });
            } catch (err) {
                console.error('Error retrieving blog posts:', err);
                res.render('index', { posts: [], error: 'An error occurred while retrieving blog posts.' });
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

                await pool.query('INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)', [user_id, password, name]);
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
                req.session.user_id = user_id; // Store user_id in session after successful sign-in
                res.redirect('/');
            } catch (err) {
                console.error('Error during sign-in:', err);
                res.render('signin', { error: 'An error occurred. Please try again.' });
            }
        });

        // ---------------------- Edit Post Route ----------------------
        app.get('/blog/edit/:id', async (req, res) => {
            const postId = req.params.id;
            const currentUserId = req.session.user_id; 
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

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
});
