import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EditPost = ({ userId }) => {
    const { id } = useParams();
    const [post, setPost] = useState({ title: '', body: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPost = async () => {
            const response = await fetch(`/api/posts/${id}`);
            const data = await response.json();
            setPost(data);
        };

        fetchPost();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...post }),
        });

        if (response.ok) {
            navigate('/'); // Redirect back to post list after updating
        } else {
            console.error('Error updating post');
        }
    };

    return (
        <div>
            <h1>Edit Post</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={post.title}
                    onChange={(e) => setPost({ ...post, title: e.target.value })}
                    placeholder="Post Title"
                    required
                />
                <textarea
                    value={post.body}
                    onChange={(e) => setPost({ ...post, body: e.target.value })}
                    placeholder="Post Body"
                    required
                />
                <button type="submit">Update Post</button>
            </form>
        </div>
    );
};

export default EditPost;
