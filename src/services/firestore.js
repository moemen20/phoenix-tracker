import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

// Prospects collection functions
export const addProspect = async (prospectData) => {
  try {
    const docRef = await addDoc(collection(db, 'prospects'), {
      ...prospectData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding prospect:', error);
    throw error;
  }
};

export const updateProspect = async (id, prospectData) => {
  try {
    const docRef = doc(db, 'prospects', id);
    await updateDoc(docRef, prospectData);
  } catch (error) {
    console.error('Error updating prospect:', error);
    throw error;
  }
};

export const deleteProspect = async (id) => {
  try {
    await deleteDoc(doc(db, 'prospects', id));
  } catch (error) {
    console.error('Error deleting prospect:', error);
    throw error;
  }
};

export const getProspects = async (teamId, filters = {}) => {
  try {
    let q = query(collection(db, 'prospects'), where('teamId', '==', teamId));

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.search) {
      // Note: Firestore doesn't support text search directly
      // For simple search, we can get all and filter client-side
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(prospect =>
          prospect.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          prospect.email.toLowerCase().includes(filters.search.toLowerCase())
        );
    }

    q = query(q, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting prospects:', error);
    throw error;
  }
};

export const getProspect = async (id) => {
  try {
    const docRef = doc(db, 'prospects', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting prospect:', error);
    throw error;
  }
};

// Tasks collection functions
export const addTask = async (taskData) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const docRef = doc(db, 'tasks', id);
    await updateDoc(docRef, taskData);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getTasks = async (userId, teamId) => {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('teamId', '==', teamId),
      orderBy('dueDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

export const getUserTasks = async (userId) => {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw error;
  }
};

// Dashboard stats
export const getDashboardStats = async (teamId) => {
  try {
    const prospects = await getProspects(teamId);
    const tasks = await getTasks(null, teamId);

    const totalProspects = prospects.length;
    const prospectsByStatus = prospects.reduce((acc, prospect) => {
      acc[prospect.status] = (acc[prospect.status] || 0) + 1;
      return acc;
    }, {});

    const activeTasks = tasks.filter(task => !task.completed).length;
    const conversionRate = totalProspects > 0 ?
      ((prospectsByStatus.inscrit || 0) / totalProspects * 100).toFixed(1) : 0;

    const thisWeekFollowUps = prospects.filter(prospect => {
      if (!prospect.nextFollowUp) return false;
      const followUpDate = new Date(prospect.nextFollowUp);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return followUpDate >= now && followUpDate <= weekFromNow;
    }).length;

    return {
      totalProspects,
      prospectsByStatus,
      activeTasks,
      conversionRate,
      thisWeekFollowUps
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

// Upline dashboard stats - aggregates data from all downlines
export const getUplineDashboardStats = async (uplineTeamId) => {
  try {
    console.log('Getting upline dashboard stats for teamId:', uplineTeamId);

    // Get all users in this team (including upline and downlines)
    const allTeamUsers = await getTeamUsers(uplineTeamId);
    console.log('All team users:', allTeamUsers);

    // Filter to get only downlines
    const downlines = allTeamUsers.filter(user => user.userType === 'downline');
    console.log('Downlines found:', downlines.length);

    let totalProspects = 0;
    let totalTasks = [];
    let prospectsByStatus = {};

    // Aggregate data from all downlines
    for (const downline of downlines) {
      try {
        console.log('Processing downline:', downline.name, 'teamId:', downline.teamId);
        const prospects = await getProspects(downline.teamId);
        const tasks = await getTasks(null, downline.teamId);

        console.log(`Downline ${downline.name} has ${prospects.length} prospects and ${tasks.length} tasks`);

        totalProspects += prospects.length;
        totalTasks = totalTasks.concat(tasks);

        // Aggregate prospects by status
        prospects.forEach(prospect => {
          prospectsByStatus[prospect.status] = (prospectsByStatus[prospect.status] || 0) + 1;
        });
      } catch (error) {
        console.warn(`Error getting data for downline ${downline.uid}:`, error);
      }
    }

    const activeTasks = totalTasks.filter(task => !task.completed).length;
    const conversionRate = totalProspects > 0 ?
      ((prospectsByStatus.inscrit || 0) / totalProspects * 100).toFixed(1) : 0;

    console.log('Upline stats calculated:', {
      totalProspects,
      activeTasks,
      conversionRate,
      totalDownlines: downlines.length
    });

    // Calculate this week's follow-ups across all downlines
    const thisWeekFollowUps = await Promise.all(
      downlines.map(async (downline) => {
        try {
          const prospects = await getProspects(downline.teamId);
          return prospects.filter(prospect => {
            if (!prospect.nextFollowUp) return false;
            const followUpDate = new Date(prospect.nextFollowUp);
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return followUpDate >= now && followUpDate <= weekFromNow;
          }).length;
        } catch (error) {
          console.warn(`Error getting follow-ups for downline ${downline.uid}:`, error);
          return 0;
        }
      })
    ).then(results => results.reduce((sum, count) => sum + count, 0));

    const result = {
      totalProspects,
      prospectsByStatus,
      activeTasks,
      conversionRate,
      thisWeekFollowUps,
      totalDownlines: downlines.length
    };

    console.log('Returning upline dashboard stats:', result);
    return result;
  } catch (error) {
    console.error('Error getting upline dashboard stats:', error);
    // Return default values instead of throwing error to prevent infinite loading
    return {
      totalProspects: 0,
      prospectsByStatus: {},
      activeTasks: 0,
      conversionRate: 0,
      thisWeekFollowUps: 0,
      totalDownlines: 0
    };
  }
};

// Real-time listeners
export const subscribeToProspects = (teamId, callback, filters = {}) => {
  let q = query(collection(db, 'prospects'), where('teamId', '==', teamId));

  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const prospects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(prospects);
  });
};

export const subscribeToTasks = (teamId, callback) => {
  const q = query(
    collection(db, 'tasks'),
    where('teamId', '==', teamId),
    orderBy('dueDate', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
};

// Contacts collection functions
export const addContact = async (contactData) => {
  try {
    const docRef = await addDoc(collection(db, 'contacts'), {
      ...contactData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

export const updateContact = async (id, contactData) => {
  try {
    const docRef = doc(db, 'contacts', id);
    await updateDoc(docRef, contactData);
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

export const deleteContact = async (id) => {
  try {
    await deleteDoc(doc(db, 'contacts', id));
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};

export const getContacts = async (teamId, filters = {}) => {
  try {
    let q = query(collection(db, 'contacts'), where('teamId', '==', teamId));

    if (filters.state) {
      q = query(q, where('state', '==', filters.state));
    }

    if (filters.job) {
      q = query(q, where('job', '==', filters.job));
    }

    if (filters.search) {
      // Note: Firestore doesn't support text search directly
      // For simple search, we can get all and filter client-side
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(contact =>
          contact.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          contact.surname.toLowerCase().includes(filters.search.toLowerCase()) ||
          contact.phone.toLowerCase().includes(filters.search.toLowerCase())
        );
    }

    q = query(q, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
};

export const getContact = async (id) => {
  try {
    const docRef = doc(db, 'contacts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting contact:', error);
    throw error;
  }
};

// Real-time listeners for contacts
export const subscribeToContacts = (teamId, callback, filters = {}) => {
  let q = query(collection(db, 'contacts'), where('teamId', '==', teamId));

  if (filters.state) {
    q = query(q, where('state', '==', filters.state));
  }

  if (filters.job) {
    q = query(q, where('job', '==', filters.job));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(contacts);
  });
};

// Users collection functions
export const getTeamUsers = async (teamId) => {
  try {
    const q = query(collection(db, 'users'), where('teamId', '==', teamId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting team users:', error);
    throw error;
  }
};