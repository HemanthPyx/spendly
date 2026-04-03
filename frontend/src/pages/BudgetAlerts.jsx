import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

export default function BudgetAlerts() {
    const [alertData, setAlertData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => { fetchAlerts(); }, []);

    const fetchAlerts = async () => {
        try {
            const res = await api.get('/budget-alerts/');
            setAlertData(res.data);
        } catch (err) {
            toast.error('Failed to load budget alerts.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="skeleton h-48 rounded-2xl" />;

    const alertColors = {
        exceeded: 'from-danger to-red-700',
        warning: 'from-warning to-amber-700',
        caution: 'from-info to-blue-700',
        safe: 'from-success to-emerald-700',
        none: 'from-gray-400 to-gray-600',
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-primary dark:text-surface">Budget Alerts</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Smart alerts for your spending</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r ${alertColors[alertData?.alert] || alertColors.none} rounded-2xl p-8 text-white text-center shadow-xl`}>
                <div className="text-5xl mb-4">
                    {alertData?.alert === 'exceeded' ? '🚨' : alertData?.alert === 'warning' ? '⚠️' : alertData?.alert === 'caution' ? '💡' : alertData?.alert === 'safe' ? '✅' : '📊'}
                </div>
                <p className="text-xl font-bold mb-2">{alertData?.message || 'No budget set for this month.'}</p>
                {alertData?.suggestion && <p className="text-white/70">{alertData.suggestion}</p>}
            </motion.div>

            {alertData?.has_budget && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="text-xl font-bold text-primary dark:text-surface">{formatCurrency(alertData.budget_amount, user?.currency)}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-sm text-gray-500">Spent</p>
                        <p className="text-xl font-bold text-danger">{formatCurrency(alertData.total_spent, user?.currency)}</p>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border text-center">
                        <p className="text-sm text-gray-500">Remaining</p>
                        <p className={`text-xl font-bold ${alertData.remaining >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(alertData.remaining, user?.currency)}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
