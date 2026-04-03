import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineMoon, HiOutlineSun, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useState } from 'react';

export default function Topbar({ onToggleSidebar, sidebarOpen }) {
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully!');
        navigate('/login');
    };

    return (
        <>
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-border px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors"
                        >
                            <HiOutlineMenuAlt2 className="w-5 h-5 text-primary dark:text-surface" />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-primary dark:text-surface">
                                Welcome back, {user?.first_name || user?.email?.split('@')[0] || 'User'}!
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Track your expenses and stay on budget
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-all duration-300"
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? (
                                <HiOutlineSun className="w-5 h-5 text-accent" />
                            ) : (
                                <HiOutlineMoon className="w-5 h-5 text-primary" />
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/budget-alerts')}
                            className="p-2 rounded-xl hover:bg-surface dark:hover:bg-dark-surface transition-colors relative"
                        >
                            <HiOutlineBell className="w-5 h-5 text-primary dark:text-surface" />
                        </button>

                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Logout"
                        >
                            <HiOutlineLogout className="w-5 h-5 text-danger" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Logout confirmation modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-fade-in-up">
                        <h3 className="text-lg font-bold text-primary dark:text-surface mb-2">Confirm Logout</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to log out?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutConfirm(false);
                                    handleLogout();
                                }}
                                className="flex-1 py-2 rounded-xl bg-danger text-white hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
