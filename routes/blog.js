const express = require('express');
const router = express.Router();

// Temporary storage for posts
let posts = [];

// Home route - showing all posts and the form
router.get('/', (req, res) => {
    res.render('index', { posts: posts });
});

// Route handling POST request from the form submission to create new posts
router.post('/', (req, res) => {
    const { creator, title, content } = req.body;  // Destructure data from form
    const newPost = {
        creator,
        title,
        content,
        creationTime: new Date().toLocaleString() // Store creation time
    };
    posts.push(newPost); // Add the new post to our posts array
    res.redirect('/blog'); // Redirect to the blog route to show the updated list of posts
});

// Serve edit form
router.get('/edit/:index', (req, res) => {
    const index = req.params.index;
    if (index >= 0 && index < posts.length) {
        res.render('edit', { post: posts[index], index: index });
    } else {
        res.status(404).send('Post not found');
    }
});

// Handle edit form submission
router.post('/edit/:index', (req, res) => {
    const index = req.params.index;
    if (index >= 0 && index < posts.length) {
        // Update the post with new data from the form
        posts[index] = {
            creator: req.body.creator,
            title: req.body.title,
            content: req.body.content,
            creationTime: new Date().toLocaleString()  // Optionally update the timestamp
        };
        res.redirect('/blog');
    } else {
        res.status(404).send('Post not found');
    }
});

// Route to handle deleting a post
router.post('/delete/:index', (req, res) => {
    const index = req.params.index;
    if (index >= 0 && index < posts.length) {
        posts.splice(index, 1);  // Removes the post at the specified index
        res.redirect('/blog');
    } else {
        res.status(404).send('Post not found');
    }
});

module.exports = router;
