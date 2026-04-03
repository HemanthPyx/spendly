import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineKey } from 'react-icons/hi';
import api from '../api/axios';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1=email, 2=code+password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!email) { toast.error('Enter your email.'); return; }
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password/', { email });
            toast.success('Reset code sent to your email! 📧');
            // In dev mode, show code in toast if email service not configured
            if (res.data.dev_code) {
                toast.info(`Dev code: ${res.data.dev_code}`, { autoClose: 15000 });
            }
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to send code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await api.post('/auth/reset-password/', { email, code, new_password: newPassword });
            toast.success('Password reset successfully! 🔒');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary-dark p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white text-2xl font-bold mb-4 shadow-lg shadow-accent/40"
                    >
                        🔒
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white">
                        {step === 1 ? 'Forgot Password' : 'Reset Password'}
                    </h1>
                    <p className="text-white/60 mt-1">
                        {step === 1 ? 'Enter your email to get a reset code' : 'Enter the code and your new password'}
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8">
                    {step === 1 ? (
                        <form onSubmit={handleSendCode} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com" required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-50">
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reset Code</label>
                                <div className="relative">
                                    <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text" value={code} onChange={(e) => setCode(e.target.value)}
                                        placeholder="Enter 6-digit code" required maxLength={6}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-center text-lg tracking-widest font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 8 characters" required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                <input
                                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat new password" required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-danger mt-1">Passwords do not match</p>
                                )}
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-50">
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button type="button" onClick={() => setStep(1)}
                                className="w-full py-2 text-sm text-accent hover:underline">
                                ← Send code again
                            </button>
                        </form>
                    )}

                    <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Remember your password?{' '}
                        <Link to="/login" className="font-semibold text-accent hover:text-secondary transition-colors">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
