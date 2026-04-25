import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/navigation';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import axios from 'axios';
import { ArrowLeft, Settings as SettingsIcon, Plus, Trash2, Megaphone, Send, Users, Edit3, X, Check } from 'lucide-react';

interface Category {
    _id: string;
    name: string;
    description: string;
    icon: string;
    isActive: boolean;
}

interface Announcement {
    _id: string;
    message: string;
    targetRole: 'student' | 'instructor' | 'both';
    isActive: boolean;
    createdAt: string;
    createdBy: {
        name: string;
        role: string;
    };
}

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '' });
    const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ message: '', targetRole: 'both' as 'student' | 'instructor' | 'both' });
    
    // Broadcast state
    const [broadcast, setBroadcast] = useState({
        title: '',
        message: '',
        targetRole: 'all',
        link: '',
        type: 'announcement'
    });
    const [sendingBroadcast, setSendingBroadcast] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchAnnouncements = async () => {
        try {
            setLoadingAnnouncements(true);
            const response = await axios.get(`${API_URL}/announcements?scope=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(response.data || []);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            showError('Failed to load announcements');
        } finally {
            setLoadingAnnouncements(false);
        }
    };

    const handleEditAnnouncement = async (id: string) => {
        try {
            const response = await axios.put(
                `${API_URL}/announcements/${id}`,
                editForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Announcement updated successfully');
            setEditingAnnouncement(null);
            fetchAnnouncements();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to update announcement');
        }
    };

    const handleDeleteAnnouncement = async (id: string, message: string) => {
        if (!window.confirm(`Are you sure you want to delete this announcement: "${message.substring(0, 50)}..."?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Announcement deleted successfully');
            fetchAnnouncements();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to delete announcement');
        }
    };

    const startEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement._id);
        setEditForm({
            message: announcement.message,
            targetRole: announcement.targetRole
        });
    };

    const cancelEdit = () => {
        setEditingAnnouncement(null);
        setEditForm({ message: '', targetRole: 'both' });
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcast.title.trim() || !broadcast.message.trim()) {
            showError('Title and message are required');
            return;
        }
        setSendingBroadcast(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Send in-app notifications to targeted users via the notifications broadcast endpoint
            const notifPayload: Record<string, any> = {
                title: broadcast.title.trim(),
                message: broadcast.message.trim(),
                type: broadcast.type === 'important' ? 'system' : broadcast.type,
                link: broadcast.link.trim() || undefined,
            };
            // Map frontend targetRole value → backend expects null (all), 'student', or 'instructor'
            if (broadcast.targetRole !== 'all') {
                notifPayload.targetRole = broadcast.targetRole;
            }
            await axios.post(`${API_URL}/notifications/broadcast`, notifPayload, { headers });

            // 2. Also create an announcement banner entry so it appears in the scrolling banner
            //    targetRole for announcements must be 'student' | 'instructor' | 'both'
            const announcementTargetRole =
                broadcast.targetRole === 'all' ? 'both' :
                broadcast.targetRole === 'student' ? 'student' : 'instructor';
            await axios.post(
                `${API_URL}/announcements`,
                {
                    message: `${broadcast.title}: ${broadcast.message}`,
                    targetRole: announcementTargetRole,
                    isActive: true,
                },
                { headers }
            );

            showSuccess(`Broadcast sent successfully to ${broadcast.targetRole === 'all' ? 'all users' : broadcast.targetRole + 's'}!`);
            // Reset form
            setBroadcast({ title: '', message: '', targetRole: 'all', link: '', type: 'announcement' });
            // Refresh announcements list
            fetchAnnouncements();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to send broadcast. Please try again.');
        } finally {
            setSendingBroadcast(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchAnnouncements();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/categories`);
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            showError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newCategory.name || !newCategory.icon) {
            showError('Name and icon are required');
            return;
        }

        try {
            await axios.post(
                `${API_URL}/categories`,
                newCategory,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Category created successfully');
            setShowAddModal(false);
            setNewCategory({ name: '', description: '', icon: '' });
            fetchCategories();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to create category');
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Category deleted successfully');
            fetchCategories();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to delete category');
        }
    };

    return (
        <div className="min-h-[85vh] bg-gray-50 dark:bg-dark-bg p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <SettingsIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-dark-bg dark:text-white">System Settings</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage categories and platform settings</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold hover:shadow-lg transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Category
                        </button>
                    </div>

                    {/* Broadcast Section */}
                    <div className="mt-8 grid lg:grid-cols-2 gap-8">
                        {/* Categories List */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-lg font-bold text-dark-bg dark:text-white mb-4">Course Categories</h2>
                            
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading categories...</div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No categories found</div>
                            ) : (
                                <div className="grid gap-4">
                                    {categories.map((category) => (
                                        <div
                                            key={category._id}
                                            className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-primary transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{category.icon}</span>
                                                <div>
                                                    <h3 className="font-bold text-sm text-dark-bg dark:text-white">{category.name}</h3>
                                                    <p className="text-[10px] text-gray-500 line-clamp-1">{category.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(category._id, category.name)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Broadcast Form */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Megaphone className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-bold text-dark-bg dark:text-white">Broadcast Announcement</h2>
                            </div>

                            <form onSubmit={handleBroadcast} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <select 
                                                value={broadcast.targetRole}
                                                onChange={(e) => setBroadcast({ ...broadcast, targetRole: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                            >
                                                <option value="all">Everyone</option>
                                                <option value="student">All Students</option>
                                                <option value="instructor">All Instructors</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Notice Type</label>
                                        <select 
                                            value={broadcast.type}
                                            onChange={(e) => setBroadcast({ ...broadcast, type: e.target.value as any })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                        >
                                            <option value="announcement">Announcement</option>
                                            <option value="system">System Update</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Subject / Title</label>
                                    <input 
                                        required
                                        value={broadcast.title}
                                        onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                                        placeholder="e.g. New Platform Features!"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Message Content</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={broadcast.message}
                                        onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Action Link (Optional)</label>
                                    <input 
                                        value={broadcast.link}
                                        onChange={(e) => setBroadcast({ ...broadcast, link: e.target.value })}
                                        placeholder="e.g. /marketplace"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sendingBroadcast}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {sendingBroadcast ? (
                                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Broadcast
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Announcements Management Section */}
                    <div className="mt-8 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Megaphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-dark-bg dark:text-white">Manage Announcements</h2>
                        </div>

                        {loadingAnnouncements ? (
                            <div className="text-center py-8 text-gray-500">Loading announcements...</div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No announcements found</div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement._id}
                                        className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-primary/50 transition-colors"
                                    >
                                        {editingAnnouncement === announcement._id ? (
                                            // Edit Mode
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Role</label>
                                                        <select
                                                            value={editForm.targetRole}
                                                            onChange={(e) => setEditForm({ ...editForm, targetRole: e.target.value as any })}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                                                        >
                                                            <option value="both">Everyone</option>
                                                            <option value="student">Students</option>
                                                            <option value="instructor">Instructors</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <button
                                                            onClick={() => handleEditAnnouncement(announcement._id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Message</label>
                                                    <textarea
                                                        value={editForm.message}
                                                        onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                                                        rows={3}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none"
                                                        placeholder="Enter announcement message..."
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            // View Mode
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            announcement.targetRole === 'both' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                            announcement.targetRole === 'student' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                        }`}>
                                                            {announcement.targetRole === 'both' ? 'Everyone' : 
                                                             announcement.targetRole === 'student' ? 'Students' : 'Instructors'}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            announcement.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                            {announcement.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-dark-bg dark:text-white font-medium mb-2">
                                                        {announcement.message}
                                                    </p>
                                                    <div className="text-xs text-gray-500">
                                                        Created by {announcement.createdBy.name} • {new Date(announcement.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEdit(announcement)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Edit announcement"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAnnouncement(announcement._id, announcement.message)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete announcement"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platform Info */}
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            ⚙️ Additional system settings (email configuration, payment settings, etc.) will be available in future updates.
                        </p>
                    </div>
                </motion.div>

                {/* Add Category Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-md w-full"
                        >
                            <h2 className="text-xl font-bold text-dark-bg dark:text-white mb-4">Add New Category</h2>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        placeholder="e.g., Web Development"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                        Icon (Emoji) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.icon}
                                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                        placeholder="e.g., 💻"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-dark-bg dark:text-white mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        placeholder="Brief description..."
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setNewCategory({ name: '', description: '', icon: '' });
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg transition-all"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
