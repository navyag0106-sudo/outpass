import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { getUserProfile } from '../services/userService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Card, 
  CardContent,
  Box,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Person, 
  ExitToApp, 
  Description, 
  History,
  School,
  LocationOn,
  DateRange,
  Home,
  Email,
  Warning,
  Refresh
} from '@mui/icons-material';

const StudentDashboard = () => {
  const { user, logout, userProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [outpassHistory, setOutpassHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // For refreshing data

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          console.log('🔍 Student Dashboard - Fetching profile for user:', user.uid);
          
          const userProfile = await getUserProfile(user.uid);
          console.log('🔍 Student Dashboard - Fetched profile:', userProfile);
          
          if (userProfile) {
            setProfile(userProfile);
            console.log('✅ Student Dashboard - Profile set successfully');
            return userProfile; // Return the profile data
          } else {
            console.log('⚠️ Student Dashboard - No profile found, creating fallback profile');
            // Create a fallback profile using user data
            const fallbackProfile = {
              id: user.uid,
              uid: user.uid,
              name: user.displayName || user.email.split('@')[0] || 'Student',
              email: user.email,
              photoURL: user.photoURL || '', // Include Firebase Auth photoURL
              registrationNo: 'N/A',
              username: 'N/A',
              hostel: 'N/A',
              department: 'N/A',
              year: 'N/A',
              roomNo: 'N/A',
              phone: 'N/A',
              address: 'N/A',
              isFallbackProfile: true
            };
            setProfile(fallbackProfile);
            console.log('✅ Student Dashboard - Fallback profile created:', fallbackProfile);
            return fallbackProfile; // Return the fallback profile
          }
        } catch (error) {
          console.error('❌ Student Dashboard - Error fetching profile:', error);
          setError('Failed to fetch profile');
          
          // Create fallback profile even on error
          const fallbackProfile = {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0] || 'Student',
            email: user.email,
            photoURL: user.photoURL || '', // Include Firebase Auth photoURL
            registrationNo: 'N/A',
            username: 'N/A',
            hostel: 'N/A',
            department: 'N/A',
            year: 'N/A',
            roomNo: 'N/A',
            phone: 'N/A',
            address: 'N/A',
            isFallbackProfile: true
          };
          setProfile(fallbackProfile);
          return fallbackProfile; // Return the fallback profile
        }
      }
      return null; // Return null if no user
    };

    const fetchOutpassHistory = async () => {
      if (user) {
        try {
          let history = [];
          
          // Try the optimized query first (with orderBy)
          try {
            console.log('🔍 Trying optimized query with orderBy...');
            const q = query(
              collection(db, 'outpassRequests'), 
              where('userId', '==', user.uid),
              orderBy('dateApplied', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            history = querySnapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            }));
            
            console.log('✅ Optimized query successful, fetched:', history.length, 'records');
            
          } catch (indexError) {
            console.log('⚠️ Index error, using fallback query:', indexError.message);
            
            // Fallback: fetch without orderBy and sort client-side
            const fallbackQuery = query(
              collection(db, 'outpassRequests'), 
              where('userId', '==', user.uid)
            );
            
            const querySnapshot = await getDocs(fallbackQuery);
            history = querySnapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            }));
            
            // Sort client-side by dateApplied
            history.sort((a, b) => {
              const dateA = a.dateApplied?.toMillis?.() || new Date(a.dateApplied).getTime();
              const dateB = b.dateApplied?.toMillis?.() || new Date(b.dateApplied).getTime();
              return dateB - dateA; // descending order
            });
            
            console.log('✅ Fallback query successful, fetched and sorted:', history.length, 'records');
          }
          
          setOutpassHistory(history);
          
        } catch (err) {
          console.error('❌ Complete fetch failure:', err);
          
          // Provide helpful error message for different types of errors
          if (err.message.includes('requires an index')) {
            setError('Database index is being created. Please refresh in 1-2 minutes.');
          } else if (err.message.includes('permission-denied')) {
            setError('Permission denied. You may not have access to view outpass history.');
          } else if (err.message.includes('unavailable')) {
            setError('Service temporarily unavailable. Please try again later.');
          } else {
            setError('Failed to fetch outpass history. Please try again.');
          }
        }
      }
    };

    const loadData = async () => {
      setLoading(true);
      console.log('🔄 Student Dashboard - Starting data load...');
      try {
        // Fetch profile first and get the result directly
        const fetchedProfile = await fetchProfile();
        
        // Then fetch outpass history
        await fetchOutpassHistory();
        
        console.log('✅ Student Dashboard - Data load completed');
        
        // Safety check: use the fetched profile directly, not state
        if (!fetchedProfile) {
          console.log('⚠️ Student Dashboard - Profile still null, creating emergency fallback');
          const emergencyFallback = {
            id: user?.uid || 'unknown',
            uid: user?.uid || 'unknown',
            name: user?.displayName || user?.email?.split('@')[0] || 'Student',
            email: user?.email || 'N/A',
            photoURL: user?.photoURL || '',
            registrationNo: 'N/A',
            hostel: 'N/A',
            department: 'N/A',
            year: 'N/A',
            roomNo: 'N/A',
            isFallbackProfile: true
          };
          setProfile(emergencyFallback);
          console.log('✅ Student Dashboard - Emergency fallback created:', emergencyFallback);
        } else {
          console.log('✅ Student Dashboard - Profile loaded successfully, no fallback needed');
        }
        
      } catch (error) {
        console.error('❌ Student Dashboard - Error loading data:', error);
        
        // Create emergency fallback on error
        const emergencyFallback = {
          id: user?.uid || 'unknown',
          uid: user?.uid || 'unknown',
          name: user?.displayName || user?.email?.split('@')[0] || 'Student',
          email: user?.email || 'N/A',
          photoURL: user?.photoURL || '',
          registrationNo: 'N/A',
          hostel: 'N/A',
          department: 'N/A',
          year: 'N/A',
          roomNo: 'N/A',
          isFallbackProfile: true
        };
        setProfile(emergencyFallback);
        console.log('✅ Student Dashboard - Emergency fallback created on error:', emergencyFallback);
      } finally {
        setLoading(false);
        console.log('🔄 Student Dashboard - Loading set to false');
      }
    };

    loadData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      setError('Failed to logout');
    }
  };

  const handleRefreshProfile = async () => {
    console.log('🔄 Manual profile refresh triggered');
    try {
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        console.log('🔄 Refreshed profile:', userProfile);
        if (userProfile) {
          setProfile(userProfile);
          console.log('✅ Profile refreshed successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    // Handle Firestore Timestamp objects
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    
    // Handle regular Date objects or string dates
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '📋';
    }
  };

  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: 4,
          px: { xs: 2, sm: 3 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                  animation: 'shimmer 3s infinite'
                }}
              />
              <School sx={{ fontSize: 32, color: 'white', zIndex: 1 }} />
            </Box>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.5px',
                  mb: 0.5
                }}
              >
                Student Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Manage your outpass requests efficiently
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleLogout}
            sx={{ 
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              width: 48,
              height: 48,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(238, 90, 36, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(238, 90, 36, 0.4)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <ExitToApp />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {profile?.isFallbackProfile && (
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

        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            sx={{ flex: 1 }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box sx={{ flex: 1, width: '100%' }}>
            <Grid container spacing={3} sx={{ width: '100%' }}>
              {/* Profile Card */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 4, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={profile?.photoURL || profile?.profileImage || ''}
                          sx={{
                            width: 90,
                            height: 90,
                            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '2.2rem',
                            mr: 3,
                            border: '4px solid white',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
                            position: 'relative',
                            zIndex: 1
                          }}
                        >
                          {(!profile?.photoURL && !profile?.profileImage) && 
                            (profile?.name?.charAt(0) || <Person />)
                          }
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 20,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '3px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2
                          }}
                        >
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          color: '#1e293b',
                          mb: 0.5,
                          fontSize: '1.4rem'
                        }}>
                          {profile?.name || 'Loading...'}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#64748b',
                          fontWeight: 500,
                          mb: 1
                        }}>
                          Student
                        </Typography>
                        {profile?.isFallbackProfile && (
                          <Chip
                            label="Limited Profile Data"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ 
                      backgroundColor: 'rgba(148, 163, 184, 0.1)', 
                      mb: 3,
                      border: 'none',
                      height: '1px'
                    }} />

                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.1)'
                        }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Email sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              Email Address
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.9rem'
                            }}>
                              {profile?.email || profile?.username || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.1)'
                        }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Description sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              Registration No
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.9rem'
                            }}>
                              {profile?.registrationNo || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          background: 'rgba(245, 158, 11, 0.05)',
                          border: '1px solid rgba(245, 158, 11, 0.1)'
                        }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Home sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              Hostel
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.9rem'
                            }}>
                              {profile?.hostel || 'Boys Hostel'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          background: 'rgba(139, 92, 246, 0.05)',
                          border: '1px solid rgba(139, 92, 246, 0.1)'
                        }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <School sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              Department
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.9rem'
                            }}>
                              {profile?.dept || profile?.department || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          background: 'rgba(236, 72, 153, 0.05)',
                          border: '1px solid rgba(236, 72, 153, 0.1)'
                        }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <DateRange sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              Year
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.9rem'
                            }}>
                              {profile?.year || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          background: 'rgba(14, 165, 233, 0.05)',
                          border: '1px solid rgba(14, 165, 233, 0.1)'
                        }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <LocationOn sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              Room No
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.9rem'
                            }}>
                              {profile?.roomNo || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Card
                  elevation={6}
                  sx={{
                    borderRadius: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                      Quick Actions
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          variant="contained"
                          component={Link}
                          to="/student/apply"
                          fullWidth
                          size="large"
                          startIcon={<Description />}
                          sx={{
                            py: 2.5,
                            px: 3,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                            textTransform: 'none',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: -100,
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: 'left 0.5s',
                            },
                            '&:hover': {
                              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                              transform: 'translateY(-3px)',
                              boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)',
                              '&::before': {
                                left: '100%',
                              }
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          Apply for Outpass
                        </Button>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          variant="outlined"
                          component={Link}
                          to="/student/history"
                          fullWidth
                          size="large"
                          startIcon={<History />}
                          sx={{
                            py: 2.5,
                            px: 3,
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            borderColor: '#3b82f6',
                            color: '#3b82f6',
                            borderWidth: 2,
                            background: 'rgba(59, 130, 246, 0.05)',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: '#1d4ed8',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          View History
                        </Button>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Button
                          variant="outlined"
                          onClick={handleRefreshProfile}
                          fullWidth
                          size="large"
                          startIcon={<Refresh />}
                          sx={{
                            py: 2.5,
                            px: 3,
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            borderColor: '#10b981',
                            color: '#10b981',
                            borderWidth: 2,
                            background: 'rgba(16, 185, 129, 0.05)',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: '#059669',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          Refresh Profile
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Stats Cards */}
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50' }}>
                        Request Statistics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={4}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                            <Typography variant="h4" color="#27ae60" sx={{ fontWeight: 'bold' }}>
                              {outpassHistory.filter(h => h.status === 'approved').length}
                            </Typography>
                            <Typography variant="body2" color="#27ae60">Approved</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={4}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3cd' }}>
                            <Typography variant="h4" color="#f39c12" sx={{ fontWeight: 'bold' }}>
                              {outpassHistory.filter(h => h.status === 'pending').length}
                            </Typography>
                            <Typography variant="body2" color="#f39c12">Pending</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={4}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f8d7da' }}>
                            <Typography variant="h4" color="#e74c3c" sx={{ fontWeight: 'bold' }}>
                              {outpassHistory.filter(h => h.status === 'rejected').length}
                            </Typography>
                            <Typography variant="body2" color="#e74c3c">Rejected</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Outpass History */}
              <Grid size={12}>
                <Card
                  elevation={6}
                  sx={{
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                      Recent Outpass History
                    </Typography>

                    {outpassHistory.length === 0 ? (
                      <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                        <Typography variant="h6" color="#6c757d">
                          No outpass requests found
                        </Typography>
                      </Paper>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Departure Date</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Arrival Date</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {outpassHistory.slice(0, 5).map((outpass) => (
                              <TableRow
                                key={outpass.id}
                                hover
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOn fontSize="small" color="action" />
                                    {outpass.reason || 'N/A'}
                                  </Box>
                                </TableCell>
                                <TableCell>{formatDate(outpass.departureDate)}</TableCell>
                                <TableCell>{formatDate(outpass.arrivalDate)}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                      {getStatusIcon(outpass.status)}
                                    </Typography>
                                    <Chip
                                      label={outpass.status || 'Pending'}
                                      color={getStatusColor(outpass.status)}
                                      size="small"
                                      sx={{ 
                                        fontWeight: 'bold',
                                        minWidth: '80px',
                                        textAlign: 'center'
                                      }}
                                    />
                                  </Box>
                                  {outpass.status === 'pending' && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                      Awaiting approval
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default StudentDashboard;
