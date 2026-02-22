// Firebase Cloud Functions for Direct Auth User Deletion
// Deploy this to Firebase Functions for automatic Auth deletion

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Cloud Function to directly delete Firebase Auth user
exports.deleteUserDirectly = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to delete users');
  }

  // Check if user has admin or warden privileges
  const callerUid = context.auth.uid;
  const targetUid = data.uid;

  console.log(`User ${callerUid} attempting to directly delete user ${targetUid}`);

  try {
    // Get caller's profile to check permissions
    const callerProfile = await admin.firestore()
      .collection('profiles')
      .where('uid', '==', callerUid)
      .limit(1)
      .get();

    if (callerProfile.empty) {
      throw new functions.https.HttpsError('permission-denied', 'Caller profile not found');
    }

    const callerData = callerProfile.docs[0].data();
    const callerRole = callerData.role;

    // Only admins and wardens can delete users
    if (callerRole !== 'admin' && callerRole !== 'warden') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins and wardens can delete users'
      );
    }

    // Prevent self-deletion (users should use client-side deletion for themselves)
    if (callerUid === targetUid) {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot delete yourself through this function');
    }

    // Get target user's profile for logging
    const targetProfile = await admin.firestore()
      .collection('profiles')
      .where('uid', '==', targetUid)
      .limit(1)
      .get();

    let targetUserName = 'Unknown User';
    if (!targetProfile.empty) {
      targetUserName = targetProfile.docs[0].data().name || targetProfile.docs[0].data().email || targetUid;
    }

    // DIRECTLY DELETE THE FIREBASE AUTH USER
    console.log(`🔐 DIRECTLY deleting Firebase Auth user: ${targetUid} (${targetUserName})`);
    
    try {
      await admin.auth().deleteUser(targetUid);
      console.log(`✅ Successfully deleted Firebase Auth user: ${targetUid}`);
      
      // Log the successful deletion
      await admin.firestore().collection('authDeletionLogs').add({
        uid: targetUid,
        targetName: targetUserName,
        deletedBy: callerUid,
        deletedByRole: callerRole,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        method: 'direct-cloud-function',
        success: true
      });
      
      return {
        success: true,
        message: `Firebase Auth user ${targetUserName} deleted successfully`,
        deletedBy: callerRole,
        deletedAt: new Date().toISOString(),
        method: 'direct-admin-sdk'
      };

    } catch (authError) {
      console.error('Error deleting Firebase Auth user:', authError);
      
      // Log the failed deletion attempt
      await admin.firestore().collection('authDeletionLogs').add({
        uid: targetUid,
        targetName: targetUserName,
        deletedBy: callerUid,
        deletedByRole: callerRole,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        method: 'direct-cloud-function',
        success: false,
        error: authError.message
      });
      
      if (authError.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Firebase Auth user not found');
      }
      
      throw new functions.https.HttpsError('internal', `Failed to delete Firebase Auth user: ${authError.message}`);
    }

  } catch (error) {
    console.error('Error in direct user deletion:', error);
    
    if (error.code === 'permission-denied' || error.code === 'unauthenticated' || error.code === 'invalid-argument') {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function to process direct auth deletion requests
exports.processDirectAuthDeletionRequests = functions.firestore
  .document('directAuthDeletionRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const requestData = snap.data();
    
    console.log('🔄 Processing direct auth deletion request:', requestData);
    
    try {
      // Verify the requester has permissions
      const requesterProfile = await admin.firestore()
        .collection('profiles')
        .where('uid', '==', requestData.requestedBy)
        .limit(1)
        .get();

      if (requesterProfile.empty) {
        console.log('Requester profile not found, skipping deletion');
        return;
      }

      const requesterData = requesterProfile.docs[0].data();
      const requesterRole = requesterData.role;

      if (requesterRole !== 'admin' && requesterRole !== 'warden') {
        console.log('Requester does not have permission to delete users');
        return;
      }

      // DIRECTLY DELETE THE FIREBASE AUTH USER
      console.log(`🔐 DIRECTLY deleting Firebase Auth user: ${requestData.uid}`);
      
      await admin.auth().deleteUser(requestData.uid);
      
      console.log(`✅ Successfully processed direct auth deletion for: ${requestData.uid}`);
      
      // Update the request status
      await snap.ref.update({
        status: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        method: 'direct-admin-sdk'
      });

      // Log the successful deletion
      await admin.firestore().collection('authDeletionLogs').add({
        uid: requestData.uid,
        deletedBy: requestData.requestedBy,
        deletedByRole: requesterRole,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        method: 'direct-request-processing',
        success: true
      });

    } catch (error) {
      console.error('Error processing direct auth deletion request:', error);
      
      // Update the request status to failed
      await snap.ref.update({
        status: 'failed',
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
