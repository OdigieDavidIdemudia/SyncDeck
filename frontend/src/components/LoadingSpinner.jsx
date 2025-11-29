import logo from '../assets/logo.png';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-16 h-16 text-lg',
        lg: 'w-24 h-24 text-xl',
        xl: 'w-32 h-32 text-2xl'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-xl border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-xl border-4 border-primary border-t-transparent animate-spin"></div>

                {/* Inner Logo */}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain animate-pulse rounded-lg" />
                </div>
            </div>

            {message && (
                <p className="text-text-muted font-medium tracking-wide animate-pulse">{message}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;
