import axios from 'axios';
import React, { useEffect, useState } from 'react';

const BlogPosts = () => {
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/posts');
                setPosts(response.data);
                console.log('Fetched posts:', response.data); // Log fetched data
            } catch (error) {
                setError(error.message);
                console.error('Error fetching posts:', error); // Log error if any
            }
        };

        fetchPosts();
    }, []);

    return (
        <div>
            <h1>Blog Posts</h1>
            {error && <p>{error}</p>}
            {posts.length > 0 ? (
                <ul>
                    {posts.map(post => (
                        <li key={post.blog_id}>
                            <h2>{post.title}</h2>
                            <p>{post.body}</p>
                            <p>By: {post.creator_name}</p>
                            <p>Date: {new Date(post.date_created).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No blog posts available.</p>
            )}
        </div>
    );
};

export default BlogPosts;