import { CheckCircle2, Clock, ListTodo } from 'lucide-react';

const StatsCards = ({ data }) => {
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                <div>
                    <p className="text-sm font-medium text-text-muted mb-1">Total Tasks</p>
                    <h3 className="text-3xl font-bold text-text tracking-tight">{data.total_tasks}</h3>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <ListTodo className="text-blue-600" size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                <div>
                    <p className="text-sm font-medium text-text-muted mb-1">Completed</p>
                    <h3 className="text-3xl font-bold text-text tracking-tight">{data.completed_tasks}</h3>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <CheckCircle2 className="text-emerald-600" size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                <div>
                    <p className="text-sm font-medium text-text-muted mb-1">Pending</p>
                    <h3 className="text-3xl font-bold text-text tracking-tight">{data.pending_tasks}</h3>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <Clock className="text-amber-600" size={24} />
                </div>
            </div>
        </div>
    );
};

export default StatsCards;
