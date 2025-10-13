import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Plus,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock
} from 'lucide-react';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  subscribeToTasks
} from '../services/firestore';
import { notificationService } from '../services/notifications';

export default function Tasks() {
  const { currentUser, teamId, userRole, userType, personalTeamId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    dueTime: '',
    completed: false,
    userId: ''
  });

  useEffect(() => {
    if (!teamId) return;

    const unsubscribe = subscribeToTasks(teamId, (tasksData) => {
      setTasks(tasksData);
      setLoading(false);
    });

    return unsubscribe;
  }, [teamId]);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      const initialPermission = notificationService.getPermissionStatus();
      setNotificationPermission(initialPermission);

      // Request permission if not already granted
      if (initialPermission === 'default') {
        const permission = await notificationService.requestPermission();
        setNotificationPermission(permission);
      }

      // Start checking for upcoming tasks if permission granted
      if (notificationService.permissionsGranted && currentUser?.uid) {
        notificationService.startTaskChecking(tasks, currentUser.uid);
      }
    };

    if (!loading && currentUser?.uid) {
      initializeNotifications();
    }

    return () => {
      notificationService.stopTaskChecking();
    };
  }, [loading, tasks, currentUser?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Saving task with teamId:', teamId, 'userType:', userType, 'personalTeamId:', personalTeamId);
      let taskData = {
        ...formData,
        userId: formData.userId || currentUser.uid,
        teamId
      };

      // Combine date and time if both are provided
      if (formData.dueDate && formData.dueTime) {
        const combinedDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
        taskData.dueDate = combinedDateTime;
      } else if (formData.dueDate) {
        // If only date is provided, set time to end of day
        const dateOnly = new Date(formData.dueDate);
        dateOnly.setHours(23, 59, 59, 999);
        taskData.dueDate = dateOnly;
      }

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      setShowModal(false);
      resetForm();
      console.log('Task saved successfully');
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
      dueTime: task.dueTime ? formatTimeForInput(task.dueDate) : '',
      completed: task.completed || false,
      userId: task.userId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const toggleComplete = async (task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      dueDate: '',
      dueTime: '',
      completed: false,
      userId: ''
    });
    setEditingTask(null);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate.seconds ? dueDate.seconds * 1000 : dueDate);
    return due < now;
  };

  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate.seconds ? dueDate.seconds * 1000 : dueDate);
    const diffTime = due - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours <= 2 && diffHours >= 0;
  };

  // Helper function to format date for input field (handles both timestamp objects and strings)
  const formatDateForInput = (dueDate) => {
    if (!dueDate) return '';
    // Check if it's a Firestore timestamp object
    if (dueDate.seconds) {
      return new Date(dueDate.seconds * 1000).toISOString().split('T')[0];
    }
    // Otherwise assume it's already a date string or Date object
    return new Date(dueDate).toISOString().split('T')[0];
  };

  // Helper function to format date for display (handles both timestamp objects and strings)
  const formatDateForDisplay = (dueDate) => {
    if (!dueDate) return '';
    // Check if it's a Firestore timestamp object
    if (dueDate.seconds) {
      return new Date(dueDate.seconds * 1000).toLocaleDateString();
    }
    // Otherwise assume it's already a date string or Date object
    return new Date(dueDate).toLocaleDateString();
  };

  // Helper function to format time for input field (handles both timestamp objects and strings)
  const formatTimeForInput = (dueDate) => {
    if (!dueDate) return '';
    // Check if it's a Firestore timestamp object
    if (dueDate.seconds) {
      return new Date(dueDate.seconds * 1000).toTimeString().slice(0, 5);
    }
    // Otherwise assume it's already a date string or Date object
    return new Date(dueDate).toTimeString().slice(0, 5);
  };

  // Helper function to format date and time for display (handles both timestamp objects and strings)
  const formatDateTimeForDisplay = (dueDate) => {
    if (!dueDate) return '';
    // Check if it's a Firestore timestamp object
    if (dueDate.seconds) {
      const date = new Date(dueDate.seconds * 1000);
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    // Otherwise assume it's already a date string or Date object
    const date = new Date(dueDate);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage your daily tasks and follow-ups
          </p>
          {/* Notification Status */}
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              notificationPermission === 'granted'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : notificationPermission === 'denied' || notificationPermission === 'https-required'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {notificationPermission === 'granted' && '🔔 Notifications enabled'}
              {notificationPermission === 'denied' && '🚫 Notifications blocked'}
              {notificationPermission === 'https-required' && '🔒 HTTPS required for notifications'}
              {notificationPermission === 'default' && '⏰ Enable notifications for reminders'}
              {notificationPermission === 'not-supported' && '📱 Notifications not supported'}
            </span>
            {(notificationPermission === 'default' || notificationPermission === 'denied') && (
              <button
                onClick={async () => {
                  console.log('🔔 Enable notifications button clicked');
                  try {
                    const permission = await notificationService.requestPermission();
                    console.log('📱 Permission result:', permission);
                    setNotificationPermission(permission);
                    if (permission === 'granted' && currentUser?.uid) {
                      console.log('🚀 Starting task checking for user:', currentUser.uid);
                      notificationService.startTaskChecking(tasks, currentUser.uid);
                    }
                  } catch (error) {
                    console.error('❌ Error requesting notification permission:', error);
                  }
                }}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-phoenix-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </button>
      </div>

      {/* Active Tasks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Active Tasks ({activeTasks.length})
        </h2>

        {activeTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active tasks</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Great job! All tasks are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 shadow-sm ${
                  isOverdue(task.dueDate) ? 'border-l-red-500' :
                  isDueSoon(task.dueDate) ? 'border-l-yellow-500' : 'border-l-phoenix-orange'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleComplete(task)}
                      className="text-gray-400 hover:text-phoenix-orange focus:outline-none"
                    >
                      <Square className="h-6 w-6" />
                    </button>
                    <div>
                      <h3 className={`text-sm font-medium ${
                        isOverdue(task.dueDate) ? 'text-red-600 dark:text-red-400' :
                        isDueSoon(task.dueDate) ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>
                     {task.dueDate && (
                       <div className="flex items-center mt-1">
                         <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                         <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500' : isDueSoon(task.dueDate) ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`}>
                           Due {formatDateTimeForDisplay(task.dueDate)}
                           {isOverdue(task.dueDate) && ' (Overdue)'}
                           {isDueSoon(task.dueDate) && ' (Due Soon)'}
                         </span>
                       </div>
                     )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-gray-400 hover:text-red-600 focus:outline-none"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Completed Tasks ({completedTasks.length})
          </h2>

          <div className="space-y-3">
            {completedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-l-green-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleComplete(task)}
                      className="text-green-600 focus:outline-none"
                    >
                      <CheckSquare className="h-6 w-6" />
                    </button>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
                        {task.title}
                      </h3>
                      {task.dueDate && (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Completed {formatDateTimeForDisplay(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-gray-400 hover:text-red-600 focus:outline-none"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 opacity-75" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-[60] inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white dark:bg-gray-800 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {editingTask ? 'Edit Task' : 'Add New Task'}
                      </h3>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Task Title *
                          </label>
                          <input
                            type="text"
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Enter task title"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Due Date
                            </label>
                            <input
                              type="date"
                              id="dueDate"
                              value={formData.dueDate}
                              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Due Time
                            </label>
                            <input
                              type="time"
                              id="dueTime"
                              value={formData.dueTime}
                              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {userRole === 'admin' && (
                          <div>
                            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Assign to User
                            </label>
                            <select
                              id="userId"
                              value={formData.userId}
                              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-phoenix-orange focus:border-phoenix-orange sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value={currentUser.uid}>Me</option>
                              {/* In a real app, you'd fetch team members here */}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-phoenix-orange text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingTask ? 'Update' : 'Add'} Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-phoenix-orange sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}