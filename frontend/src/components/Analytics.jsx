import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_BASE_URL } from '../config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true;

        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_BASE_URL}/analytics/`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: abortController.signal
                });
                if (!isMounted) return;
                setData(res.data);
                setLoading(false);
            } catch (err) {
                if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                    return;
                }
                console.error(err);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchData();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, []);

    if (loading) return <div>Loading Analytics...</div>;
    if (!data) return null;

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2>Analytics Overview</h2>

            {/* Key Metrics */}
            <div className="dashboard-metrics">
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Tasks</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{data.total_tasks}</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Completed</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{data.completed_tasks}</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pending</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>{data.pending_tasks}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="dashboard-charts">
                <div className="card" style={{ height: '400px' }}>
                    <h3>Tasks by Team</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.team_data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="tasks" fill="var(--primary)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ height: '400px' }}>
                    <h3>Task Status</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.status_data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.status_data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
