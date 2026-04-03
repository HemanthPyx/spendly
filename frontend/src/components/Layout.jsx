import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { requestNotificationPermission, onForegroundMessage } from '../utils/firebase';
import { toast } from 'react-toastify';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    // Request push notification permission on mount
    useEffect(() => {
        requestNotificationPermission().catch(() => {});

        // Listen for foreground push notifications
        const unsubscribe = onForegroundMessage((payload) => {
            const title = payload.notification?.title || 'Notification';
            const body = payload.notification?.body || '';
            toast.info(`${title}: ${body}`, { autoClose: 8000 });
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    return (
        <div className="min-h-screen bg-surface-light dark:bg-dark">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div
                className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}
            >
                <Topbar
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    sidebarOpen={sidebarOpen}
                />
                <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-64px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
