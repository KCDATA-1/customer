import React from 'react';
import { Box, Paper, Typography, Grid, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CLVComparison = ({ comparisonData, periods }) => {
  // Add safety check at the beginning
  if (!comparisonData || !comparisonData.customerChanges || !comparisonData.overallChanges) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Customer Lifetime Value Comparison</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Safe access to properties with default values
  const customerChanges = comparisonData?.customerChanges || [];
  const overallChanges = comparisonData?.overallChanges || {};
  
  const totalCLV = overallChanges?.totalCLV || { current: 0, previous: 0, absoluteChange: 0, percentChange: 0 };
  const averageCLV = overallChanges?.averageCLV || { current: 0, previous: 0, absoluteChange: 0, percentChange: 0 };
  const customerCount = overallChanges?.customerCount || { current: 0, previous: 0, change: 0 };

  // Sort customers by absolute change for top movers
  const sortedCustomers = [...customerChanges].sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange));
  const topMovers = sortedCustomers.slice(0, 5);

  // Format data for the chart
  const chartData = topMovers.map(customer => ({
    name: customer?.name || 'Unknown',
    current: customer?.currentCLV || 0,
    previous: customer?.previousCLV || 0,
    change: customer?.absoluteChange || 0
  }));

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Customer Lifetime Value Comparison
      </Typography>
      
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {periods?.currentPeriod?.label || 'Current Period'} vs. {periods?.previousPeriod?.label || 'Previous Period'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* CLV Metrics */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Key Metrics
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Total Customer Lifetime Value
            </Typography>
            <Typography variant="h6">
              ${totalCLV.current.toFixed(2)}
              {totalCLV.absoluteChange !== 0 && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    color: totalCLV.absoluteChange > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {totalCLV.absoluteChange > 0 ? '↑' : '↓'} 
                  {Math.abs(totalCLV.percentChange).toFixed(1)}%
                </Typography>
              )}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Average CLV per Customer
            </Typography>
            <Typography variant="h6">
              ${averageCLV.current.toFixed(2)}
              {averageCLV.absoluteChange !== 0 && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    color: averageCLV.absoluteChange > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {averageCLV.absoluteChange > 0 ? '↑' : '↓'} 
                  {Math.abs(averageCLV.percentChange).toFixed(1)}%
                </Typography>
              )}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Customer Count
            </Typography>
            <Typography variant="h6">
              {customerCount.current}
              {customerCount.change !== 0 && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    color: customerCount.change > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {customerCount.change > 0 ? '↑' : '↓'} 
                  {Math.abs(customerCount.change)}
                </Typography>
              )}
            </Typography>
          </Box>
        </Grid>
        
        {/* Top Movers Chart */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            Top CLV Movers
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="current" name="Current CLV" fill="#8884d8" />
                <Bar dataKey="previous" name="Previous CLV" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CLVComparison;
