import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity,
    MessageSquare,
    AlertCircle,
    FileText,
    RefreshCw,
    BarChart2,
    CheckCircle
} from 'lucide-react';

const ActivityTimeline = ({ taskId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimeline();
    }, [taskId]);

    const fetchTimeline = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://127.0.0.1:8000/tasks/${taskId}/timeline`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActivities(response.data);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'status_change': return <RefreshCw size={16} className="text-blue-500" />;
            case 'progress_update': return <BarChart2 size={16} className="text-green-500" />;
            case 'comment_added': return <MessageSquare size={16} className="text-gray-500" />;
            case 'help_requested': return <AlertCircle size={16} className="text-red-500" />;
            case 'evidence_uploaded': return <FileText size={16} className="text-purple-500" />;
            default: return <Activity size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Activity Timeline</h3>

            <div className="relative border-l-2 border-border ml-3 space-y-6 pl-6 py-2">
                {loading ? (
                    <p className="text-text-muted text-sm">Loading timeline...</p>
                ) : activities.length === 0 ? (
                    <p className="text-text-muted text-sm italic">No activity recorded yet.</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="relative">
                            <div className="absolute -left-[33px] bg-surface border border-border p-1.5 rounded-full">
                                {getActivityIcon(activity.activity_type)}
                            </div>
                            <div>
                                <p className="text-sm text-text font-medium">{activity.description}</p>
                                <p className="text-xs text-text-muted">
                                    {new Date(activity.created_at).toLocaleString()} • {activity.user?.username || 'System'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityTimeline;
