import { X, Calendar, User, AlertCircle, Clock, Edit2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskComments from './TaskComments';
import ActivityTimeline from './ActivityTimeline';
import EvidenceUpload from './EvidenceUpload';

const TaskDetailModal = ({ task, isOpen, onClose, onUpdate, user, teamMembers }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState({
        title: '',
        description: '',
        status: 'ongoing',
        criticality: 'medium',
        progress_percentage: 0,
        assigned_to: null,
        deadline: '',
        summary_text: ''
    });
    const [activeTab, setActiveTab] = useState('details');
    const [showHelpRequest, setShowHelpRequest] = useState(false);
    const [helpReason, setHelpReason] = useState('');

    useEffect(() => {
        if (task) {
            setEditedTask({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'ongoing',
                criticality: task.criticality || 'medium',
                progress_percentage: task.progress_percentage || 0,
                assigned_to: task.assigned_to || null,
                deadline: task.deadline || '',
                summary_text: ''
            });
        }
    }, [task, isOpen]);

    if (!isOpen || !task) return null;

    // Permission checks
    const isAssigner = user.id === task.assigner_id;
    const isAssignee = user.id === task.assignee_id;
    // Group Heads can always edit. Otherwise, only the assigner can edit metadata.
    const canEditMetadata = user.role === 'group_head' || isAssigner;


    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://127.0.0.1:8000/tasks/${task.id}/update`,
                {
                    progress_percentage: editedTask.progress_percentage,
                    status: editedTask.status,
                    summary_text: editedTask.summary_text
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (canEditMetadata) {
                await axios.put(
                    `http://127.0.0.1:8000/tasks/${task.id}`,
                    {
                        title: editedTask.title,
                        description: editedTask.description,
                        criticality: editedTask.criticality,
                        deadline: editedTask.deadline,
                        assigned_to: editedTask.assigned_to,
                        status: editedTask.status,
                        progress_percentage: editedTask.progress_percentage
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            onUpdate();
            setIsEditing(false);
            onClose();
        } catch (err) {
            console.error('Error updating task:', err);
            alert(err.response?.data?.detail || 'Failed to update task');
        }
    };

    const handleProgressChange = (newProgress) => {
        let newStatus = editedTask.status;

        if (newProgress === 0) {
            newStatus = 'not_started';
        } else if (newProgress > 0 && newProgress < 100) {
            newStatus = 'ongoing';
        } else if (newProgress === 100) {
            newStatus = 'pending_approval';
        }

        setEditedTask(prev => ({
            ...prev,
            progress_percentage: newProgress,
            status: newStatus
        }));
    };

    const handleApprove = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://127.0.0.1:8000/tasks/${task.id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Task approved and marked as completed!');
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error approving task:', err);
            alert(err.response?.data?.detail || 'Failed to approve task');
        }
    };

    const handleRequestHelp = async () => {
        if (!helpReason.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://127.0.0.1:8000/tasks/${task.id}/help-request`,
                { reason: helpReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowHelpRequest(false);
            setHelpReason('');
            alert('Help request sent to Unit Head');
        } catch (err) {
            console.error('Error requesting help:', err);
            alert('Failed to request help');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'not_started': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'ongoing': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'completed': return 'bg-green-50 text-green-600 border-green-200';
            case 'continuous': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'blocked': return 'bg-red-50 text-red-600 border-red-200';
            case 'waiting_on_external': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'needs_review': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
            case 'pending_approval': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'pending_group_head_approval': return 'bg-orange-50 text-orange-600 border-orange-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getCriticalityColor = (criticality) => {
        switch (criticality) {
            case 'high': return 'bg-red-50 text-red-600 border-red-200';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'low': return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-border p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-text">Task Details</h2>
                    <div className="flex gap-2">
                        {/* Approve Button for Assigners */}
                        {!isEditing && (task.status === 'pending_approval' || task.status === 'pending_group_head_approval') && (user.role === 'unit_head' || user.role === 'backup_unit_head' || user.role === 'group_head' || user.id === task.assigner_id) && (
                            <button
                                onClick={handleApprove}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Completion
                            </button>
                        )}
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                            >
                                <Edit2 size={16} />
                                {isAssignee && !canEditMetadata ? 'Update Progress' : 'Edit Task'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-subsurface rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6 sticky top-[88px] bg-white z-10">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
                    >
                        Activity
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
                    >
                        Comments
                    </button>
                    <button
                        onClick={() => setActiveTab('evidence')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'evidence' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
                    >
                        Evidence
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {activeTab === 'details' && (
                        <>
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Title</label>
                                {isEditing && canEditMetadata ? (
                                    <input
                                        type="text"
                                        value={editedTask.title}
                                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                                        className="input w-full"
                                    />
                                ) : (
                                    <h3 className="text-xl font-semibold text-text">{task.title}</h3>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Description</label>
                                {isEditing && canEditMetadata ? (
                                    <textarea
                                        value={editedTask.description}
                                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                        className="input w-full min-h-[100px]"
                                    />
                                ) : (
                                    <p className="text-text">{task.description || 'No description provided'}</p>
                                )}
                            </div>

                            {/* Status & Criticality */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Status</label>
                                    {isEditing ? (
                                        <select
                                            value={editedTask.status}
                                            onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="not_started">Not Started</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="completed">Completed</option>
                                            <option value="continuous">Continuous</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="waiting_on_external">Waiting on External</option>
                                            <option value="needs_review">Needs Review</option>
                                            <option value="pending_approval">Pending Approval</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                                            {task.status?.toUpperCase().replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Criticality</label>
                                    {isEditing && canEditMetadata ? (
                                        <select
                                            value={editedTask.criticality}
                                            onChange={(e) => setEditedTask({ ...editedTask, criticality: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getCriticalityColor(task.criticality)}`}>
                                            {task.criticality?.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Progress - Dual Input System */}
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Progress</label>
                                {isEditing ? (
                                    <div className="space-y-4 bg-subsurface p-4 rounded-lg border border-border">
                                        {/* Presets */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleProgressChange(0)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${editedTask.progress_percentage === 0 ? 'bg-gray-200 border-gray-300 text-gray-800' : 'bg-white border-border text-text-muted hover:bg-gray-50'}`}
                                            >
                                                Not Started (0%)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleProgressChange(50)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${editedTask.progress_percentage === 50 ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-border text-text-muted hover:bg-gray-50'}`}
                                            >
                                                In Progress (50%)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleProgressChange(100)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${editedTask.progress_percentage === 100 ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white border-border text-text-muted hover:bg-gray-50'}`}
                                            >
                                                Ready for Review (100%)
                                            </button>
                                        </div>

                                        {/* Slider & Manual Input */}
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="10"
                                                value={editedTask.progress_percentage}
                                                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={editedTask.progress_percentage}
                                                    onChange={(e) => handleProgressChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                    className="w-16 px-2 py-1 text-right border border-border rounded-md text-sm"
                                                />
                                                <span className="text-sm text-text-muted">%</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-primary h-3 rounded-full transition-all"
                                                style={{ width: `${task.progress_percentage || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-text">{task.progress_percentage || 0}%</span>
                                    </div>
                                )}
                            </div>

                            {/* Summary Field */}
                            {isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Update Summary</label>
                                    <textarea
                                        value={editedTask.summary_text}
                                        onChange={(e) => setEditedTask({ ...editedTask, summary_text: e.target.value })}
                                        className="input w-full min-h-[80px]"
                                        placeholder="Describe what you've done, findings, blockers, or progress details..."
                                    />
                                </div>
                            )}

                            {/* Assigned To */}
                            {canEditMetadata && (
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Assigned To</label>
                                    {isEditing ? (
                                        <select
                                            value={editedTask.assigned_to || ''}
                                            onChange={(e) => setEditedTask({ ...editedTask, assigned_to: parseInt(e.target.value) })}
                                            className="input w-full"
                                        >
                                            <option value="">Select team member</option>
                                            {teamMembers.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.username} ({member.role})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-text-muted" />
                                            <span className="text-text">{task.assignee?.username || 'Unassigned'}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Deadline</label>
                                {isEditing && canEditMetadata ? (
                                    <input
                                        type="datetime-local"
                                        value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                                        className="input w-full"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-text-muted" />
                                        <span className="text-text">
                                            {task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline set'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Created By</label>
                                    <p className="text-text">{task.assigner?.username || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Created At</label>
                                    <p className="text-text">{new Date(task.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Help Request Button */}
                            {!isEditing && (
                                <div className="pt-4 border-t border-border">
                                    <button
                                        onClick={() => setShowHelpRequest(!showHelpRequest)}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                    >
                                        <AlertTriangle size={14} />
                                        Request Help / Escalate
                                    </button>

                                    {showHelpRequest && (
                                        <div className="mt-3 bg-red-50 p-4 rounded-lg border border-red-100">
                                            <label className="block text-sm font-medium text-red-800 mb-2">Reason for escalation</label>
                                            <textarea
                                                value={helpReason}
                                                onChange={(e) => setHelpReason(e.target.value)}
                                                className="w-full p-2 border border-red-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                placeholder="Describe the issue or blocker..."
                                                rows="3"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setShowHelpRequest(false)}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 rounded-md"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleRequestHelp}
                                                    className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                                                >
                                                    Send Request
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'activity' && (
                        <ActivityTimeline taskId={task.id} />
                    )}

                    {activeTab === 'comments' && (
                        <TaskComments taskId={task.id} currentUser={user} />
                    )}

                    {activeTab === 'evidence' && (
                        <EvidenceUpload
                            taskId={task.id}
                            currentEvidenceUrl={task.evidence_url}
                            onUploadComplete={(url) => {
                                alert('Evidence uploaded successfully!');
                                onUpdate();
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                {isEditing && (
                    <div className="sticky bottom-0 bg-subsurface border-t border-border p-6 flex justify-end gap-3 z-10">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditedTask({
                                    title: task.title,
                                    description: task.description,
                                    status: task.status,
                                    criticality: task.criticality,
                                    progress_percentage: task.progress_percentage,
                                    assigned_to: task.assigned_to,
                                    deadline: task.deadline,
                                    summary_text: ''
                                });
                            }}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetailModal;
