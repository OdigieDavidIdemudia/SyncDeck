import { useState, useEffect } from 'react';

const Footer = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <footer className="bg-[#0f172a] text-white py-3 border-t border-gray-800 mt-auto">
            <div className="container mx-auto px-6 max-w-screen-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Left side - Clock */}
                    <div className="flex items-center gap-6">
                        {/* Digital Clock */}
                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="text-lg font-bold text-primary tabular-nums">
                                {formatTime(currentTime)}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 text-center">
                                {formatDate(currentTime)}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Copyright */}
                    <p className="text-gray-500 text-xs">
                        © {new Date().getFullYear()} SyncDeck Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

