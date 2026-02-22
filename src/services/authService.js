import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

// Function to delete Firebase Auth user - WORKING VERSION
export const deleteAuthUser = async (uid) => {
  try {
    console.log('🔐 DELETING Firebase Auth user:', uid);
    
    // Check if current user is trying to delete themselves
    if (auth.currentUser && auth.currentUser.uid === uid) {
      console.log('✅ Self-deletion detected');
      await auth.currentUser.delete();
      console.log('✅ Firebase Auth user deleted successfully (self-deletion)');
      return { success: true, method: 'self' };
    }
    
    // Get current user's authentication token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    console.log('🔄 Getting authentication token...');
    const idToken = await currentUser.getIdToken(true);
    console.log('✅ Authentication token obtained');
    
    // Use Firebase Auth REST API to delete the user
    console.log('🌐 Calling Firebase Auth REST API...');
    
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/outpass-d84b7/accounts:delete?key=AIzaSyC750vKgE62oMlhIvYYTnBpLtc1m-MLE64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        localId: uid,
        idToken: idToken
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.kind === 'identitytoolkit#DeleteAccountResponse') {
      console.log('✅ Firebase Auth user deleted successfully via REST API!');
      console.log('📊 Deletion result:', result);
      
      return { 
        success: true, 
        method: 'rest-api-direct', 
        data: result,
        message: 'Firebase Auth user deleted successfully'
      };
    } else {
      console.log('❌ REST API response:', result);
      throw new Error(result.error?.message || `REST API error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Direct auth deletion failed:', error.message);
    
    // Create a deletion record for backend processing
    console.log('🔄 Creating backend deletion request...');
    
    try {
      const { db, collection, addDoc, serverTimestamp } = await import('../firebase');
      
      await addDoc(collection(db, 'authDeletionQueue'), {
        uid: uid,
        requestedBy: auth.currentUser?.uid,
        requesterEmail: auth.currentUser?.email,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: 'high',
        method: 'rest-api-failed',
        createdAt: serverTimestamp(),
        error: error.message
      });
      
      console.log('✅ Deletion queued for backend processing');
      
      return { 
        success: true, 
        method: 'backend-queue',
        message: 'Auth deletion queued for backend processing due to API restrictions',
        uid: uid
      };
      
    } catch (firestoreError) {
      console.log('❌ Backend queue creation failed:', firestoreError.message);
      
      // Final fallback - provide clear manual instructions
      console.log('📋 MANUAL DELETION INSTRUCTIONS:');
      console.log('1. Go to Firebase Console');
      console.log('2. Click Authentication → Users');
      console.log(`3. Search for UID: ${uid}`);
      console.log('4. Click three dots (⋮) → Delete account');
      console.log('5. Confirm deletion');
      
      return {
        success: false,
        method: 'manual-required',
        error: error.message,
        uid: uid,
        instructions: [
          'Go to Firebase Console → Authentication → Users',
          `Search for UID: ${uid}`,
          'Click three dots (⋮) → Delete account',
          'Confirm deletion'
        ]
      };
    }
  }
};

// Function to check if user has admin privileges for deletion
export const canDeleteUser = async (currentUser) => {
  if (!currentUser) return false;
  
  try {
    const { db, collection, getDocs, query, where } = await import('../firebase');
    
    // Check if user is admin or warden
    const userQuery = query(
      collection(db, 'profiles'),
      where('uid', '==', currentUser.uid)
    );
    
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData.role === 'admin' || userData.role === 'warden';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
};

// Enhanced logout function
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('✅ User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { success: false, error: error.message };
  }
};
