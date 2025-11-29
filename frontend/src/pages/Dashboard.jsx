import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCards from '../components/StatsCards';
import ChartsSection from '../components/ChartsSection';
import RecentActivity from '../components/RecentActivity';
import TaskDetailModal from '../components/TaskDetailModal';
import MemberAchievements from '../components/MemberAchievements';
import WorkloadIndicator from '../components/WorkloadIndicator';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', assignee_id: '', criticality: 'medium', is_internal: false, deadline: '' });
    const [teamMembers, setTeamMembers] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        try {
            const userRes = await axios.get('http://127.0.0.1:8000/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(userRes.data);

            const tasksRes = await axios.get('http://127.0.0.1:8000/tasks/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasksRes.data);

            if (userRes.data.role === 'unit_head' || userRes.data.role === 'backup_unit_head' || userRes.data.role === 'group_head') {
                const usersRes = await axios.get('http://127.0.0.1:8000/users/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.data.role === 'unit_head' || userRes.data.role === 'backup_unit_head') {
                    setTeamMembers(usersRes.data.filter(u => u.team_id === userRes.data.team_id && u.role === 'member'));
                } else if (userRes.data.role === 'group_head') {
                    setTeamMembers(usersRes.data.filter(u => u.id !== userRes.data.id));
                } else {
                    setTeamMembers(usersRes.data);
                }
            }

            if (userRes.data.role === 'group_head') {
                const analyticsRes = await axios.get('http://127.0.0.1:8000/analytics/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAnalyticsData(analyticsRes.data);
            }
        } catch (err) {
            console.error(err);
            navigate('/');
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-subsurface">
            <LoadingSpinner size="lg" message="Loading Dashboard..." />
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'ongoing': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'continuous': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'blocked': return 'bg-red-50 text-red-600 border-red-200';
            case 'waiting_on_external': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'needs_review': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'pending_approval': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'pending_group_head_approval': return 'bg-orange-50 text-orange-700 border-orange-300';
            case 'not_started': return 'bg-gray-100 text-gray-600 border-gray-200';
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
            {/* Header & Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text tracking-tight">Dashboard</h1>
                    <p className="text-text-muted">Overview of your team's performance</p>
                </div>
                <div className="flex items-center gap-3">
                    {(user.role === 'unit_head' || user.role === 'backup_unit_head' || user.role === 'group_head') && (
                        <>
                            <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20" onClick={() => setShowCreateTask(true)}>
                                <Plus size={18} />
                                <span className="hidden sm:inline">Create Task</span>
                                <span className="sm:hidden">Create</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {user.role === 'group_head' && analyticsData && (
                <div className="space-y-8 mb-8">
                    <StatsCards data={analyticsData} />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <ChartsSection data={analyticsData} />
                        </div>
                        <div className="lg:col-span-4 h-full">
                            <RecentActivity tasks={tasks} />
                        </div>
                    </div>
                </div>
            )}

            {/* Member Stats & Workload */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-text mb-4">My Achievements</h2>
                    <MemberAchievements userId={user.id} />
                </div>
                <div>
                    <WorkloadIndicator tasks={tasks} />
                </div>
            </div>

            {showCreateTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-text">Create New Task</h3>
                            <button onClick={() => setShowCreateTask(false)} className="text-text-muted hover:text-text">
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await axios.post('http://127.0.0.1:8000/tasks/', newTask, {
                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                });
                                setShowCreateTask(false);
                                setNewTask({ title: '', description: '', assignee_id: '', criticality: 'medium', is_internal: false, deadline: '' });
                                fetchData();
                            } catch (err) {
                                console.error(err);
                                alert('Failed to create task');
                            }
                        }}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
                                    <input type="text" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Task title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                                    <textarea className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px]" placeholder="Task description..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1">Assignee</label>
                                        <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={newTask.assignee_id} onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })} required>
                                            <option value="">Select Assignee</option>
                                            {teamMembers.map(m => (
                                                <option key={m.id} value={m.id}>{m.username} ({m.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1">Criticality</label>
                                        <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={newTask.criticality} onChange={e => setNewTask({ ...newTask, criticality: e.target.value })}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Deadline (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={newTask.deadline || ''}
                                        onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                    />
                                </div>

                                {(user.role === 'unit_head' || user.role === 'backup_unit_head') && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <input type="checkbox" id="internal" className="w-4 h-4 text-red-600 rounded focus:ring-red-500" checked={newTask.is_internal} onChange={e => setNewTask({ ...newTask, is_internal: e.target.checked })} />
                                        <label htmlFor="internal" className="text-sm font-medium text-red-700">Internal Task (Hidden from Group Head)</label>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-border flex justify-end gap-3 bg-subsurface">
                                <button type="button" className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text bg-white border border-border rounded-md hover:bg-gray-50 transition-colors" onClick={() => setShowCreateTask(false)}>Cancel</button>
                                <button type="submit" className="btn-primary text-sm">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-text">All Tasks</h2>
                    <div className="flex gap-2">
                        <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <Search size={20} />
                        </button>
                        <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-subsurface border-b border-border">
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Title</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Progress</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Summary</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Criticality</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Assignee</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Deadline</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Created</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-text-muted">No tasks found.</td>
                                </tr>
                            ) : (
                                tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-subsurface/50 transition-colors group">
                                        <td className="py-4 px-6 text-sm font-medium text-text group-hover:text-primary transition-colors">{task.title}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all"
                                                            style={{ width: `${task.progress_percentage || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-medium text-text-muted min-w-[3rem] text-right">
                                                    {task.progress_percentage || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="max-w-xs">
                                                <p className="text-xs text-text-muted truncate">
                                                    {task.updates && task.updates.length > 0
                                                        ? task.updates[task.updates.length - 1].summary_text || 'No summary provided'
                                                        : 'No updates yet'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCriticalityColor(task.criticality)}`}>
                                                {task.criticality ? task.criticality.toUpperCase() : 'MEDIUM'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {task.assignee ? task.assignee.username.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="text-sm text-text">{task.assignee ? task.assignee.username : 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm">
                                            {task.deadline ? (
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const deadline = new Date(task.deadline);
                                                        const now = new Date();
                                                        const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                                                        const isOverdue = daysUntil < 0;
                                                        const isApproaching = daysUntil >= 0 && daysUntil <= 3;

                                                        return (
                                                            <>
                                                                <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' :
                                                                    isApproaching ? 'text-amber-600 font-medium' :
                                                                        'text-text-muted'
                                                                    }`}>
                                                                    {deadline.toLocaleDateString()}
                                                                </span>
                                                                {isOverdue && (
                                                                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200 font-medium">
                                                                        Overdue
                                                                    </span>
                                                                )}
                                                                {isApproaching && !isOverdue && (
                                                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-200 font-medium">
                                                                        {daysUntil}d left
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-text-muted">No deadline</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text-muted">
                                            {new Date(task.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                className="text-sm font-medium text-primary hover:text-orange-700 transition-colors"
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowTaskDetail(true);
                                                }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TaskDetailModal
                task={selectedTask}
                isOpen={showTaskDetail}
                onClose={() => {
                    setShowTaskDetail(false);
                    setSelectedTask(null);
                }}
                onUpdate={fetchData}
                user={user}
                teamMembers={teamMembers}
            />
        </Layout>
    );
};

export default Dashboard;
