import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '', confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getPasswordStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-danger', 'bg-warning', 'bg-info', 'bg-success'];
    const strength = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error('Email and password are required.');
            return;
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register/', {
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
            });
            toast.success('Account created! Please login now. 🎉');
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Registration failed.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential);
            toast.success('Welcome! Signed up with Google 🎉');
            navigate('/');
        } catch (err) {
            toast.error('Google signup failed.');
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
                        E
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="text-white/60 mt-1">Start tracking your expenses today</p>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text" name="first_name" value={formData.first_name}
                                        onChange={handleChange} placeholder="John"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                <input
                                    type="text" name="last_name" value={formData.last_name}
                                    onChange={handleChange} placeholder="Doe"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email" name="email" value={formData.email}
                                    onChange={handleChange} placeholder="you@example.com" required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                                    onChange={handleChange} placeholder="Min 8 characters" required
                                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? strengthColors[strength - 1] : 'bg-gray-200 dark:bg-dark-border'}`} />
                                        ))}
                                    </div>
                                    <p className={`text-xs mt-1 ${strength <= 1 ? 'text-danger' : strength === 2 ? 'text-warning' : strength === 3 ? 'text-info' : 'text-success'}`}>
                                        {strengthLabels[strength - 1] || 'Too short'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                            <input
                                type="password" name="confirmPassword" value={formData.confirmPassword}
                                onChange={handleChange} placeholder="Repeat password" required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                            />
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-danger mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border"></div>
                        <span className="text-sm text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border"></div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google signup failed')} shape="pill" size="large" />
                    </div>

                    <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-accent hover:text-secondary transition-colors">Sign In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
