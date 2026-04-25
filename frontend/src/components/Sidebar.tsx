import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from '@/lib/navigation';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, 
    BookOpen, 
    Award, 
    FileText, 
    Users, 
    Settings, 
    CheckSquare,
    LogOut,
    GraduationCap,
    BarChart,
    PlusCircle,
    Folders,
    Trophy,
    Video
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
    isMobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setMobileOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const studentLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Browse Library', path: '/student/browse', icon: BookOpen },
        { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
        { name: 'Live Sessions', path: '/live/sessions', icon: Video },
        { name: 'Certificates', path: '/student/certificates', icon: Award },
        { name: 'Resources', path: '/student/resources', icon: FileText },
    ];

    const instructorLinks = [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'My Students', path: '/instructor/students', icon: Users },
        { name: 'Create Course', path: '/instructor/create', icon: PlusCircle },
        { name: 'Analytics', path: '/instructor/analytics', icon: BarChart },
        { name: 'Live Classes', path: '/live/sessions', icon: Video },
    ];

    const adminLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Manage Users', path: '/admin/users', icon: Users },
        { name: 'Approvals', path: '/admin/approvals', icon: CheckSquare },
        { name: 'Categories', path: '/admin/categories', icon: Folders },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
        { name: 'Live Stream Admin', path: '/live/sessions', icon: Video },
    ];

    let links = studentLinks;
    if (user?.role === UserRole.INSTRUCTOR || user?.role === UserRole.ASSISTANT_INSTRUCTOR) {
        links = instructorLinks;
    } else if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.MODERATOR) {
        links = adminLinks;
    }

    const isActive = (path: string) => location.pathname === path;

    const sidebarContent = (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
            {/* Logo area */}
            <div className="p-6">
                <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="bg-cyan-500/20 p-2 rounded-xl text-cyan-400">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">SESA<span className="text-cyan-400">.</span></span>
                </div>
            </div>

            {/* User Profile Snippet */}
            <div className="px-6 pb-6">
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 pr-2">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 space-y-2 overflow-y-auto hidden-scrollbar">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
                {links.map((link) => {
                    const active = isActive(link.path);
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                                active 
                                ? 'bg-cyan-500/10 text-cyan-400' 
                                : 'hover:bg-slate-800/80 hover:text-white'
                            }`}
                        >
                            <link.icon className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                            {link.name}
                        </NavLink>
                    );
                })}
            </div>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-800 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar Layer */}
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: isMobileOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-2xl"
            >
                {sidebarContent}
            </motion.aside>
        </>
    );
};

export default Sidebar;
