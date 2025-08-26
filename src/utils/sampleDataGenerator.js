// src/utils/sampleDataGenerator.js

/**
 * Generate sample customer data for demonstration purposes
 * @param {number} customerCount - Number of customers to generate
 * @param {number} maxTransactionsPerCustomer - Maximum number of transactions per customer
 * @param {Date} startDate - Start date for transaction generation
 * @param {Date} endDate - End date for transaction generation
 * @returns {Array} Array of customer objects with transaction history
 */
export const generateSampleData = (
  customerCount = 100,
  maxTransactionsPerCustomer = 20,
  startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
  endDate = new Date()
) => {
  const customers = [];
  
  for (let i = 1; i <= customerCount; i++) {
    const customer = {
      id: `cust${i.toString().padStart(3, '0')}`,
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      transactions: []
    };
    
    // Random number of transactions for this customer
    const transactionCount = Math.floor(Math.random() * maxTransactionsPerCustomer) + 1;
    
    for (let j = 1; j <= transactionCount; j++) {
      // Random date between startDate and endDate
      const transactionDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Random transaction amount between $10 and $500
      const amount = Math.round((10 + Math.random() * 490) * 100) / 100;
      
      // Random number of items between 1 and 10
      const items = Math.floor(Math.random() * 10) + 1;
      
      customer.transactions.push({
        id: `t${i}_${j}`,
        date: transactionDate.toISOString(),
        amount,
        items
      });
    }
    
    // Sort transactions by date (oldest first)
    customer.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    customers.push(customer);
  }
  
  return customers;
};

/**
 * Export sample data to JSON file
 * @param {number} customerCount - Number of customers to generate
 * @returns {string} JSON string of sample data
 */
export const exportSampleData = (customerCount = 20) => {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const sampleData = generateSampleData(customerCount, 15, oneYearAgo, today);
  return JSON.stringify(sampleData, null, 2);
};

export default generateSampleData;
