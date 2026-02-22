/* eslint-disable */
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to verify Firebase token
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Create outpass
app.post('/api/outpasses', authenticate, async (req, res) => {
  try {
    const outpassData = {
      ...req.body,
      studentId: req.user.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('outpasses').add(outpassData);
    
    // Create notification for warden
    await createNotification({
      userId: req.body.wardenId, // or fetch from user's hostel
      title: 'New Outpass Request',
      message: `${req.body.studentName} has requested an outpass`,
      type: 'outpass_status',
      data: { outpassId: docRef.id }
    });

    res.status(201).json({ id: docRef.id, ...outpassData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get outpasses for student
app.get('/api/outpasses/student', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('outpasses')
      .where('studentId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const outpasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(outpasses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get outpasses for warden/admin
app.get('/api/outpasses/pending', authenticate, async (req, res) => {
  try {
    // Check if user is warden/admin
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    if (!['warden', 'admin'].includes(userData.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let query = db.collection('outpasses').where('status', '==', 'pending');
    
    // If warden, filter by their hostel
    if (userData.role === 'warden') {
      query = query.where('hostel', '==', userData.hostel);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const outpasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(outpasses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update outpass status
app.put('/api/outpasses/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: req.user.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    await db.collection('outpasses').doc(id).update(updateData);
    
    // Get outpass to create notification for student
    const outpassDoc = await db.collection('outpasses').doc(id).get();
    const outpass = outpassDoc.data();
    
    await createNotification({
      userId: outpass.studentId,
      title: 'Outpass Status Updated',
      message: `Your outpass has been ${status}`,
      type: 'outpass_status',
      data: { outpassId: id, status }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user notifications
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({
      read: true
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create notifications
async function createNotification(notification) {
  await db.collection('notifications').add({
    ...notification,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));