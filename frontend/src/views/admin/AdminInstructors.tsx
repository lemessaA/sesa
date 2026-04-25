import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, BookOpen, ShieldCheck, 
    Search, Download,
    CheckCircle, AlertCircle, Mail,
    Trash2, Edit3, UserPlus, Clock
} from 'lucide-react';
import apiService from '../../utils/api';
import { toast } from 'react-toastify';

interface InstructorRecord {
    _id: string;
    name: string;
    email: string;
    role: string;
    isVerified?: boolean;
    courseCount?: number;
    studentCount?: number;
    joinedAt?: string;
}

const AdminInstructors: React.FC = () => {
    const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            setLoading(true);
            const response = await apiService.admin.getAllUsers();
            // Filter only instructors
            const filtered = response.data.filter((u: any) => u.role === 'INSTRUCTOR');
            setInstructors(filtered);
        } catch (error) {
            toast.error('Failed to load instructors');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = instructors.filter(inst => {
        const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             inst.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || 
                             (filter === 'verified' && inst.isVerified) ||
                             (filter === 'unverified' && !inst.isVerified);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-4 md:p-8 space-y-6 bg-white dark:bg-dark-bg min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-dark-bg dark:text-white flex items-center gap-3 italic">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Instructor Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-widest">
                        System Oversight & Staff Verification
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm border border-gray-200 dark:border-gray-700">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20 text-sm">
                        <UserPlus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: instructors.length, icon: Users, color: 'text-blue-500' },
                    { label: 'Verified', value: instructors.filter(i => i.isVerified).length, icon: CheckCircle, color: 'text-emerald-500' },
                    { label: 'Pending', value: instructors.filter(i => !i.isVerified).length, icon: AlertCircle, color: 'text-amber-500' },
                    { label: 'Total Courses', value: instructors.reduce((acc, curr) => acc + (curr.courseCount || 0), 0), icon: BookOpen, color: 'text-purple-500' }
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <span className="text-xs font-bold text-gray-500 uppercase">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-black text-dark-bg dark:text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 ring-primary/20 text-sm transition-all text-dark-bg dark:text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    {(['all', 'verified', 'unverified'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                filter === f 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 tracking-widest">Instructor</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 tracking-widest text-center">Courses</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 tracking-widest text-center">Students</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 tracking-widest">Joined</th>
                                <th className="px-6 py-4 text-xs font-black uppercase text-gray-500 tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-dark-bg dark:text-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold uppercase tracking-widest italic animate-pulse">
                                        Synchronizing Staff Data...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold uppercase tracking-widest">
                                        No instructors found matching criteria
                                    </td>
                                </tr>
                            ) : filteredData.map((inst) => (
                                <motion.tr 
                                    key={inst._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center font-black text-primary border border-primary/20">
                                                {inst.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{inst.name}</p>
                                                <p className="text-xs text-gray-500 font-medium">{inst.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inst.isVerified ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                                <ShieldCheck className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                                <AlertCircle className="w-3 h-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-sm">{inst.courseCount || 0}</td>
                                    <td className="px-6 py-4 text-center font-bold text-sm">{(inst.studentCount || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {inst.joinedAt ? new Date(inst.joinedAt).toLocaleDateString() : 'Mar 2026'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-primary transition-all">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-primary transition-all">
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-rose-500 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminInstructors;
