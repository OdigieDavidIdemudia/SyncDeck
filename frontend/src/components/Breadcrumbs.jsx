import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
        return null;
    }

    return (
        <nav className="flex items-center text-sm text-text-muted mb-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home size={14} />
                <span>Home</span>
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;

                // Format the segment (e.g., "team-members" -> "Team Members")
                const formattedValue = value
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                // If it's an ID (numeric or long string), maybe show "Details" or truncate?
                // For now, let's just show it, or if it's numeric, assume it's an ID.
                const displayName = /^\d+$/.test(value) ? `Task #${value}` : formattedValue;

                return (
                    <div key={to} className="flex items-center">
                        <ChevronRight size={14} className="mx-2 text-border" />
                        {isLast ? (
                            <span className="font-medium text-text">{displayName}</span>
                        ) : (
                            <Link to={to} className="hover:text-primary transition-colors">
                                {displayName}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
