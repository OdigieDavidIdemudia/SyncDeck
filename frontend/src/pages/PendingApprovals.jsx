import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../config';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

const PendingApprovals = () => {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                // Only GROUP_HEAD can access this page
                if (userRes.data.role !== 'group_head') {
                    navigate('/dashboard');
                    return;
                }

                await fetchRequests(filter);
            } catch (err) {
                console.error(err);
                setToast({ show: true, message: 'Failed to load data', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, filter]);

    const fetchRequests = async (status) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/users/deletion-requests/?status=${status}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to load requests', type: 'error' });
        }
    };

    const handleReview = async (requestId, approved) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/users/deletion-requests/${requestId}/review?approved=${approved}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setToast({
                show: true,
                message: `Request ${approved ? 'approved' : 'rejected'} successfully`,
                type: 'success'
            });

            // Refresh the list
            await fetchRequests(filter);
        } catch (err) {
            console.error(err);
            setToast({
                show: true,
                message: err.response?.data?.detail || 'Failed to process request',
                type: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <Layout user={user}>
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-text mb-2">Pending Approvals</h1>
                    <p className="text-text-muted">Review and approve user deletion requests</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 border-b border-border">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 font-medium transition-colors ${filter === 'pending'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-muted hover:text-text'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 font-medium transition-colors ${filter === 'approved'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-muted hover:text-text'
                            }`}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 font-medium transition-colors ${filter === 'rejected'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-muted hover:text-text'
                            }`}
                    >
                        Rejected
                    </button>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="bg-surface border border-border rounded-xl p-8 text-center">
                            <p className="text-text-muted">No {filter} requests found</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                                <User size={20} className="text-red-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-text">
                                                    {request.user.username}
                                                </h3>
                                                <p className="text-sm text-text-muted">
                                                    {request.user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <p className="text-xs text-text-muted mb-1">Requested By</p>
                                                <p className="text-sm font-medium text-text">
                                                    {request.requested_by.username}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted mb-1">Requested On</p>
                                                <p className="text-sm font-medium text-text">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {request.reason && (
                                            <div className="mb-3">
                                                <p className="text-xs text-text-muted mb-1">Reason</p>
                                                <p className="text-sm text-text bg-subsurface p-3 rounded-lg">
                                                    {request.reason}
                                                </p>
                                            </div>
                                        )}

                                        {request.status !== 'pending' && request.reviewed_at && (
                                            <div className="text-xs text-text-muted">
                                                Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-4">
                                        {request.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReview(request.id, true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                    title="Approve deletion"
                                                >
                                                    <CheckCircle size={18} />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReview(request.id, false)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                    title="Reject deletion"
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${request.status === 'approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {request.status === 'approved' ? (
                                                    <CheckCircle size={16} />
                                                ) : (
                                                    <XCircle size={16} />
                                                )}
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PendingApprovals;
