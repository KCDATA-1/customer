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
  Link
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const DataImport = ({ onDataImported }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [importedData, setImportedData] = useState(null);
  
  const steps = ['Select file', 'Validate data', 'Import data'];
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
    setActiveStep(1);
  };
  
  const validateFile = () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        
        // Validate data structure
        if (!Array.isArray(data)) {
          setError('Invalid data format: Root element must be an array');
          return;
        }
        
        if (data.length === 0) {
          setError('Data file contains no customer records');
          return;
        }
        
        // Check if each customer has required fields
        const invalidCustomers = data.filter(customer => 
          !customer.id || 
          !customer.name || 
          !Array.isArray(customer.transactions)
        );
        
        if (invalidCustomers.length > 0) {
          setError(`${invalidCustomers.length} customers are missing required fields (id, name, or transactions array)`);
          return;
        }
        
        // Check if transactions have required fields
        let invalidTransactions = 0;
        data.forEach(customer => {
          customer.transactions.forEach(transaction => {
            if (!transaction.date || !transaction.amount) {
              invalidTransactions++;
            }
          });
        });
        
        if (invalidTransactions > 0) {
          setError(`${invalidTransactions} transactions are missing required fields (date or amount)`);
          return;
        }
        
        // Data is valid
        setImportedData(data);
        setActiveStep(2);
      } catch (err) {
        setError(`Error parsing JSON: ${err.message}`);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsText(file);
  };
  
  const importData = () => {
    if (!importedData) {
      setError('No valid data to import');
      return;
    }
    
    onDataImported(importedData);
  };
  
  const downloadSampleData = () => {
    const sampleData = [
      {
        "id": "cust001",
        "name": "John Smith",
        "email": "john@example.com",
        "transactions": [
          {
            "id": "t001",
            "date": "2025-01-15T10:30:00Z",
            "amount": 125.50,
            "items": 3
          },
          {
            "id": "t002",
            "date": "2025-02-20T14:45:00Z",
            "amount": 89.99,
            "items": 1
          },
          {
            "id": "t003",
            "date": "2025-04-05T09:15:00Z",
            "amount": 210.75,
            "items": 4
          }
        ]
      },
      {
        "id": "cust002",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "transactions": [
          {
            "id": "t004",
            "date": "2025-01-10T16:20:00Z",
            "amount": 45.25,
            "items": 2
          },
          {
            "id": "t005",
            "date": "2025-03-15T11:30:00Z",
            "amount": 199.99,
            "items": 1
          }
        ]
      }
    ];
    
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_customer_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Import Customer Data
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
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          Upload your customer data file in JSON format. The file should contain an array of customer objects, each with:
        </Typography>
        <ul>
          <li>id (string): Unique customer identifier</li>
          <li>name (string): Customer name</li>
          <li>transactions (array): List of transactions with date and amount</li>
        </ul>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={downloadSampleData}
            sx={{ mr: 2 }}
          >
            Download Sample Data
          </Button>
          <Link href="#" onClick={(e) => { e.preventDefault(); }}>
            View Data Format Documentation
          </Link>
        </Box>
      </Box>
      
      {activeStep === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            accept="application/json"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button 
              variant="contained" 
              component="span" 
              startIcon={<UploadFileIcon />}
              sx={{ mb: 2 }}
            >
              Select File
            </Button>
          </label>
        </Box>
      )}
      
      {activeStep === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Selected file: {file?.name}
          </Typography>
          <Button 
            variant="contained" 
            onClick={validateFile}
            sx={{ mt: 2 }}
          >
            Validate Data
          </Button>
        </Box>
      )}
      
      {activeStep === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
            <AlertTitle>Validation Successful</AlertTitle>
            <Typography variant="body2">
              Found {importedData?.length} customers with a total of {
                importedData?.reduce((sum, customer) => sum + customer.transactions.length, 0)
              } transactions.
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            color="primary"
            onClick={importData}
            startIcon={<CheckCircleIcon />}
          >
            Import Data
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default DataImport;
