import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CSVInstructions from './CSVInstructions';

const CSVConverter = ({ onDataConverted, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [convertedData, setConvertedData] = useState(null);
  const [error, setError] = useState(null);
  
  const steps = ['Upload CSV', 'Map Columns', 'Preview & Convert', 'Download/Import'];
  
  // Required fields for the dashboard
  const requiredFields = {
    customerId: 'Customer ID',
    customerName: 'Customer Name',
    customerEmail: 'Customer Email (optional)',
    transactionId: 'Transaction ID',
    transactionDate: 'Transaction Date',
    transactionAmount: 'Transaction Amount'
  };
  
  const optionalFields = {
    transactionItems: 'Number of Items (optional)'
  };
  
  // Handle CSV file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('CSV file must contain at least a header row and one data row');
          return;
        }
        
        // Parse CSV (simple implementation - handles basic CSV format)
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        const headers = parseCSVLine(lines[0]);
        const data = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        setHeaders(headers);
        setCsvData(data);
        setActiveStep(1);
      } catch (err) {
        setError(`Error parsing CSV: ${err.message}`);
      }
    };
    
    reader.readAsText(file);
  };
  
  // Handle column mapping
  const handleColumnMapping = (field, csvColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: csvColumn
    }));
  };
  
  // Validate mapping and proceed to conversion
  const validateAndProceed = () => {
    const requiredMappings = ['customerId', 'customerName', 'transactionId', 'transactionDate', 'transactionAmount'];
    const missingMappings = requiredMappings.filter(field => !columnMapping[field]);
    
    if (missingMappings.length > 0) {
      setError(`Please map the following required fields: ${missingMappings.map(f => requiredFields[f]).join(', ')}`);
      return;
    }
    
    setError(null);
    convertData();
    setActiveStep(2);
  };
  
  // Convert CSV data to JSON format
  const convertData = () => {
    try {
      // Group transactions by customer
      const customerMap = new Map();
      
      csvData.forEach(row => {
        const customerId = row[columnMapping.customerId];
        const customerName = row[columnMapping.customerName];
        const customerEmail = columnMapping.customerEmail ? row[columnMapping.customerEmail] : `${customerId}@example.com`;
        
        const transactionId = row[columnMapping.transactionId];
        const transactionDate = row[columnMapping.transactionDate];
        const transactionAmount = parseFloat(row[columnMapping.transactionAmount]) || 0;
        const transactionItems = columnMapping.transactionItems ? 
          parseInt(row[columnMapping.transactionItems]) || 1 : 1;
        
        // Validate required data
        if (!customerId || !transactionId || !transactionDate || transactionAmount <= 0) {
          console.warn('Skipping invalid row:', row);
          return;
        }
        
        // Parse date
        let parsedDate;
        try {
          // Try different date formats
          const dateStr = transactionDate.trim();
          if (dateStr.includes('/')) {
            // MM/DD/YYYY or DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              // Assume MM/DD/YYYY for now
              parsedDate = new Date(parts[2], parts[0] - 1, parts[1]);
            }
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD or DD-MM-YYYY
            parsedDate = new Date(dateStr);
          } else {
            parsedDate = new Date(dateStr);
          }
          
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (err) {
          console.warn('Invalid date format:', transactionDate);
          parsedDate = new Date(); // Use current date as fallback
        }
        
        // Get or create customer
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: customerName,
            email: customerEmail,
            transactions: []
          });
        }
        
        // Add transaction
        customerMap.get(customerId).transactions.push({
          id: transactionId,
          date: parsedDate.toISOString(),
          amount: transactionAmount,
          items: transactionItems
        });
      });
      
      // Convert to array and sort transactions by date
      const customers = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        transactions: customer.transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
      }));
      
      setConvertedData(customers);
      setActiveStep(3);
    } catch (err) {
      setError(`Error converting data: ${err.message}`);
    }
  };
  
  // Download JSON file
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(convertedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import data directly into dashboard
  const importData = () => {
    if (onDataConverted) {
      onDataConverted(convertedData);
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        CSV to JSON Converter
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Convert your customer transaction data from CSV format to JSON for use in the dashboard
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* Step 1: Upload CSV */}
      {activeStep === 0 && (
        <Box>
          <CSVInstructions />
          
          <Typography variant="h6" gutterBottom>
            Upload CSV File
          </Typography>
          <Typography variant="body2" gutterBottom>
            Your CSV should contain customer transaction data with columns like:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" component="div">
              • Customer ID, Customer Name, Customer Email
            </Typography>
            <Typography variant="body2" component="div">
              • Transaction ID, Transaction Date, Transaction Amount
            </Typography>
            <Typography variant="body2" component="div">
              • Number of Items (optional)
            </Typography>
          </Box>
          
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="csv-upload">
            <Button 
              variant="contained" 
              component="span" 
              startIcon={<UploadFileIcon />}
            >
              Select CSV File
            </Button>
          </label>
          
          {csvFile && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: {csvFile.name} ({csvData.length} rows)
            </Typography>
          )}
        </Box>
      )}
      
      {/* Step 2: Map Columns */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Map CSV Columns to Required Fields
          </Typography>
          <Typography variant="body2" gutterBottom>
            Map your CSV columns to the required fields for the dashboard:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {Object.entries(requiredFields).map(([field, label]) => (
              <Grid item xs={12} md={6} key={field}>
                <FormControl fullWidth>
                  <InputLabel>{label} *</InputLabel>
                  <Select
                    value={columnMapping[field] || ''}
                    label={label}
                    onChange={(e) => handleColumnMapping(field, e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select column</em>
                    </MenuItem>
                    {headers.map(header => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
            
            {Object.entries(optionalFields).map(([field, label]) => (
              <Grid item xs={12} md={6} key={field}>
                <FormControl fullWidth>
                  <InputLabel>{label}</InputLabel>
                  <Select
                    value={columnMapping[field] || ''}
                    label={label}
                    onChange={(e) => handleColumnMapping(field, e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Skip this field</em>
                    </MenuItem>
                    {headers.map(header => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Available CSV Columns:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {headers.map(header => (
                <Chip key={header} label={header} size="small" />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button onClick={() => setActiveStep(0)}>
              Back
            </Button>
            <Button variant="contained" onClick={validateAndProceed}>
              Convert Data
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Step 3: Preview */}
      {activeStep === 2 && convertedData && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Conversion Preview
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Conversion Successful!</AlertTitle>
            Converted {convertedData.length} customers with a total of {
              convertedData.reduce((sum, customer) => sum + customer.transactions.length, 0)
            } transactions.
          </Alert>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 3 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Customer ID</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Transactions</TableCell>
                  <TableCell>Total Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {convertedData.slice(0, 10).map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.id}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.transactions.length}</TableCell>
                    <TableCell>
                      ${customer.transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {convertedData.length > 10 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Showing first 10 customers. Total: {convertedData.length} customers.
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => setActiveStep(1)}>
              Back
            </Button>
            <Button variant="contained" onClick={() => setActiveStep(3)}>
              Proceed
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Step 4: Download/Import */}
      {activeStep === 3 && convertedData && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Download or Import Data
          </Typography>
          <Typography variant="body2" gutterBottom>
            Your data has been successfully converted! You can now:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={downloadJSON}
            >
              Download JSON File
            </Button>
            <Button 
              variant="contained" 
              startIcon={<CheckCircleIcon />}
              onClick={importData}
            >
              Import to Dashboard
            </Button>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Button onClick={() => {
              setActiveStep(0);
              setCsvFile(null);
              setCsvData([]);
              setHeaders([]);
              setColumnMapping({});
              setConvertedData(null);
              setError(null);
            }}>
              Convert Another File
            </Button>
          </Box>
        </Box>
      )}
      
      {onClose && (
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button onClick={onClose}>
            Close Converter
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default CSVConverter;