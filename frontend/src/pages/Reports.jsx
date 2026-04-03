import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineDownload } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
    const [reportType, setReportType] = useState('monthly');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => { fetchReport(); }, [reportType, month, year]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/?type=${reportType}&month=${month}&year=${year}`);
            setData(res.data);
        } catch (err) {
            toast.error('Failed to load report.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const res = await api.get(`/reports/export/?format=${format}&month=${month}&year=${year}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses_${month}_${year}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Report exported as ${format.toUpperCase()}! 📄`);
        } catch (err) {
            toast.error('Export failed.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generate financial reports</p>
                </div>
                <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all">
                        <HiOutlineDownload className="w-4 h-4" /> PDF
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all">
                        <HiOutlineDownload className="w-4 h-4" /> Excel
                    </motion.button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
                {['monthly', 'weekly', 'category'].map((t) => (
                    <button key={t} onClick={() => setReportType(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${reportType === t ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-accent'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none text-sm">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none text-sm">
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
            ) : !data ? null : (
                <div className="space-y-6">
                    {/* Summary */}
                    {data.type !== 'category' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {data.total_income !== undefined && (
                                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                                    <p className="text-sm text-gray-500">Income</p>
                                    <p className="text-2xl font-bold text-success">{formatCurrency(data.total_income || 0, user?.currency)}</p>
                                </div>
                            )}
                            <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                                <p className="text-sm text-gray-500">Expenses</p>
                                <p className="text-2xl font-bold text-danger">{formatCurrency(data.total_expenses || 0, user?.currency)}</p>
                            </div>
                            {data.savings !== undefined && (
                                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                                    <p className="text-sm text-gray-500">Savings</p>
                                    <p className={`text-2xl font-bold ${data.savings >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(data.savings || 0, user?.currency)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category Summary */}
                    {data.type === 'category' && data.categories && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border">
                            <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Category Breakdown</h3>
                            <div className="space-y-3">
                                {data.categories.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-border last:border-0">
                                        <div className="flex items-center gap-3">
                                            {cat.color && <span className="w-3 h-3 rounded-full" style={{ background: cat.color }}></span>}
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">{cat.count} expense{cat.count !== 1 ? 's' : ''}</span>
                                            <span className="font-bold text-accent">{formatCurrency(cat.total, user?.currency)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Weekly Chart */}
                    {data.type === 'weekly' && data.weekly_summary && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border">
                            <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Weekly Spending</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.weekly_summary} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => formatCurrency(val, user?.currency)} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value) => [formatCurrency(value, user?.currency), 'Spent']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="amount" fill="#D53E0F" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Expense List */}
                    {data.expenses && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border">
                            <h3 className="text-lg font-semibold text-primary dark:text-surface mb-4">Expenses ({data.expenses.length})</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-dark-border">
                                            <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                                            <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                                            <th className="text-left py-2 text-gray-500 font-medium">Category</th>
                                            <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.expenses.map((exp, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                                                <td className="py-2 text-gray-600 dark:text-gray-400">{exp.date}</td>
                                                <td className="py-2 text-gray-800 dark:text-gray-200">{exp.description}</td>
                                                <td className="py-2 text-gray-500">{exp.category_name || 'N/A'}</td>
                                                <td className="py-2 text-right font-medium text-danger">{formatCurrency(exp.amount, user?.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
