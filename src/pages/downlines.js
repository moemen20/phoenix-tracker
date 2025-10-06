import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Copy,
  Eye
} from 'lucide-react';
import {
  getProspects,
  getTasks,
  getContacts
} from '../services/firestore';

export default function Downlines() {
  const { currentUser, userType, teamId, getDownlines } = useAuth();
  const [downlines, setDownlines] = useState([]);
  const [downlineStats, setDownlineStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [copiedTeamId, setCopiedTeamId] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (userType !== 'upline' && userType !== 'downline') {
      router.push('/dashboard');
      return;
    }

    loadDownlines();
  }, [currentUser, userType, teamId]);

  // Show loading while auth is checking
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoenix-orange"></div>
      </div>
    );
  }

  const loadDownlines = async () => {
    try {
      const downlineUsers = await getDownlines(teamId);
      setDownlines(downlineUsers);

      // Load stats for each downline
      const statsPromises = downlineUsers.map(async (downline) => {
        const [prospects, tasks, contacts] = await Promise.all([
          getProspects(downline.teamId),
          getTasks(null, downline.teamId),
          getContacts(downline.teamId)
        ]);

        return {
          uid: downline.uid,
          prospects: prospects.length,
          tasks: tasks.length,
          contacts: contacts.length,
          completedTasks: tasks.filter(task => task.status === 'completed').length,
          pendingTasks: tasks.filter(task => task.status === 'pending').length
        };
      });

      const stats = await Promise.all(statsPromises);
      const statsMap = {};
      stats.forEach(stat => {
        statsMap[stat.uid] = stat;
      });
      setDownlineStats(statsMap);
    } catch (error) {
      console.error('Error loading downlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyTeamId = () => {
    navigator.clipboard.writeText(teamId);
    setCopiedTeamId(true);
    setTimeout(() => setCopiedTeamId(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoenix-orange"></div>
      </div>
    );
  }

  const totalDownlines = downlines.length;
  const totalProspects = Object.values(downlineStats).reduce((sum, stat) => sum + stat.prospects, 0);
  const totalContacts = Object.values(downlineStats).reduce((sum, stat) => sum + stat.contacts, 0);
  const totalTasks = Object.values(downlineStats).reduce((sum, stat) => sum + stat.tasks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Network</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Monitor your downlines' performance and build your network
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Your Team ID:</span>
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
            {teamId}
          </code>
          <button
            onClick={copyTeamId}
            className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Copy Team ID"
          >
            <Copy className="h-4 w-4" />
          </button>
          {copiedTeamId && (
            <span className="text-green-600 dark:text-green-400 text-sm">Copied!</span>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Downlines
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalDownlines}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Prospects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalProspects}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Contacts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalContacts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Downlines List */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Network Members
          </h3>

          {downlines.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No downlines yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Share your team ID ({teamId}) with potential recruits to grow your network.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {downlines.map((downline) => {
                const stats = downlineStats[downline.uid] || { prospects: 0, tasks: 0, contacts: 0, completedTasks: 0, pendingTasks: 0 };

                return (
                  <motion.div
                    key={downline.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {downline.name}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4 mr-2" />
                        {downline.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Joined: {new Date(downline.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.prospects}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Prospects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.contacts}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Contacts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.tasks}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Tasks</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1 text-center">
                        <div className="text-sm font-medium text-green-600">{stats.completedTasks}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-sm font-medium text-yellow-600">{stats.pendingTasks}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}