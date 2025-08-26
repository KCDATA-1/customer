import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const TopCustomersSegments = ({ currentRFM, periods }) => {
  const [selectedSegment, setSelectedSegment] = useState('Champions');
  
  if (!currentRFM || !Array.isArray(currentRFM)) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Top Customers by Segment</Typography>
        <Typography variant="body2" color="text.secondary">
          No customer data available
        </Typography>
      </Paper>
    );
  }

  // Define segment colors
  const segmentColors = {
    'Champions': '#4CAF50',
    'Loyal Customers': '#2196F3',
    'Potential Loyalists': '#FF9800',
    'New Customers': '#9C27B0',
    'Promising': '#00BCD4',
    'At Risk': '#FF5722',
    'Can\'t Lose Them': '#F44336',
    'Hibernating': '#795548',
    'About to Sleep': '#607D8B'
  };

  // Group customers by segment
  const customersBySegment = {};
  currentRFM.forEach(customer => {
    const segment = customer.rfm?.segment || 'Unknown';
    if (!customersBySegment[segment]) {
      customersBySegment[segment] = [];
    }
    customersBySegment[segment].push(customer);
  });

  // Sort customers within each segment by RFM score
  Object.keys(customersBySegment).forEach(segment => {
    customersBySegment[segment].sort((a, b) => 
      (b.rfm?.rfm_score || 0) - (a.rfm?.rfm_score || 0)
    );
  });

  // Prepare data for segment distribution pie chart
  const segmentDistribution = Object.keys(customersBySegment).map(segment => ({
    name: segment,
    value: customersBySegment[segment].length,
    color: segmentColors[segment] || '#9E9E9E'
  }));

  // Get top customers for selected segment
  const topCustomersInSegment = customersBySegment[selectedSegment] || [];
  const top10Customers = topCustomersInSegment.slice(0, 10);

  // Prepare data for top customers bar chart
  const topCustomersChartData = top10Customers.map(customer => {
    const totalRevenue = customer.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    return {
      name: customer.name?.substring(0, 15) + (customer.name?.length > 15 ? '...' : ''),
      revenue: totalRevenue,
      rfmScore: customer.rfm?.rfm_score || 0,
      transactions: customer.transactions?.length || 0
    };
  });

  // Calculate segment statistics
  const segmentStats = Object.keys(customersBySegment).map(segment => {
    const customers = customersBySegment[segment];
    const totalRevenue = customers.reduce((sum, customer) => 
      sum + (customer.transactions?.reduce((tSum, t) => tSum + t.amount, 0) || 0), 0
    );
    const avgRFMScore = customers.reduce((sum, customer) => 
      sum + (customer.rfm?.rfm_score || 0), 0) / customers.length;
    
    return {
      segment,
      count: customers.length,
      totalRevenue,
      avgRevenue: totalRevenue / customers.length,
      avgRFMScore,
      color: segmentColors[segment] || '#9E9E9E'
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Top Customers by RFM Segment
      </Typography>
      
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {periods?.currentPeriod?.label || 'Current Period'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Segment Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Customer Segment Distribution
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Segment Statistics */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Segment Performance Overview
          </Typography>
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {segmentStats.map((stat) => (
              <Card key={stat.segment} sx={{ mb: 1, border: `2px solid ${stat.color}` }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: stat.color, width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                      {stat.count}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {stat.segment}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue: ${stat.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Revenue: ${stat.avgRevenue.toLocaleString()} | RFM Score: {stat.avgRFMScore.toFixed(1)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Segment Selector */}
        <Grid item xs={12}>
          <FormControl sx={{ minWidth: 200, mb: 2 }}>
            <InputLabel>Select Segment</InputLabel>
            <Select
              value={selectedSegment}
              label="Select Segment"
              onChange={(e) => setSelectedSegment(e.target.value)}
            >
              {Object.keys(customersBySegment).map((segment) => (
                <MenuItem key={segment} value={segment}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: segmentColors[segment] || '#9E9E9E',
                        mr: 1
                      }}
                    />
                    {segment} ({customersBySegment[segment].length})
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Top Customers Chart */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            Top 10 Customers in {selectedSegment}
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCustomersChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                    if (name === 'rfmScore') return [value.toFixed(2), 'RFM Score'];
                    if (name === 'transactions') return [value, 'Transactions'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill={segmentColors[selectedSegment] || '#8884d8'} 
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Top Customers Table */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Customer Details
          </Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">RFM Score</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {top10Customers.map((customer, index) => {
                  const totalRevenue = customer.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {customer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={customer.rfm?.rfm_score?.toFixed(1) || '0.0'} 
                          size="small"
                          color={index < 3 ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        ${totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {customer.transactions?.length || 0}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TopCustomersSegments;