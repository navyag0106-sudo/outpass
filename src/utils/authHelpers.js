import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export const handleAuthError = async (error, setError, setLoading) => {
  console.error('Authentication error:', error);
  
  if (setError) {
    setError(error.message || 'An error occurred during authentication');
  }
  
  if (setLoading) {
    setLoading(false);
  }
};

export const handleProfileNotFound = async (setError, setLoading) => {
  console.error('User profile not found in database');
  
  if (setError) {
    setError(
      'Login successful but user profile not found. Please contact administrator.'
    );
  }
  
  if (setLoading) {
    setLoading(false);
  }
  
  // Sign out the user since they don't have a profile
  try {
    await signOut(auth);
  } catch (signOutError) {
    console.error('Error signing out user:', signOutError);
  }
};

export const getRedirectPath = (userProfile) => {
  if (!userProfile || !userProfile.role) {
    console.log('No profile or role found, defaulting to student');
    return '/student'; // default fallback
  }
  
  const validRoles = ['admin', 'warden', 'student'];
  const normalizedRole = userProfile.role.toLowerCase().trim();
  
  if (!validRoles.includes(normalizedRole)) {
    console.log(
      'Invalid role detected:', 
      userProfile.role, 
      'defaulting to student'
    );
    return '/student'; // safe fallback for invalid roles
  }
  
  switch (normalizedRole) {
    case 'admin':
      console.log('Redirecting admin to /admin');
      return '/admin';
    case 'warden':
      console.log('Redirecting warden to /warden');
      return '/warden';
    case 'student':
      console.log('Redirecting student to /student');
      return '/student';
    default:
      console.log('Unknown role, defaulting to student');
      return '/student';
  }
};
