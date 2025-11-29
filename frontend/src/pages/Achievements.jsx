import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import Layout from '../components/Layout';

const Achievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [user, setUser] = useState(null);
    const [period, setPeriod] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const userRes = await axios.get('http://127.0.0.1:8000/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userRes.data);
                fetchAchievements(userRes.data.id, period, startDate, endDate);
            } catch (err) {
                console.error(err);
                navigate('/');
            }
        };

        fetchData();
    }, [navigate]);

    const fetchAchievements = async (userId, selectedPeriod, start, end) => {
        const token = localStorage.getItem('token');
        try {
            let url = `http://127.0.0.1:8000/achievements/${userId}?period=${selectedPeriod}`;
            if (selectedPeriod === 'custom' && start && end) {
                url += `&start_date=${start}&end_date=${end}`;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAchievements(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) {
            if (period !== 'custom' || (startDate && endDate)) {
                fetchAchievements(user.id, period, startDate, endDate);
            }
        }
    }, [period, startDate, endDate, user]);

    const handleExport = async (format) => {
        const token = localStorage.getItem('token');
        try {
            let url = `http://127.0.0.1:8000/achievements/${user.id}/export?format=${format}&period=${period}`;
            if (period === 'custom' && startDate && endDate) {
                url += `&start_date=${startDate}&end_date=${endDate}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', `achievements_${user.username}_${period}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Export failed');
        }
    };

    if (!user) return <div className="container">Loading...</div>;

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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-text">Achievements</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-subsurface transition-all shadow-sm text-sm font-medium text-text"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-subsurface transition-all shadow-sm text-sm font-medium text-text"
                    >
                        <FileText size={16} />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-8">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Time Period</label>
                        <select
                            className="input w-40 transition-all duration-200 ease-in-out"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {period === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-subsurface border-b border-border">
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Task</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Criticality</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Completed At</th>
                                <th className="py-4 px-6 text-sm font-semibold text-text-muted uppercase tracking-wider">Assigner</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {achievements.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-text-muted">No completed tasks found for this period.</td>
                                </tr>
                            ) : (
                                achievements.map(task => (
                                    <tr key={task.id} className="hover:bg-subsurface/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-text">{task.title}</div>
                                            <div className="text-xs text-text-muted truncate max-w-xs">{task.description}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCriticalityColor(task.criticality)}`}>
                                                {task.criticality ? task.criticality.toUpperCase() : 'MEDIUM'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text-muted">
                                            {new Date(task.completed_at).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-text">
                                            {task.assigner ? task.assigner.username : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Achievements;
