import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const WorkloadIndicator = ({ tasks }) => {
    const totalTasks = tasks.length;
    const ongoing = tasks.filter(t => t.status === 'ongoing').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const other = totalTasks - ongoing - completed - blocked;

    const data = [
        { name: 'Ongoing', value: ongoing, color: '#3b82f6' },
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Blocked', value: blocked, color: '#ef4444' },
        { name: 'Other', value: other, color: '#94a3b8' },
    ].filter(item => item.value > 0);

    return (
        <div className="bg-surface border border-border p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-text mb-2">My Workload</h3>
            <div className="flex items-center gap-4">
                <div className="w-20 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={35}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Total Tasks</span>
                        <span className="font-bold text-text">{totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
                        {data.map((entry, index) => (
                            <div
                                key={index}
                                style={{ width: `${(entry.value / totalTasks) * 100}%`, backgroundColor: entry.color }}
                                className="h-full"
                            />
                        ))}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                        {ongoing} ongoing, {blocked} blocked
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkloadIndicator;
