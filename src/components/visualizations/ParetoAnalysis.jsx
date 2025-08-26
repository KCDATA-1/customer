import React from 'react';
import { Box, Paper, Typography, Grid, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const ParetoAnalysis = ({ currentPeriodPareto, previousPeriodPareto, compareResults, periods }) => {
  // Add safety check at the beginning
  if (!currentPeriodPareto || !currentPeriodPareto.paretoPoints || !compareResults) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Pareto Analysis</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Safe access to properties with default values
  const paretoRatio = compareResults?.currentParetoRatio || 0;
  const previousParetoRatio = compareResults?.previousParetoRatio || 0;
  const giniCoefficient = compareResults?.currentGiniCoefficient || 0;
  const previousGiniCoefficient = compareResults?.previousGiniCoefficient || 0;
  const paretoPoints = currentPeriodPareto?.paretoPoints || [];
  const previousParetoPoints = previousPeriodPareto?.paretoPoints || [];

  // Format data for the chart
  const chartData = paretoPoints.map((point, index) => {
    return {
      customerPercentage: Math.round(point?.customerPercentage * 100) || 0,
      currentRevenue: Math.round(point?.revenuePercentage * 100) || 0,
      previousRevenue: previousParetoPoints[index] 
        ? Math.round(previousParetoPoints[index]?.revenuePercentage * 100) || 0 
        : 0
    };
  });

  // Find the 80% revenue point safely
  const eightyPercentLine = paretoPoints?.find(point => point?.revenuePercentage >= 0.8) || null;
  const customerPercentage = eightyPercentLine ? eightyPercentLine.customerPercentage * 100 : 100;
  
  // Calculate change in Pareto ratio
  const paretoRatioChange = compareResults?.paretoRatioChange || 0;
  const paretoRatioChangePercent = previousParetoRatio !== 0 
    ? (paretoRatioChange / previousParetoRatio) * 100 
    : 0;
  
  // Calculate change in Gini coefficient
  const giniCoefficientChange = compareResults?.giniCoefficientChange || 0;
  const giniCoefficientChangePercent = previousGiniCoefficient !== 0 
    ? (giniCoefficientChange / previousGiniCoefficient) * 100 
    : 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Pareto Analysis (80/20 Rule)
      </Typography>
      
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {periods?.currentPeriod?.label || 'Current Period'} vs. {periods?.previousPeriod?.label || 'Previous Period'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Pareto Chart */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            Revenue Concentration Curve
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="customerPercentage" 
                  label={{ value: 'Customers (%)', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Revenue (%)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" label="80% Revenue" />
                <Line 
                  type="monotone" 
                  dataKey="currentRevenue" 
                  name="Current Period" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="previousRevenue" 
                  name="Previous Period" 
                  stroke="#82ca9d" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        
        {/* Metrics */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Key Metrics
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Pareto Ratio (% of customers generating 80% of revenue)
            </Typography>
            <Typography variant="h6">
              {customerPercentage.toFixed(1)}%
              {paretoRatioChange !== 0 && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    color: paretoRatioChange < 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {paretoRatioChange < 0 ? '↓' : '↑'} 
                  {Math.abs(paretoRatioChangePercent).toFixed(1)}%
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {paretoRatioChange < 0 
                ? 'Revenue concentration has decreased (more balanced)' 
                : 'Revenue concentration has increased (less balanced)'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Gini Coefficient (inequality measure, 0-1)
            </Typography>
            <Typography variant="h6">
              {giniCoefficient.toFixed(2)}
              {giniCoefficientChange !== 0 && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    color: giniCoefficientChange < 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {giniCoefficientChange < 0 ? '↓' : '↑'} 
                  {Math.abs(giniCoefficientChangePercent).toFixed(1)}%
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {giniCoefficientChange < 0 
                ? 'Customer revenue distribution is becoming more equal' 
                : 'Customer revenue distribution is becoming less equal'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ParetoAnalysis;
