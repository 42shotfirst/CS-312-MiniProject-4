// src/components/BlogPostForm.js

import React, { useState } from 'react';

const BlogPostForm = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const [creatorUserId, setCreatorUserId] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        const postData = {
            title,
            body,
            creator_name: creatorName,
            creator_user_id: creatorUserId,
        };

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const newPost = await response.json();
            console.log('New Post Created:', newPost);
            // Reset form fields
            setTitle('');
            setBody('');
            setCreatorName('');
            setCreatorUserId('');
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Title:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Body:</label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Creator Name:</label>
                <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Creator User ID:</label>
                <input
                    type="text"
                    value={creatorUserId}
                    onChange={(e) => setCreatorUserId(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Create Post</button>
        </form>
    );
};

export default BlogPostForm;
