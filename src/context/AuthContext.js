import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userType, setUserType] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, name, userType = 'downline', uplineTeamId = null) => {
    if (!auth || !db) {
      throw new Error('Firebase services not available');
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: name
    });

    let finalTeamId;
    let role = 'member';

    // Every user gets their own unique team ID (for building their own network)
    finalTeamId = generateTeamId();

    if (userType === 'upline') {
      role = 'upline';
    } else if (userType === 'downline' && uplineTeamId) {
      // Verify upline team ID exists
      const uplineExists = await verifyUplineTeamId(uplineTeamId);
      if (!uplineExists) {
        throw new Error('Invalid upline team ID. Please check and try again.');
      }
      role = 'downline';
    } else {
      throw new Error('Please specify whether you are an upline or provide a valid upline team ID.');
    }

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name,
      email,
      role: role, // Keep for backward compatibility
      userType: userType, // New field for upline/downline system
      teamId: finalTeamId, // Every user gets their own team ID
      uplineTeamId: userType === 'downline' ? uplineTeamId : null, // Reference to upline
      createdAt: new Date().toISOString()
    });

    return userCredential.user;
  };

  // Sign in function
  const login = (email, password) => {
    if (!auth) {
      throw new Error('Firebase auth not available');
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google sign in function
  const signInWithGoogle = async () => {
    if (!auth || !db) {
      throw new Error('Firebase services not available');
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create one
      const userData = await getUserData(user.uid);
      if (!userData) {
        // Create user document with default role and team
        const name = user.displayName || user.email.split('@')[0];
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email: user.email,
          role: 'member', // Default to member for Google sign-in
          teamId: 'default-team', // Default team
          createdAt: new Date().toISOString()
        });
      }

      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign out function
  const logout = () => {
    if (!auth) {
      throw new Error('Firebase auth not available');
    }
    return signOut(auth);
  };

  // Generate unique team ID for uplines
  const generateTeamId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Verify if upline team ID exists
  const verifyUplineTeamId = async (teamId) => {
    if (!db) {
      console.warn('Firestore not available, cannot verify upline team ID');
      return false;
    }

    try {
      const q = query(collection(db, 'users'), where('teamId', '==', teamId), where('userType', '==', 'upline'));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error verifying upline team ID:', error);
      return false;
    }
  };

  // Get downlines for an upline
  const getDownlines = async (uplineTeamId) => {
    if (!db) {
      console.warn('Firestore not available, cannot get downlines');
      return [];
    }

    try {
      const q = query(collection(db, 'users'), where('uplineTeamId', '==', uplineTeamId));
      const querySnapshot = await getDocs(q);
      const downlines = [];
      querySnapshot.forEach((doc) => {
        downlines.push({ id: doc.id, ...doc.data() });
      });
      return downlines;
    } catch (error) {
      console.error('Error getting downlines:', error);
      return [];
    }
  };

  // Get user data from Firestore
  const getUserData = async (uid) => {
    if (!db) {
      console.warn('Firestore not available, cannot get user data');
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.warn('Error fetching user data from Firestore:', error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth listener...');

    // Force loading to complete immediately for now to fix loading issue
    const immediateTimeout = setTimeout(() => {
      console.log('Force completing auth loading immediately');
      setLoading(false);
    }, 100);

    if (!auth) {
      console.error('Firebase auth not available, skipping auth setup');
      setLoading(false);
      return;
    }

    let listenerCalled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user?.email);
      listenerCalled = true;

      setCurrentUser(user);

      if (user) {
        try {
          // Get user role from Firestore
          const userData = await getUserData(user.uid);
          console.log('User data from Firestore:', userData);
          setUserRole(userData?.role || 'member');
          setUserType(userData?.userType || 'downline');
          setTeamId(userData?.teamId || 'default-team');
          console.log('Set userType to:', userData?.userType, 'teamId to:', userData?.teamId);
        } catch (error) {
          console.warn('Failed to get user data from Firestore:', error);
          // Set default values if Firestore fails
          setUserRole('member');
          setUserType('downline');
          setTeamId('default-team');
        }
      } else {
        setUserRole(null);
        setUserType(null);
        setTeamId(null);
      }

      setLoading(false);
    });

    // Force loading to complete after 2 seconds as safety net
    const timeout = setTimeout(() => {
      if (!listenerCalled) {
        console.log('Auth listener never called, force completing loading');
      } else {
        console.log('Force completing auth loading after timeout');
      }
      setLoading(false);
    }, 2000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(immediateTimeout);
      clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    userType,
    teamId,
    signup,
    login,
    logout,
    signInWithGoogle,
    getUserData,
    generateTeamId,
    verifyUplineTeamId,
    getDownlines
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};