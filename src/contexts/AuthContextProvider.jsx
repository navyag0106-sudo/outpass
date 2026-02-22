import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getUserProfile, createUserProfile } from '../services/userService';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const createBasicProfile = async (firebaseUser) => {
    try {
      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.email.split('@')[0], // Use email prefix as username
        role: 'student', // Default role
        status: 'active',
        createdAt: new Date().toISOString(),
        isFallbackProfile: true // Mark as fallback
      };

      console.log('Creating basic profile:', profileData);
      
      // Try to create in Firestore (this might fail due to permissions)
      try {
        const profileId = await createUserProfile(profileData);
        console.log('Profile created successfully with ID:', profileId);
        return { id: profileId, ...profileData, isFallbackProfile: false };
      } catch (createError) {
        console.log('Failed to create profile in Firestore, using local fallback:', createError.message);
        // Return the profile data even if Firestore creation fails
        return { ...profileData, isFallbackProfile: true };
      }
    } catch (error) {
      console.error('Error creating basic profile:', error);
      // Return minimal profile data
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'student',
        name: firebaseUser.displayName || 'User',
        isFallbackProfile: true
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          console.log('Fetching profile for user:', firebaseUser.uid);
          const profile = await getUserProfile(firebaseUser.uid);
          console.log('Profile fetched:', profile);
          
          if (profile) {
            setUserProfile(profile);
          } else {
            // Profile doesn't exist, create one automatically
            console.log('Profile not found, creating new one...');
            const newProfile = await createBasicProfile(firebaseUser);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          
          // Handle permission errors or other issues by creating basic profile
          if (error.message.includes('Missing or insufficient permissions')) {
            console.log('Permission error - creating local fallback profile');
            const fallbackProfile = await createBasicProfile(firebaseUser);
            setUserProfile(fallbackProfile);
            
            // Show user-friendly message about permissions
            console.warn('Using local profile due to Firestore permissions. Some features may be limited.');
          } else {
            console.log('Creating fallback profile due to error:', error.message);
            const fallbackProfile = await createBasicProfile(firebaseUser);
            setUserProfile(fallbackProfile);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      return await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
