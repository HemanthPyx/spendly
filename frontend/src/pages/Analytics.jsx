import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { HiOutlineSparkles, HiOutlineLightBulb, HiOutlineCurrencyDollar, HiOutlineTrendingUp } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    
    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    
    const { user } = useAuth();

    useEffect(() => { fetchAnalytics(); }, [year]);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get(`/analytics/?year=${year}`);
            setData(res.data);
        } catch (err) {
            toast.error('Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    };

    const generateAiAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await api.get('/reports/ai-analysis/');
            setAiAnalysis(res.data);
            toast.success('AI Analysis complete! ✨');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to generate AI analysis.');
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return <div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}</div>;
    }

    if (!data) return null;

    const monthlyChartData = data.monthly_data?.map((d) => ({
        name: MONTHS[d.month - 1],
        expenses: d.expenses,
        income: d.income,
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visual insights into your spending</p>
                </div>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none">
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white">
                    <p className="text-sm text-white/60">Highest Category</p>
                    <p className="text-xl font-bold mt-1">{data.insights?.highest_category || 'N/A'}</p>
                    <p className="text-sm text-white/70">{formatCurrency(data.insights?.highest_amount || 0, user?.currency)}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-accent to-warning rounded-2xl p-5 text-white">
                    <p className="text-sm text-white/60">Avg Daily Spending</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(data.insights?.avg_daily_spending || 0, user?.currency)}</p>
                    <p className="text-sm text-white/70">Last 30 days</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-info to-primary rounded-2xl p-5 text-white">
                    <p className="text-sm text-white/60">Total Expenses ({year})</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(monthlyChartData.reduce((s, d) => s + d.expenses, 0), user?.currency)}</p>
                    <p className="text-sm text-white/70">Across all months</p>
                </motion.div>
            </div>

            {/* AI Analysis Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-accent/20 shadow-md relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -z-10"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-primary dark:text-surface flex items-center gap-2">
                            <HiOutlineSparkles className="w-6 h-6 text-accent" /> AI Financial Analysis
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get deep insights into your spending habits powered by Gemini AI</p>
                    </div>
                    <button
                        onClick={generateAiAnalysis}
                        disabled={analyzing}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all cursor-pointer ${analyzing ? 'bg-accent/70 cursor-not-allowed' : 'bg-gradient-to-r from-accent to-secondary hover:shadow-lg shadow-accent/30'}`}
                    >
                        {analyzing ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                        ) : (
                            <><HiOutlineSparkles className="w-5 h-5" /> Generate Analysis</>
                        )}
                    </button>
                </div>

                <AnimatePresence>
                    {aiAnalysis && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4"
                        >
                            <div className="p-4 bg-gray-50 dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-200">
                                <p className="font-medium text-primary dark:text-surface mb-2 text-lg">Executive Summary</p>
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words">
                                    <ReactMarkdown>{String(aiAnalysis.summary || '')}</ReactMarkdown>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                    <h4 className="flex items-center gap-1.5 font-bold text-danger mb-3 text-base">
                                        <HiOutlineCurrencyDollar className="w-5 h-5" /> Wasted Money
                                    </h4>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none break-words">
                                        <ReactMarkdown>{String(aiAnalysis.wasted_money || '')}</ReactMarkdown>
                                    </div>
                                </div>
                                <div className="p-5 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                    <h4 className="flex items-center gap-1.5 font-bold text-success mb-3 text-base">
                                        <HiOutlineTrendingUp className="w-5 h-5" /> Saving Opportunities
                                    </h4>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none break-words">
                                        <ReactMarkdown>{String(aiAnalysis.saving_opportunities || '')}</ReactMarkdown>
                                    </div>
                                </div>
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                    <h4 className="flex items-center gap-1.5 font-bold text-info mb-3 text-base">
                                        <HiOutlineLightBulb className="w-5 h-5" /> Positive Habits
                                    </h4>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none break-words">
                                        <ReactMarkdown>{String(aiAnalysis.positive_habits || '')}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Bar Chart */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                    <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Monthly Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} name="Income" />
                            <Bar dataKey="expenses" fill="#D53E0F" radius={[4, 4, 0, 0]} name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Category Pie Chart */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                    <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Spending by Category</h3>
                    {data.category_data?.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={data.category_data} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                                        {data.category_data.map((entry, i) => <Cell key={i} fill={entry.color || '#D53E0F'} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => formatCurrency(v, user?.currency)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {data.category_data.map((cat, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }}></span>
                                        {cat.name}: {formatCurrency(cat.amount, user?.currency)}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>
                    )}
                </motion.div>
            </div>

            {/* Daily Trend Line Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Expense Trend (Last 30 Days)</h3>
                {data.daily_data?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.daily_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="amount" stroke="#D53E0F" strokeWidth={2} dot={{ fill: '#D53E0F', r: 4 }} activeDot={{ r: 6 }} name="Expenses" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">No recent expense data</div>
                )}
            </motion.div>
        </div>
    );
}
