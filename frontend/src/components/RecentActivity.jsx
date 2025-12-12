import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const RecentActivity = ({ tasks }) => {
    const navigate = useNavigate();
    // Sort by created_at desc and take top 5, excluding waiting_on_external
    const recentTasks = [...tasks]
        .filter(t => t.status !== 'waiting_on_external')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const getStatusColor = (status) => {
        switch (status) {
            case 'todo': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'in_progress': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-text mb-4">Recent Activity</h3>
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {recentTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted py-8">
                        <p className="text-sm">No recent activity.</p>
                    </div>
                ) : (
                    recentTasks.map(task => (
                        <div key={task.id} className="pb-4 border-b border-border last:border-0 last:pb-0 group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-text text-sm line-clamp-1 group-hover:text-primary transition-colors">{task.title}</span>
                                <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                                    {new Date(task.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                    {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <button
                                    className="text-primary hover:text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors"
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                >
                                    View <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
