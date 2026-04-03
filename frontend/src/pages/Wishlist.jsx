import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
const priorityConfig = {
    low: { label: 'Low', color: 'bg-info/10 text-info border-info/30' },
    medium: { label: 'Medium', color: 'bg-warning/10 text-warning border-warning/30' },
    high: { label: 'High', color: 'bg-danger/10 text-danger border-danger/30' },
};

export default function Wishlist() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({ name: '', price: '', priority: 'medium', notes: '', link: '' });

    useEffect(() => { fetchItems(); }, [filter]);

    const fetchItems = async () => {
        try {
            let url = '/wishlist/';
            if (filter !== 'all') url += `?is_purchased=${filter === 'purchased'}`;
            const res = await api.get(url);
            setItems(res.data.results || res.data);
        } catch (err) {
            toast.error('Failed to load wishlist.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/wishlist/', formData);
            toast.success('Added to wishlist! 💝');
            setShowModal(false);
            setFormData({ name: '', price: '', priority: 'medium', notes: '', link: '' });
            fetchItems();
        } catch (err) {
            toast.error('Failed to add item.');
        }
    };

    const handlePurchase = async (id) => {
        try {
            await api.post(`/wishlist/${id}/purchase/`);
            toast.success('Marked as purchased! ✅');
            fetchItems();
        } catch (err) {
            toast.error('Failed to update.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove from wishlist?')) return;
        try {
            await api.delete(`/wishlist/${id}/`);
            toast.success('Removed from wishlist!');
            fetchItems();
        } catch (err) {
            toast.error('Failed to delete.');
        }
    };

    const totalPrice = items.filter(i => !i.is_purchased).reduce((sum, i) => sum + Number(i.price), 0);
    const completedCount = items.filter(i => i.is_purchased).length;
    const totalSpent = items.filter(i => i.is_purchased).reduce((sum, i) => sum + Number(i.price), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Wishlist</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track things you want to buy</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium shadow-lg shadow-accent/30">
                    <HiOutlinePlus className="w-5 h-5" /> Add Item
                </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                    <p className="text-2xl font-bold text-primary dark:text-surface">{items.length}</p>
                    <p className="text-sm text-gray-500">Total Items</p>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                    <p className="text-2xl font-bold text-success">{completedCount}</p>
                    <p className="text-sm text-gray-500">Purchased</p>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                    <p className="text-2xl font-bold text-accent">{formatCurrency(totalPrice, user?.currency)}</p>
                    <p className="text-sm text-gray-500">Pending Total</p>
                </div>
                <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 dark:bg-dark-card rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-success">{formatCurrency(totalSpent, user?.currency)}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['all', 'pending', 'purchased'].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-accent'}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Items */}
            {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-6xl mb-4">🛍️</div><p>Your wishlist is empty</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {items.map((item, i) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all ${item.is_purchased ? 'opacity-70' : ''}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${item.is_purchased ? 'line-through' : ''}`}>{item.name}</h3>
                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium border mt-1 ${priorityConfig[item.priority]?.color}`}>
                                            {priorityConfig[item.priority]?.label}
                                        </span>
                                    </div>
                                    <p className="text-xl font-bold text-accent">{formatCurrency(item.price, user?.currency)}</p>
                                </div>
                                {item.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.notes}</p>}
                                <div className="flex items-center justify-between">
                                    {item.is_purchased ? (
                                        <span className="text-sm text-success font-medium flex items-center gap-1"><HiOutlineCheck className="w-4 h-4" /> Purchased {item.purchased_date}</span>
                                    ) : (
                                        <button onClick={() => handlePurchase(item.id)}
                                            className="flex items-center gap-1 text-sm text-success font-medium hover:underline"><HiOutlineCheck className="w-4 h-4" /> Mark Purchased</button>
                                    )}
                                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <HiOutlineTrash className="w-4 h-4 text-danger" /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface">Add to Wishlist</h3>
                                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Item name" required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder={`Price (${user?.currency || '₹'})`} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none" />
                                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none">
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Notes (optional)" rows="2" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none resize-none" />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">Cancel</button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all">Add Item</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
