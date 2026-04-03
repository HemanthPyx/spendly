import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCash, HiOutlineCurrencyRupee, HiOutlineTrendingUp, HiOutlineShoppingBag, HiOutlineLightBulb, HiOutlineExclamation } from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
    }),
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [debtReminders, setDebtReminders] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        initMonth();
        fetchDashboard();
        fetchDebtReminders();
    }, []);

    const initMonth = async () => {
        try {
            await api.post('/budgets/init_month/');
        } catch (err) { /* silent - might be first time user */ }
    };

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/dashboard/');
            setData(res.data);
        } catch (err) {
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDebtReminders = async () => {
        try {
            const res = await api.get('/debts/reminders/');
            setDebtReminders(res.data);
        } catch (err) { /* silent - debts might not exist yet */ }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="skeleton h-80 rounded-2xl" />
                    <div className="skeleton h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const statCards = [
        { title: 'Total Income', value: formatCurrency(data.total_income || 0, user?.currency), icon: HiOutlineCash, color: 'bg-success', textColor: 'text-success' },
        { title: 'Total Spent', value: formatCurrency(data.total_expenses || 0, user?.currency), icon: HiOutlineCurrencyRupee, color: 'bg-danger', textColor: 'text-danger' },
        { title: 'Remaining', value: formatCurrency(data.remaining_balance || 0, user?.currency), icon: HiOutlineTrendingUp, color: 'bg-info', textColor: 'text-info' },
        { title: 'Budget Used', value: `${data.budget_percentage || 0}%`, icon: HiOutlineShoppingBag, color: 'bg-warning', textColor: 'text-warning' },
    ];

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-dark-border"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.title}</span>
                            <div className={`p-2 rounded-xl ${card.color}/10`}>
                                <card.icon className={`w-5 h-5 ${card.textColor}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Smart Insights */}
            {data.insights && data.insights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-accent/10 to-warning/10 border border-accent/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
                >
                    <div className="p-2 bg-gradient-to-br from-accent to-warning rounded-xl text-white shadow-md flex-shrink-0">
                        <HiOutlineLightBulb className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Smart Insights</h3>
                        <div className="space-y-1 pb-1">
                            {data.insights.map((insight, idx) => (
                                <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">• {insight}</p>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Debt Reminders Widget */}
            {debtReminders && debtReminders.total_unpaid > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-sm"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-xl text-white shadow-md flex-shrink-0">
                                <HiOutlineExclamation className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-800 dark:text-red-300">Unpaid Debts</h3>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    You owe <strong>{formatCurrency(debtReminders.total_unpaid, user?.currency)}</strong>
                                    {debtReminders.overdue?.length > 0 && (
                                        <span className="ml-1">
                                            — <strong>{debtReminders.overdue.length} overdue!</strong>
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/debts"
                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 text-center"
                        >
                            View Debts →
                        </Link>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border"
                >
                    <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Spending by Category</h3>
                    {data.category_breakdown?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data.category_breakdown}
                                    dataKey="amount"
                                    nameKey="name"
                                    cx="50%" cy="50%"
                                    outerRadius={90}
                                    innerRadius={50}
                                    paddingAngle={3}
                                    strokeWidth={0}
                                >
                                    {data.category_breakdown.map((entry, index) => (
                                        <Cell key={index} fill={entry.color || '#D53E0F'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatCurrency(value, user?.currency)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">No expense data yet</div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {data.category_breakdown?.map((cat, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color || '#D53E0F' }}></span>
                                {cat.name}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Budget Progress & Wishlist */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-6"
                >
                    {/* Budget Progress */}
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                        <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Budget Progress</h3>
                        <div className="relative pt-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatCurrency(data.total_expenses || 0, user?.currency)} / {formatCurrency(data.budget_amount || 0, user?.currency)}
                                </span>
                                <span className={`text-sm font-bold ${data.budget_percentage >= 100 ? 'text-danger' : data.budget_percentage >= 80 ? 'text-warning' : 'text-success'}`}>
                                    {data.budget_percentage}%
                                </span>
                            </div>
                            <div className="overflow-hidden h-3 rounded-full bg-gray-200 dark:bg-dark-border">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(data.budget_percentage, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${data.budget_percentage >= 100 ? 'bg-danger' : data.budget_percentage >= 80 ? 'bg-warning' : 'bg-success'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Wishlist Progress */}
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                        <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Wishlist</h3>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-accent">{data.wishlist_progress?.completed || 0}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Purchased</p>
                            </div>
                            <div className="text-gray-300 dark:text-dark-border text-2xl">/</div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary dark:text-surface">{data.wishlist_progress?.total || 0}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Items</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Category & Daily Average */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center">
                            <h3 className="text-sm font-medium text-white/70 mb-1">Top Category</h3>
                            <p className="text-xl font-bold truncate">{data.top_category?.name || 'N/A'}</p>
                            <p className="text-md text-white/80 mt-1">{formatCurrency(data.top_category?.amount || 0, user?.currency)}</p>
                        </div>
                        <div className="bg-gradient-to-r from-accent to-orange-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center">
                            <h3 className="text-sm font-medium text-white/70 mb-1">Daily Average</h3>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(data.avg_daily_spending || 0, user?.currency)}</p>
                            <p className="text-xs text-white/70 mt-2">This month</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent Expenses */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border"
            >
                <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Recent Expenses</h3>
                {data.recent_expenses?.length > 0 ? (
                    <div className="space-y-3">
                        {data.recent_expenses.map((expense, i) => (
                            <div key={expense.id || i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-border last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: (expense.category_color || '#D53E0F') + '20' }}>
                                        💰
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{expense.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{expense.category_name} • {expense.date}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-danger">- {formatCurrency(expense.amount, user?.currency)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">No expenses yet. Start tracking!</p>
                )}
            </motion.div>
        </div>
    );
}
