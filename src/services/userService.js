import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as deleteFirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { USER_ROLES } from '../utils/constants';

export const createUserProfile = async (userData) => {
  try {
    // Use setDoc with user's UID as document ID to match Firestore rules
    const docRef = doc(db, 'users', userData.uid);
    await setDoc(docRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('User profile created with ID: ', userData.uid);
    return userData.uid;
  } catch (error) {
    console.error('Error creating user profile: ', error);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log('Querying for user profile with uid:', userId);
    
    // First try direct document lookup since we now store with UID as document ID
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userProfile = { id: docSnap.id, ...docSnap.data() };
        console.log('User profile found by direct lookup:', userProfile);
        return userProfile;
      }
    } catch (directError) {
      console.log('Direct lookup failed, trying query:', directError.message);
    }
    
    // Fallback: Try query method
    const q = query(
      collection(db, 'users'),
      where('uid', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('No user profile found for uid:', userId);
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const profile = { id: userDoc.id, ...userDoc.data() };
    console.log('User profile found by query:', profile);
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile: ', error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

export const createStudentProfile = async (studentData) => {
  try {
    const profilesRef = collection(db, 'profiles');
    const docRef = await addDoc(profilesRef, {
      ...studentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Student profile created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating student profile: ', error);
    throw new Error(`Failed to create student profile: ${error.message}`);
  }
};

export const getStudentProfile = async (userId) => {
  try {
    console.log('🔍 Looking for student profile with UID:', userId);
    
    // Try ALL possible ways to find the profile
    let profile = null;
    
    // Method 1: Direct document lookup by UID
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        profile = { id: docSnap.id, ...docSnap.data() };
        console.log('✅ Found by UID as document ID');
      }
    } catch (e) {
      console.log('❌ Method 1 failed:', e.message);
    }
    
    // Method 2: Query by userId field
    if (!profile) {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          profile = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          console.log('✅ Found by userId field');
        }
      } catch (e) {
        console.log('❌ Method 2 failed:', e.message);
      }
    }
    
    // Method 3: Query by uid field
    if (!profile) {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('uid', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          profile = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          console.log('✅ Found by uid field');
        }
      } catch (e) {
        console.log('❌ Method 3 failed:', e.message);
      }
    }
    
    if (profile) {
      console.log('🎉 SUCCESS - Found profile:', profile);
      return profile;
    } else {
      console.log('❌ NO PROFILE FOUND');
      return null;
    }
  } catch (error) {
    console.error('❌ COMPLETE FAILURE:', error);
    return null;
  }
};

export const updateStudentProfile = async (profileId, updateData) => {
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, { 
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('Student profile updated successfully');
  } catch (error) {
    console.error('Error updating student profile: ', error);
    throw new Error(`Failed to update student profile: ${error.message}`);
  }
};

export const getAllUsers = async (role = null) => {
  try {
    let q = query(collection(db, 'users'));
    
    if (role) {
      q = query(collection(db, 'users'), where('role', '==', role));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching users: ', error);
    throw error;
  }
};

export const createWarden = async (wardenData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...wardenData,
      role: USER_ROLES.WARDEN,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    console.log('Warden created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating warden: ', error);
    throw new Error(`Failed to create warden: ${error.message}`);
  }
};

export const getWardens = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', USER_ROLES.WARDEN)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching wardens: ', error);
    throw new Error(`Failed to fetch wardens: ${error.message}`);
  }
};

export const updateWarden = async (wardenId, updateData) => {
  try {
    const wardenRef = doc(db, 'users', wardenId);
    await updateDoc(wardenRef, { 
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('Warden updated successfully');
  } catch (error) {
    console.error('Error updating warden: ', error);
    throw new Error(`Failed to update warden: ${error.message}`);
  }
};

export const deleteWarden = async (wardenId) => {
  try {
    await deleteDoc(doc(db, 'users', wardenId));
    console.log('Warden deleted successfully');
  } catch (error) {
    console.error('Error deleting warden: ', error);
    throw new Error(`Failed to delete warden: ${error.message}`);
  }
};

export const createStudent = async (studentData) => {
  try {
    // Step 1: Create Firebase Auth user
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth, 
        studentData.email, 
        studentData.password
      );
      
      // Update the user's display name with their name
      await updateProfile(userCredential.user, {
        displayName: studentData.name
      });
    } catch (authError) {
      console.error('Error creating Firebase Auth user:', authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }
    
    // Step 2: Create user document in Firestore
    const userDocRef = await addDoc(collection(db, 'users'), {
      uid: userCredential.user.uid,
      email: studentData.email,
      username: studentData.username,
      role: USER_ROLES.STUDENT,
      registrationNo: studentData.registrationNo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });

    // Step 3: Create profile document in Firestore
    const profileDocRef = await addDoc(collection(db, 'profiles'), {
      userId: userCredential.user.uid,
      registrationNo: studentData.registrationNo,
      username: studentData.username,
      name: studentData.name || '',
      department: studentData.department || '',
      year: studentData.year || '',
      roomNo: studentData.roomNo || '',
      phone: studentData.phone || '',
      address: studentData.address || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      wardenId: studentData.wardenId
    });

    console.log('Student created successfully with Firebase Auth account');
    return { 
      userId: userDocRef.id, 
      profileId: profileDocRef.id,
      authUid: userCredential.user.uid 
    };
  } catch (error) {
    console.error('Error creating student: ', error);
    throw error;
  }
};

export const getStudents = async (hostel) => {
  try {
    let q;
    
    if (hostel) {
      // Get students assigned to this hostel
      q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('hostel', '==', hostel)
      );
    } else {
      // Get all students
      q = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching students: ', error);
    throw error;
  }
};

export const updateStudent = async (studentId, updateData) => {
  try {
    console.log('🔍 Updating student with ID:', studentId);
    console.log('🔍 Update data:', updateData);
    
    // Check if the profile document exists first
    const studentRef = doc(db, 'profiles', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (studentDoc.exists()) {
      // Update existing profile document
      await updateDoc(studentRef, { 
        ...updateData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Existing student profile updated successfully');
    } else {
      // Create new profile document if it doesn't exist
      console.log('⚠️ Profile document does not exist, creating new one');
      await setDoc(studentRef, {
        ...updateData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ New student profile created successfully');
    }

    // If username or password is being updated, also update the user document
    // Note: Email updates in Firebase Auth should only be done by the logged-in user
    if (updateData.username || updateData.password) {
      // Find the user document by registration number
      const q = query(
        collection(db, 'users'),
        where('registrationNo', '==', updateData.registrationNo)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userUpdateData = {};
        
        if (updateData.username) userUpdateData.username = updateData.username;
        if (updateData.password) userUpdateData.password = updateData.password;
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          ...userUpdateData,
          updatedAt: serverTimestamp()
        });
        console.log('✅ User document updated successfully');
      }
    }

    // Log email update note (but don't attempt Firebase Auth update from warden)
    if (updateData.email) {
      console.log('📝 Email updated in Firestore profile:', updateData.email);
      console.log('📝 Note: Firebase Auth email update requires student to be logged in');
      console.log('📝 Student will need to visit profile page to sync authentication email');
    }

    console.log('✅ Student update operation completed successfully');
  } catch (error) {
    console.error('❌ Error updating student: ', error);
    throw new Error(`Failed to update student: ${error.message}`);
  }
};

// Additional helper functions for the new structure
export const createWardenProfile = async (wardenData) => {
  try {
    const { uid } = wardenData;
    const wardenRef = doc(db, 'users/warden', uid);
    await setDoc(wardenRef, {
      ...wardenData,
      role: 'warden',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Warden profile created with UID:', uid);
    return uid;
  } catch (error) {
    console.error('Error creating warden profile: ', error);
    throw new Error(`Failed to create warden profile: ${error.message}`);
  }
};

export const createAdminProfile = async (adminData) => {
  try {
    const { uid } = adminData;
    const adminRef = doc(db, 'users/admin', uid);
    await setDoc(adminRef, {
      ...adminData,
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Admin profile created with UID:', uid);
    return uid;
  } catch (error) {
    console.error('Error creating admin profile: ', error);
    throw new Error(`Failed to create admin profile: ${error.message}`);
  }
};

export const createStudentProfileNew = async (studentData) => {
  try {
    const { uid } = studentData;
    const studentRef = doc(db, 'users/student', uid);
    await setDoc(studentRef, {
      ...studentData,
      role: 'student',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Student profile created with UID:', uid);
    return uid;
  } catch (error) {
    console.error('Error creating student profile: ', error);
    throw new Error(`Failed to create student profile: ${error.message}`);
  }
};

export const getWardenProfile = async (uid) => {
  try {
    const docRef = doc(db, 'users/warden', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error fetching warden profile: ', error);
    throw error;
  }
};

export const getAdminProfile = async (uid) => {
  try {
    const docRef = doc(db, 'users/admin', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error fetching admin profile: ', error);
    throw error;
  }
};

export const getStudentProfileNew = async (uid) => {
  try {
    console.log('🔍 Fetching student profile from new structure with UID:', uid);
    const docRef = doc(db, 'users/student', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Found student profile in new structure:', docSnap.data());
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('❌ No student profile found in new structure, falling back to old method');
      return null;
    }
  } catch (error) {
    console.error('Error fetching student profile from new structure: ', error);
    throw error;
  }
};

export const updateStudentNew = async (uid, updateData) => {
  try {
    console.log('🔍 Updating student with UID:', uid);
    console.log('🔍 Update data:', updateData);
    
    const studentRef = doc(db, 'users/student', uid);
    await updateDoc(studentRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Student profile updated successfully in new structure');
  } catch (error) {
    console.error('Error updating student: ', error);
    throw new Error(`Failed to update student: ${error.message}`);
  }
};

export const updateWardenNew = async (uid, updateData) => {
  try {
    const wardenRef = doc(db, 'users/warden', uid);
    await updateDoc(wardenRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Warden profile updated successfully in new structure');
  } catch (error) {
    console.error('Error updating warden: ', error);
    throw new Error(`Failed to update warden: ${error.message}`);
  }
};

export const getAllStudents = async () => {
  try {
    const q = query(collection(db, 'users/student'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all students: ', error);
    throw error;
  }
};

export const getAllWardens = async () => {
  try {
    const q = query(collection(db, 'users/warden'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all wardens: ', error);
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    console.log('🗑️ Starting comprehensive student deletion for ID:', studentId);
    
    let profileData = null;
    let studentUid = studentId; // Assume the passed ID is the UID
    let registrationNo = null;
    let foundProfileId = null;
    
    // Step 1: Try to find the profile by multiple methods, prioritizing UID
    console.log('🔍 Searching for student profile...');
    
    // Method 1: Query by uid field (most likely to work with Firebase Auth UID)
    try {
      const q = query(
        collection(db, 'profiles'),
        where('uid', '==', studentId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileDoc = querySnapshot.docs[0];
        profileData = profileDoc.data();
        foundProfileId = profileDoc.id;
        console.log('✅ Found profile by UID field query');
      }
    } catch (error) {
      console.log('❌ UID field query failed:', error.message);
    }
    
    // Method 2: Direct document lookup by studentId
    if (!profileData) {
      try {
        const profileRef = doc(db, 'profiles', studentId);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          profileData = profileDoc.data();
          foundProfileId = studentId;
          console.log('✅ Found profile by direct ID lookup');
        }
      } catch (error) {
        console.log('❌ Direct ID lookup failed:', error.message);
      }
    }
    
    // Method 3: Query by document ID field
    if (!profileData) {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('id', '==', studentId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          profileData = profileDoc.data();
          foundProfileId = profileDoc.id;
          console.log('✅ Found profile by ID field query');
        }
      } catch (error) {
        console.log('❌ ID field query failed:', error.message);
      }
    }
    
    // Method 4: Query by registration number
    if (!profileData) {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('registrationNo', '==', studentId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          profileData = profileDoc.data();
          foundProfileId = profileDoc.id;
          console.log('✅ Found profile by registration number query');
        }
      } catch (error) {
        console.log('❌ Registration number query failed:', error.message);
      }
    }
    
    // Method 5: Query by email/username
    if (!profileData) {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('email', '==', studentId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          profileData = profileDoc.data();
          foundProfileId = profileDoc.id;
          console.log('✅ Found profile by email query');
        }
      } catch (error) {
        console.log('❌ Email query failed:', error.message);
      }
    }
    
    // Method 6: Query by username
    if (!profileData) {
      try {
        const q = query(
          collection(db, 'profiles'),
          where('username', '==', studentId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          profileData = profileDoc.data();
          foundProfileId = profileDoc.id;
          console.log('✅ Found profile by username query');
        }
      } catch (error) {
        console.log('❌ Username query failed:', error.message);
      }
    }
    
    // SPECIAL HANDLING: If no profile found, show available profiles and error
    if (!profileData) {
      console.log('❌ No profile found with ID:', studentId);
      console.log('📄 Available profiles:');
      
      // Show all available profiles for debugging
      const allProfilesQuery = query(collection(db, 'profiles'));
      const allProfilesSnapshot = await getDocs(allProfilesQuery);
      
      if (allProfilesSnapshot.empty) {
        console.log('   ❌ No profiles found in database at all!');
        console.log('   🔧 SOLUTION: Database is empty - need to create students first');
      } else {
        allProfilesSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   📄 ${doc.id}: ${data.name || 'No name'} (${data.email || data.username || 'No email'})`);
          console.log(`       uid: ${data.uid || 'No uid'}`);
          console.log(`       userId: ${data.userId || 'No userId'}`);
          console.log(`       registrationNo: ${data.registrationNo || 'No regNo'}`);
          console.log('---');
        });
      }
      
      throw new Error(`Student profile with ID ${studentId} not found. Database may be empty or have permission issues.`);
    }
    
    // Extract student information
    studentUid = profileData.uid || studentId; // Use profile UID or fallback to passed ID
    registrationNo = profileData.registrationNo;
    
    console.log('📋 Found profile data:', profileData);
    console.log('🔗 Student UID:', studentUid);
    console.log('📝 Registration No:', registrationNo);
    console.log('🆔 Found Profile ID:', foundProfileId);
    
    // Step 2: Delete the found profile
    if (foundProfileId) {
      await deleteDoc(doc(db, 'profiles', foundProfileId));
      console.log('✅ Found profile deleted successfully:', foundProfileId);
    }
    
    // Step 3: Delete UID profile if it exists and is different
    if (studentUid && studentUid !== foundProfileId) {
      try {
        const uidProfileRef = doc(db, 'profiles', studentUid);
        const uidProfileDoc = await getDoc(uidProfileRef);
        
        if (uidProfileDoc.exists()) {
          await deleteDoc(uidProfileRef);
          console.log('✅ UID profile deleted successfully:', studentUid);
        } else {
          console.log('ℹ️ No UID profile found to delete');
        }
      } catch (error) {
        console.log('⚠️ Error deleting UID profile:', error.message);
      }
    }
    
    // Step 4: Delete from users collection if registration number exists
    if (registrationNo && registrationNo !== 'TEMP') {
      try {
        const q = query(
          collection(db, 'users'),
          where('registrationNo', '==', registrationNo)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          for (const userDoc of querySnapshot.docs) {
            await deleteDoc(doc(db, 'users', userDoc.id));
            console.log('✅ User document deleted:', userDoc.id);
          }
        } else {
          console.log('ℹ️ No user document found for registration:', registrationNo);
        }
      } catch (error) {
        console.log('⚠️ Error deleting user document:', error.message);
      }
    }
    
    // Step 5: Note about Firebase Auth deletion
    console.log('ℹ️ Note: Firebase Auth user deletion requires admin privileges');
    console.log('ℹ️ To delete the Firebase Auth user, go to Firebase Console → Authentication → Users');
    console.log('📝 Search for UID:', studentUid, 'and delete manually');
    
    console.log('🎉 Student Firestore data deletion completed successfully');
    return { 
      success: true, 
      studentId, 
      studentUid, 
      foundProfileId,
      message: 'Student Firestore data deleted successfully. Firebase Auth user requires manual deletion in Firebase Console.' 
    };
    
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    throw new Error(`Failed to delete student: ${error.message}`);
  }
};
