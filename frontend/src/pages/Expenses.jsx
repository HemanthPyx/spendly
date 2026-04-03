import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineX, HiOutlineTag, HiOutlineFilter, HiOutlineMicrophone } from 'react-icons/hi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const PRESET_COLORS = ['#D53E0F', '#9B0F06', '#5E0006', '#059669', '#2563EB', '#7C3AED', '#EE8A00', '#DC2626', '#0891B2', '#DB2777'];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [formData, setFormData] = useState({
        description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '', receipt: null
    });
    const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📁', color: '#D53E0F' });
    const [isScanning, setIsScanning] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Advanced Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [ordering, setOrdering] = useState('-date');
    const [showFilters, setShowFilters] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, [search, filterCategory, dateFrom, dateTo, minAmount, maxAmount, ordering]);

    const fetchExpenses = async () => {
        try {
            let url = '/expenses/?';
            if (search) url += `search=${search}&`;
            if (filterCategory) url += `category=${filterCategory}&`;
            if (dateFrom) url += `date_from=${dateFrom}&`;
            if (dateTo) url += `date_to=${dateTo}&`;
            if (minAmount) url += `min_amount=${minAmount}&`;
            if (maxAmount) url += `max_amount=${maxAmount}&`;
            if (ordering) url += `ordering=${ordering}&`;
            const res = await api.get(url);
            setExpenses(res.data.results || res.data);
        } catch (err) {
            toast.error('Failed to load expenses.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories/');
            setCategories(res.data.results || res.data);
        } catch (err) { /* silent */ }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const submitData = new FormData();
        submitData.append('description', formData.description);
        submitData.append('amount', formData.amount);
        submitData.append('category', formData.category);
        submitData.append('date', formData.date);
        submitData.append('notes', formData.notes);
        if (formData.receipt) {
            submitData.append('receipt', formData.receipt);
        }

        try {
            if (editingExpense) {
                await api.put(`/expenses/${editingExpense.id}/`, submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Expense updated! ✏️');
            } else {
                await api.post('/expenses/', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Expense added! 💰');
            }
            setShowModal(false);
            setEditingExpense(null);
            resetForm();
            fetchExpenses();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save expense.');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            notes: expense.notes || '',
            receipt: null // Reset file input on edit
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}/`);
            toast.success('Expense deleted! 🗑️');
            fetchExpenses();
        } catch (err) {
            toast.error('Failed to delete expense.');
        }
    };

    const resetForm = () => {
        setFormData({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '', receipt: null });
        setIsScanning(false);
    };

    const handleScanReceipt = async () => {
        if (!formData.receipt) {
            toast.error('Please select a receipt image first.');
            return;
        }
        setIsScanning(true);
        const scanData = new FormData();
        scanData.append('receipt', formData.receipt);
        try {
            const res = await api.post('/expenses/ocr/', scanData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const { amount, date, description, category_name } = res.data;
            
            const matchedCategory = categories.find(c => c.name.toLowerCase() === category_name?.toLowerCase());
            
            setFormData(prev => ({
                ...prev,
                amount: amount || prev.amount,
                date: date || prev.date,
                description: description || prev.description,
                category: matchedCategory ? matchedCategory.id : prev.category
            }));
            
            toast.success('Receipt scanned successfully! ✨');
        } catch (err) {
            toast.error('Failed to scan receipt.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Voice recognition is not supported in your browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            toast.info('Listening... Speak now 🎤 (e.g., "Spent 500 on Food")');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            
            // Extract amount
            const amountMatch = transcript.match(/\d+(\.\d{1,2})?/);
            const amount = amountMatch ? amountMatch[0] : '';
            
            // Extract category
            let matchedCategory = '';
            for (const cat of categories) {
                if (transcript.includes(cat.name.toLowerCase())) {
                    matchedCategory = cat.id;
                    break;
                }
            }
            
            setFormData(prev => ({
                ...prev,
                amount: amount || prev.amount,
                category: matchedCategory || prev.category,
                description: transcript.charAt(0).toUpperCase() + transcript.slice(1),
            }));
            
            toast.success('Voice input processed! ✨');
        };

        recognition.onerror = (event) => {
            toast.error(`Voice error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // ─── Category Handlers ───
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!categoryForm.name.trim()) {
            toast.error('Category name is required.');
            return;
        }
        try {
            await api.post('/categories/', categoryForm);
            toast.success('Category added! 🏷️');
            setCategoryForm({ name: '', icon: '📁', color: '#D53E0F' });
            setShowCategoryModal(false);
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.name?.[0] || 'Failed to add category.');
        }
    };

    const handleDeleteCategory = async (id, isDefault) => {
        if (isDefault) {
            toast.error('Default categories cannot be deleted.');
            return;
        }
        if (!window.confirm('Delete this category? Expenses using it will become uncategorized.')) return;
        try {
            await api.delete(`/categories/${id}/`);
            toast.success('Category deleted!');
            fetchCategories();
        } catch (err) {
            toast.error('Failed to delete category.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-surface">Expenses</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your daily expenses</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium transition-all cursor-pointer ${showFilters ? 'border-accent bg-accent text-white' : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}
                    >
                        <HiOutlineFilter className="w-5 h-5" /> Filters
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCategoryManager(!showCategoryManager)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium transition-all cursor-pointer ${showCategoryManager ? 'border-accent bg-accent text-white' : 'border-accent text-accent hover:bg-accent hover:text-white'}`}
                    >
                        <HiOutlineTag className="w-5 h-5" /> Categories
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { resetForm(); setEditingExpense(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium shadow-lg shadow-accent/30 hover:shadow-xl transition-all cursor-pointer"
                    >
                        <HiOutlinePlus className="w-5 h-5" /> Add Expense
                    </motion.button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date From</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-accent" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date To</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-accent" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount Range ({user?.currency || '₹'})</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={minAmount} onChange={(e) => setMinAmount(e.target.value)}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-accent" />
                                    <span className="text-gray-400">-</span>
                                    <input type="number" placeholder="Max" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-accent" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sort By</label>
                                <select value={ordering} onChange={(e) => setOrdering(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-accent">
                                    <option value="-date">Newest First</option>
                                    <option value="date">Oldest First</option>
                                    <option value="-amount">Highest Amount</option>
                                    <option value="amount">Lowest Amount</option>
                                </select>
                            </div>
                            <div className="col-span-full flex justify-end">
                                <button onClick={() => { setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount(''); setOrdering('-date'); }}
                                    className="text-sm text-accent hover:underline font-medium">
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Category Manager */}
            <AnimatePresence>
                {showCategoryManager && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-primary dark:text-surface">Categories</h3>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCategoryModal(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium"
                                >
                                    <HiOutlinePlus className="w-4 h-4" /> Add Custom
                                </motion.button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-sm group"
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ background: cat.color || '#D53E0F' }}
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">{cat.icon} {cat.name}</span>
                                        {cat.is_default ? (
                                            <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-dark-border px-1.5 py-0.5 rounded-md">default</span>
                                        ) : (
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id, cat.is_default)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                                            >
                                                <HiOutlineX className="w-3.5 h-3.5 text-danger" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search expenses..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <select
                    value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Expenses List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
                </div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">💸</div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No expenses found</h3>
                    <p className="text-gray-400 mt-1">Start tracking your spending!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {expenses.map((expense, i) => (
                            <motion.div
                                key={expense.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-start sm:items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                                        style={{ background: (expense.category_color || '#D53E0F') + '15', color: expense.category_color || '#D53E0F' }}
                                    >
                                        {expense.category_icon || expense.category_name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{expense.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {expense.category_name || 'Uncategorized'} • {expense.date}
                                        </p>
                                        {expense.notes && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{expense.notes}</p>
                                        )}
                                        {expense.receipt && (
                                            <a href={expense.receipt} target="_blank" rel="noopener noreferrer" 
                                               className="inline-flex items-center gap-1 mt-1 text-xs text-info hover:underline">
                                                <span>📎 View Receipt</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-dark-border">
                                    <span className="text-lg font-bold text-danger">- {formatCurrency(expense.amount, user?.currency)}</span>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(expense)}
                                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <HiOutlinePencil className="w-4 h-4 text-info" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <HiOutlineTrash className="w-4 h-4 text-danger" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add/Edit Expense Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface flex items-center gap-3">
                                    {editingExpense ? 'Edit Expense' : 'Add Expense'}
                                    <button 
                                        type="button" 
                                        onClick={handleVoiceInput}
                                        disabled={isListening}
                                        className={`p-2 rounded-full transition-colors ${isListening ? 'bg-danger text-white animate-pulse' : 'bg-info/10 text-info hover:bg-info/20'}`}
                                        title="Voice Fill"
                                    >
                                        <HiOutlineMicrophone className="w-5 h-5" />
                                    </button>
                                </h3>
                                <button onClick={() => { setShowModal(false); setEditingExpense(null); }}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <input
                                        type="text" value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. Lunch at restaurant" required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({user?.currency || '₹'})</label>
                                        <input
                                            type="number" value={formData.amount} step="0.01"
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00" required
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                        <input
                                            type="date" value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Image (Optional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFormData({ ...formData, receipt: e.target.files[0] })}
                                            className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
                                        />
                                        {formData.receipt && (
                                            <button 
                                                type="button" 
                                                onClick={handleScanReceipt} 
                                                disabled={isScanning}
                                                className="shrink-0 px-4 py-2 rounded-xl bg-info/10 text-info font-medium hover:bg-info/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {isScanning ? 'Scanning...' : '✨ Auto-fill'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                        rows="2"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowModal(false); setEditingExpense(null); }}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all cursor-pointer">
                                        {editingExpense ? 'Update' : 'Add Expense'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Category Modal */}
            <AnimatePresence>
                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-primary dark:text-surface">Add Custom Category</h3>
                                <button onClick={() => setShowCategoryModal(false)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface">
                                    <HiOutlineX className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                                    <input
                                        type="text" value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        placeholder="e.g. Groceries, Gym, Subscriptions"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (emoji)</label>
                                    <input
                                        type="text" value={categoryForm.icon}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                        placeholder="📁"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c} type="button"
                                                onClick={() => setCategoryForm({ ...categoryForm, color: c })}
                                                className={`w-7 h-7 rounded-full border-2 transition-all ${categoryForm.color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                                                style={{ background: c }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="color" value={categoryForm.color}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                        className="w-full h-10 rounded-xl border border-gray-300 dark:border-dark-border cursor-pointer"
                                    />
                                </div>
                                {/* Preview */}
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                                    <span className="w-4 h-4 rounded-full" style={{ background: categoryForm.color }} />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{categoryForm.icon} {categoryForm.name || 'Category Preview'}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowCategoryModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white font-medium hover:shadow-lg transition-all">
                                        Add Category
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
