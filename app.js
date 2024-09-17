const express = require('express');
const app = express();
const blogRoutes = require('./routes/blog');

// Middleware to parse request bodies
// Using Express's built-in middleware as bodyParser is no longer needed for urlencoded data
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use blogRoutes for any '/blog' routes
app.use('/blog', blogRoutes);

// Redirect from the root to the blog home
app.get('/', (req, res) => {
    res.redirect('/blog');
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
