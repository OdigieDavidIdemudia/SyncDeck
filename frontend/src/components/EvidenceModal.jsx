import { X, Download, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';

const EvidenceModal = ({ isOpen, onClose, fileUrl, fileName }) => {
    if (!isOpen || !fileUrl) return null;

    const fullUrl = `${API_BASE_URL}${fileUrl}`;
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-white">
                    <h3 className="font-semibold text-lg text-text truncate max-w-md" title={fileName}>
                        {fileName || 'Evidence Preview'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={fullUrl}
                            download
                            className="p-2 hover:bg-subsurface rounded-lg text-text-muted hover:text-primary transition-colors"
                            title="Download"
                        >
                            <Download size={20} />
                        </a>
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-subsurface rounded-lg text-text-muted hover:text-primary transition-colors"
                            title="Open in New Tab"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-50 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-subsurface overflow-auto flex items-center justify-center p-4 relative">
                    {isImage ? (
                        <img
                            src={fullUrl}
                            alt="Evidence"
                            className="max-w-full max-h-full object-contain shadow-md rounded"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={fullUrl}
                            className="w-full h-full rounded shadow-md border border-border"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-border">
                            <div className="bg-primary/10 p-4 rounded-full inline-block mb-4">
                                <ExternalLink size={32} className="text-primary" />
                            </div>
                            <h4 className="text-lg font-medium text-text mb-2">Preview not available</h4>
                            <p className="text-text-muted mb-6">This file type cannot be previewed directly.</p>
                            <a
                                href={fullUrl}
                                download
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <Download size={18} />
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvidenceModal;
