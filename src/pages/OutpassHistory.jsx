import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';

const OutpassHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        let historyData = [];
        
        // Try the optimized query first (with orderBy)
        try {
          console.log('🔍 Trying optimized query with orderBy...');
          const q = query(
            collection(db, 'outpassRequests'), 
            where('userId', '==', user.uid),
            orderBy('dateApplied', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          historyData = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          console.log('✅ Optimized query successful, fetched:', historyData.length, 'records');
          
        } catch (indexError) {
          console.log('⚠️ Index error, using fallback query:', indexError.message);
          
          // Fallback: fetch without orderBy and sort client-side
          const fallbackQuery = query(
            collection(db, 'outpassRequests'), 
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(fallbackQuery);
          historyData = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          // Sort client-side by dateApplied
          historyData.sort((a, b) => {
            const dateA = a.dateApplied?.toMillis?.() || new Date(a.dateApplied).getTime();
            const dateB = b.dateApplied?.toMillis?.() || new Date(b.dateApplied).getTime();
            return dateB - dateA; // descending order
          });
          
          console.log('✅ Fallback query successful, fetched and sorted:', historyData.length, 'records');
        }
        
        setHistory(historyData);
        setError('');
        
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
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Outpass History
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      ) : history.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No outpass requests found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Date Applied</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Out Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Return Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((req) => (
                <TableRow 
                  key={req.id} 
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {formatDate(req.dateApplied)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(req.departureDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(req.arrivalDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {req.reason || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={req.status || 'Unknown'} 
                      color={getStatusColor(req.status)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default OutpassHistory;
