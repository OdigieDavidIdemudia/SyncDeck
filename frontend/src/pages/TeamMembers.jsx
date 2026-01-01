import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../config';

const TeamMembers = () => {
    const [members, setMembers] = useState([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [user, setUser] = useState(null);

    // Toast & Modal State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                // Fetch all users and filter in frontend or backend?
                // Backend doesn't have a "get my team members" endpoint yet, but we can use /users/ and filter.
                // Or better, let's assume /users/ returns all and we filter.
                // Ideally we should have a specific endpoint.
                const usersRes = await axios.get(`${API_BASE_URL}/users/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filter for my team
                // Must exclude group_head and self, and ensure they belong to my team
                const myTeam = usersRes.data.filter(u =>
                    u.team_id === userRes.data.team_id &&
                    u.id !== userRes.data.id &&
                    u.role === 'member'
                );
                setMembers(myTeam);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleAddMember = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            // Unit Head creating a user. Backend automatically assigns team_id.
            await axios.post(`${API_BASE_URL}/users/`, {
                username: newMemberName,
                password: newMemberPassword,
                role: 'member'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewMemberName('');
            setNewMemberPassword('');

            // Refresh
            const usersRes = await axios.get(`${API_BASE_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const myTeam = usersRes.data.filter(u =>
                u.team_id === user.team_id &&
                u.id !== user.id &&
                u.role === 'member'
            );
            setMembers(myTeam);
            setToast({ show: true, message: 'Member added successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Failed to add member';
            setToast({ show: true, message: errorMsg, type: 'error' });
        }
    };

    const handleDeleteMemberClick = (userId) => {
        setMemberToDelete(userId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete) return;
        const token = localStorage.getItem('token');
        try {
            // UNIT_HEAD must request deletion, not delete directly
            await axios.post(`${API_BASE_URL}/users/deletion-requests/`, {
                user_id: memberToDelete,
                reason: "Requested by Unit Head" // Could add a reason input field
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: 'Deletion request submitted successfully. Awaiting GROUP_HEAD approval.', type: 'success' });
            // Note: Member is not immediately removed from list since deletion is pending approval
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Failed to request deletion';
            setToast({ show: true, message: errorMsg, type: 'error' });
        } finally {
            setDeleteModalOpen(false);
            setMemberToDelete(null);
        }
    };

    if (!user) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

    return (
        <Layout user={user}>
            <h1 className="text-2xl font-bold text-text mb-8">My Team</h1>

            {/* Add Member Form */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm max-w-3xl mx-auto mb-6">
                <h3 className="text-lg font-semibold text-text mb-4">Add New Member</h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">Username</label>
                            <input
                                type="text"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">Password</label>
                            <input
                                type="password"
                                value={newMemberPassword}
                                onChange={(e) => setNewMemberPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn-primary w-full md:w-auto"
                    >
                        Add Member
                    </button>
                </form>
            </div>

            {/* Team Members List */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm max-w-3xl mx-auto">
                <h3 className="text-lg font-semibold text-text mb-4">Team Members</h3>
                <ul className="divide-y divide-border">
                    {members.length === 0 && <p className="text-text-muted py-4 text-center">No members yet.</p>}
                    {members.map(m => (
                        <li key={m.id} className="py-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {m.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-text font-medium">{m.username}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteMemberClick(m.id)}
                                className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-medium"
                            >
                                Request Deletion
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Deletion Request Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setMemberToDelete(null);
                }}
                onConfirm={confirmDeleteMember}
                title="Request Member Deletion"
                message="This will submit a deletion request to the GROUP_HEAD for approval. The member will not be deleted immediately."
                confirmText="Submit Request"
                isDestructive={true}
            />

            {/* Toast Notifications */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </Layout>
    );
};

export default TeamMembers;
