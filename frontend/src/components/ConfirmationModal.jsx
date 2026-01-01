import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border bg-background-light">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-text">
                        {isDestructive && <AlertTriangle className="text-red-500" size={20} />}
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-text-secondary leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 bg-background-light border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200 shadow-red-500/20'
                                : 'bg-primary hover:bg-primary-dark focus:ring-primary/20 shadow-primary/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
