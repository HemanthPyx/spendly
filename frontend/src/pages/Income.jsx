import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function Income() {
    const [incomes, setIncomes] = useState([]);
    const [budget, setBudget] = useState(null);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [incomeForm, setIncomeForm] = useState({ amount: '', source: 'Salary', month: currentMonth, year: currentYear, notes: '' });
    const [budgetForm, setBudgetForm] = useState({ amount: '', month: currentMonth, year: currentYear, carry_forward: 0 });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [incRes, budRes] = await Promise.all([
                api.get('/incomes/'),
                api.get(`/budgets/current/`).catch(() => null),
            ]);
            setIncomes(incRes.data.results || incRes.data);
            if (budRes?.data) setBudget(budRes.data);
        } catch (err) {
            toast.error('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingIncome) {
                await api.put(`/incomes/${editingIncome.id}/`, incomeForm);
                toast.success('Income updated!');
            } else {
                await api.post('/incomes/', incomeForm);
                toast.success('Income added! 💵');
            }
            setShowIncomeModal(false);
            setEditingIncome(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save income.');
        }
    };

    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        try {
            if (budget?.id) {
                await api.put(`/budgets/${budget.id}/`, budgetForm);
            } else {
                await api.post('/budgets/', budgetForm);
            }
            toast.success('Budget saved! 🎯');
            setShowBudgetModal(false);
            fetchData();
        } catch (err) {
            toast.error('Failed to save budget.');
        }
    };

    const handleDeleteIncome = async (id) => {
        if (!window.confirm('Delete this income entry?')) return;
        try {
            await api.delete(`/incomes/${id}/`);
            toast.success('Income deleted!');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete.');
        }
    };

    if (loading) {
        return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Income & Budget</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your income and monthly budget</p>
                </div>
                <div className="flex gap-3">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setIncomeForm({ amount: '', source: 'Salary', month: currentMonth, year: currentYear, notes: '' }); setEditingIncome(null); setShowIncomeModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium shadow-lg shadow-accent/30 cursor-pointer">
                        <HiOutlinePlus className="w-5 h-5" /> Add Income
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setBudgetForm({ amount: budget?.amount || '', month: currentMonth, year: currentYear, carry_forward: budget?.carry_forward || 0 }); setShowBudgetModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-accent text-accent hover:bg-accent hover:text-white font-medium transition-all cursor-pointer">
                        🎯 Set Budget
                    </motion.button>
                </div>
            </div>

            {/* Budget Card */}
            {budget && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium text-white/70 mb-2">Monthly Budget</h3>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold">{formatCurrency(budget.amount, user?.currency)}</p>
                            <p className="text-sm text-white/60 mt-1">
                                Spent: {formatCurrency(budget.total_expenses, user?.currency)} | Remaining: {formatCurrency(budget.remaining, user?.currency)}
                            </p>
                        </div>
                        <div className={`text-xl font-bold px-3 py-1 rounded-xl ${budget.percentage_used >= 100 ? 'bg-danger/30' : budget.percentage_used >= 80 ? 'bg-warning/30' : 'bg-success/30'}`}>
                            {budget.percentage_used}%
                        </div>
                    </div>
                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full ${budget.percentage_used >= 100 ? 'bg-danger' : budget.percentage_used >= 80 ? 'bg-warning' : 'bg-white'}`} />
                    </div>
                </motion.div>
            )}

            {/* Income List */}
            <div>
                <h2 className="text-lg font-semibold text-primary dark:text-surface mb-3">Income Entries</h2>
                {incomes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-5xl mb-3">💵</div>
                        <p>No income entries yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incomes.map((income, i) => (
                            <motion.div key={income.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-border flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{income.source}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{income.month}/{income.year} {income.notes && `• ${income.notes}`}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-success">+ {formatCurrency(income.amount, user?.currency)}</span>
                                    <button onClick={() => { setEditingIncome(income); setIncomeForm({ amount: income.amount, source: income.source, month: income.month, year: income.year, notes: income.notes }); setShowIncomeModal(true); }}
                                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><HiOutlinePencil className="w-4 h-4 text-info" /></button>
                                    <button onClick={() => handleDeleteIncome(income.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><HiOutlineTrash className="w-4 h-4 text-danger" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Income Modal */}
            <AnimatePresence>
                {showIncomeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface">{editingIncome ? 'Edit Income' : 'Add Income'}</h3>
                                <button onClick={() => { setShowIncomeModal(false); setEditingIncome(null); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleIncomeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({user?.currency || '₹'})</label>
                                    <input type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                                        placeholder="20000" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
                                    <input type="text" value={incomeForm.source} onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                                        placeholder="Salary" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                                        <select value={incomeForm.month} onChange={(e) => setIncomeForm({ ...incomeForm, month: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none">
                                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                                        <input type="number" value={incomeForm.year} onChange={(e) => setIncomeForm({ ...incomeForm, year: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowIncomeModal(false); setEditingIncome(null); }}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all cursor-pointer">
                                        {editingIncome ? 'Update' : 'Add Income'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Budget Modal */}
            <AnimatePresence>
                {showBudgetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface">Set Monthly Budget</h3>
                                <button onClick={() => setShowBudgetModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleBudgetSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Amount ({user?.currency || '₹'})</label>
                                    <input type="number" value={budgetForm.amount} onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                                        placeholder="15000" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carry Forward ({user?.currency || '₹'})</label>
                                    <input type="number" value={budgetForm.carry_forward} onChange={(e) => setBudgetForm({ ...budgetForm, carry_forward: e.target.value })}
                                        placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowBudgetModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all cursor-pointer">Save Budget</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
