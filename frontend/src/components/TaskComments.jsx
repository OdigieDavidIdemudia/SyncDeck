import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, User } from 'lucide-react';
import { API_BASE_URL } from '../config';

const TaskComments = ({ taskId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/comments/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/tasks/${taskId}/comments/`,
                { content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Comments</h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {loading ? (
                    <p className="text-text-muted text-sm">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-text-muted text-sm italic">No comments yet.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User size={14} className="text-primary" />
                            </div>
                            <div className="flex-1 bg-subsurface p-3 rounded-lg border border-border">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-text">{comment.author.username}</span>
                                    <span className="text-xs text-text-muted">
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-text">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 input"
                />
                <button
                    type="submit"
                    className="btn-primary p-2"
                    disabled={!newComment.trim()}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default TaskComments;
