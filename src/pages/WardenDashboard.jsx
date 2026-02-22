import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
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
import { Edit, Delete, Add, Search, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

const WardenDashboard = () => {
  const { user, logout, userProfile } = useAuth();
  const [profile, setProfile] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    registrationNo: '',
    department: '',
    year: '',
    roomNo: '',
    phone: '',
    address: '',
    username: '',
    password: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile) {
            setProfile(userProfile);
            
            // Fetch students assigned to this warden's hostel
            const studentsList = await getStudents(userProfile.hostel);
            setStudents(studentsList);
            
            // Fetch outpass requests for this warden's hostel
            await fetchOutpassRequests(userProfile.hostel);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user]);

  const fetchOutpassRequests = async (hostel) => {
    try {
      console.log('🔍 Fetching outpass requests for hostel:', hostel);
      console.log('🔍 Warden profile:', profile);
      
      let requests = [];
      
      // First, let's try to fetch all requests to see what's available
      console.log('🔍 Debug: Fetching ALL requests to check data...');
      const allRequestsQuery = query(collection(db, 'outpassRequests'));
      const allRequestsSnapshot = await getDocs(allRequestsQuery);
      const allRequestsData = allRequestsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      console.log('📊 ALL requests in database:', allRequestsData.length);
      console.log('📊 Sample request data:', allRequestsData[0]);
      console.log('📊 Hostel values in requests:', [...new Set(allRequestsData.map(req => req.hostel))]);
      
      // Now try to fetch with hostel filter and ordering
      try {
        console.log('🔍 Trying optimized query with hostel filter...');
        console.log('🔍 Query filter - hostel:', hostel);
        
        const q = query(
          collection(db, 'outpassRequests'),
          where('hostel', '==', hostel),
          orderBy('dateApplied', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        requests = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        console.log('✅ Optimized query successful, fetched:', requests.length, 'requests');
        
      } catch (indexError) {
        console.log('⚠️ Index error, using fallback query:', indexError.message);
        
        // Fallback: fetch without ordering and sort client-side
        const fallbackQuery = query(
          collection(db, 'outpassRequests'),
          where('hostel', '==', hostel)
        );
        
        const querySnapshot = await getDocs(fallbackQuery);
        requests = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        console.log('✅ Fallback query successful, fetched:', requests.length, 'requests');
      }
      
      // If no requests found with hostel filter, let's debug further
      if (requests.length === 0) {
        console.log('⚠️ No requests found for hostel:', hostel);
        console.log('🔍 Trying to find requests with similar hostel values...');
        
        // Try case-insensitive matching
        const similarRequests = allRequestsData.filter(req => 
          req.hostel && req.hostel.toLowerCase() === hostel.toLowerCase()
        );
        console.log('📊 Case-insensitive matches:', similarRequests.length);
        
        // Try partial matching
        const partialMatches = allRequestsData.filter(req => 
          req.hostel && req.hostel.toLowerCase().includes(hostel.toLowerCase()) ||
          hostel.toLowerCase().includes(req.hostel?.toLowerCase() || '')
        );
        console.log('📊 Partial matches:', partialMatches.length);
        
        if (partialMatches.length > 0) {
          console.log('📊 Using partial matches as fallback');
          requests = partialMatches;
        }
      }
      
      // Sort client-side by dateApplied
      requests.sort((a, b) => {
        const dateA = a.dateApplied?.toMillis?.() || new Date(a.dateApplied).getTime();
        const dateB = b.dateApplied?.toMillis?.() || new Date(b.dateApplied).getTime();
        return dateB - dateA; // descending order
      });
      
      // Filter requests by status
      const pending = requests.filter(req => req.status === 'pending');
      const all = requests; // All requests for history
      
      console.log('📊 Final request summary:', {
        total: all.length,
        pending: pending.length,
        approved: all.filter(req => req.status === 'approved').length,
        rejected: all.filter(req => req.status === 'rejected').length,
        hostel: hostel
      });
      
      setPendingRequests(pending);
      setAllRequests(all);
      
    } catch (error) {
      console.error('❌ Error fetching outpass requests:', error);
      
      // Provide helpful error message
      if (error.message.includes('requires an index')) {
        setError('Database index is being created. Please refresh in 1-2 minutes.');
      } else if (error.message.includes('permission-denied')) {
        setError('Permission denied. You may not have access to view outpass requests.');
      } else {
        setError('Failed to fetch outpass requests. Please try again.');
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      console.log('✅ Approving request:', id);
      await updateDoc(doc(db, 'outpassRequests', id), { status: 'approved' });
      
      // Refresh the requests list
      await fetchOutpassRequests(profile.hostel);
      
      setSnackbar({
        open: true,
        message: 'Outpass request approved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('❌ Error approving request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to approve request. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleReject = async (id) => {
    try {
      console.log('❌ Rejecting request:', id);
      await updateDoc(doc(db, 'outpassRequests', id), { status: 'rejected' });
      
      // Refresh the requests list
      await fetchOutpassRequests(profile.hostel);
      
      setSnackbar({
        open: true,
        message: 'Outpass request rejected successfully!',
        severity: 'info'
      });
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reject request. Please try again.',
        severity: 'error'
      });
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      
      // Handle seconds timestamp (Firestore format)
      if (dateValue && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString();
      }
      
      // Handle regular Date object or string
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests.map(req => req.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequests(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one request to approve',
        severity: 'warning'
      });
      return;
    }

    try {
      const promises = selectedRequests.map(id => 
        updateDoc(doc(db, 'outpassRequests', id), { status: 'approved' })
      );
      
      await Promise.all(promises);
      
      setPendingRequests(prev => prev.filter(req => !selectedRequests.includes(req.id)));
      setAllRequests(prev => prev.map(req => 
        selectedRequests.includes(req.id) ? { ...req, status: 'approved' } : req
      ));
      
      setSelectedRequests([]);
      setSelectAll(false);
      
      setSnackbar({
        open: true,
        message: `${selectedRequests.length} request(s) approved successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('❌ Error bulk approving requests:', error);
      setSnackbar({
        open: true,
        message: 'Failed to approve some requests. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one request to reject',
        severity: 'warning'
      });
      return;
    }

    try {
      const promises = selectedRequests.map(id => 
        updateDoc(doc(db, 'outpassRequests', id), { status: 'rejected' })
      );
      
      await Promise.all(promises);
      
      setPendingRequests(prev => prev.filter(req => !selectedRequests.includes(req.id)));
      setAllRequests(prev => prev.map(req => 
        selectedRequests.includes(req.id) ? { ...req, status: 'rejected' } : req
      ));
      
      setSelectedRequests([]);
      setSelectAll(false);
      
      setSnackbar({
        open: true,
        message: `${selectedRequests.length} request(s) rejected successfully!`,
        severity: 'info'
      });
    } catch (error) {
      console.error('❌ Error bulk rejecting requests:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reject some requests. Please try again.',
        severity: 'error'
      });
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.registrationNo?.toLowerCase().includes(searchLower)
    );
  });

  const filteredHistory = allRequests.filter(req => {
    const searchLower = historySearchTerm.toLowerCase();
    return (
      req.registrationNo?.toLowerCase().includes(searchLower) ||
      req.studentName?.toLowerCase().includes(searchLower)
    );
  });

  const filteredPendingRequests = pendingRequests.filter(req => {
    const searchLower = pendingSearchTerm.toLowerCase();
    return (
      req.registrationNo?.toLowerCase().includes(searchLower) ||
      req.studentName?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      name: '',
      email: '',
      registrationNo: '',
      department: '',
      year: '',
      roomNo: '',
      phone: '',
      address: '',
      username: '',
      password: ''
    });
    setDialogOpen(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name || '',
      email: student.email || '',
      registrationNo: student.registrationNo || '',
      department: student.department || '',
      year: student.year || '',
      roomNo: student.roomNo || '',
      phone: student.phone || '',
      address: student.address || '',
      username: student.username || '',
      password: student.password || ''
    });
    setDialogOpen(true);
  };

  const handleSaveStudent = async () => {
    // Basic validation
    if (
      !studentForm.name ||
      !studentForm.email ||
      !studentForm.registrationNo ||
      !studentForm.username ||
      (!studentForm.password && !editingStudent) ||
      !studentForm.department ||
      !studentForm.year ||
      !studentForm.roomNo ||
      !studentForm.phone ||
      !studentForm.address
    ) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, studentForm);
        setSnackbar({
          open: true,
          message: 'Student updated successfully',
          severity: 'success'
        });
      } else {
        await createStudent({
          ...studentForm,
          wardenId: user?.uid
        });
        setSnackbar({
          open: true,
          message: 'Student created successfully',
          severity: 'success'
        });
      }
      
      const updatedStudents = await getStudents(profile.hostel);
      setStudents(updatedStudents);
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error saving student',
        severity: 'error'
      });
      console.error('Error saving student:', error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(studentId);
        setSnackbar({
          open: true,
          message: 'Student deleted successfully',
          severity: 'success'
        });
        const updatedStudents = await getStudents(profile.hostel);
        setStudents(updatedStudents);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error deleting student',
          severity: 'error'
        });
        console.error('Error deleting student:', error);
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
          Warden Dashboard
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
              <Typography>
                <strong>Name:</strong> {profile.name || user?.displayName}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography>
                <strong>Email:</strong> {user?.email}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography>
                <strong>Role:</strong> Warden
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography>
                <strong>Hostel:</strong> {profile.hostel || 'Not Assigned'}
              </Typography>
            </Grid>
          </Grid>
          <Box mt={2}>
            <Button variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Student Management */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Student Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddStudent}
            >
              Add Student
            </Button>
          </Box>
          
          {/* Search Bar */}
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableCell>Registration No</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Room No</TableCell>
                  <TableCell>Hostel</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.registrationNo}</TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{student.year}</TableCell>
                    <TableCell>{student.roomNo}</TableCell>
                    <TableCell>{student.hostel}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditStudent(student)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStudent(student.id)}
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Pending Requests ({pendingRequests.length})
            </Typography>
            <Box display="flex" gap={1}>
              {selectedRequests.length > 0 && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleBulkApprove}
                    startIcon={<span>✓</span>}
                  >
                    Approve Selected ({selectedRequests.length})
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleBulkReject}
                    startIcon={<span>✗</span>}
                  >
                    Reject Selected ({selectedRequests.length})
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={() => fetchOutpassRequests(profile.hostel)}
                startIcon={<span>🔄</span>}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          {/* Search Bar for Pending Requests */}
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search pending requests by registration number or student name..."
              value={pendingSearchTerm}
              onChange={(e) => setPendingSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
              size="small"
            />
          </Box>
          {filteredPendingRequests.length === 0 ? (
            <Alert severity="info">
              {pendingSearchTerm ? 'No pending requests found matching your search' : 'No pending requests'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <IconButton onClick={handleSelectAll}>
                        {selectAll ? <CheckBox /> : <CheckBoxOutlineBlank />}
                      </IconButton>
                    </TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Registration No</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Departure Date</TableCell>
                    <TableCell>Arrival Date</TableCell>
                    <TableCell>Emergency Contact</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPendingRequests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell padding="checkbox">
                        <IconButton onClick={() => handleSelectRequest(req.id)}>
                          {selectedRequests.includes(req.id) ? <CheckBox /> : <CheckBoxOutlineBlank />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {req.studentName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{req.registrationNo || 'N/A'}</TableCell>
                      <TableCell>{req.destination || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {req.reason || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(req.departureDate)}</TableCell>
                      <TableCell>{formatDate(req.arrivalDate)}</TableCell>
                      <TableCell>{req.emergencyContact || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApprove(req.id)}
                          sx={{ mr: 1 }}
                          startIcon={<span>✅</span>}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleReject(req.id)}
                          startIcon={<span>❌</span>}
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Outpass History ({allRequests.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => fetchOutpassRequests(profile.hostel)}
              startIcon={<span>🔄</span>}
            >
              Refresh
            </Button>
          </Box>
          
          {/* Search Bar for History */}
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search history by registration number or student name..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
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
                  <TableCell>Student Name</TableCell>
                  <TableCell>Registration No</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Departure Date</TableCell>
                  <TableCell>Arrival Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {req.studentName || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{req.registrationNo || 'N/A'}</TableCell>
                    <TableCell>{req.destination || 'N/A'}</TableCell>
                    <TableCell>{formatDate(req.departureDate)}</TableCell>
                    <TableCell>{formatDate(req.arrivalDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.status || 'pending'}
                        color={
                          req.status === 'approved' ? 'success' :
                          req.status === 'rejected' ? 'error' : 'warning'
                        }
                        size="small"
                        icon={
                          req.status === 'approved' ? <span>✅</span> :
                          req.status === 'rejected' ? <span>❌</span> : <span>⏳</span>
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

      {/* Student Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            variant="outlined"
            value={studentForm.name}
            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={studentForm.email}
            onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Registration Number"
            fullWidth
            variant="outlined"
            value={studentForm.registrationNo}
            onChange={(e) => setStudentForm({ ...studentForm, registrationNo: e.target.value })}
            sx={{ mb: 2 }}
            disabled={!!editingStudent}
            required
          />
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={studentForm.username}
            onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={studentForm.password}
            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
            sx={{ mb: 2 }}
            placeholder={editingStudent ? 'Leave blank to keep current password' : 'Set student password'}
            required={!editingStudent}
          />
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            variant="outlined"
            value={studentForm.department}
            onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Year"
            fullWidth
            variant="outlined"
            value={studentForm.year}
            onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Room Number"
            fullWidth
            variant="outlined"
            value={studentForm.roomNo}
            onChange={(e) => setStudentForm({ ...studentForm, roomNo: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Phone Number"
            fullWidth
            variant="outlined"
            value={studentForm.phone}
            onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={studentForm.address}
            onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStudent} variant="contained">
            {editingStudent ? 'Update' : 'Create'}
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

export default WardenDashboard;
