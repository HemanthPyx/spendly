import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlinePlus, HiOutlineX, HiOutlinePencil, HiOutlineTrash,
    HiOutlineCheck, HiOutlineClock, HiOutlineExclamation,
    HiOutlineSwitchHorizontal
} from 'react-icons/hi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const initialFormState = {
    person_name: '',
    amount: '',
    debt_type: 'borrowed',
    reason: '',
    due_date: '',
    priority: 'normal',
};

export default function Debts() {
    const [debts, setDebts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [filter, setFilter] = useState('all'); // all, active, paid
    const [typeFilter, setTypeFilter] = useState('all'); // all, borrowed, lent

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [debtsRes, summaryRes] = await Promise.all([
                api.get('/debts/'),
                api.get('/debts/summary/'),
            ]);
            setDebts(debtsRes.data.results || debtsRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            toast.error('Failed to load debts.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingDebt(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.person_name || !formData.amount) {
            toast.error('Person name and amount are required.');
            return;
        }
        try {
            if (editingDebt) {
                await api.put(`/debts/${editingDebt.id}/`, formData);
                toast.success('Debt updated! ✏️');
            } else {
                await api.post('/debts/', formData);
                toast.success('Debt added! 💰');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            toast.error('Failed to save debt.');
        }
    };

    const handleEdit = (debt) => {
        setEditingDebt(debt);
        setFormData({
            person_name: debt.person_name,
            amount: debt.amount,
            debt_type: debt.debt_type,
            reason: debt.reason,
            due_date: debt.due_date || '',
            priority: debt.priority,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this debt?')) return;
        try {
            await api.delete(`/debts/${id}/`);
            toast.success('Debt deleted!');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete debt.');
        }
    };

    const handleMarkPaid = async (debt) => {
        if (debt.is_paid) return;
        const confirmMessage = debt.debt_type === 'borrowed'
            ? `Mark as paid? This will auto-create an expense of ${formatCurrency(debt.amount, user?.currency)} for "${debt.person_name}".`
            : `Mark as received from "${debt.person_name}"?`;
        if (!window.confirm(confirmMessage)) return;
        try {
            await api.post(`/debts/${debt.id}/mark_paid/`);
            toast.success(debt.debt_type === 'borrowed' ? 'Debt paid! Expense created. ✅' : 'Payment received! ✅');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to mark as paid.');
        }
    };

    const filteredDebts = debts.filter(d => {
        if (filter === 'active' && d.is_paid) return false;
        if (filter === 'paid' && !d.is_paid) return false;
        if (typeFilter === 'borrowed' && d.debt_type !== 'borrowed') return false;
        if (typeFilter === 'lent' && d.debt_type !== 'lent') return false;
        return true;
    });

    const priorityColors = {
        urgent: 'text-red-500 bg-red-50 dark:bg-red-900/20',
        normal: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
        low: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    };

    if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Debt Tracker</h1>
                    <p className="text-gray-500 text-sm">Track money you've borrowed or lent</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/30 w-full sm:w-auto justify-center"
                >
                    <HiOutlinePlus className="w-5 h-5" /> Add Debt
                </button>
            </div>

            {/* Stats Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.total_borrowed, user?.currency)}</p>
                        <p className="text-sm text-gray-500">Borrowed</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-2xl font-bold text-blue-500">{formatCurrency(summary.total_lent, user?.currency)}</p>
                        <p className="text-sm text-gray-500">Lent Out</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-2xl font-bold text-accent">{formatCurrency(summary.total_outstanding, user?.currency)}</p>
                        <p className="text-sm text-gray-500">Outstanding</p>
                    </div>
                    <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-bold text-success">{formatCurrency(summary.total_paid, user?.currency)}</p>
                        <p className="text-sm text-gray-500">Settled</p>
                    </div>
                </div>
            )}

            {/* Overdue Alert */}
            {summary && summary.overdue_count > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3"
                >
                    <HiOutlineExclamation className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-red-700 dark:text-red-400">
                            {summary.overdue_count} overdue debt{summary.overdue_count > 1 ? 's' : ''}!
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300">
                            Please settle your overdue payments as soon as possible.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                    {['all', 'active', 'paid'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${filter === f
                                ? 'bg-primary text-white'
                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                    {['all', 'borrowed', 'lent'].map(f => (
                        <button
                            key={f}
                            onClick={() => setTypeFilter(f)}
                            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${typeFilter === f
                                ? 'bg-accent text-white'
                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Debt List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {filteredDebts.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <HiOutlineSwitchHorizontal className="w-16 h-16 mx-auto mb-3 opacity-30" />
                            <p className="text-lg">No debts found</p>
                            <p className="text-sm">Add a new debt to start tracking</p>
                        </div>
                    )}
                    {filteredDebts.map((debt, index) => (
                        <motion.div
                            key={debt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white dark:bg-dark-card rounded-2xl p-4 border transition-all hover:shadow-md ${
                                debt.is_paid
                                    ? 'border-success/30 opacity-70'
                                    : debt.is_overdue
                                        ? 'border-red-300 dark:border-red-800'
                                        : 'border-gray-100 dark:border-dark-border'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Left: Info */}
                                <div className="flex items-start gap-3 flex-grow min-w-0">
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        debt.debt_type === 'borrowed'
                                            ? 'bg-red-50 dark:bg-red-900/20'
                                            : 'bg-blue-50 dark:bg-blue-900/20'
                                    }`}>
                                        <HiOutlineSwitchHorizontal className={`w-5 h-5 ${
                                            debt.debt_type === 'borrowed' ? 'text-red-500' : 'text-blue-500'
                                        }`} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-primary dark:text-surface">
                                                {debt.person_name}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                debt.debt_type === 'borrowed'
                                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {debt.debt_type === 'borrowed' ? '↓ Borrowed' : '↑ Lent'}
                                            </span>
                                            {debt.is_paid && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 font-medium">
                                                    ✅ Paid
                                                </span>
                                            )}
                                            {debt.is_overdue && !debt.is_paid && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium animate-pulse">
                                                    ⚠️ Overdue
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[debt.priority]}`}>
                                                {debt.priority}
                                            </span>
                                        </div>
                                        {debt.reason && (
                                            <p className="text-sm text-gray-500 mt-1 truncate">{debt.reason}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                            <span>Added {new Date(debt.created_at).toLocaleDateString()}</span>
                                            {debt.due_date && (
                                                <span className="flex items-center gap-1">
                                                    <HiOutlineClock className="w-3 h-3" />
                                                    Due {new Date(debt.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            {debt.paid_date && (
                                                <span className="text-green-500">
                                                    Paid on {new Date(debt.paid_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Amount + Actions */}
                                <div className="flex items-center gap-3 justify-between sm:justify-end">
                                    <p className={`text-lg font-bold whitespace-nowrap ${
                                        debt.is_paid ? 'text-gray-400 line-through' : 'text-accent'
                                    }`}>
                                        {formatCurrency(debt.amount, user?.currency)}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {!debt.is_paid && (
                                            <button
                                                onClick={() => handleMarkPaid(debt)}
                                                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                title="Mark as Paid"
                                            >
                                                <HiOutlineCheck className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(debt)}
                                            className="p-2 text-primary dark:text-surface hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <HiOutlinePencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(debt.id)}
                                            className="p-2 text-accent hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-dark-border max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-primary dark:text-surface">
                                    {editingDebt ? 'Edit Debt' : 'Add New Debt'}
                                </h2>
                                <button onClick={() => { setShowModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Debt Type Toggle */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Type</label>
                                    <div className="flex gap-2">
                                        <button type="button"
                                            onClick={() => setFormData(f => ({ ...f, debt_type: 'borrowed' }))}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                                                formData.debt_type === 'borrowed'
                                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                    : 'bg-gray-100 dark:bg-dark-bg text-gray-500'
                                            }`}
                                        >
                                            ↓ I Borrowed
                                        </button>
                                        <button type="button"
                                            onClick={() => setFormData(f => ({ ...f, debt_type: 'lent' }))}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                                                formData.debt_type === 'lent'
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-gray-100 dark:bg-dark-bg text-gray-500'
                                            }`}
                                        >
                                            ↑ I Lent
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formData.debt_type === 'borrowed' ? 'Borrowed From' : 'Lent To'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.person_name}
                                        onChange={e => setFormData(f => ({ ...f, person_name: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-primary dark:text-surface focus:ring-2 focus:ring-accent/50 outline-none"
                                        placeholder="e.g. John, Mom, Ravi..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-primary dark:text-surface focus:ring-2 focus:ring-accent/50 outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                                    <input
                                        type="text"
                                        value={formData.reason}
                                        onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
                                        className="w-full mt-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-primary dark:text-surface focus:ring-2 focus:ring-accent/50 outline-none"
                                        placeholder="e.g. Movie tickets, lunch, rent..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.due_date}
                                            onChange={e => setFormData(f => ({ ...f, due_date: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-primary dark:text-surface focus:ring-2 focus:ring-accent/50 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={e => setFormData(f => ({ ...f, priority: e.target.value }))}
                                            className="w-full mt-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-primary dark:text-surface focus:ring-2 focus:ring-accent/50 outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/30"
                                >
                                    {editingDebt ? 'Update Debt' : 'Add Debt'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
