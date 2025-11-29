import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Target, Zap, Shield } from 'lucide-react';

const MemberAchievements = ({ userId }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [userId]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://127.0.0.1:8000/users/${userId}/achievement-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching achievement stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-24 bg-subsurface rounded-xl"></div>;
    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Target size={20} className="text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-text">{stats.on_time_completion_rate}%</span>
                <span className="text-xs text-text-muted">On-time Rate</span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <Trophy size={20} className="text-green-600" />
                </div>
                <span className="text-2xl font-bold text-text">{stats.total_completed_tasks}</span>
                <span className="text-xs text-text-muted">Tasks Completed</span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                    <Zap size={20} className="text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-text">{stats.critical_tasks_completed}</span>
                <span className="text-xs text-text-muted">Critical Tasks</span>
            </div>

            <div className="bg-surface border border-border p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <Shield size={20} className="text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-text">{stats.current_no_blocker_streak}</span>
                <span className="text-xs text-text-muted">Day Streak</span>
            </div>
        </div>
    );
};

export default MemberAchievements;
