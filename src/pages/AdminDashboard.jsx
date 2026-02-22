import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import {
  getWardens,
  createWarden,
  updateWarden,
  deleteWarden,
  getUserProfile
} from '../services/userService';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar
} from '@mui/material';
import { Edit, Delete, Add, Search } from '@mui/icons-material';

const AdminDashboard = () => {
  const { user, logout, userProfile } = useAuth();
  const [profile, setProfile] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarden, setEditingWarden] = useState(null);
  const [wardenForm, setWardenForm] = useState({ name: '', email: '', username: '', password: '', phone: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [wardenSearchTerm, setWardenSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin profile
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile) {
            setProfile(userProfile);
          }
        }

        // Fetch pending requests
        const pendingQuery = query(collection(db, 'outpassRequests'), where('status', '==', 'pending'));
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingRequests(pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch all requests for history
        const allSnapshot = await getDocs(collection(db, 'outpassRequests'));
        setAllRequests(allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch wardens
        const wardensList = await getWardens();
        setWardens(wardensList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'outpassRequests', id), { status: 'approved' });
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
      setAllRequests(allRequests.map(req => req.id === id ? { ...req, status: 'approved' } : req));
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, 'outpassRequests', id), { status: 'rejected' });
      setPendingRequests(pendingRequests.filter(req => req.id !== id));
      setAllRequests(allRequests.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const filteredWardens = wardens.filter(warden => {
    const searchLower = wardenSearchTerm.toLowerCase();
    return (
      warden.employeeId?.toLowerCase().includes(searchLower)
    );
  });

  const filteredStudents = allRequests.filter(request => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      request.registrationNo?.toLowerCase().includes(searchLower)
    );
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleAddWarden = () => {
    setEditingWarden(null);
    setWardenForm({ name: '', email: '', username: '', password: '', phone: '' });
    setDialogOpen(true);
  };

  const handleEditWarden = (warden) => {
    setEditingWarden(warden);
    setWardenForm({
      name: warden.name || '',
      email: warden.email || '',
      username: warden.username || '',
      password: '',
      phone: warden.phone || ''
    });
    setDialogOpen(true);
  };

  const handleSaveWarden = async () => {
    try {
      if (editingWarden) {
        await updateWarden(editingWarden.id, wardenForm);
        setSnackbar({ open: true, message: 'Warden updated successfully', severity: 'success' });
      } else {
        await createWarden(wardenForm);
        setSnackbar({ open: true, message: 'Warden created successfully', severity: 'success' });
      }
      
      const updatedWardens = await getWardens();
      setWardens(updatedWardens);
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error saving warden', severity: 'error' });
      console.error('Error saving warden:', error);
    }
  };

  const handleDeleteWarden = async (wardenId) => {
    if (window.confirm('Are you sure you want to delete this warden?')) {
      try {
        await deleteWarden(wardenId);
        setSnackbar({ open: true, message: 'Warden deleted successfully', severity: 'success' });
        const updatedWardens = await getWardens();
        setWardens(updatedWardens);
      } catch (error) {
        setSnackbar({ open: true, message: 'Error deleting warden', severity: 'error' });
        console.error('Error deleting warden:', error);
      }
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {userProfile?.isFallbackProfile && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button size="small" color="inherit">
                Learn More
              </Button>
            }
          >
            Limited Access: Using local profile due to Firestore permissions. Some features may not work properly.
          </Alert>
        )}

        {/* Profile Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography><strong>Name:</strong> {profile.name || user?.displayName}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography><strong>Email:</strong> {user?.email}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography><strong>Role:</strong> Admin</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography><strong>Department:</strong> {profile.department || 'Administration'}</Typography>
            </Grid>
          </Grid>
          <Box mt={2}>
            <Button variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Warden Management */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Warden Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddWarden}
            >
              Add Warden
            </Button>
          </Box>
          
          {/* Search Bar for Wardens */}
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search wardens by employee ID..."
              value={wardenSearchTerm}
              onChange={(e) => setWardenSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
              size="small"
            />
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWardens.map((warden) => (
                  <TableRow key={warden.id}>
                    <TableCell>{warden.name}</TableCell>
                    <TableCell>{warden.email}</TableCell>
                    <TableCell>{warden.username}</TableCell>
                    <TableCell>{warden.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={warden.status || 'active'}
                        color={warden.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditWarden(warden)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteWarden(warden.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pending Requests / Notifications */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Pending Requests ({pendingRequests.length})
          </Typography>
          {pendingRequests.length === 0 ? (
            <Alert severity="info">No pending requests</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Registration No</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Departure Date</TableCell>
                    <TableCell>Arrival Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.studentName}</TableCell>
                      <TableCell>{req.registrationNo}</TableCell>
                      <TableCell>{req.destination}</TableCell>
                      <TableCell>{new Date(req.departureDate.seconds * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(req.arrivalDate.seconds * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApprove(req.id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleReject(req.id)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* History */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Outpass History
          </Typography>
          
          {/* Search Bar for Students/Requests */}
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search students by registration number..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
              size="small"
            />
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Registration No</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Departure Date</TableCell>
                  <TableCell>Arrival Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.studentName}</TableCell>
                    <TableCell>{req.registrationNo}</TableCell>
                    <TableCell>{req.destination}</TableCell>
                    <TableCell>{new Date(req.departureDate.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(req.arrivalDate.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.status}
                        color={
                          req.status === 'approved' ? 'success' :
                          req.status === 'rejected' ? 'error' : 'warning'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Warden Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWarden ? 'Edit Warden' : 'Add New Warden'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={wardenForm.name}
            onChange={(e) => setWardenForm({ ...wardenForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={wardenForm.email}
            onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={wardenForm.username}
            onChange={(e) => setWardenForm({ ...wardenForm, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={wardenForm.password}
            onChange={(e) => setWardenForm({ ...wardenForm, password: e.target.value })}
            sx={{ mb: 2 }}
            placeholder={editingWarden ? 'Leave blank to keep current password' : ''}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            variant="outlined"
            value={wardenForm.phone}
            onChange={(e) => setWardenForm({ ...wardenForm, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWarden} variant="contained">
            {editingWarden ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
