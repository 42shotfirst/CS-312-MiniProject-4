import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PostList = ({ userId }) => {
    const [posts, setPosts] = useState([]);

    // Fetch posts from the backend when the component mounts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/posts'); // Adjust the URL based on your API structure
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setPosts(data); // Update state with fetched posts
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        fetchPosts();
    }, []);

    // Function to handle deleting a post with authentication
    const handleDelete = async (postId) => {
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming you're storing the user's token in localStorage
                },
            });

            if (response.ok) {
                setPosts(posts.filter(post => post.blog_id !== postId)); // Update the state to remove deleted post
            } else {
                const errorData = await response.json();
                console.error('Error deleting post:', errorData.message); // Show error message from the server
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    return (
        <div className="post-list">
            <h2>Blog Posts</h2>
            {posts.length === 0 ? (
                <p>No posts available.</p>
            ) : (
                <ul>
                    {posts.map(post => (
                        <li key={post.blog_id} className="post">
                            <h3>{post.title}</h3>
                            <p>{post.body}</p>
                            <p>By: {post.creator_name} on {new Date(post.date_created).toLocaleDateString()}</p>
                            <Link to={`/edit/${post.blog_id}`}>Edit</Link>
                            <button onClick={() => handleDelete(post.blog_id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PostList;
