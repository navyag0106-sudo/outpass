import { 
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { createUserProfile } from './userService';
import { serverTimestamp } from 'firebase/firestore';

export const signupUser = async (formData) => {
  try {
    console.log('Starting user registration...');
    
    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    
    const user = userCredential.user;
    console.log('Firebase auth user created:', user.uid);
    
    // Step 2: Update user profile with display name
    await updateProfile(user, {
      displayName: formData.fullName
    });
    
    console.log('User profile updated with display name');
    
    // Step 3: Create user profile in Firestore
    const profileData = {
      uid: user.uid,
      email: formData.email,
      username: formData.email.split('@')[0], // Use email prefix as username
      name: formData.fullName,
      role: formData.role,
      status: 'active',
      createdAt: serverTimestamp(),
      // Common fields
      phone: formData.phone || '',
      address: formData.address || ''
    };
    
    // Add role-specific data
    if (formData.role === 'student') {
      profileData.registrationNo = formData.registrationNo;
      profileData.department = formData.department;
      profileData.year = formData.year;
      profileData.roomNo = formData.roomNo || '';
      profileData.hostel = formData.hostel;
      profileData.phone = formData.phone || '';
      profileData.address = formData.address || '';
    } else if (formData.role === 'warden') {
      profileData.hostel = formData.hostel;
      profileData.employeeId = formData.employeeId;
    } else if (formData.role === 'admin') {
      profileData.adminCode = formData.adminCode; // In production, this should be validated
    }
    
    const profileId = await createUserProfile(profileData);
    console.log('User profile created in Firestore with ID:', profileId);
    
    // Step 4: Sign out the user (they'll need to login)
    await auth.signOut();
    console.log('User signed out after registration');
    
    return {
      success: true,
      userId: user.uid,
      profileId,
      message: 'Registration successful! Please login to continue.'
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific Firebase auth errors
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 
          'This email address is already registered. Please use a different email or login.';
        break;
      case 'auth/weak-password':
        errorMessage = 
          'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/invalid-email':
        errorMessage = 
          'Invalid email address. Please check and try again.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 
          'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 
          'Too many registration attempts. Please try again later.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
};

export const validateAdminCode = async (adminCode) => {
  // In a real application, this would validate against a secure backend
  // For demo purposes, we'll use a simple validation
  const validCodes = ['ADMIN123', 'HOSTEL2024', 'OUTPASS_ADMIN'];
  
  return validCodes.includes(adminCode);
};

export const checkEmailAvailability = async (email) => {
  try {
    // Check if email exists in Firebase Auth by attempting sign-in methods
    const auth = getAuth();
    const methods = await fetchSignInMethodsForEmail(auth, email);
    
    // If there are sign-in methods, email is already registered
    if (methods.length > 0) {
      return {
        available: false,
        message: 'This email is already registered. Please use a different email or login.',
        methods: methods
      };
    }
    
    return { available: true };
  } catch (error) {
    console.error('Error checking email availability:', error);
    // If we can't check, assume available and let Firebase handle the error
    return { available: true };
  }
};

export const validateRegistrationData = (formData) => {
  const errors = [];
  
  // Basic validation
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }
  
  if (!formData.email || !formData.email.includes('@')) {
    errors.push('Please enter a valid email address');
  }
  
  // Role-specific validation
  if (formData.role === 'student') {
    if (!formData.registrationNo) {
      errors.push('Registration number is required for students');
    }
    if (!formData.department) {
      errors.push('Department is required for students');
    }
    if (!formData.year) {
      errors.push('Year is required for students');
    }
    if (!formData.hostel) {
      errors.push('Hostel selection is required for students');
    }
    if (!formData.phone) {
      errors.push('Phone number is required for students');
    }
  } else if (formData.role === 'warden') {
    if (!formData.hostel) {
      errors.push('Hostel name is required for wardens');
    }
    if (!formData.employeeId) {
      errors.push('Employee ID is required for wardens');
    }
    if (!formData.phone) {
      errors.push('Phone number is required for wardens');
    }
  } else if (formData.role === 'admin') {
    if (!formData.adminCode) {
      errors.push('Admin authorization code is required');
    }
  }
  
  return errors;
};
