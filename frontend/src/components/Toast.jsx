import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <XCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />
    };

    const styles = {
        success: 'bg-white border-green-200 text-green-800',
        error: 'bg-white border-red-200 text-red-800',
        info: 'bg-white border-blue-200 text-blue-800',
        warning: 'bg-white border-amber-200 text-amber-800'
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transform transition-all duration-300 ${styles[type]} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
            {icons[type]}
            <p className="font-medium text-sm">{message}</p>
            <button onClick={() => setIsVisible(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
