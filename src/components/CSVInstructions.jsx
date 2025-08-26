import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CSVInstructions = () => {
  const sampleData = [
    {
      customer_id: 'CUST001',
      customer_name: 'John Smith',
      customer_email: 'john.smith@email.com',
      transaction_id: 'TXN001',
      transaction_date: '2024-01-15',
      transaction_amount: '125.50',
      items: '3'
    },
    {
      customer_id: 'CUST001',
      customer_name: 'John Smith',
      customer_email: 'john.smith@email.com',
      transaction_id: 'TXN002',
      transaction_date: '2024-02-20',
      transaction_amount: '89.99',
      items: '1'
    },
    {
      customer_id: 'CUST002',
      customer_name: 'Jane Doe',
      customer_email: 'jane.doe@email.com',
      transaction_id: 'TXN003',
      transaction_date: '2024-01-10',
      transaction_amount: '45.25',
      items: '2'
    }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            CSV Format Instructions & Sample Data
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>CSV Format Requirements</AlertTitle>
              Your CSV file should contain one row per transaction, with customer information repeated for each transaction.
            </Alert>

            <Typography variant="h6" gutterBottom>
              Required Columns
            </Typography>
            <Typography variant="body2" gutterBottom>
              Your CSV must include these columns (column names can vary, you'll map them in the next step):
            </Typography>
            <ul>
              <li><strong>Customer ID:</strong> Unique identifier for each customer</li>
              <li><strong>Customer Name:</strong> Full name of the customer</li>
              <li><strong>Transaction ID:</strong> Unique identifier for each transaction</li>
              <li><strong>Transaction Date:</strong> Date of the transaction (MM/DD/YYYY, YYYY-MM-DD, or similar)</li>
              <li><strong>Transaction Amount:</strong> Monetary value of the transaction</li>
            </ul>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Optional Columns
            </Typography>
            <ul>
              <li><strong>Customer Email:</strong> Email address (will be auto-generated if not provided)</li>
              <li><strong>Number of Items:</strong> Quantity of items in the transaction (defaults to 1)</li>
            </ul>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Sample CSV Data
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>customer_id</TableCell>
                    <TableCell>customer_name</TableCell>
                    <TableCell>customer_email</TableCell>
                    <TableCell>transaction_id</TableCell>
                    <TableCell>transaction_date</TableCell>
                    <TableCell>transaction_amount</TableCell>
                    <TableCell>items</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.customer_id}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.customer_email}</TableCell>
                      <TableCell>{row.transaction_id}</TableCell>
                      <TableCell>{row.transaction_date}</TableCell>
                      <TableCell>{row.transaction_amount}</TableCell>
                      <TableCell>{row.items}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom>
              Supported Date Formats
            </Typography>
            <ul>
              <li>MM/DD/YYYY (e.g., 01/15/2024)</li>
              <li>DD/MM/YYYY (e.g., 15/01/2024)</li>
              <li>YYYY-MM-DD (e.g., 2024-01-15)</li>
              <li>DD-MM-YYYY (e.g., 15-01-2024)</li>
            </ul>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <AlertTitle>Important Notes</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Each row should represent one transaction</li>
                <li>Customer information will be repeated for each of their transactions</li>
                <li>Transaction amounts should be numeric (without currency symbols)</li>
                <li>Dates should be consistent throughout the file</li>
                <li>The converter will group transactions by customer automatically</li>
              </ul>
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CSVInstructions;