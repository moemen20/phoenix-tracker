const notificationService = {
  permissionsGranted: false,
  notificationInterval: null,
  lastCheckedTasks: new Set(),

  // Request notification permission from browser
  requestPermission: async function() {
    console.log('Requesting notification permission...');

    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return 'not-supported';
    }

    // Check if we're on HTTPS (required for notifications in production)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.log('HTTPS required for notifications in production');
      return 'https-required';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Permission result from browser:', permission);
      this.permissionsGranted = permission === 'granted';
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  },

  // Get current notification permission status
  getPermissionStatus: function() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  },

  // Send a notification with task details
  sendNotification: function(title, options = {}) {
    if (!this.permissionsGranted) return;

    try {
      const notification = new Notification(title, {
        icon: '/phoenixLogo.png',
        body: options.body,
        tag: options.tag,
        requireInteraction: true,
        silent: false
      });

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  },

  // Check for upcoming tasks due within 2 hours
  checkUpcomingTasks: function(tasks, userId) {
    if (!this.permissionsGranted || !tasks || tasks.length === 0) return;

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    tasks.forEach(task => {
      if (!task.id || task.status === 'completed') return;

      // Handle different date formats (Firestore timestamp or string)
      let dueDate;
      try {
        if (task.dueDate?.seconds) {
          dueDate = new Date(task.dueDate.seconds * 1000);
        } else if (typeof task.dueDate === 'string') {
          dueDate = new Date(task.dueDate);
        } else {
          return; // Invalid date format
        }

        if (isNaN(dueDate.getTime())) return; // Invalid date
      } catch (error) {
        console.error('Error parsing task due date:', error);
        return;
      }

      // Check if task is due within 2 hours and not already notified
      const taskKey = `${userId}-${task.id}`;
      const hoursUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

      if (dueDate > now && dueDate <= twoHoursFromNow && !this.lastCheckedTasks.has(taskKey)) {
        this.sendNotification(`Task Reminder: ${task.title}`, {
          body: `Due ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${hoursUntilDue} hour${hoursUntilDue !== 1 ? 's' : ''})`,
          tag: `task-reminder-${task.id}`
        });

        // Mark as notified to prevent duplicates
        this.lastCheckedTasks.add(taskKey);
      }
    });
  },

  // Start periodic task checking
  startTaskChecking: function(tasks, userId) {
    if (!this.permissionsGranted) return;

    // Check immediately
    this.checkUpcomingTasks(tasks, userId);

    // Set up interval to check every 30 minutes
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }

    this.notificationInterval = setInterval(() => {
      this.checkUpcomingTasks(tasks, userId);
    }, 30 * 60 * 1000); // 30 minutes
  },

  // Stop task checking
  stopTaskChecking: function() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
    this.lastCheckedTasks.clear();
  }
};

export { notificationService };