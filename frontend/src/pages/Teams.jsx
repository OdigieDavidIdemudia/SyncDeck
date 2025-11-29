import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const fetchData = async () => {
            try {
                const userRes = await axios.get('http://127.0.0.1:8000/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);

                const teamsRes = await axios.get('http://127.0.0.1:8000/teams/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeams(teamsRes.data);

                const usersRes = await axios.get('http://127.0.0.1:8000/users/', {
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
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://127.0.0.1:8000/teams/', { name: newTeamName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewTeamName('');
            // Refresh teams
            const res = await axios.get('http://127.0.0.1:8000/teams/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateMember = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://127.0.0.1:8000/users/', {
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
            const res = await axios.get('http://127.0.0.1:8000/users/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.filter(u => u.role !== 'group_head'));
        } catch (err) {
            console.error(err);
            alert('Failed to create member');
        }
    };

    const handleAssignUser = async (userId, teamId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://127.0.0.1:8000/users/${userId}`, { team_id: teamId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh users
            const res = await axios.get('http://127.0.0.1:8000/users/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePromoteToUnitHead = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://127.0.0.1:8000/users/${userId}`, { role: 'unit_head' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh users
            const res = await axios.get('http://127.0.0.1:8000/users/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.filter(u => u.role !== 'group_head'));
        } catch (err) {
            console.error(err);
            alert('Failed to promote user');
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
                            <li key={team.id} className="py-3 text-text">
                                {team.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-text mb-4">Assign Members</h3>
                    <ul className="divide-y divide-border">
                        {users.map(u => (
                            <li key={u.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <span className="text-text font-medium">{u.username} <span className="text-text-muted font-normal text-sm">({u.role})</span></span>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={u.team_id || ''}
                                        onChange={(e) => handleAssignUser(u.id, e.target.value)}
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
        </Layout>
    );
};

export default Teams;
