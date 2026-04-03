import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineHome, HiOutlineCurrencyRupee, HiOutlineShoppingBag,
    HiOutlineChartPie, HiOutlineDocumentReport, HiOutlineCog,
    HiOutlineHeart, HiOutlineCash, HiOutlineMenuAlt2, HiOutlineX,
    HiOutlineBell, HiOutlineRefresh, HiOutlineReceiptTax
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
    { path: '/expenses', icon: HiOutlineCurrencyRupee, label: 'Expenses' },
    { path: '/income', icon: HiOutlineCash, label: 'Income & Budget' },
    { path: '/wishlist', icon: HiOutlineHeart, label: 'Wishlist' },
    { path: '/analytics', icon: HiOutlineChartPie, label: 'Analytics' },
    { path: '/reports', icon: HiOutlineDocumentReport, label: 'Reports' },
    { path: '/savings', icon: HiOutlineShoppingBag, label: 'Savings' },
    { path: '/recurring', icon: HiOutlineRefresh, label: 'Recurring' },
    { path: '/debts', icon: HiOutlineReceiptTax, label: 'Debts' },
    { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ isOpen, onToggle }) {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onToggle}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed top-0 left-0 h-full z-50 flex flex-col
          bg-gradient-to-b from-primary to-primary-dark text-white
          shadow-2xl transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-0 lg:w-20'}
          overflow-hidden`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg shrink-0">
                        E
                    </div>
                    {isOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-lg whitespace-nowrap"
                        >
                            ExpenseTracker
                        </motion.span>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && onToggle && onToggle()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-200
                ${isActive
                                    ? 'bg-accent text-white shadow-lg shadow-accent/30'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {isOpen && (
                                <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                {user && isOpen && (
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-sm font-bold">
                                {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">
                                    {user.first_name || user.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-white/50 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.aside>
        </>
    );
}
