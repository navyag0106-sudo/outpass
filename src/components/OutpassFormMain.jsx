import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Box, 
  Alert,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Slide,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  DatePicker 
} from '@mui/x-date-pickers/DatePicker';
import { 
  LocalizationProvider 
} from '@mui/x-date-pickers/LocalizationProvider';
import { 
  AdapterDateFns 
} from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../hooks/useAuth';
import { createOutpass } from '../services/outpassService';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  ArrowBack,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  BasicInfoStep,
  DateSelectionStep,
  ContactDetailsStep,
  ReviewStep
} from './OutpassFormSteps';

const OutpassForm = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      setMessage('You must be logged in to submit an outpass request');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [user, navigate]);

  const steps = [
    {
      label: 'Basic Information',
      description: 'Where are you going and why?'
    },
    {
      label: 'Date Selection',
      description: 'When do you need outpass?'
    },
    {
      label: 'Contact Details',
      description: 'Emergency contact information'
    },
    {
      label: 'Review & Submit',
      description: 'Review your application'
    }
  ];

  const formik = useFormik({
    initialValues: {
      destination: '',
      reason: '',
      departureDate: null,
      arrivalDate: null,
      emergencyContact: '',
      tripType: 'personal',
      hostel: 'Boys Hostel A', // Default value
      registrationNo: '', // Add registration number field
      attachments: []
    },
    validationSchema: Yup.object({
      destination: Yup.string()
        .required('Destination is required')
        .min(3, 'Destination must be at least 3 characters'),
      reason: Yup.string()
        .required('Reason is required')
        .trim()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason cannot exceed 500 characters'),
      departureDate: Yup.date()
        .required('Departure date is required')
        .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Departure date cannot be in the past'),
      arrivalDate: Yup.date()
        .required('Arrival date is required')
        .min(Yup.ref('departureDate'), 'Arrival date must be after departure date'),
      emergencyContact: Yup.string()
        .matches(/^[0-9]{10}$/, 'Emergency contact must be exactly 10 digits')
        .required('Emergency contact is required'),
      tripType: Yup.string().required('Trip type is required'),
      hostel: Yup.string().required('Hostel is required'),
      registrationNo: Yup.string().required('Registration number is required')
    }),
    onSubmit: async (values, { setSubmitting }) => {
      console.log('🚀 FORM SUBMISSION TRIGGERED!');
      console.log('Form values:', values);
      console.log('User:', user);
      console.log('User profile:', userProfile);
      
      try {
        // Check if user is authenticated
        if (!user || !user.uid) {
          console.log('❌ User not authenticated');
          setMessage('You must be logged in to submit an outpass request');
          setShowSuccess(false);
          setSubmitting(false);
          return;
        }

        console.log('✅ User authenticated, proceeding with submission...');
        console.log('🔍 User profile:', userProfile);
        console.log('🔍 User profile hostel:', userProfile?.hostel);
        console.log('🔍 Form values hostel:', values.hostel);
        
        setLoading(true);
        
        const outpassData = {
          ...values,
          userId: user.uid,
          studentName: user.displayName || userProfile?.name || user.email.split('@')[0] || 'Student',
          registrationNo: values.registrationNo, // Use registrationNo from form instead of profile
          hostel: values.hostel, // Use hostel from form instead of profile
          department: userProfile?.department || 'N/A',
          phone: userProfile?.phone || 'N/A',
          email: user.email,
          dateApplied: new Date(),
          status: 'pending'
        };
        
        console.log('📤 Enhanced outpass data to submit:', outpassData);
        console.log('🔍 Final hostel value:', outpassData.hostel);
        console.log('🔍 About to call createOutpass service...');
        
        const result = await createOutpass(outpassData);
        console.log('✅ Outpass created successfully with ID:', result);
        
        // Set success state and navigate
        setMessage('Outpass submitted successfully!');
        setShowSuccess(true);
        
        // Navigate after 2 seconds
        setTimeout(() => {
          console.log('🔄 Redirecting to student dashboard...');
          navigate('/student');
        }, 2000);
        
      } catch (error) {
        console.error('❌ Submit error:', error);
        setMessage(error.message || 'Failed to submit outpass. Please try again.');
        setShowSuccess(false);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        console.log('Redirecting to student dashboard...');
        navigate('/student');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  // Touch all fields on review step to show validation errors
  useEffect(() => {
    if (activeStep === 3) {
      const allFields = ['destination', 'reason', 'tripType', 'hostel', 'registrationNo', 'departureDate', 'arrivalDate', 'emergencyContact'];
      allFields.forEach(field => {
        formik.setFieldTouched(field, true);
      });
    }
  }, [activeStep, formik.setFieldTouched]);

  const handleNext = () => {
    console.log('Current step:', activeStep);
    console.log('Form values:', formik.values);
    console.log('Form errors:', formik.errors);
    console.log('Form touched:', formik.touched);
    
    const currentStepFields = {
      0: ['destination', 'reason', 'tripType', 'hostel', 'registrationNo'],
      1: ['departureDate', 'arrivalDate'],
      2: ['emergencyContact']
    };
    
    const fields = currentStepFields[activeStep];
    const hasErrors = fields.some(field => formik.touched[field] && formik.errors[field]);
    
    console.log('Fields to validate:', fields);
    console.log('Has errors:', hasErrors);
    
    if (!hasErrors && fields.every(field => formik.values[field])) {
      console.log('Moving to next step');
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      console.log('Validation failed, touching fields');
      fields.forEach(field => formik.setFieldTouched(field, true));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <BasicInfoStep formik={formik} />;
      case 1:
        return <DateSelectionStep formik={formik} />;
      case 2:
        return <ContactDetailsStep formik={formik} />;
      case 3:
        return <ReviewStep formik={formik} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
      <Container maxWidth="md" sx={{ py: 3, flex: 1 }}>
        <Slide direction="down" in={true} timeout={600}>
          <Paper 
            elevation={8} 
            sx={{ 
              p: 4,
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <IconButton 
                component="a" 
                href="/student"
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  flexGrow: 1
                }}
              >
                Apply for Outpass
              </Typography>
            </Box>

            {/* Success Message */}
            <Fade in={showSuccess} timeout={500}>
              <Alert 
                severity="success" 
                icon={<CheckCircle />}
                sx={{ mb: 3 }}
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setShowSuccess(false)}
                  >
                    ×
                  </IconButton>
                }
              >
                {message}
              </Alert>
            </Fade>

            {/* Error Message */}
            {message && !showSuccess && (
              <Fade in={!!message} timeout={500}>
                <Alert 
                  severity="error" 
                  icon={<ErrorIcon />}
                  sx={{ mb: 3 }}
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={() => setMessage('')}
                    >
                      ×
                    </IconButton>
                  }
                >
                  {message}
                </Alert>
              </Fade>
            )}

            {/* Stepper */}
            <Stepper 
              activeStep={activeStep} 
              sx={{ mb: 4 }}
              alternativeLabel
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel>
                    <Tooltip title={step.description} arrow>
                      <span>{step.label}</span>
                    </Tooltip>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Form Content */}
            <Box sx={{ flex: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <form onSubmit={formik.handleSubmit}>
                  <Fade in={true} timeout={800}>
                    <Box>
                      {getStepContent(activeStep)}
                    </Box>
                  </Fade>

                  {/* Navigation Buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      type="button"
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ 
                        background: '#6c757d',
                        '&:hover': { background: '#5a6268' }
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      type={activeStep === steps.length - 1 ? "submit" : "button"}
                      onClick={() => {
                        console.log('🔍 Button clicked!');
                        console.log('Active step:', activeStep);
                        console.log('Total steps:', steps.length);
                        console.log('Is last step:', activeStep === steps.length - 1);
                        console.log('Formik isValid:', formik.isValid);
                        console.log('Formik errors:', formik.errors);
                        console.log('Formik values:', formik.values);
                        console.log('Loading state:', loading);
                        
                        if (activeStep !== steps.length - 1) {
                          console.log('➡️ Moving to next step...');
                          handleNext();
                        }
                        // Remove the formik.handleSubmit() call here since type="submit" will handle it
                      }}
                      disabled={loading || formik.isSubmitting}
                      startIcon={activeStep === steps.length - 1 ? <Send /> : null}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                        }
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : activeStep === steps.length - 1 ? (
                        'Submit Application'
                      ) : (
                        'Next'
                      )}
                    </Button>
                  </Box>
                </form>
              </LocalizationProvider>
            </Box>
          </Paper>
        </Slide>
      </Container>
    </Box>
  );
};

export default OutpassForm;
