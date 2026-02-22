import React from 'react';
import { 
  Grid, 
  TextField, 
  FormControl,
  InputLabel,
  FormHelperText,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Box
} from '@mui/material';
import { 
  LocationOn,
  CalendarToday,
  Phone,
  Description,
  Warning
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Step Components

export const BasicInfoStep = ({ formik }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <FormControl fullWidth>
        <InputLabel>Trip Type</InputLabel>
        <Select
          name="tripType"
          value={formik.values.tripType}
          onChange={formik.handleChange}
          error={formik.touched.tripType && Boolean(formik.errors.tripType)}
        >
          <MenuItem value="personal">Personal</MenuItem>
          <MenuItem value="medical">Medical</MenuItem>
          <MenuItem value="family">Family Emergency</MenuItem>
          <MenuItem value="academic">Academic</MenuItem>
        </Select>
        <FormHelperText error={formik.touched.tripType && formik.errors.tripType}>
          {formik.touched.tripType && formik.errors.tripType}
        </FormHelperText>
      </FormControl>
    </Grid>
    <Grid size={12}>
      <FormControl fullWidth>
        <InputLabel>Hostel</InputLabel>
        <Select
          name="hostel"
          value={formik.values.hostel}
          onChange={formik.handleChange}
          error={formik.touched.hostel && Boolean(formik.errors.hostel)}
        >
          <MenuItem value="Boys Hostel A">Boys Hostel A</MenuItem>
          <MenuItem value="Boys Hostel B">Boys Hostel B</MenuItem>
          <MenuItem value="Girls Hostel A">Girls Hostel A</MenuItem>
          <MenuItem value="Girls Hostel B">Girls Hostel B</MenuItem>
        </Select>
        <FormHelperText error={formik.touched.hostel && formik.errors.hostel}>
          {formik.touched.hostel && formik.errors.hostel}
        </FormHelperText>
      </FormControl>
    </Grid>
    <Grid size={12}>
      <TextField
        fullWidth
        label="Registration Number"
        name="registrationNo"
        value={formik.values.registrationNo}
        onChange={formik.handleChange}
        error={formik.touched.registrationNo && Boolean(formik.errors.registrationNo)}
        helperText={formik.touched.registrationNo && formik.errors.registrationNo}
        placeholder="Enter your registration number"
      />
    </Grid>
    <Grid size={12}>
      <TextField
        fullWidth
        label="Destination"
        name="destination"
        value={formik.values.destination}
        onChange={formik.handleChange}
        error={formik.touched.destination && Boolean(formik.errors.destination)}
        helperText={formik.touched.destination && formik.errors.destination}
        InputProps={{
          startAdornment: <LocationOn sx={{ mr: 1, color: 'action' }} />
        }}
        placeholder="Enter your destination"
      />
    </Grid>
    <Grid size={12}>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Reason for Outpass"
        name="reason"
        value={formik.values.reason}
        onChange={formik.handleChange}
        error={formik.touched.reason && Boolean(formik.errors.reason)}
        helperText={formik.touched.reason && formik.errors.reason}
        InputProps={{
          startAdornment: <Description sx={{ mr: 1, mt: 2, color: 'action' }} />
        }}
        placeholder="Please provide a detailed reason for your outpass request"
      />
    </Grid>
  </Grid>
);

export const DateSelectionStep = ({ formik }) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, sm: 6 }}>
      <DatePicker
        label="Departure Date & Time"
        value={formik.values.departureDate}
        onChange={(date) => formik.setFieldValue('departureDate', date)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            error={formik.touched.departureDate && Boolean(formik.errors.departureDate)}
            helperText={formik.touched.departureDate && formik.errors.departureDate}
            InputProps={{
              startAdornment: <CalendarToday sx={{ mr: 1, color: 'action' }} />
            }}
          />
        )}
        minDate={new Date()}
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 6 }}>
      <DatePicker
        label="Arrival Date & Time"
        value={formik.values.arrivalDate}
        onChange={(date) => formik.setFieldValue('arrivalDate', date)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            error={formik.touched.arrivalDate && Boolean(formik.errors.arrivalDate)}
            helperText={formik.touched.arrivalDate && formik.errors.arrivalDate}
            InputProps={{
              startAdornment: <CalendarToday sx={{ mr: 1, color: 'action' }} />
            }}
          />
        )}
        minDate={formik.values.departureDate}
      />
    </Grid>
    <Grid size={12}>
      <Alert severity="info" icon={<Warning />}>
        <Typography variant="body2">
          <strong>Note:</strong> Please ensure your arrival date is after your departure date.
          Outpass requests are typically processed within 24 hours.
        </Typography>
      </Alert>
    </Grid>
  </Grid>
);

export const ContactDetailsStep = ({ formik }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <TextField
        fullWidth
        label="Emergency Contact Number"
        name="emergencyContact"
        value={formik.values.emergencyContact}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
          formik.setFieldValue('emergencyContact', value);
        }}
        error={formik.touched.emergencyContact && Boolean(formik.errors.emergencyContact)}
        helperText={formik.touched.emergencyContact && formik.errors.emergencyContact}
        InputProps={{
          startAdornment: <Phone sx={{ mr: 1, color: 'action' }} />,
          inputProps: {
            inputMode: 'numeric',
            pattern: '[0-9]*',
            maxLength: 10
          }
        }}
        placeholder="Enter 10-digit phone number"
      />
    </Grid>
    <Grid size={12}>
      <Alert severity="warning" icon={<Warning />}>
        <Typography variant="body2">
          <strong>Important:</strong> This emergency contact will be used only in case of emergencies
          during your outpass period. Please ensure that number is correct and reachable.
        </Typography>
      </Alert>
    </Grid>
  </Grid>
);

export const ReviewStep = ({ formik }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
            Application Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Trip Type:</strong>
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={formik.values.tripType} size="small" color="primary" />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Hostel:</strong>
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={formik.values.hostel} size="small" color="secondary" />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Registration No:</strong>
              </Typography>
              <Typography variant="body1">
                {formik.values.registrationNo || 'Not specified'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Destination:</strong>
              </Typography>
              <Typography variant="body1">
                {formik.values.destination || 'Not specified'}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" color="textSecondary">
                <strong>Reason:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {formik.values.reason || 'Not specified'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Departure:</strong>
              </Typography>
              <Typography variant="body1">
                {formik.values.departureDate?.toLocaleString() || 'Not specified'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Arrival:</strong>
              </Typography>
              <Typography variant="body1">
                {formik.values.arrivalDate?.toLocaleString() || 'Not specified'}
              </Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" color="textSecondary">
                <strong>Emergency Contact:</strong>
              </Typography>
              <Typography variant="body1">
                {formik.values.emergencyContact || 'Not specified'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);
