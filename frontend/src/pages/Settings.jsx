import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { QRCodeSVG } from 'qrcode.react';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // MFA State
    const [mfaSecret, setMfaSecret] = useState('');
    const [mfaUri, setMfaUri] = useState('');
    const [mfaCode, setMfaCode] = useState('');

    // User state
    const [currentUser, setCurrentUser] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'member',
        team_id: ''
    });

    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://127.0.0.1:8000/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUser(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                username: currentUser.username,
                email: currentUser.email || '',
                password: '',
                confirmPassword: ''
            });
            if (currentUser.role === 'group_head') {
                fetchUsersAndTeams();
            }
        }
    }, [currentUser]);

    const fetchUsersAndTeams = async () => {
        const token = localStorage.getItem('token');
        try {
            const [usersRes, teamsRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/users/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/teams/', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUsers(usersRes.data);
            setTeams(teamsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSetupMFA = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://127.0.0.1:8000/auth/mfa/setup', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMfaSecret(res.data.secret);
            setMfaUri(res.data.uri);
        } catch (err) {
            console.error(err);
            alert('Failed to setup MFA');
        }
    };

    const handleEnableMFA = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://127.0.0.1:8000/auth/mfa/enable',
                new URLSearchParams({ secret: mfaSecret, code: mfaCode }),
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            alert('MFA Enabled successfully!');
            setMfaSecret('');
            setMfaCode('');
        } catch (err) {
            console.error(err);
            alert('Invalid Code');
        }
    };

    const handleProfileUpdate = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://127.0.0.1:8000/users/${currentUser.id}`,
                { username: formData.username, email: formData.email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Profile updated successfully');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            alert("New passwords don't match");
            return;
        }
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://127.0.0.1:8000/users/${currentUser.id}`,
                { password: passwordData.newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to update password');
        }
    };

    const handleCreateUser = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://127.0.0.1:8000/users/',
                { ...newUser, team_id: newUser.team_id || null },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('User created successfully');
            setNewUser({ username: '', password: '', role: 'member', team_id: '' });
            fetchUsersAndTeams();
        } catch (err) {
            console.error(err);
            alert('Failed to create user: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleEditUser = async () => {
        if (!editingUser) return;
        const token = localStorage.getItem('token');
        try {
            const updateData = {
                username: editingUser.username,
                role: editingUser.role,
                team_id: editingUser.team_id || null
            };
            await axios.put(`http://127.0.0.1:8000/users/${editingUser.id}`,
                updateData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('User updated successfully');
            setEditingUser(null);
            fetchUsersAndTeams();
        } catch (err) {
            console.error(err);
            alert('Failed to update user: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://127.0.0.1:8000/users/${deletingUser.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('User deleted successfully');
            setDeletingUser(null);
            fetchUsersAndTeams();
        } catch (err) {
            console.error(err);
            alert('Failed to delete user: ' + (err.response?.data?.detail || err.message));
        }
    };

    const tabs = [
        { id: 'profile', label: 'My details' },
        { id: 'security', label: 'Password & Security' },
        { id: 'notifications', label: 'Notifications' },
        ...(currentUser?.role === 'group_head' ? [{ id: 'users', label: 'User Management' }] : [])
    ];

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-subsurface">
            <LoadingSpinner size="xl" message="Loading your settings..." />
        </div>
    );

    return (
        <Layout user={currentUser}>
            {/* Header with gradient background */}
            <div className="mb-8 -mx-8 -mt-8 px-8 pt-8 pb-6 bg-surface border-b border-border">
                <h1 className="text-3xl font-bold text-text mb-2">Settings</h1>
                <p className="text-text-muted">Manage your account settings and preferences.</p>
            </div>

            {/* Tabs with enhanced styling */}
            <div className="border-b border-border mb-8 bg-surface rounded-t-xl -mx-8 px-8 shadow-sm">
                <nav className="flex gap-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 pt-2 text-sm font-semibold transition-all relative whitespace-nowrap ${activeTab === tab.id
                                ? 'text-primary'
                                : 'text-text-muted hover:text-text'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-lg"></div>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl">
                {activeTab === 'profile' && (
                    <div className="space-y-8">
                        <section>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-text">Personal Information</h3>
                                    <p className="text-sm text-text-muted mt-1">Update your personal details.</p>
                                </div>
                                <button className="btn-primary shadow-lg shadow-primary/20" onClick={handleProfileUpdate}>
                                    Save changes
                                </button>
                            </div>

                            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Username</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Role</label>
                                        <div className="px-4 py-3 border border-border rounded-lg bg-subsurface text-text capitalize font-medium">
                                            {currentUser.role.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Team ID</label>
                                        <div className="px-4 py-3 border border-border rounded-lg bg-subsurface text-text-muted font-medium">
                                            {currentUser.team_id || 'Not assigned'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-text">Change Password</h3>
                                <p className="text-sm text-text-muted mt-1">Update your password associated with this account.</p>
                            </div>
                            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">New Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                            value={passwordData.confirmNewPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                        />
                                    </div>
                                    <button className="btn-primary w-full shadow-lg shadow-primary/20" onClick={handlePasswordChange}>
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-text">Multi-Factor Authentication</h3>
                                <p className="text-sm text-text-muted mt-1">Add an extra layer of security to your account.</p>
                            </div>

                            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                                {!mfaSecret ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-text">Two-step verification</h4>
                                            <p className="text-sm text-text-muted mt-1">Secure your account with TOTP (Google Authenticator, Authy).</p>
                                        </div>
                                        <button className="btn-primary shadow-lg shadow-primary/20" onClick={handleSetupMFA}>
                                            Setup MFA
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                            <div className="flex-1">
                                                <p className="font-medium">Finish setting up MFA</p>
                                                <p className="text-sm mt-1 opacity-90">Scan the QR code with your authenticator app and enter the code below.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                            <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                                                <QRCodeSVG value={mfaUri} size={160} />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Secret Key</label>
                                                    <code className="block bg-subsurface px-3 py-2 rounded border border-border text-sm font-mono break-all select-all text-text">
                                                        {mfaSecret}
                                                    </code>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-text mb-2">Verification Code</label>
                                                    <div className="flex gap-3">
                                                        <input
                                                            type="text"
                                                            className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-32 text-center tracking-widest bg-subsurface hover:bg-surface"
                                                            value={mfaCode}
                                                            onChange={(e) => setMfaCode(e.target.value)}
                                                            placeholder="000000"
                                                            maxLength={6}
                                                        />
                                                        <button className="btn-primary shadow-lg shadow-primary/20" onClick={handleEnableMFA}>
                                                            Enable MFA
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )
                }

                {
                    activeTab === 'users' && currentUser.role === 'group_head' && (
                        <div className="space-y-8">
                            <section>
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-text">Add New User</h3>
                                    <p className="text-sm text-text-muted mt-1">Create a new user and assign them a role.</p>
                                </div>
                                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-text mb-2">Username</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                                value={newUser.username}
                                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text mb-2">Password</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text mb-2">Role</label>
                                            <select
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-surface"
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            >
                                                <option value="member">Member</option>
                                                <option value="unit_head">Unit Head</option>
                                                <option value="backup_unit_head">Backup Unit Head</option>
                                                <option value="group_head">Group Head</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text mb-2">Team (Optional)</label>
                                            <select
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-surface"
                                                value={newUser.team_id}
                                                onChange={(e) => setNewUser({ ...newUser, team_id: e.target.value })}
                                            >
                                                <option value="">No Team</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button className="btn-primary w-full md:w-auto mt-6 shadow-lg shadow-primary/20" onClick={handleCreateUser}>
                                        Create User
                                    </button>
                                </div>
                            </section>

                            <section>
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-text">Existing Users</h3>
                                    <p className="text-sm text-text-muted mt-1">Manage existing users and their roles.</p>
                                </div>
                                <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-subsurface border-b border-border">
                                                <th className="py-4 px-6 text-sm font-semibold text-text-muted">Username</th>
                                                <th className="py-4 px-6 text-sm font-semibold text-text-muted">Role</th>
                                                <th className="py-4 px-6 text-sm font-semibold text-text-muted">Team</th>
                                                <th className="py-4 px-6 text-sm font-semibold text-text-muted">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-subsurface/50 transition-colors">
                                                    <td className="py-4 px-6 text-sm text-text font-medium">{u.username}</td>
                                                    <td className="py-4 px-6 text-sm text-text-muted capitalize">{u.role.replace('_', ' ')}</td>
                                                    <td className="py-4 px-6 text-sm text-text-muted">{teams.find(t => t.id === u.team_id)?.name || '-'}</td>
                                                    <td className="py-4 px-6 text-sm">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingUser({ ...u })}
                                                                className="px-4 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingUser(u)}
                                                                className="px-4 py-1.5 text-xs font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                                disabled={u.id === currentUser.id}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Edit User Modal */}
                            {editingUser && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                                    <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                                        <h3 className="text-2xl font-bold text-text mb-6">Edit User</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-text mb-2">Username</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-subsurface hover:bg-surface"
                                                    value={editingUser.username}
                                                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-text mb-2">Role</label>
                                                <select
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-surface"
                                                    value={editingUser.role}
                                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="unit_head">Unit Head</option>
                                                    <option value="backup_unit_head">Backup Unit Head</option>
                                                    <option value="group_head">Group Head</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-text mb-2">Team</label>
                                                <select
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-surface"
                                                    value={editingUser.team_id || ''}
                                                    onChange={(e) => setEditingUser({ ...editingUser, team_id: e.target.value })}
                                                >
                                                    <option value="">No Team</option>
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id}>{team.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={handleEditUser}
                                                    className="flex-1 btn-primary shadow-lg shadow-primary/20"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="flex-1 px-6 py-2.5 border border-border rounded-lg hover:bg-subsurface transition-all font-medium text-text"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Delete Confirmation Modal */}
                            {deletingUser && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                                    <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                                        <h3 className="text-2xl font-bold text-text mb-4">Delete User</h3>
                                        <p className="text-text-muted mb-6">
                                            Are you sure you want to delete user <strong className="text-text">{deletingUser.username}</strong>? This action cannot be undone.
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDeleteUser}
                                                className="flex-1 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 hover:shadow-lg transition-all font-medium"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(null)}
                                                className="flex-1 px-6 py-2.5 border border-border rounded-lg hover:bg-subsurface transition-all font-medium text-text"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'notifications' && (
                        <div className="bg-surface border border-border rounded-2xl p-12 text-center shadow-sm">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-text">No notifications yet</h3>
                            <p className="text-text-muted mt-2">We'll let you know when something important happens.</p>
                        </div>
                    )
                }
            </div >
        </Layout >
    );
};

export default Settings;
