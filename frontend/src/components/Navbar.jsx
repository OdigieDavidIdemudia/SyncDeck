import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Users, Shield, Settings, Trophy } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;
    const linkClass = (path) => `flex items-center gap-2 text-sm font-medium transition-colors ${isActive(path) ? 'text-primary' : 'text-text-muted hover:text-primary'}`;

    return (
        <nav className="h-16 bg-surface border-b border-border px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-text">GT SyncDeck</span>
                </div>

                <div className="flex items-center gap-6 ml-4">
                    <Link to="/dashboard" className={linkClass('/dashboard')}>
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>

                    <Link to="/achievements" className={linkClass('/achievements')}>
                        <Trophy size={18} />
                        Achievements
                    </Link>

                    {user.role === 'unit_head' && (
                        <Link to="/team-members" className={linkClass('/team-members')}>
                            <Users size={18} />
                            My Team
                        </Link>
                    )}

                    {user.role === 'group_head' && (
                        <Link to="/teams" className={linkClass('/teams')}>
                            <Users size={18} />
                            Teams
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-text-muted bg-subsurface px-3 py-1.5 rounded-full border border-border">
                    <Shield size={14} className="text-primary" />
                    <span className="font-medium text-text">{user.username}</span>
                    <span className="text-xs opacity-70">
                        ({user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})
                    </span>
                </div>

                <Link
                    to="/settings"
                    className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
                >
                    <Settings size={18} />
                    Settings
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-red-500 transition-colors"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
