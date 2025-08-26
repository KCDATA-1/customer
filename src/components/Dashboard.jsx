// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, CircularProgress, Button } from '@mui/material';
import TimePeriodSelector from './TimePeriodSelector';
import DataImport from './DataImport';
import CSVConverter from './CSVConverter';
import RFMSegmentMigration from './visualizations/RFMSegmentMigration';
import CLVComparison from './visualizations/CLVComparison';
import ParetoAnalysis from './visualizations/ParetoAnalysis';
import TopCustomersSegments from './visualizations/TopCustomersSegments';
import { 
  calculateRFM, 
  compareRFM, 
  calculateCLV, 
  compareCLV, 
  calculatePareto, 
  comparePareto,
  generateSampleData
} from '../utils/analyticsUtils';

const Dashboard = () => {
  // State for time periods with default values
  const [periods, setPeriods] = useState(null);
  
  // State for customer data
  const [customerData, setCustomerData] = useState(null);
  
  // State for data source
  const [dataSource, setDataSource] = useState('sample'); // 'sample' or 'imported'
  
  // State for analysis results with default values (Solution 2)
  const [currentRFM, setCurrentRFM] = useState({
    customers: [],
    segments: {}
  });
  
  const [previousRFM, setPreviousRFM] = useState({
    customers: [],
    segments: {}
  });
  
  const [rfmComparison, setRfmComparison] = useState({
    segmentMigration: {},
    customerChanges: [],
    segmentChanges: []
  });
  
  const [currentCLV, setCurrentCLV] = useState({
    customers: []
  });
  
  const [previousCLV, setPreviousCLV] = useState({
    customers: []
  });
  
  const [clvComparison, setClvComparison] = useState({
    customerChanges: [],
    overallChanges: {
      totalCLV: { current: 0, previous: 0, absoluteChange: 0, percentChange: 0 },
      averageCLV: { current: 0, previous: 0, absoluteChange: 0, percentChange: 0 },
      customerCount: { current: 0, previous: 0, change: 0 }
    }
  });
  
  const [currentPareto, setCurrentPareto] = useState({
    customerRevenues: [],
    paretoPoints: [],
    paretoRatio: 0,
    giniCoefficient: 0
  });
  
  const [previousPareto, setPreviousPareto] = useState({
    customerRevenues: [],
    paretoPoints: [],
    paretoRatio: 0,
    giniCoefficient: 0
  });
  
  const [paretoComparison, setParetoComparison] = useState({
    paretoRatioChange: 0,
    giniCoefficientChange: 0,
    currentParetoRatio: 0,
    previousParetoRatio: 0,
    currentGiniCoefficient: 0,
    previousGiniCoefficient: 0
  });
  
  // State for loading
  const [loading, setLoading] = useState(false);
  
  // State for showing data import
  const [showDataImport, setShowDataImport] = useState(false);
  
  // State for showing CSV converter
  const [showCSVConverter, setShowCSVConverter] = useState(false);
  
  // Generate sample data on component mount
  useEffect(() => {
    if (dataSource === 'sample') {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      const sampleData = generateSampleData(200, 30, oneYearAgo, today);
      setCustomerData(sampleData);
    }
    
    // Set default time periods
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);
    
    const thirtyOneDaysAgo = new Date(today);
    thirtyOneDaysAgo.setDate(today.getDate() - 31);
    
    setPeriods({
      currentPeriod: {
        startDate: thirtyDaysAgo,
        endDate: today,
        label: `Last 30 Days (${thirtyDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()})`
      },
      previousPeriod: {
        startDate: sixtyDaysAgo,
        endDate: thirtyOneDaysAgo,
        label: `Previous 30 Days (${sixtyDaysAgo.toLocaleDateString()} - ${thirtyOneDaysAgo.toLocaleDateString()})`
      }
    });
  }, [dataSource]);
  
  // Run analysis when periods or customer data changes
  useEffect(() => {
    if (!periods || !customerData) return;
    
    setLoading(true);
    
    try {
      // Filter transactions for current period
      const currentPeriodCustomers = customerData.map(customer => ({
        ...customer,
        transactions: customer.transactions.filter(t => 
          new Date(t.date) >= periods.currentPeriod.startDate && 
          new Date(t.date) <= periods.currentPeriod.endDate
        )
      }));
      
      // Filter transactions for previous period
      const previousPeriodCustomers = customerData.map(customer => ({
        ...customer,
        transactions: customer.transactions.filter(t => 
          new Date(t.date) >= periods.previousPeriod.startDate && 
          new Date(t.date) <= periods.previousPeriod.endDate
        )
      }));
      
      // Calculate RFM for both periods
      const currentRFMResults = calculateRFM(currentPeriodCustomers, periods.currentPeriod.endDate);
      const previousRFMResults = calculateRFM(previousPeriodCustomers, periods.previousPeriod.endDate);
      
      // Compare RFM results
      const rfmComparisonResults = compareRFM(currentRFMResults, previousRFMResults);
      
      // Calculate CLV for both periods
      const currentCLVResults = calculateCLV(currentPeriodCustomers);
      const previousCLVResults = calculateCLV(previousPeriodCustomers);
      
      // Compare CLV results
      const clvComparisonResults = compareCLV(currentCLVResults, previousCLVResults);
      
      // Calculate Pareto for both periods
      const currentParetoResults = calculatePareto(currentPeriodCustomers);
      const previousParetoResults = calculatePareto(previousPeriodCustomers);
      
      // Compare Pareto results
      const paretoComparisonResults = comparePareto(currentParetoResults, previousParetoResults);
      
      // Update state with results
      setCurrentRFM(currentRFMResults || { customers: [], segments: {} });
      setPreviousRFM(previousRFMResults || { customers: [], segments: {} });
      setRfmComparison(rfmComparisonResults || { segmentMigration: {}, customerChanges: [], segmentChanges: [] });
      
      setCurrentCLV(currentCLVResults || { customers: [] });
      setPreviousCLV(previousCLVResults || { customers: [] });
      setClvComparison(clvComparisonResults || { 
        customerChanges: [], 
        overallChanges: {
          totalCLV: { current: 0, previous: 0, absoluteChange: 0, percentChange: 0 },
          averageCLV: { current: 0, previous: 0, absoluteChange: 0, percentChange: 0 },
          customerCount: { current: 0, previous: 0, change: 0 }
        }
      });
      
      setCurrentPareto(currentParetoResults || {
        customerRevenues: [],
        paretoPoints: [],
        paretoRatio: 0,
        giniCoefficient: 0
      });
      
      setPreviousPareto(previousParetoResults || {
        customerRevenues: [],
        paretoPoints: [],
        paretoRatio: 0,
        giniCoefficient: 0
      });
      
      setParetoComparison(paretoComparisonResults || {
        paretoRatioChange: 0,
        giniCoefficientChange: 0,
        currentParetoRatio: 0,
        previousParetoRatio: 0,
        currentGiniCoefficient: 0,
        previousGiniCoefficient: 0
      });
    } catch (error) {
      console.error("Error analyzing data:", error);
    } finally {
      setLoading(false);
    }
  }, [periods, customerData]);
  
  // Handle period changes from selector
  const handlePeriodsChange = (newPeriods) => {
    setPeriods(newPeriods);
  };
  
  // Handle data import
  const handleDataImported = (importedData) => {
    setCustomerData(importedData);
    setDataSource('imported');
    setShowDataImport(false);
    setShowCSVConverter(false);
  };
  
  // Handle CSV conversion
  const handleCSVConverted = (convertedData) => {
    setCustomerData(convertedData);
    setDataSource('imported');
    setShowCSVConverter(false);
    setShowDataImport(false);
  };
  
  // Toggle between sample and imported data
  const toggleDataSource = () => {
    if (dataSource === 'imported') {
      setDataSource('sample');
    } else {
      setShowDataImport(true);
    }
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Customer Intelligence Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
          Comparative Analysis of Customer Metrics
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => setShowCSVConverter(true)}
            sx={{ mr: 2 }}
          >
            Convert CSV Data
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={toggleDataSource}
            sx={{ mr: 2 }}
          >
            {dataSource === 'sample' ? 'Import Your Data' : 'Use Sample Data'}
          </Button>
        </Box>
        
        {showCSVConverter && (
          <CSVConverter 
            onDataConverted={handleCSVConverted}
            onClose={() => setShowCSVConverter(false)}
          />
        )}
        
        {showDataImport && (
          <DataImport onDataImported={handleDataImported} />
        )}
        
        {/* Time Period Selector */}
        <TimePeriodSelector onPeriodsChange={handlePeriodsChange} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {/* RFM Analysis */}
            <Grid item xs={12}>
              <RFMSegmentMigration 
                comparisonData={rfmComparison} 
                periods={periods} 
              />
            </Grid>
            
            {/* Top Customers by Segment */}
            <Grid item xs={12}>
              <TopCustomersSegments 
                currentRFM={currentRFM} 
                periods={periods} 
              />
            </Grid>
            
            {/* CLV Analysis */}
            <Grid item xs={12}>
              <CLVComparison 
                comparisonData={clvComparison} 
                periods={periods} 
              />
            </Grid>
            
            {/* Pareto Analysis */}
            <Grid item xs={12}>
              <ParetoAnalysis 
                currentPeriodPareto={currentPareto}
                previousPeriodPareto={previousPareto}
                compareResults={paretoComparison}
                periods={periods} 
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;
