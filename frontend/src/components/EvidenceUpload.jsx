import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Check, X, ExternalLink, Eye } from 'lucide-react';
import { API_BASE_URL } from '../config';
import EvidenceModal from './EvidenceModal';

const EvidenceUpload = ({ taskId, currentEvidenceUrl, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/tasks/${taskId}/evidence`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setFile(null);
            if (onUploadComplete) {
                onUploadComplete(response.data.url);
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Evidence</h3>

            {currentEvidenceUrl && (
                <div className="flex flex-col gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <FileText size={20} className="text-green-600" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-green-800 truncate">Evidence Uploaded</p>
                            <button
                                onClick={() => setShowPreview(true)}
                                className="text-xs text-green-600 hover:underline flex items-center gap-1 font-medium"
                            >
                                <Eye size={12} /> View File
                            </button>
                        </div>
                        <div className="bg-green-200 p-1 rounded-full">
                            <Check size={14} className="text-green-700" />
                        </div>
                    </div>

                </div>
            )}

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-subsurface/50 transition-colors">
                <input
                    type="file"
                    id={`evidence-upload-${taskId}`}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                {!file ? (
                    <label
                        htmlFor={`evidence-upload-${taskId}`}
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Upload size={24} className="text-primary" />
                        </div>
                        <p className="text-sm font-medium text-text">Click to upload evidence</p>
                        <p className="text-xs text-text-muted">PDF, DOC, JPG, PNG (Max 10MB)</p>
                    </label>
                ) : (
                    <div className="flex items-center justify-between bg-surface border border-border p-3 rounded-lg">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileText size={20} className="text-primary" />
                            <span className="text-sm text-text truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <button
                            onClick={() => setFile(null)}
                            className="text-text-muted hover:text-red-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>

            {file && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full btn-primary py-2 flex items-center justify-center gap-2"
                >
                    {uploading ? 'Uploading...' : 'Upload Evidence'}
                </button>
            )}

            {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <EvidenceModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                fileUrl={currentEvidenceUrl}
                fileName="Evidence Document"
            />
        </div>
    );
};

export default EvidenceUpload;
