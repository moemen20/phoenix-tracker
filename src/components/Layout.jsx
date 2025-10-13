import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user is logged in, redirect to login
    if (!loading && !currentUser && router.pathname !== '/login' && router.pathname !== '/signup') {
      console.log('Layout: No user found, redirecting to login from:', router.pathname);
      router.push('/login');
    }
  }, [currentUser, loading, router.pathname]);

  // Public routes that don't need the layout
  if (router.pathname === '/login' || router.pathname === '/signup') {
    return <>{children}</>;
  }

  // If loading or no user, show loading state
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoenix-orange"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Main content */}
      <div className="flex-1 md:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}