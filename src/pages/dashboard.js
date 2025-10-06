import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, CheckSquare, TrendingUp, Calendar, Network } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getDashboardStats, getUplineDashboardStats } from '../services/firestore';

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, teamId, userType, loading: authLoading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalProspects: 0,
    prospectsByStatus: {},
    activeTasks: 0,
    conversionRate: 0,
    thisWeekFollowUps: 0
  });
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }
  }, [currentUser, authLoading]);

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoenix-orange"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!currentUser) {
    return null;
  }

  useEffect(() => {
    const fetchStats = async () => {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching dashboard stats for userType:', userType, 'teamId:', teamId);
        // Always try regular dashboard stats first, then upline stats if user is upline
        let stats;
        if (userType === 'upline') {
          try {
            stats = await getUplineDashboardStats(teamId);
          } catch (uplineError) {
            console.warn('Upline stats failed, falling back to regular stats:', uplineError);
            stats = await getDashboardStats(teamId);
          }
        } else {
          stats = await getDashboardStats(teamId);
        }
        console.log('Dashboard stats received:', stats);
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default stats on error
        setDashboardStats({
          totalProspects: 0,
          prospectsByStatus: {},
          activeTasks: 0,
          conversionRate: 0,
          thisWeekFollowUps: 0,
          totalDownlines: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Force loading to complete after 10 seconds as safety net
    const timeout = setTimeout(() => {
      console.log('Force completing dashboard loading');
      setLoading(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [teamId, userType]);

  const getStats = () => {
    const baseStats = [
      {
        name: 'Total Prospects',
        value: dashboardStats.totalProspects.toString(),
        icon: Users,
        color: 'bg-blue-500',
        change: '+12%',
        changeType: 'positive'
      },
      {
        name: 'Active Tasks',
        value: dashboardStats.activeTasks.toString(),
        icon: CheckSquare,
        color: 'bg-green-500',
        change: '+2',
        changeType: 'positive'
      },
      {
        name: 'Conversion Rate',
        value: `${dashboardStats.conversionRate}%`,
        icon: TrendingUp,
        color: 'bg-phoenix-orange',
        change: '+8%',
        changeType: 'positive'
      },
      {
        name: 'This Week',
        value: dashboardStats.thisWeekFollowUps.toString(),
        icon: Calendar,
        color: 'bg-purple-500',
        change: 'follow-ups',
        changeType: 'neutral'
      }
    ];

    // Add network stats for uplines
    if (userType === 'upline') {
      baseStats.splice(1, 0, {
        name: 'My Network',
        value: dashboardStats.totalDownlines?.toString() || '0',
        icon: Network,
        color: 'bg-indigo-500',
        change: 'downlines',
        changeType: 'neutral'
      });
    }

    return baseStats;
  };

  const chartData = Object.entries(dashboardStats.prospectsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'nouveau' ? '#3B82F6' :
           status === 'contacté' ? '#10B981' :
           status === 'intéressé' ? '#F59E0B' :
           status === 'inscrit' ? '#EF4444' :
           '#6B7280'
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoenix-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {currentUser?.displayName || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {userType === 'upline'
              ? "Here's what's happening with your network today."
              : "Here's what's happening with your prospects today."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStats().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} rounded-md p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive' 
                            ? 'text-green-600 dark:text-green-400' 
                            : stat.changeType === 'negative'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  New prospect added: John Doe
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Meeting scheduled with Sarah Wilson
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Follow-up task due tomorrow
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Prospect Status Distribution</h3>
          </div>
          <div className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">No prospect data available</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}