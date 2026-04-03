import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { toast } from 'react-toastify';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export default function Settings() {
    const { user, updateUser } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        currency: user?.currency || 'INR',
    });
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await api.put('/auth/profile/', profileForm);
            updateUser(res.data);
            toast.success('Profile updated! ✅');
        } catch (err) {
            toast.error('Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('Passwords do not match.');
            return;
        }
        if (passwordForm.new_password.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }
        setSavingPassword(true);
        try {
            await api.post('/auth/change-password/', {
                old_password: passwordForm.old_password,
                new_password: passwordForm.new_password,
            });
            toast.success('Password changed! 🔒');
            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            toast.error(err.response?.data?.old_password?.[0] || 'Failed to change password.');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-primary dark:text-surface">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences</p>
            </div>

            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Profile</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                            <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                            <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input type="email" value={user?.email || ''} disabled
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                        <select value={profileForm.currency} onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none">
                            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={savingProfile}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all disabled:opacity-50">
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </motion.div>

            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Appearance</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
                    </div>
                    <button onClick={toggleDarkMode}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-accent' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`}></div>
                    </button>
                </div>
            </motion.div>

            {/* Change Password */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        placeholder="Current password" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                    <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="New password (min 8 chars)" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                    <input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        placeholder="Confirm new password" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                    <button type="submit" disabled={savingPassword}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:shadow-lg transition-all disabled:opacity-50">
                        {savingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
