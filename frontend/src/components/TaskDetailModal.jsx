import { X, Calendar, User, AlertCircle, Clock, Edit2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskComments from './TaskComments';
import ActivityTimeline from './ActivityTimeline';
import EvidenceUpload from './EvidenceUpload';
import Toast from './Toast';
import SearchableMultiSelect from './SearchableMultiSelect';
import { API_BASE_URL } from '../config';

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
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [currentEvidenceUrl, setCurrentEvidenceUrl] = useState(null);

    useEffect(() => {
        if (task) {
            setEditedTask({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'ongoing',
                criticality: task.criticality || 'medium',
                progress_percentage: task.progress_percentage || 0,
                assigned_to: task.assignees?.map(a => a.id) || (task.assignee_id ? [task.assignee_id] : []),
                deadline: task.deadline || '',
                summary_text: ''
            });
            setCurrentEvidenceUrl(task.evidence_url || null);
        }
    }, [task, isOpen]);

    // Mark task as viewed when modal opens
    useEffect(() => {
        const markAsViewed = async () => {
            if (isOpen && task && task.is_new) {
                try {
                    const token = localStorage.getItem('token');
                    await axios.post(
                        `${API_BASE_URL}/tasks/${task.id}/mark-viewed`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    // Optionally refresh task list to remove NEW badge
                    if (onUpdate) {
                        onUpdate();
                    }
                } catch (err) {
                    console.error('Error marking task as viewed:', err);
                }
            }
        };
        markAsViewed();
    }, [isOpen, task, onUpdate]);

    // Fetch updated task data after evidence upload
    const fetchUpdatedTask = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/tasks/${task.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCurrentEvidenceUrl(response.data.evidence_url || null);
        } catch (err) {
            console.error('Error fetching updated task:', err);
        }
    };

    if (!isOpen || !task) return null;

    // Permission checks
    const isAssigner = user.id === task.assigner_id;
    const isAssignee = task.assignees?.some(a => a.id === user.id) || user.id === task.assignee_id;
    // Group Heads can always edit. Otherwise, only the assigner can edit metadata.
    const canEditMetadata = user.role === 'group_head' || isAssigner;


    const handleSave = async () => {
        try {
            // Enforce logic: Members cannot mark as completed. 100% means pending_approval.
            let finalStatus = editedTask.status;
            if (!canEditMetadata && editedTask.progress_percentage === 100) {
                finalStatus = 'pending_approval';
            }

            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/tasks/${task.id}/update`,
                {
                    progress_percentage: editedTask.progress_percentage,
                    status: finalStatus,
                    summary_text: editedTask.summary_text
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (canEditMetadata) {
                await axios.put(
                    `${API_BASE_URL}/tasks/${task.id}`,
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
            setToast({ show: true, message: 'Task updated successfully', type: 'success' });
        } catch (err) {
            console.error('Error updating task:', err);
            setToast({ show: true, message: err.response?.data?.detail || 'Failed to update task', type: 'error' });
        }
    };

    const handleProgressChange = (newProgress) => {
        let newStatus = editedTask.status;

        // Auto-update status based on progress
        if (newProgress === 100) {
            // Assigners can complete directly. Members go to pending approval.
            newStatus = canEditMetadata ? 'completed' : 'pending_approval';
        } else if (newProgress === 0) {
            newStatus = 'not_started';
        } else {
            // For any progress > 0 and < 100, ensure status is ongoing (unless it was blocked/waiting etc)
            if (['not_started', 'completed', 'pending_approval', 'pending_group_head_approval'].includes(newStatus)) {
                newStatus = 'ongoing';
            }
        }

        setEditedTask(prev => ({
            ...prev,
            progress_percentage: newProgress,
            status: newStatus
        }));
    };

    const getProgressColor = (percent) => {
        if (percent === 0) return '#cfcfcf';
        if (percent === 5) return '#ff6b6b';
        if (percent <= 25) return '#ffa726';
        if (percent <= 50) return '#ffd54f';
        if (percent <= 75) return '#42a5f5';
        return '#66bb6a'; // 100
    };

    const getProgressLabel = (percent) => {
        const options = [
            { text: "Not Started", percent: 0 },
            { text: "Started", percent: 5 },
            { text: "In Progress", percent: 25 },
            { text: "On Track", percent: 50 },
            { text: "Near Completion", percent: 75 },
            { text: "Completed", percent: 100 }
        ];
        // Find exact match or closest lower bound? Spec implies discrete options map to text.
        // But with slider step 5, we might have 10, 15 etc.
        // Let's return exact match if exists, otherwise "In Progress" generic or nearest.
        const match = options.find(o => o.percent === percent);
        if (match) return match.text;

        if (percent === 0) return "Not Started";
        if (percent < 25) return "Started";
        if (percent < 50) return "In Progress";
        if (percent < 75) return "On Track";
        if (percent < 100) return "Near Completion";
        return "Completed";
    };

    const handleApprove = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/tasks/${task.id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setToast({ show: true, message: 'Task approved and marked as completed!', type: 'success' });
            onUpdate();
            setTimeout(onClose, 1500);
        } catch (err) {
            console.error('Error approving task:', err);
            setToast({ show: true, message: err.response?.data?.detail || 'Failed to approve task', type: 'error' });
        }
    };

    const handleRequestHelp = async () => {
        if (!helpReason.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/tasks/${task.id}/help-request`,
                { reason: helpReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowHelpRequest(false);
            setHelpReason('');
            setToast({ show: true, message: 'Help request sent to Unit Head', type: 'success' });
        } catch (err) {
            console.error('Error requesting help:', err);
            setToast({ show: true, message: 'Failed to request help', type: 'error' });
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
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
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
                <div className="grid grid-cols-4 border-b border-border px-6 sticky top-[88px] bg-white z-10 relative">
                    {/* Sliding Indicator */}
                    <div
                        className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
                        style={{
                            width: '25%',
                            left: activeTab === 'details' ? '0%' :
                                activeTab === 'activity' ? '25%' :
                                    activeTab === 'comments' ? '50%' : '75%'
                        }}
                    />

                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-3 text-sm font-medium transition-colors ${activeTab === 'details' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`py-3 text-sm font-medium transition-colors ${activeTab === 'activity' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
                    >
                        Activity
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`py-3 text-sm font-medium transition-colors ${activeTab === 'comments' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
                    >
                        Comments
                    </button>
                    <button
                        onClick={() => setActiveTab('evidence')}
                        className={`py-3 text-sm font-medium transition-colors ${activeTab === 'evidence' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
                    >
                        Evidence
                    </button>
                </div>

                {/* Content */}
                <div
                    key={activeTab}
                    className="p-6 space-y-6 min-h-[400px] animate-in fade-in duration-300"
                >
                    {activeTab === 'details' && (
                        <>
                            {/* Title */}
                            <div className="pb-4 border-b border-border">
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
                            <div className="pb-4 border-b border-border">
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
                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
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
                                            {canEditMetadata && <option value="completed">Completed</option>}
                                            <option value="continuous">Continuous</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="waiting_on_external">Waiting on External</option>
                                            <option value="needs_review">Needs Review</option>
                                            <option value="pending_approval">Pending Approval</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium border text-center leading-tight max-w-[140px] ${getStatusColor(task.status)}`}>
                                            {task.status && task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                            <div className="pb-4 border-b border-border">
                                <label className="block text-sm font-medium text-text-muted mb-2">Progress</label>
                                {isEditing ? (
                                    <div className="space-y-4 bg-subsurface p-4 rounded-lg border border-border">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-2xl font-bold" style={{ color: getProgressColor(editedTask.progress_percentage) }}>
                                                    {editedTask.progress_percentage}%
                                                </span>
                                                <span className="text-sm font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                                                    {getProgressLabel(editedTask.progress_percentage)}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={editedTask.progress_percentage}
                                                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                style={{
                                                    accentColor: getProgressColor(editedTask.progress_percentage)
                                                }}
                                            />
                                            <div className="flex justify-between text-xs text-text-muted mb-4">
                                                <span>0%</span>
                                                <span>50%</span>
                                                <span>100%</span>
                                            </div>

                                            {/* Preset Buttons */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {[
                                                    { label: 'Started', value: 5 },
                                                    { label: 'In Progress', value: 25 },
                                                    { label: 'On Track', value: 50 },
                                                    { label: 'Near Done', value: 75 },
                                                    { label: 'Done (Review)', value: 100 }
                                                ].map(preset => (
                                                    <button
                                                        key={preset.value}
                                                        onClick={() => handleProgressChange(preset.value)}
                                                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${editedTask.progress_percentage === preset.value
                                                            ? 'bg-primary text-white border-primary shadow-sm'
                                                            : 'bg-white text-text-muted border-border hover:border-primary/50 hover:bg-primary/5'
                                                            }`}
                                                    >
                                                        {preset.label} ({preset.value}%)
                                                    </button>
                                                ))}
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
                                <div className="pb-4 border-b border-border">
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
                                <div className="pb-4 border-b border-border">
                                    {isEditing ? (
                                        <SearchableMultiSelect
                                            options={teamMembers}
                                            value={editedTask.assigned_to}
                                            onChange={(selectedIds) => setEditedTask({ ...editedTask, assigned_to: selectedIds })}
                                            label="Assigned To"
                                            placeholder="Search team members..."
                                            displayTemplate={(member) => member.username}
                                            roleTemplate={(member) => member.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            compact={true}
                                        />
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {task.assignees && task.assignees.length > 0 ? (
                                                task.assignees.map(assignee => (
                                                    <div key={assignee.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                                            {assignee.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm text-text font-medium">{assignee.username}</span>
                                                    </div>
                                                ))
                                            ) : task.assignee ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                                    <User size={16} className="text-primary" />
                                                    <span className="text-text">{task.assignee.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-text-muted">Unassigned</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Deadline */}
                            <div className="pb-4 border-b border-border">
                                <label className="block text-sm font-medium text-text-muted mb-2">Deadline</label>
                                {isEditing && canEditMetadata ? (
                                    <input
                                        type="datetime-local"
                                        value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().slice(0, 16) : ''}
                                        min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                        onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                                        className="input w-full"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-text">
                                        <div className="p-2 bg-surface-hover rounded-lg">
                                            <Calendar size={18} className="text-text-muted" />
                                        </div>
                                        <span>{task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}</span>
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

                            {/* Completed At - Audit Trail for Completed Tasks */}
                            {task.status === 'completed' && task.completed_at && (
                                <div className="pt-4 border-t border-border">
                                    <div className="flex items-center gap-2 bg-green-50 p-4 rounded-lg border border-green-200">
                                        <Clock size={18} className="text-green-600" />
                                        <div>
                                            <label className="block text-sm font-medium text-green-700">Completed At</label>
                                            <p className="text-green-800 font-medium">{new Date(task.completed_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                        <div className="flex flex-col justify-center min-h-[350px] w-full">
                            <EvidenceUpload
                                taskId={task.id}
                                currentEvidenceUrl={currentEvidenceUrl}
                                onUploadComplete={async (url) => {
                                    await fetchUpdatedTask();
                                    setToast({ show: true, message: 'Evidence uploaded successfully!', type: 'success' });
                                    onUpdate();
                                }}
                            />
                        </div>
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
