import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../services/userService';
import { updateEmail as updateFirebaseEmail } from 'firebase/auth';
import { auth } from '../firebase';
import {
  Container, Paper, Typography, Box, Alert,
  Grid, CircularProgress, IconButton, Snackbar,
  Avatar, Divider, Button
} from '@mui/material';
import { 
  ArrowBack, 
  Person, 
  School, 
  Home, 
  Phone, 
  LocationOn,
  Description,
  DateRange
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Function to sync Firebase Auth email with profile email
  const syncFirebaseAuthEmail = async (profileEmail) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email !== profileEmail) {
        console.log('🔄 Updating Firebase Auth email from', currentUser.email, 'to', profileEmail);
        await updateFirebaseEmail(currentUser, profileEmail);
        console.log('✅ Firebase Auth email updated successfully');
        return true;
      } else {
        console.log('ℹ️ Firebase Auth email already matches profile email');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating Firebase Auth email:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user) {
          console.log('🔍 StudentProfile: Fetching profile for user UID:', user.uid);
          const userProfile = await getUserProfile(user.uid);
          console.log('📊 StudentProfile: Received profile data:', userProfile);
          
          if (userProfile) {
            setProfile(userProfile);
            console.log('✅ StudentProfile: Profile set successfully');
            
            // Sync Firebase Auth email with profile email
            if (userProfile.email && userProfile.email !== user.email) {
              try {
                const emailUpdated = await syncFirebaseAuthEmail(userProfile.email);
                if (emailUpdated) {
                  setSnackbar({ 
                    open: true, 
                    message: 'Your login email has been updated to match your profile email', 
                    severity: 'success' 
                  });
                }
              } catch (emailError) {
                console.error('Email sync error:', emailError);
                setSnackbar({ 
                  open: true, 
                  message: 'Profile loaded, but email update failed. Please logout and login again.', 
                  severity: 'warning' 
                });
              }
            }
          } else {
            console.log('❌ StudentProfile: No profile found for UID:', user.uid);
          }
        }
      } catch (error) {
        console.error('❌ StudentProfile: Error fetching student profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              p: 6,
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
              textAlign: 'center'
            }}
          >
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: '#3b82f6',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500 }}>
              Loading your profile...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="md">
          <Box
            sx={{
              p: 6,
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem'
              }}
            >
              <Person sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#1e293b', 
              mb: 2 
            }}>
              Profile Not Found
            </Typography>
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                borderRadius: '12px',
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              Please contact your warden to set up your profile.
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/student')}
              startIcon={<ArrowBack />}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                }
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          gap: 2
        }}>
          <IconButton
            onClick={() => navigate('/student')}
            sx={{
              background: 'white',
              color: '#3b82f6',
              width: 48,
              height: 48,
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#f8fafc',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5
              }}
            >
              My Profile
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Profile information created by your warden
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: '24px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
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
          <Box sx={{ p: 4 }}>
            {/* Profile Header */}
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
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                  Profile created by warden
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ 
              backgroundColor: 'rgba(148, 163, 184, 0.1)', 
              mb: 3,
              border: 'none',
              height: '1px'
            }} />

            {/* Profile Information */}
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
                    <Person sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Full Name
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.9rem'
                    }}>
                      {profile?.name || 'N/A'}
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
                      {profile?.hostel || 'N/A'}
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
              <Grid size={6}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 2,
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.1)'
                }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Phone sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Phone Number
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.9rem'
                    }}>
                      {profile?.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.1)'
                }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5
                  }}>
                    <LocationOn sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Address
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.9rem',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {profile?.address || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentProfile;
