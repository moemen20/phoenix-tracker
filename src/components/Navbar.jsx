import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Home,
  Users,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Network
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser, userType, logout } = useAuth();
  const router = useRouter();

  // Handle dark mode toggle
  useEffect(() => {
    // Check for user preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Navigation items
  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Prospects', href: '/prospects', icon: Users },
      { name: 'Contacts', href: '/contacts', icon: Users },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    // Add downlines page for uplines and downlines (everyone can build a network)
    if (userType === 'upline' || userType === 'downline') {
      baseItems.splice(1, 0, { name: 'My Network', href: '/downlines', icon: Network });
    }

    return baseItems;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Dark mode toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
        initial={false}
        animate={isOpen ? { x: 0 } : { x: '-100%' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
            {/* Phoenix Logo */}
            <img
              src="/phoenixLogo.png"
              alt="Phoenix Tracker Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">Phoenix Tracker</span>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    router.pathname === item.href
                      ? 'bg-phoenix-orange text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
          {/* Logo placeholder */}
          <div className="w-10 h-10 rounded-full bg-phoenix-orange flex items-center justify-center text-white text-xl font-bold">
            P
          </div>
          <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">Phoenix Tracker</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  router.pathname === item.href
                    ? 'bg-phoenix-orange text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}