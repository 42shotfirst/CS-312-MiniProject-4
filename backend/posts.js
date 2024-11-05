const express = require('express');
const router = express.Router();
const db = require('./db'); // Your database connection
const { authenticateToken } = require('./middleware'); // Middleware for token authentication

// DELETE endpoint to remove a post
router.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await db.query('SELECT * FROM posts WHERE blog_id = $1', [postId]);
        
        if (post.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const { creator_id } = post.rows[0]; // Assuming the post has a creator_id field

        // Check if the authenticated user is the creator of the post
        if (creator_id !== req.user.id) {
            return res.status(403).json({ message: 'You do not have permission to delete this post' });
        }

        // Proceed to delete the post
        await db.query('DELETE FROM posts WHERE blog_id = $1', [postId]);
        res.status(204).send(); // No content to send back
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
