import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../config';

const TeamMembers = () => {
    const [members, setMembers] = useState([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [user, setUser] = useState(null);

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
            // Unit Head creating a user. Backend handles team assignment automatically for Unit Head.
            await axios.post(`${API_BASE_URL}/users/`, {
                username: newMemberName,
                password: newMemberPassword,
                role: 'member' // Enforced by backend anyway
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
        } catch (err) {
            console.error(err);
            alert('Failed to add member');
        }
    };

    const handleDeleteMember = async (userId) => {
        if (!confirm('Are you sure?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(members.filter(m => m.id !== userId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete member');
        }
    };

    if (!user) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

    return (
        <Layout user={user}>
            <h1 className="text-2xl font-bold text-text mb-8">My Team</h1>

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
                        </li>
                    ))}
                </ul>
            </div>
        </Layout>
    );
};

export default TeamMembers;
