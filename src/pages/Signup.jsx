import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signupUser, validateRegistrationData, checkEmailAvailability } from '../services/signupService';
import {
  Container,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Fade
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Signup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student',
    
    // Student specific
    registrationNo: '',
    department: '',
    year: '',
    roomNo: '',
    phone: '',
    address: '',
    
    // Warden specific
    employeeId: '',
    
    // Common fields (used by both student and warden)
    hostel: '',
    
    // Admin specific
    adminCode: ''
  });

  const steps = ['Account Information', 'Personal Details', 'Confirmation'];

  const roleInfo = {
    student: {
      title: 'Student Registration',
      icon: <SchoolIcon />,
      description: 'Register as a student to request outpasses',
      color: '#1976d2'
    },
    warden: {
      title: 'Warden Registration', 
      icon: <SecurityIcon />,
      description: 'Register as a warden to manage students and approve outpasses',
      color: '#f57c00'
    },
    admin: {
      title: 'Admin Registration',
      icon: <AdminPanelSettingsIcon />,
      description: 'Register as an administrator',
      color: '#7b1fa2'
    }
  };

  const checkEmailAvailabilityRealtime = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailError('');
      return;
    }

    setEmailChecking(true);
    try {
      const result = await checkEmailAvailability(email);
      if (!result.available) {
        setEmailError(result.message);
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailError('');
    } finally {
      setEmailChecking(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(''); // Clear error on input
    
    // Check email availability when email field changes
    if (field === 'email') {
      const email = event.target.value;
      if (email && email.includes('@')) {
        checkEmailAvailabilityRealtime(email);
      } else {
        setEmailError('');
      }
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Account Information
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        if (!formData.email.includes('@')) {
          setError('Please enter a valid email address');
          return false;
        }
        if (emailError) {
          setError('Please use a different email address');
          return false;
        }
        return true;

      case 1: // Personal Details
        if (formData.role === 'student') {
          if (!formData.registrationNo || !formData.department || !formData.year || !formData.phone) {
            setError('Please fill in all student details');
            return false;
          }
        } else if (formData.role === 'warden') {
          if (!formData.hostel || !formData.employeeId) {
            setError('Please fill in all warden details');
            return false;
          }
        } else if (formData.role === 'admin') {
          if (!formData.adminCode) {
            setError('Please enter admin authorization code');
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all form data
    const validationErrors = validateRegistrationData(formData);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signupUser(formData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in={step === 0}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Create Your Account
              </Typography>
              
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                margin="normal"
                required
                autoComplete="name"
              />
              
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                autoComplete="email"
                error={!!emailError}
                helperText={emailError}
                InputProps={{
                  endAdornment: emailChecking && <CircularProgress size={20} />
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                autoComplete="new-password"
              />
              
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                margin="normal"
                required
                autoComplete="new-password"
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Select Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleInputChange('role')}
                  label="Select Role"
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="warden">Warden</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
              
              {formData.role && (
                <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {roleInfo[formData.role].icon}
                      <Box>
                        <Typography variant="subtitle2" color={roleInfo[formData.role].color}>
                          {roleInfo[formData.role].title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {roleInfo[formData.role].description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in={step === 1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              
              {formData.role === 'student' && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Registration Number"
                      value={formData.registrationNo}
                      onChange={handleInputChange('registrationNo')}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={formData.department}
                      onChange={handleInputChange('department')}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Year"
                      value={formData.year}
                      onChange={handleInputChange('year')}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Room Number"
                      value={formData.roomNo}
                      onChange={handleInputChange('roomNo')}
                      margin="normal"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel>Hostel</InputLabel>
                      <Select
                        value={formData.hostel}
                        onChange={handleInputChange('hostel')}
                        label="Hostel"
                      >
                        <MenuItem value="Boys Hostel A">Boys Hostel A</MenuItem>
                        <MenuItem value="Boys Hostel B">Boys Hostel B</MenuItem>
                        <MenuItem value="Girls Hostel A">Girls Hostel A</MenuItem>
                        <MenuItem value="Girls Hostel B">Girls Hostel B</MenuItem>
                        <MenuItem value="Mixed Hostel C">Mixed Hostel C</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              )}
              
              {formData.role === 'warden' && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel>Hostel Assignment</InputLabel>
                      <Select
                        value={formData.hostel}
                        onChange={handleInputChange('hostel')}
                        label="Hostel Assignment"
                      >
                        <MenuItem value="Boys Hostel A">Boys Hostel A</MenuItem>
                        <MenuItem value="Boys Hostel B">Boys Hostel B</MenuItem>
                        <MenuItem value="Girls Hostel A">Girls Hostel A</MenuItem>
                        <MenuItem value="Girls Hostel B">Girls Hostel B</MenuItem>
                        <MenuItem value="Mixed Hostel C">Mixed Hostel C</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={formData.employeeId}
                      onChange={handleInputChange('employeeId')}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      margin="normal"
                      required
                    />
                  </Grid>
                </Grid>
              )}
              
              {formData.role === 'admin' && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Administrator registration requires authorization from system administrators.
                  </Alert>
                  <TextField
                    fullWidth
                    label="Admin Authorization Code"
                    value={formData.adminCode}
                    onChange={handleInputChange('adminCode')}
                    margin="normal"
                    required
                    type="password"
                  />
                </Box>
              )}
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in={step === 2}>
            <Box textAlign="center">
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'success.main', width: 64, height: 64 }}>
                <HowToRegIcon sx={{ fontSize: 32 }} />
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                Ready to Register
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review your information before submitting your registration.
              </Typography>
              
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Registration Summary:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {formData.fullName}<br/>
                    <strong>Email:</strong> {formData.email}<br/>
                    <strong>Role:</strong> {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}<br/>
                    {formData.role === 'student' && (
                      <>
                        <strong>Registration No:</strong> {formData.registrationNo}<br/>
                        <strong>Department:</strong> {formData.department}<br/>
                        <strong>Year:</strong> {formData.year}
                      </>
                    )}
                    {formData.role === 'warden' && (
                      <>
                        <strong>Hostel:</strong> {formData.hostel}<br/>
                        <strong>Employee ID:</strong> {formData.employeeId}
                      </>
                    )}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'success.main', width: 64, height: 64 }}>
              <HowToRegIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Typography variant="h4" component="h1" gutterBottom color="success.main">
              Registration Successful!
            </Typography>
            
            <Typography variant="body1" paragraph>
              Your account has been created successfully. You can now login to your account.
            </Typography>
            
            <Button
              variant="contained"
              component={Link}
              to="/login"
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
              <PersonAddIcon />
            </Avatar>
            <Typography component="h1" variant="h4" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join the Hostel Outpass Management System
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <HowToRegIcon />}
                  >
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<PersonAddIcon />}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
