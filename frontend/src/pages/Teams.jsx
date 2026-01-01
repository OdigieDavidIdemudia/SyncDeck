import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../config';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [user, setUser] = useState(null);

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                const teamsRes = await axios.get(`${API_BASE_URL}/teams/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeams(teamsRes.data);

                const usersRes = await axios.get(`${API_BASE_URL}/users/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filter out group_head users from assignment list
                setUsers(usersRes.data.filter(u => u.role !== 'group_head'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) {
            setToast({ show: true, message: 'Team name cannot be empty', type: 'error' });
            return;
        }
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_BASE_URL}/teams/`, { name: newTeamName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewTeamName('');
            // Refresh teams
            const res = await axios.get(`${API_BASE_URL}/teams/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(res.data);
            setToast({ show: true, message: 'Team created successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Failed to create team';
            setToast({ show: true, message: errorMsg, type: 'error' });
        }
    };

    const handleCreateMember = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_BASE_URL}/users/`, {
                username: newMemberName,
                password: newMemberPassword,
                role: 'member',
                team_id: selectedTeamId || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewMemberName('');
            setNewMemberPassword('');
            // Refresh users
            const res = await axios.get(`${API_BASE_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.filter(u => u.role !== 'group_head'));
            setToast({ show: true, message: 'Member created successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Failed to create member';
            setToast({ show: true, message: errorMsg, type: 'error' });
        }
    };

    const handleAssignUser = async (userId, teamId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_BASE_URL}/users/${userId}`, { team_id: teamId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh users
            const res = await axios.get(`${API_BASE_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.filter(u => u.role !== 'group_head'));
            setToast({ show: true, message: 'User assigned to team', type: 'success' });
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || `Failed to assign user: ${err.message}`;
            setToast({ show: true, message: errorMsg, type: 'error' });
        }
    };

    const handlePromoteToUnitHead = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_BASE_URL}/users/${userId}`, { role: 'unit_head' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh users
            const res = await axios.get(`${API_BASE_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.filter(u => u.role !== 'group_head'));
            setToast({ show: true, message: 'User promoted successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Failed to promote user';
            setToast({ show: true, message: errorMsg, type: 'error' });
        }
    };

    const handleDeleteTeamClick = (teamId) => {
        setTeamToDelete(teamId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteTeam = async () => {
        if (!teamToDelete) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE_URL}/teams/${teamToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh teams
            const res = await axios.get(`${API_BASE_URL}/teams/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(res.data);
            setDeleteModalOpen(false);
            setTeamToDelete(null);
            setToast({ show: true, message: 'Team deleted successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to delete team', type: 'error' });
            setDeleteModalOpen(false);
        }
    };

    if (!user) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

    return (
        <Layout user={user}>
            <h1 className="text-2xl font-bold text-text mb-8">Team Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-text mb-4">Create New Team</h3>
                    <form onSubmit={handleCreateTeam} className="flex gap-4">
                        <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Team Name"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                        />
                        <button type="submit" className="btn-primary whitespace-nowrap">Create</button>
                    </form>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-text mb-4">Create New Member</h3>
                    <form onSubmit={handleCreateMember} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Username"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                            />
                            <input
                                type="password"
                                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Password"
                                value={newMemberPassword}
                                onChange={(e) => setNewMemberPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            >
                                <option value="">Select Team (Optional)</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button type="submit" className="btn-primary whitespace-nowrap">Create Member</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-text mb-4">Teams</h3>
                    <ul className="divide-y divide-border">
                        {teams.map(team => (
                            <li key={team.id} className="py-3 flex justify-between items-center text-text">
                                <span>{team.name}</span>
                                <button
                                    onClick={() => handleDeleteTeamClick(team.id)}
                                    className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-text mb-4">Assign Members</h3>
                    <ul className="divide-y divide-border">
                        {users.map(u => (
                            <li key={u.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <span className="text-text font-medium">{u.username} <span className="text-text-muted font-normal text-sm">({u.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})</span></span>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={u.team_id || ''}
                                        onChange={(e) => handleAssignUser(u.id, e.target.value === "" ? null : parseInt(e.target.value))}
                                        className="px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    >
                                        <option value="">No Team</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {u.role === 'member' && u.team_id && (
                                        <button
                                            className="text-xs px-2 py-1 bg-white border border-primary text-primary rounded hover:bg-orange-50 transition-colors"
                                            onClick={() => handlePromoteToUnitHead(u.id)}
                                        >
                                            Promote
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteTeam}
                title="Delete Team"
                message="Are you sure you want to delete this team? This action cannot be undone."
                confirmText="Delete Team"
                isDestructive={true}
            />
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
        </Layout>
    );
};

export default Teams;
