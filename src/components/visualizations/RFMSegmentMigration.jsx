import React from 'react';
import { Box, Paper, Typography, Grid, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RFMSegmentMigration = ({ comparisonData, periods }) => {
  // Add safety check at the beginning
  if (!comparisonData || !comparisonData.segmentChanges) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">RFM Segment Migration</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Safe access to properties with default values
  const segmentChanges = comparisonData?.segmentChanges || [];
  const customerChanges = comparisonData?.customerChanges || [];
  
  // Format data for the segment changes chart
  const segmentChartData = segmentChanges.map(segment => ({
    name: segment?.segment || 'Unknown',
    current: segment?.current || 0,
    previous: segment?.previous || 0,
    change: segment?.change || 0
  }));

  // Find top segment migrations
  const migrations = {};
  customerChanges.forEach(customer => {
    if (!customer.isNew && !customer.isLost && customer.currentSegment !== customer.previousSegment) {
      const key = `${customer.previousSegment} → ${customer.currentSegment}`;
      migrations[key] = (migrations[key] || 0) + 1;
    }
  });

  // Convert migrations to array and sort
  const migrationArray = Object.entries(migrations || {})
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 migrations

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        RFM Segment Migration
      </Typography>
      
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {periods?.currentPeriod?.label || 'Current Period'} vs. {periods?.previousPeriod?.label || 'Previous Period'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Segment Distribution Chart */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            Segment Distribution Changes
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" name="Current Period" fill="#8884d8" />
                <Bar dataKey="previous" name="Previous Period" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        {/* Top Migrations */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Top Segment Migrations
          </Typography>
          
          {migrationArray.length > 0 ? (
            migrationArray.map((migration, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="body1">
                  {migration.path}: {migration.count} customers
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    height: 10,
                    width: `${Math.min(100, (migration.count / migrationArray[0].count) * 100)}%`,
                    bgcolor: 'primary.main',
                    borderRadius: 1
                  }}
                />
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No significant segment migrations detected.
            </Typography>
          )}
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              New Customers: {customerChanges.filter(c => c.isNew).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lost Customers: {customerChanges.filter(c => c.isLost).length || 0}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RFMSegmentMigration;
