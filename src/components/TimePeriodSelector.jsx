// src/components/TimePeriodSelector.jsx
import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography, 
  Grid,
  Button,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

const TimePeriodSelector = ({ onPeriodsChange }) => {
  const today = new Date();
  
  // Predefined period options
  const predefinedPeriods = [
    { label: 'Custom Range', value: 'custom' },
    { label: 'Last 30 Days vs Previous 30 Days', value: 'last30' },
    { label: 'Last 90 Days vs Previous 90 Days', value: 'last90' },
    { label: 'This Month vs Last Month', value: 'thisMonth' },
    { label: 'This Quarter vs Last Quarter', value: 'thisQuarter' },
    { label: 'This Year vs Last Year', value: 'thisYear' },
    { label: 'Year-over-Year (Same Month Last Year)', value: 'yoy' }
  ];
  
  // State for selected period type and custom dates
  const [periodType, setPeriodType] = useState('last30');
  const [currentStartDate, setCurrentStartDate] = useState(subDays(today, 30));
  const [currentEndDate, setCurrentEndDate] = useState(today);
  const [previousStartDate, setPreviousStartDate] = useState(subDays(today, 60));
  const [previousEndDate, setPreviousEndDate] = useState(subDays(today, 31));
  
  // Handle period type change
  const handlePeriodTypeChange = (event) => {
    const newPeriodType = event.target.value;
    setPeriodType(newPeriodType);
    
    // Update date ranges based on selected period type
    switch(newPeriodType) {
      case 'last30':
        setCurrentStartDate(subDays(today, 30));
        setCurrentEndDate(today);
        setPreviousStartDate(subDays(today, 60));
        setPreviousEndDate(subDays(today, 31));
        break;
      case 'last90':
        setCurrentStartDate(subDays(today, 90));
        setCurrentEndDate(today);
        setPreviousStartDate(subDays(today, 180));
        setPreviousEndDate(subDays(today, 91));
        break;
      case 'thisMonth':
        setCurrentStartDate(startOfMonth(today));
        setCurrentEndDate(today);
        setPreviousStartDate(startOfMonth(subMonths(today, 1)));
        setPreviousEndDate(endOfMonth(subMonths(today, 1)));
        break;
      case 'thisQuarter':
        setCurrentStartDate(startOfQuarter(today));
        setCurrentEndDate(today);
        setPreviousStartDate(startOfQuarter(subMonths(today, 3)));
        setPreviousEndDate(endOfQuarter(subMonths(today, 3)));
        break;
      case 'thisYear':
        setCurrentStartDate(startOfYear(today));
        setCurrentEndDate(today);
        setPreviousStartDate(startOfYear(subYears(today, 1)));
        setPreviousEndDate(endOfYear(subYears(today, 1)));
        break;
      case 'yoy':
        // Current: This month to date
        setCurrentStartDate(startOfMonth(today));
        setCurrentEndDate(today);
        // Previous: Same month last year
        setPreviousStartDate(startOfMonth(subYears(today, 1)));
        setPreviousEndDate(endOfMonth(subYears(today, 1)));
        break;
      case 'custom':
        // Keep existing dates for custom selection
        break;
      default:
        break;
    }
  };
  
  // Apply selected periods
  const handleApply = () => {
    if (onPeriodsChange) {
      onPeriodsChange({
        currentPeriod: {
          startDate: currentStartDate,
          endDate: currentEndDate,
          label: `${format(currentStartDate, 'MMM d, yyyy')} - ${format(currentEndDate, 'MMM d, yyyy')}`
        },
        previousPeriod: {
          startDate: previousStartDate,
          endDate: previousEndDate,
          label: `${format(previousStartDate, 'MMM d, yyyy')} - ${format(previousEndDate, 'MMM d, yyyy')}`
        }
      });
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Compare Time Periods
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="period-type-label">Select Comparison</InputLabel>
              <Select
                labelId="period-type-label"
                id="period-type"
                value={periodType}
                label="Select Comparison"
                onChange={handlePeriodTypeChange}
              >
                {predefinedPeriods.map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Period
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={currentStartDate}
                    onChange={(newDate) => setCurrentStartDate(newDate)}
                    disabled={periodType !== 'custom'}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={currentEndDate}
                    onChange={(newDate) => setCurrentEndDate(newDate)}
                    disabled={periodType !== 'custom'}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Previous Period
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Start Date"
                    value={previousStartDate}
                    onChange={(newDate) => setPreviousStartDate(newDate)}
                    disabled={periodType !== 'custom'}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="End Date"
                    value={previousEndDate}
                    onChange={(newDate) => setPreviousEndDate(newDate)}
                    disabled={periodType !== 'custom'}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleApply}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default TimePeriodSelector;
