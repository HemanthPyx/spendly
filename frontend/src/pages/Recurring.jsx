import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
export default function Recurring() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ description: '', amount: '', category: '', frequency: 'monthly', next_due_date: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [itemsRes, catRes] = await Promise.all([
                api.get('/recurring/'),
                api.get('/categories/'),
            ]);
            setItems(itemsRes.data.results || itemsRes.data);
            setCategories(catRes.data.results || catRes.data);
        } catch (err) {
            toast.error('Failed to load recurring payments.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ description: '', amount: '', category: '', frequency: 'monthly', next_due_date: '' });
        setEditingItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/recurring/${editingItem.id}/`, formData);
                toast.success('Recurring payment updated! ✏️');
            } else {
                await api.post('/recurring/', formData);
                toast.success('Recurring payment added! 🔄');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save.');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            description: item.description,
            amount: item.amount,
            category: item.category || '',
            frequency: item.frequency,
            next_due_date: item.next_due_date,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this recurring payment?')) return;
        try {
            await api.delete(`/recurring/${id}/`);
            toast.success('Deleted!');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete.');
        }
    };

    const handleProcessDue = async () => {
        try {
            const res = await api.post('/recurring/process_due/');
            toast.success(res.data.detail);
            fetchData();
        } catch (err) {
            toast.error('Failed to process.');
        }
    };

    const freqColors = { monthly: 'bg-info/10 text-info', weekly: 'bg-success/10 text-success', yearly: 'bg-warning/10 text-warning' };

    if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Recurring Payments</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track fixed monthly expenses</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleProcessDue}
                        className="px-4 py-2.5 rounded-xl border-2 border-accent text-accent hover:bg-accent hover:text-white font-medium transition-all text-sm">
                        ⚡ Process Due
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium shadow-lg shadow-accent/30">
                        <HiOutlinePlus className="w-5 h-5" /> Add
                    </motion.button>
                </div>
            </div>


            {/* Total */}
            {items.length > 0 && (
                <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-white text-center">
                    <p className="text-sm text-white/60">Total Monthly Recurring</p>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(items.filter(i => i.frequency === 'monthly').reduce((s, i) => s + Number(i.amount), 0), user?.currency)}</p>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🔄</div><p>No recurring payments</p></div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0">🔄</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.description}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium shrink-0 ${freqColors[item.frequency]}`}>{item.frequency}</span>
                                            <span className="text-xs text-gray-400 shrink-0">{item.category_name || 'No category'}</span>
                                            <span className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis w-full sm:w-auto mt-1 sm:mt-0">• Next: {item.next_due_date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-dark-border">
                                    <span className="text-lg font-bold text-accent">- {formatCurrency(item.amount, user?.currency)}</span>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => handleEdit(item)}
                                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <HiOutlinePencil className="w-4 h-4 text-info" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <HiOutlineTrash className="w-4 h-4 text-danger" />
                                        </button>
                                    </div>
                                </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Total */}
            {/* {items.length > 0 && (
                <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-white text-center">
                    <p className="text-sm text-white/60">Total Monthly Recurring</p>
                    <p className="text-3xl font-bold mt-1">₹{items.filter(i => i.frequency === 'monthly').reduce((s, i) => s + Number(i.amount), 0).toLocaleString('en-IN')}</p>
                </div>
            )} */}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface">
                                    {editingItem ? 'Edit Recurring Payment' : 'Add Recurring Payment'}
                                </h3>
                                <button onClick={() => { setShowModal(false); resetForm(); }}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. Netflix, Rent, EMI" required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({user?.currency || '₹'})</label>
                                        <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="500" required
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                                        <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none">
                                            <option value="monthly">Monthly</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none">
                                        <option value="">Select category</option>
                                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</label>
                                    <input type="date" value={formData.next_due_date} onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                                        required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all">
                                        {editingItem ? 'Update' : 'Add'}
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
