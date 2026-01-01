import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Edit2, Trash2, Check, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import Toast from './Toast';

const TaskComments = ({ taskId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
            setToast({ show: true, message: 'Comment added successfully', type: 'success' });
        } catch (error) {
            console.error('Error posting comment:', error);
            setToast({ show: true, message: 'Failed to add comment', type: 'error' });
        }
    };

    const handleEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditedContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditedContent('');
    };

    const handleSaveEdit = async (commentId) => {
        if (!editedContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_BASE_URL}/tasks/${taskId}/comments/${commentId}`,
                { content: editedContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditingCommentId(null);
            setEditedContent('');
            fetchComments();
            setToast({ show: true, message: 'Comment updated successfully', type: 'success' });
        } catch (error) {
            console.error('Error updating comment:', error);
            setToast({ show: true, message: error.response?.data?.detail || 'Failed to update comment', type: 'error' });
        }
    };

    const handleDelete = async (commentId) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_BASE_URL}/tasks/${taskId}/comments/${commentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchComments();
            setToast({ show: true, message: 'Comment deleted successfully', type: 'success' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            setToast({ show: true, message: error.response?.data?.detail || 'Failed to delete comment', type: 'error' });
        }
    };

    return (
        <div className="space-y-4">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            <h3 className="text-lg font-semibold text-text">Comments</h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {loading ? (
                    <p className="text-text-muted text-sm">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-text-muted text-sm italic">No comments yet.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User size={14} className="text-primary" />
                            </div>
                            <div className="flex-1 bg-subsurface p-3 rounded-lg border border-border">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-text">{comment.author.username}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-muted">
                                            {new Date(comment.created_at).toLocaleString()}
                                        </span>
                                        {/* Show edit/delete icons only for comment author */}
                                        {currentUser.id === comment.author_id && editingCommentId !== comment.id && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(comment)}
                                                    className="p-1 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit comment"
                                                >
                                                    <Edit2 size={14} className="text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete comment"
                                                >
                                                    <Trash2 size={14} className="text-red-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {editingCommentId === comment.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full p-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            rows="3"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-subsurface rounded-md transition-colors"
                                            >
                                                <X size={14} />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveEdit(comment.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                                            >
                                                <Check size={14} />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-text">{comment.content}</p>
                                )}
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
