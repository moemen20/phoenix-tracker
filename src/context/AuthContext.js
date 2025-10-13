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
  console.log('🔥 AuthProvider component rendered');

  // Initialize with session data if available
  const initializeFromSession = () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
      console.log('📂 Skipping session initialization - not in browser');
      return null;
    }

    try {
      const sessionData = localStorage.getItem('phoenix_auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Check if session is not too old (24 hours)
        if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000 && session.role && session.userType && session.teamId) {
          console.log('📂 Initializing from stored session');

          const mockUser = {
            uid: session.uid,
            email: session.email,
            displayName: session.displayName,
            emailVerified: true,
            isAnonymous: false,
            providerData: [{
              providerId: 'password',
              uid: session.uid,
              displayName: session.displayName,
              email: session.email
            }]
          };

          return {
            currentUser: mockUser,
            userRole: session.role,
            userType: session.userType,
            teamId: session.teamId,
            personalTeamId: session.personalTeamId,
            loading: false
          };
        } else {
          console.log('🗑️ Stored session expired or invalid');
          localStorage.removeItem('phoenix_auth_session');
        }
      }
    } catch (error) {
      console.warn('Failed to initialize from session:', error);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.removeItem('phoenix_auth_session');
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
    return null;
  };

  const sessionData = initializeFromSession();

  const [currentUser, setCurrentUser] = useState(sessionData?.currentUser || null);
  const [userRole, setUserRole] = useState(sessionData?.userRole || null);
  const [userType, setUserType] = useState(sessionData?.userType || null);
  const [teamId, setTeamId] = useState(sessionData?.teamId || null);
  const [personalTeamId, setPersonalTeamId] = useState(sessionData?.personalTeamId || null);
  const [loading, setLoading] = useState(sessionData ? false : true);

  console.log('🔥 AuthProvider state initialized, loading:', loading, 'currentUser:', !!currentUser);

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
    let personalTeamId;
    let role = 'member';

    if (userType === 'upline') {
      role = 'upline';
      // Uplines get their own teamId for data access and personal network
      finalTeamId = generateTeamId();
      personalTeamId = finalTeamId; // Same for uplines
    } else if (userType === 'downline' && uplineTeamId) {
      // Verify upline team ID exists
      const uplineExists = await verifyUplineTeamId(uplineTeamId);
      if (!uplineExists) {
        throw new Error('Invalid upline team ID. Please check and try again.');
      }
      role = 'downline';
      // Downlines use upline's teamId for data access, but get their own personal teamId for sub-network
      finalTeamId = uplineTeamId; // Use upline's team for data access
      personalTeamId = generateTeamId(); // Generate unique ID for their own network
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
      teamId: finalTeamId, // Team ID for data access (shared with upline for downlines)
      personalTeamId: personalTeamId, // Unique team ID for building their own network
      uplineTeamId: userType === 'downline' ? uplineTeamId : null, // Reference to upline
      createdAt: new Date().toISOString()
    });

    console.log(`Created ${userType} user: teamId=${finalTeamId}, personalTeamId=${personalTeamId}, uplineTeamId=${uplineTeamId || 'none'}`);
    console.log(`Signup result: userType=${userType}, finalTeamId=${finalTeamId}, personalTeamId=${personalTeamId}`);

    return userCredential.user;
  };

  // Sign in function
  const login = async (email, password) => {
    if (!auth) {
      throw new Error('Firebase auth not available');
    }

    try {
      console.log('Attempting login...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful');

      // Store session info for persistence
      const sessionData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        timestamp: Date.now()
      };
      localStorage.setItem('phoenix_auth_session', JSON.stringify(sessionData));
      console.log('💾 Auth session stored in localStorage');

      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  // Google sign in function
  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase auth not available');
    }

    try {
      console.log('Attempting Google sign-in...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('✅ Google sign-in successful for user:', user.email);

      // User document creation is now handled in the auth state change listener
      return user;
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign out function
  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase auth not available');
    }

    try {
      console.log('Signing out user:', currentUser?.email);
      await signOut(auth);
      console.log('User signed out successfully');

      // Firebase persistence will handle clearing the auth state
      // Clear all local state
      setCurrentUser(null);
      setUserRole(null);
      setUserType(null);
      setTeamId(null);
      setPersonalTeamId(null);
      setLoading(false);

      console.log('All user data cleared');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
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

  // Get downlines for an upline - import from firestore service
  const getDownlines = async (uplineTeamId) => {
    // Import the function dynamically to avoid circular dependencies
    const { getDownlinesForUpline } = await import('../services/firestore');
    return getDownlinesForUpline(uplineTeamId);
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
    console.log('🚀 Starting auth setup... (useEffect executed)');
    console.log('Setting up auth listener...');

    let unsubscribe;
    let timeout;

    const setupAuth = async () => {
      console.log('Setting up auth...');

      if (!auth) {
        console.error('Firebase auth not available, skipping auth setup');
        setLoading(false);
        return;
      }


      // Persistence is already set at module level, set up the auth listener
      console.log('Setting up onAuthStateChanged listener...');
      let listenerCalled = false;

      console.log('Setting up auth state listener...');
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('🔄 Auth state changed, user:', user?.email, 'uid:', user?.uid, 'displayName:', user?.displayName);
        listenerCalled = true;
 
        // Clear any cached data when user changes
        if (user && currentUser && user.uid !== currentUser.uid) {
          console.log('User changed, resetting state');
          // Reset all state for new user
          setUserRole(null);
          setUserType(null);
          setTeamId(null);
          setPersonalTeamId(null);
        }
 
        setCurrentUser(user);
        console.log('Current user set to:', user ? 'authenticated' : 'null');

        if (user) {
          // Real Firebase user - Firebase handles persistence automatically
          console.log('Processing authenticated Firebase user...');

          try {
            // Get user role from Firestore
            let userData = await getUserData(user.uid);
            console.log('User data from Firestore:', userData);
            console.log('Fetching data for user:', user.uid);

            // If user document doesn't exist, create it (for Google sign-in users)
            if (!userData) {
              console.log('User document not found, creating default document for user');
              const name = user.displayName || user.email.split('@')[0];
              const uniqueTeamId = generateTeamId();
              const defaultUserData = {
                uid: user.uid,
                name,
                email: user.email,
                role: 'member',
                userType: 'upline',
                teamId: uniqueTeamId,
                personalTeamId: uniqueTeamId,
                createdAt: new Date().toISOString()
              };

              await setDoc(doc(db, 'users', user.uid), defaultUserData);
              userData = defaultUserData;
              console.log('Created default user document:', defaultUserData);
            } else {
              console.log('Found existing user document');
            }

            // Migrate old users if needed
            if (userData) {
              let needsUpdate = false;
              const updates = {};

              // Migrate old users with 'default-team' to unique team IDs
              if (userData.teamId === 'default-team') {
                console.log('Migrating user from default-team to unique team ID');
                const newTeamId = generateTeamId();
                updates.teamId = newTeamId;
                updates.personalTeamId = newTeamId; // Set personalTeamId for uplines
                userData.teamId = newTeamId;
                userData.personalTeamId = newTeamId;
                needsUpdate = true;
              }

              // Ensure all users have personalTeamId field
              if (!userData.personalTeamId) {
                console.log('Adding personalTeamId to existing user');
                if (userData.userType === 'downline') {
                  updates.personalTeamId = generateTeamId(); // Downlines get new personal ID
                } else {
                  updates.personalTeamId = userData.teamId || generateTeamId(); // Uplines use their teamId
                }
                userData.personalTeamId = updates.personalTeamId;
                needsUpdate = true;
              }

              // Ensure userType is set
              if (!userData.userType) {
                updates.userType = 'upline'; // Default to upline
                userData.userType = 'upline';
                needsUpdate = true;
              }

              if (needsUpdate) {
                await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
                console.log('User migrated with updates:', updates);
              }
            }

            // Set user state with validated data
            const finalRole = userData?.role || 'member';
            const finalUserType = userData?.userType || 'upline';
            const finalTeamId = userData?.teamId || generateTeamId();
            const finalPersonalTeamId = userData?.personalTeamId || userData?.teamId || generateTeamId();

            console.log('Setting user state:', {
              finalRole,
              finalUserType,
              finalTeamId,
              finalPersonalTeamId
            });

            setUserRole(finalRole);
            setUserType(finalUserType);
            setTeamId(finalTeamId);
            setPersonalTeamId(finalPersonalTeamId);

            console.log('✅ User auth setup complete:', {
              role: finalRole,
              userType: finalUserType,
              teamId: finalTeamId,
              personalTeamId: finalPersonalTeamId
            });

            console.log('User authentication flow completed successfully');

          } catch (error) {
            console.warn('❌ Failed to get user data from Firestore:', error);
            // Set default values if Firestore fails
            setUserRole('member');
            setUserType('upline');
            const defaultTeamId = generateTeamId();
            setTeamId(defaultTeamId);
            setPersonalTeamId(defaultTeamId);
          }
        } else {
          console.log('No authenticated Firebase user');
          setUserRole(null);
          setUserType(null);
          setTeamId(null);
          setPersonalTeamId(null);
        }

        console.log('✅ Setting loading to false - auth setup complete');
        setLoading(false);
      });

      // Force loading to complete after 2 seconds as safety net
      timeout = setTimeout(() => {
        if (!listenerCalled) {
          console.log('Auth listener never called, force completing loading');
        } else {
          console.log('Force completing auth loading after timeout');
        }
        setLoading(false);
      }, 2000);
    };

    // Call the setup function and handle cleanup
    setupAuth();

    // Return cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    userType,
    teamId,
    personalTeamId,
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