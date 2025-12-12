import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ChartsSection = ({ data }) => {
    if (!data) return null;

    const formattedStatusData = data.status_data
        .filter(item => item.name !== 'waiting_on_external')
        .map(item => ({
            ...item,
            name: item.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm h-[400px] flex flex-col hover:shadow-md transition-shadow duration-200 xl:col-span-3">
                <h3 className="text-lg font-semibold text-text mb-6">Tasks by Team</h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.team_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="tasks" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ChartsSection;
