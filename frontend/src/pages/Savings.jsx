import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineX, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

export default function Savings() {
    const [goals, setGoals] = useState([]);
    const [monthly, setMonthly] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formData, setFormData] = useState({ name: '', target_amount: '', current_amount: 0, deadline: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [goalsRes, monthlyRes] = await Promise.all([
                api.get('/savings/goals/'),
                api.get('/savings/monthly/').catch(() => null),
            ]);
            setGoals(goalsRes.data.results || goalsRes.data);
            if (monthlyRes?.data) setMonthly(monthlyRes.data);
        } catch (err) {
            toast.error('Failed to load savings data.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', target_amount: '', current_amount: 0, deadline: '' });
        setEditingGoal(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: current amount cannot exceed target amount
        if (Number(formData.current_amount) > Number(formData.target_amount)) {
            toast.error('Current amount cannot exceed the target amount.');
            return;
        }

        try {
            if (editingGoal) {
                await api.put(`/savings/goals/${editingGoal.id}/`, formData);
                toast.success('Savings goal updated! ✏️');
            } else {
                await api.post('/savings/goals/', formData);
                toast.success('Savings goal created! 🎯');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            toast.error('Failed to save goal.');
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount,
            deadline: goal.deadline || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this savings goal?')) return;
        try {
            await api.delete(`/savings/goals/${id}/`);
            toast.success('Goal deleted!');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete goal.');
        }
    };

    const updateAmount = async (goal, addedAmount) => {
        const newTotal = Number(goal.current_amount) + Number(addedAmount);
        
        if (newTotal > Number(goal.target_amount)) {
            toast.error(`Cannot add ${formatCurrency(addedAmount, user?.currency)}. Total would exceed the target amount of ${formatCurrency(goal.target_amount, user?.currency)}.`);
            return;
        }

        try {
            await api.patch(`/savings/goals/${goal.id}/`, { current_amount: newTotal });
            toast.success('Progress updated!');
            fetchData();
        } catch (err) {
            toast.error('Failed to update progress.');
        }
    };

    if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Savings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track your savings and set goals</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium shadow-lg shadow-accent/30">
                    <HiOutlinePlus className="w-5 h-5" /> New Goal
                </motion.button>
            </div>

            {/* Monthly Summary */}
            {monthly && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-sm text-gray-500">Monthly Income</p>
                        <p className="text-2xl font-bold text-success mt-1">{formatCurrency(monthly.total_income, user?.currency)}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-sm text-gray-500">Monthly Expenses</p>
                        <p className="text-2xl font-bold text-danger mt-1">{formatCurrency(monthly.total_expenses, user?.currency)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-center text-white">
                        <p className="text-sm text-white/60">Monthly Savings</p>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(monthly.savings, user?.currency)}</p>
                    </div>
                </div>
            )}

            {/* Goals */}
            <h2 className="text-lg font-semibold text-primary dark:text-surface">Savings Goals</h2>
            {goals.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><div className="text-5xl mb-3">🎯</div><p>No savings goals yet.</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal, i) => (
                        <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
                            
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{goal.name}</h3>
                                        {goal.is_completed && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-lg font-medium inline-block mt-1">Completed ✓</span>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(goal)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-info transition-colors">
                                            <HiOutlinePencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-danger transition-colors">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between mb-3">
                                    <p className="text-sm text-gray-500">
                                        {formatCurrency(goal.current_amount, user?.currency)} / {formatCurrency(goal.target_amount, user?.currency)}
                                    </p>
                                    <p className="text-lg font-bold text-accent">{goal.progress_percentage}%</p>
                                </div>
                                <div className="h-2.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden mb-3">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                                        transition={{ duration: 1 }} className={`h-full rounded-full ${goal.progress_percentage >= 100 ? 'bg-success' : 'bg-gradient-to-r from-accent to-secondary'}`} />
                                </div>
                                {goal.deadline && <p className="text-xs text-gray-400">Deadline: {goal.deadline}</p>}
                            </div>

                            {!goal.is_completed && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                                    <input type="number" placeholder={`Add more funds (${user?.currency || '₹'})`} required
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                                        onKeyDown={(e) => { 
                                            if (e.key === 'Enter' && e.target.value) { 
                                                updateAmount(goal, Number(e.target.value)); 
                                                e.target.value = ''; 
                                            } 
                                        }} 
                                    />
                                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">Press Enter</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface">
                                    {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Emergency Fund" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount</label>
                                        <input type="number" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                            placeholder="100000" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Saved</label>
                                        <input type="number" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                            placeholder="0" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline (Optional)</label>
                                    <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all">
                                        {editingGoal ? 'Update Goal' : 'Create Goal'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
