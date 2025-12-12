import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../config';

const TaskDetail = () => {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const [comment, setComment] = useState('');
    const [user, setUser] = useState(null);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const fetchTask = async () => {
            try {
                const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: abortController.signal
                });
                if (!isMounted) return;
                setUser(userRes.data);

                const res = await axios.get(`${API_BASE_URL}/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: abortController.signal
                });
                if (!isMounted) return;
                setTask(res.data);
            } catch (err) {
                if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                    return;
                }
                console.error(err);
            }
        };
        fetchTask();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [id, navigate]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_BASE_URL}/tasks/${id}/comments/`, { content: comment }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComment('');
            // Refresh task to see new comment
            const res = await axios.get(`${API_BASE_URL}/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTask(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_BASE_URL}/tasks/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const res = await axios.get(`${API_BASE_URL}/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTask(res.data);
            setIsEditingStatus(false);
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    if (!task) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'ongoing': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'continuous': return 'bg-blue-50 text-blue-600 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getCriticalityColor = (criticality) => {
        switch (criticality) {
            case 'high': return 'bg-red-50 text-red-600 border-red-200';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'low': return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <Layout user={user}>
            <button
                className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors font-medium text-sm"
                onClick={() => navigate('/dashboard')}
            >
                &larr; Back to Dashboard
            </button>

            <div className="bg-surface border border-border rounded-xl p-8 shadow-sm max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-text">{task.title}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCriticalityColor(task.criticality)}`}>
                                {task.criticality ? task.criticality.toUpperCase() : 'MEDIUM'}
                            </span>
                        </div>
                        <p className="text-text-muted leading-relaxed">{task.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {isEditingStatus ? (
                            <select
                                className="input py-1 px-2 text-sm w-auto"
                                value={task.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                onBlur={() => setIsEditingStatus(false)}
                                autoFocus
                            >
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="continuous">Continuous</option>
                            </select>
                        ) : (
                            <button
                                onClick={() => setIsEditingStatus(true)}
                                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)} hover:opacity-80 transition-opacity`}
                                title="Click to change status"
                            >
                                {task.status.replace('_', ' ')}
                            </button>
                        )}
                        <span className="text-xs text-text-muted">
                            Assigned to: {task.assignee ? task.assignee.username : 'Unassigned'}
                        </span>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-lg font-semibold text-text mb-4">Comments</h3>
                    <div className="flex flex-col gap-4 mb-6">
                        {task.comments && task.comments.length > 0 ? (
                            task.comments.map(c => (
                                <div key={c.id} className="bg-subsurface p-4 rounded-lg border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-text text-sm">{c.author.username}</span>
                                        <span className="text-xs text-text-muted">{new Date(c.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-text text-sm">{c.content}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-text-muted text-sm italic">No comments yet.</p>
                        )}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
                        <textarea
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[100px]"
                            placeholder="Add a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button type="submit" className="btn-primary">Post Comment</button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default TaskDetail;
