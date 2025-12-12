import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity,
    MessageSquare,
    AlertCircle,
    FileText,
    RefreshCw,
    BarChart2,
    CheckCircle,
    Download
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const ActivityTimeline = ({ taskId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true;

        const fetchTimeline = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/timeline`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: abortController.signal
                });
                if (!isMounted) return;
                setActivities(response.data);
            } catch (error) {
                if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                    return;
                }
                console.error('Error fetching timeline:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTimeline();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [taskId]);

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

    const handleExport = () => {
        if (!activities.length) return;

        const headers = ['Date', 'User', 'Action', 'Description'];
        const csvContent = [
            headers.join(','),
            ...activities.map(activity => {
                const date = new Date(activity.created_at).toLocaleString().replace(/,/g, '');
                const user = activity.user?.username || 'System';
                const action = activity.activity_type;
                const description = activity.description.replace(/,/g, ';').replace(/\n/g, ' ');
                return [date, user, action, description].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `task_audit_${taskId}_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text">Activity Timeline</h3>
                <button
                    onClick={handleExport}
                    disabled={activities.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={14} />
                    Export Audit
                </button>
            </div>

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
                                <p className="text-sm text-text font-medium">{activity.description.replace(/_/g, ' ')}</p>
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
