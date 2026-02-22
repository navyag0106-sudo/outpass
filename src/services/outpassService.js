import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { OUTPASS_STATUSES } from '../utils/constants';

export const createOutpass = async (outpassData) => {
  try {
    // Validate required fields
    if (!outpassData.userId) {
      throw new Error('User ID is required.');
    }
    
    if (!outpassData.destination || !outpassData.reason) {
      throw new Error('Destination and reason are required fields.');
    }
    
    if (!outpassData.departureDate || !outpassData.arrivalDate) {
      throw new Error('Departure and arrival dates are required.');
    }
    
    console.log('🔍 Outpass Service - Creating outpass with data:', outpassData);
    console.log('🔍 Outpass Service - Hostel value:', outpassData.hostel);
    
    // Enhanced data structure with all necessary fields
    const enhancedOutpassData = {
      // Basic information
      userId: outpassData.userId,
      studentName: outpassData.studentName || 'Student',
      registrationNo: outpassData.registrationNo || 'N/A',
      
      // Trip details
      destination: outpassData.destination,
      reason: outpassData.reason,
      tripType: outpassData.tripType || 'personal',
      
      // Date information (ensure proper date handling)
      departureDate: outpassData.departureDate,
      arrivalDate: outpassData.arrivalDate,
      dateApplied: serverTimestamp(),
      createdAt: serverTimestamp(),
      
      // Contact information
      emergencyContact: outpassData.emergencyContact,
      
      // Status tracking
      status: OUTPASS_STATUSES.PENDING,
      
      // Additional metadata
      attachments: outpassData.attachments || [],
      hostel: outpassData.hostel || 'N/A', // Ensure hostel is saved
      department: outpassData.department || 'N/A',
      
      // Audit trail
      submissionIP: 'web-app', // Could be enhanced with actual IP
      submissionMethod: 'web-form'
    };
    
    console.log('🔍 Outpass Service - Enhanced data to save:', enhancedOutpassData);
    console.log('🔍 Outpass Service - Final hostel value being saved:', enhancedOutpassData.hostel);
    
    const docRef = await addDoc(collection(db, 'outpassRequests'), enhancedOutpassData);
    
    console.log('✅ Outpass Service - Outpass created successfully with ID: ', docRef.id);
    console.log('📊 Outpass Service - Status set to:', OUTPASS_STATUSES.PENDING);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Outpass Service - Error creating outpass: ', error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. You may not have permission to create outpass requests.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again later.');
    } else if (error.code === 'deadline-exceeded') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else {
      throw new Error(`Failed to create outpass: ${error.message}`);
    }
  }
};

export const getOutpassRequests = async (userId) => {
  try {
    let q;
    try {
      q = query(
        collection(db, 'outpassRequests'),
        where('userId', '==', userId),
        orderBy('dateApplied', 'desc')
      );
    } catch {
      console.log('Index not found for user requests, using fallback query');
      // Fallback: fetch all user requests and sort client-side
      q = query(
        collection(db, 'outpassRequests'),
        where('userId', '==', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    let requests = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Sort client-side if we couldn't use orderBy
    if (!q._query.orderBy || q._query.orderBy.length === 0) {
      requests.sort((a, b) => {
        const dateA = a.dateApplied?.toMillis?.() || 
          new Date(a.dateApplied).getTime();
        const dateB = b.dateApplied?.toMillis?.() || 
          new Date(b.dateApplied).getTime();
        return dateB - dateA; // descending order
      });
    }
    
    return requests;
  } catch (error) {
    console.error('Error fetching outpass requests: ', error);
    throw new Error(`Failed to fetch outpass requests: ${error.message}`);
  }
};

export const getOutpassHistory = async (userId) => {
  try {
    let q;
    try {
      q = query(
        collection(db, 'outpassRequests'),
        where('userId', '==', userId),
        orderBy('dateApplied', 'desc')
      );
    } catch {
      console.log('Index not found for user history, using fallback query');
      // Fallback: fetch all user requests and sort client-side
      q = query(
        collection(db, 'outpassRequests'),
        where('userId', '==', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    let history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort client-side if we couldn't use orderBy
    if (!q._query.orderBy || q._query.orderBy.length === 0) {
      history.sort((a, b) => {
        const dateA = a.dateApplied?.toMillis?.() || new Date(a.dateApplied).getTime();
        const dateB = b.dateApplied?.toMillis?.() || new Date(b.dateApplied).getTime();
        return dateB - dateA; // descending order
      });
    }
    
    return history;
  } catch (error) {
    console.error('Error fetching outpass history: ', error);
    throw new Error(`Failed to fetch outpass history: ${error.message}`);
  }
};

export const getAllOutpassRequests = async () => {
  try {
    let q;
    try {
      q = query(
        collection(db, 'outpassRequests'),
        orderBy('dateApplied', 'desc')
      );
    } catch {
      console.log('Index not found for all requests, using fallback query');
      // Fallback: fetch all requests and sort client-side
      q = query(collection(db, 'outpassRequests'));
    }
    
    const querySnapshot = await getDocs(q);
    let requests = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Sort client-side if we couldn't use orderBy
    if (!q._query.orderBy || q._query.orderBy.length === 0) {
      requests.sort((a, b) => {
        const dateA = a.dateApplied?.toMillis?.() || 
          new Date(a.dateApplied).getTime();
        const dateB = b.dateApplied?.toMillis?.() || 
          new Date(b.dateApplied).getTime();
        return dateB - dateA; // descending order
      });
    }
    
    return requests;
  } catch (error) {
    console.error('Error fetching all outpass requests: ', error);
    throw new Error(`Failed to fetch all outpass requests: ${error.message}`);
  }
};

export const updateOutpassStatus = async (outpassId, status) => {
  try {
    const outpassRef = doc(db, 'outpassRequests', outpassId);
    await updateDoc(outpassRef, { 
      status,
      updatedAt: serverTimestamp()
    });
    console.log('Outpass status updated successfully');
  } catch (error) {
    console.error('Error updating outpass status: ', error);
    throw new Error(`Failed to update outpass status: ${error.message}`);
  }
};

export const deleteOutpass = async (outpassId) => {
  try {
    const outpassRef = doc(db, 'outpassRequests', outpassId);
    await deleteDoc(outpassRef);
    console.log('Outpass deleted successfully');
  } catch (error) {
    console.error('Error deleting outpass: ', error);
    throw new Error(`Failed to delete outpass: ${error.message}`);
  }
};
