import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back! 🎉');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential);
            toast.success('Welcome! Logged in with Google 🎉');
            navigate('/');
        } catch (err) {
            toast.error('Google login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary-dark p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white text-2xl font-bold mb-4 shadow-lg shadow-accent/40"
                    >
                        E
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-white/60 mt-1">Sign in to your expense tracker</p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-accent hover:text-secondary transition-colors font-medium">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border"></div>
                        <span className="text-sm text-gray-400">or continue with</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border"></div>
                    </div>

                    {/* Google Login */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error('Google login failed')}
                            shape="pill"
                            size="large"
                            width="100%"
                        />
                    </div>

                    {/* Register Link */}
                    <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-accent hover:text-secondary transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
