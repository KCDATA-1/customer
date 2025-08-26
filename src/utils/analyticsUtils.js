// src/utils/analyticsUtils.js

/**
 * Utility functions for RFM, CLV, and Pareto analysis
 */

import { generateSampleData } from './sampleDataGenerator';

/**
 * Calculate RFM scores for customers
 * @param {Array} customers - Array of customer objects with transaction history
 * @param {Date} endDate - End date for analysis period
 * @param {Object} weights - Optional weights for R, F, M components
 * @returns {Array} Customers with RFM scores and segments
 */
export const calculateRFM = (customers, endDate, weights = { r: 1, f: 1, m: 1 }) => {
  if (!customers || customers.length === 0) return [];
  
  const analysisDate = endDate || new Date();
  
  // Calculate raw R, F, M values for each customer
  const customersWithRFM = customers.map(customer => {
    // Sort transactions by date (newest first)
    const sortedTransactions = [...customer.transactions].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Recency: days since last purchase (lower is better)
    const lastPurchaseDate = sortedTransactions.length > 0 
      ? new Date(sortedTransactions[0].date) 
      : null;
    const recencyDays = lastPurchaseDate 
      ? Math.floor((analysisDate - lastPurchaseDate) / (1000 * 60 * 60 * 24)) 
      : Number.MAX_SAFE_INTEGER;
    
    // Frequency: count of transactions
    const frequency = sortedTransactions.length;
    
    // Monetary: total or average value of transactions
    const monetary = sortedTransactions.reduce((sum, transaction) => 
      sum + transaction.amount, 0);
      
    return {
      ...customer,
      rfm: {
        recency: recencyDays,
        frequency,
        monetary,
        raw: {
          recency: recencyDays,
          frequency,
          monetary
        }
      }
    };
  });
  
  // Calculate quintiles for scoring
  const recencyValues = customersWithRFM.map(c => c.rfm.recency).sort((a, b) => a - b);
  const frequencyValues = customersWithRFM.map(c => c.rfm.frequency).sort((a, b) => a - b);
  const monetaryValues = customersWithRFM.map(c => c.rfm.monetary).sort((a, b) => a - b);
  
  const getQuintileBreakpoints = values => {
    const quintileSize = Math.floor(values.length / 5);
    return [
      values[quintileSize - 1],
      values[quintileSize * 2 - 1],
      values[quintileSize * 3 - 1],
      values[quintileSize * 4 - 1]
    ];
  };
  
  const recencyBreakpoints = getQuintileBreakpoints(recencyValues);
  const frequencyBreakpoints = getQuintileBreakpoints(frequencyValues);
  const monetaryBreakpoints = getQuintileBreakpoints(monetaryValues);
  
  // Assign scores (1-5) based on quintiles
  // Note: For recency, lower is better, so scoring is reversed
  const getRecencyScore = value => {
    if (value <= recencyBreakpoints[0]) return 5;
    if (value <= recencyBreakpoints[1]) return 4;
    if (value <= recencyBreakpoints[2]) return 3;
    if (value <= recencyBreakpoints[3]) return 2;
    return 1;
  };
  
  const getFrequencyScore = value => {
    if (value >= frequencyBreakpoints[3]) return 5;
    if (value >= frequencyBreakpoints[2]) return 4;
    if (value >= frequencyBreakpoints[1]) return 3;
    if (value >= frequencyBreakpoints[0]) return 2;
    return 1;
  };
  
  const getMonetaryScore = value => {
    if (value >= monetaryBreakpoints[3]) return 5;
    if (value >= monetaryBreakpoints[2]) return 4;
    if (value >= monetaryBreakpoints[1]) return 3;
    if (value >= monetaryBreakpoints[0]) return 2;
    return 1;
  };
  
  // Calculate final RFM scores and segments
  return customersWithRFM.map(customer => {
    const rScore = getRecencyScore(customer.rfm.recency);
    const fScore = getFrequencyScore(customer.rfm.frequency);
    const mScore = getMonetaryScore(customer.rfm.monetary);
    
    // Calculate weighted average RFM score
    const totalWeight = weights.r + weights.f + weights.m;
    const weightedScore = (
      (rScore * weights.r) + 
      (fScore * weights.f) + 
      (mScore * weights.m)
    ) / totalWeight;
    
    // Determine segment based on R and F scores
    let segment;
    if (rScore >= 4 && fScore >= 4) {
      segment = 'Champions';
    } else if (rScore >= 2 && fScore >= 4) {
      segment = 'Loyal Customers';
    } else if (rScore >= 3 && fScore >= 3) {
      segment = 'Potential Loyalists';
    } else if (rScore >= 4 && fScore <= 2) {
      segment = 'New Customers';
    } else if (rScore >= 3 && fScore <= 2) {
      segment = 'Promising';
    } else if (rScore <= 2 && fScore >= 3) {
      segment = 'At Risk';
    } else if (rScore <= 2 && fScore <= 2 && mScore >= 3) {
      segment = 'Can\'t Lose Them';
    } else if (rScore <= 2 && fScore <= 2) {
      segment = 'Hibernating';
    } else {
      segment = 'About to Sleep';
    }
    
    return {
      ...customer,
      rfm: {
        ...customer.rfm,
        r_score: rScore,
        f_score: fScore,
        m_score: mScore,
        rfm_score: weightedScore,
        segment
      }
    };
  });
};

/**
 * Compare RFM results between two time periods
 * @param {Array} currentPeriodRFM - RFM results for current period
 * @param {Array} previousPeriodRFM - RFM results for previous period
 * @returns {Object} Comparison results including segment migrations
 */
export const compareRFM = (currentPeriodRFM, previousPeriodRFM) => {
  if (!currentPeriodRFM || !previousPeriodRFM) {
    return { segmentMigration: {}, customerChanges: [] };
  }
  
  // Create lookup for previous period
  const previousRFMMap = {};
  previousPeriodRFM.forEach(customer => {
    previousRFMMap[customer.id] = customer;
  });
  
  // Track segment migrations
  const segmentMigration = {};
  const segments = [
    'Champions', 
    'Loyal Customers', 
    'Potential Loyalists', 
    'New Customers',
    'Promising', 
    'At Risk', 
    'Can\'t Lose Them', 
    'Hibernating', 
    'About to Sleep'
  ];
  
  // Initialize migration matrix
  segments.forEach(fromSegment => {
    segmentMigration[fromSegment] = {};
    segments.forEach(toSegment => {
      segmentMigration[fromSegment][toSegment] = 0;
    });
  });
  
  // Calculate customer-level changes
  const customerChanges = currentPeriodRFM.map(currentCustomer => {
    const previousCustomer = previousRFMMap[currentCustomer.id];
    
    if (!previousCustomer) {
      return {
        id: currentCustomer.id,
        name: currentCustomer.name,
        currentSegment: currentCustomer.rfm.segment,
        previousSegment: 'New',
        isNew: true,
        rChange: null,
        fChange: null,
        mChange: null,
        scoreChange: null
      };
    }
    
    // Track segment migration
    const fromSegment = previousCustomer.rfm.segment;
    const toSegment = currentCustomer.rfm.segment;
    segmentMigration[fromSegment][toSegment] += 1;
    
    return {
      id: currentCustomer.id,
      name: currentCustomer.name,
      currentSegment: toSegment,
      previousSegment: fromSegment,
      isNew: false,
      rChange: currentCustomer.rfm.r_score - previousCustomer.rfm.r_score,
      fChange: currentCustomer.rfm.f_score - previousCustomer.rfm.f_score,
      mChange: currentCustomer.rfm.m_score - previousCustomer.rfm.m_score,
      scoreChange: currentCustomer.rfm.rfm_score - previousCustomer.rfm.rfm_score,
      rawChanges: {
        recency: previousCustomer.rfm.raw.recency - currentCustomer.rfm.raw.recency,
        frequency: currentCustomer.rfm.raw.frequency - previousCustomer.rfm.raw.frequency,
        monetary: currentCustomer.rfm.raw.monetary - previousCustomer.rfm.raw.monetary
      }
    };
  });
  
  // Find customers who existed in previous period but not in current
  const lostCustomers = previousPeriodRFM
    .filter(prevCustomer => !currentPeriodRFM.some(curr => curr.id === prevCustomer.id))
    .map(customer => ({
      id: customer.id,
      name: customer.name,
      currentSegment: 'Lost',
      previousSegment: customer.rfm.segment,
      isLost: true,
      rChange: -customer.rfm.r_score,
      fChange: -customer.rfm.f_score,
      mChange: -customer.rfm.m_score,
      scoreChange: -customer.rfm.rfm_score
    }));
  
  // Combine current and lost customers
  const allCustomerChanges = [...customerChanges, ...lostCustomers];
  
  // Calculate segment distribution changes
  const currentSegmentCounts = {};
  const previousSegmentCounts = {};
  
  segments.forEach(segment => {
    currentSegmentCounts[segment] = currentPeriodRFM.filter(c => c.rfm.segment === segment).length;
    previousSegmentCounts[segment] = previousPeriodRFM.filter(c => c.rfm.segment === segment).length;
  });
  
  return {
    segmentMigration,
    customerChanges: allCustomerChanges,
    currentSegmentCounts,
    previousSegmentCounts,
    segmentChanges: segments.map(segment => ({
      segment,
      current: currentSegmentCounts[segment],
      previous: previousSegmentCounts[segment],
      change: currentSegmentCounts[segment] - previousSegmentCounts[segment],
      percentChange: previousSegmentCounts[segment] > 0 
        ? ((currentSegmentCounts[segment] - previousSegmentCounts[segment]) / previousSegmentCounts[segment]) * 100 
        : null
    }))
  };
};

/**
 * Calculate Customer Lifetime Value (CLV)
 * @param {Array} customers - Array of customer objects with transaction history
 * @param {Object} params - Parameters for CLV calculation
 * @returns {Array} Customers with CLV scores
 */
export const calculateCLV = (customers, params = {}) => {
  const {
    churnRate = 0.05,           // Default monthly churn rate (5%)
    discountRate = 0.01,        // Default monthly discount rate (1%)
    predictionMonths = 24,      // Predict for next 24 months
    avgGrossMargin = 0.5,       // Default 50% gross margin
    includeAcquisitionCost = false,
    acquisitionCost = 0
  } = params;
  
  if (!customers || customers.length === 0) return [];
  
  return customers.map(customer => {
    // Calculate average monthly revenue
    const totalRevenue = customer.transactions.reduce((sum, t) => sum + t.amount, 0);
    const oldestTransactionDate = new Date(Math.min(...customer.transactions.map(t => new Date(t.date))));
    const now = new Date();
    const monthsActive = Math.max(1, (now - oldestTransactionDate) / (1000 * 60 * 60 * 24 * 30));
    const avgMonthlyRevenue = totalRevenue / monthsActive;
    
    // Calculate average purchase frequency (purchases per month)
    const purchaseFrequency = customer.transactions.length / monthsActive;
    
    // Calculate retention rate (inverse of churn)
    const retentionRate = 1 - churnRate;
    
    // Calculate CLV using simplified formula
    // CLV = Margin * (Revenue * Retention / (1 + Discount - Retention))
    const clv = avgGrossMargin * (avgMonthlyRevenue * retentionRate / (1 + discountRate - retentionRate));
    
    // Calculate predicted future value for specified months
    let futureValue = 0;
    let cumulativeRetention = 1;
    let cumulativeDiscount = 1;
    
    for (let i = 0; i < predictionMonths; i++) {
      cumulativeRetention *= retentionRate;
      cumulativeDiscount *= (1 / (1 + discountRate));
      futureValue += avgMonthlyRevenue * avgGrossMargin * cumulativeRetention * cumulativeDiscount;
    }
    
    // Adjust for acquisition cost if specified
    const adjustedCLV = includeAcquisitionCost ? clv - acquisitionCost : clv;
    const adjustedFutureValue = includeAcquisitionCost ? futureValue - acquisitionCost : futureValue;
    
    return {
      ...customer,
      clv: {
        value: adjustedCLV,
        futureValue: adjustedFutureValue,
        avgMonthlyRevenue,
        purchaseFrequency,
        monthsActive,
        raw: {
          totalRevenue,
          transactionCount: customer.transactions.length,
          avgTransactionValue: totalRevenue / customer.transactions.length
        }
      }
    };
  });
};

/**
 * Compare CLV results between two time periods
 * @param {Array} currentPeriodCLV - CLV results for current period
 * @param {Array} previousPeriodCLV - CLV results for previous period
 * @returns {Object} Comparison results
 */
export const compareCLV = (currentPeriodCLV, previousPeriodCLV) => {
  if (!currentPeriodCLV || !previousPeriodCLV) {
    return { customerChanges: [], overallChanges: {} };
  }
  
  // Create lookup for previous period
  const previousCLVMap = {};
  previousPeriodCLV.forEach(customer => {
    previousCLVMap[customer.id] = customer;
  });
  
  // Calculate customer-level changes
  const customerChanges = currentPeriodCLV.map(currentCustomer => {
    const previousCustomer = previousCLVMap[currentCustomer.id];
    
    if (!previousCustomer) {
      return {
        id: currentCustomer.id,
        name: currentCustomer.name,
        currentCLV: currentCustomer.clv.value,
        previousCLV: 0,
        isNew: true,
        absoluteChange: currentCustomer.clv.value,
        percentChange: null,
        revenueChange: currentCustomer.clv.avgMonthlyRevenue,
        frequencyChange: currentCustomer.clv.purchaseFrequency
      };
    }
    
    const absoluteChange = currentCustomer.clv.value - previousCustomer.clv.value;
    const percentChange = previousCustomer.clv.value !== 0 
      ? (absoluteChange / previousCustomer.clv.value) * 100 
      : null;
    
    return {
      id: currentCustomer.id,
      name: currentCustomer.name,
      currentCLV: currentCustomer.clv.value,
      previousCLV: previousCustomer.clv.value,
      isNew: false,
      absoluteChange,
      percentChange,
      revenueChange: currentCustomer.clv.avgMonthlyRevenue - previousCustomer.clv.avgMonthlyRevenue,
      frequencyChange: currentCustomer.clv.purchaseFrequency - previousCustomer.clv.purchaseFrequency,
      rawChanges: {
        totalRevenue: currentCustomer.clv.raw.totalRevenue - previousCustomer.clv.raw.totalRevenue,
        transactionCount: currentCustomer.clv.raw.transactionCount - previousCustomer.clv.raw.transactionCount,
        avgTransactionValue: currentCustomer.clv.raw.avgTransactionValue - previousCustomer.clv.raw.avgTransactionValue
      }
    };
  });
  
  // Find customers who existed in previous period but not in current
  const lostCustomers = previousPeriodCLV
    .filter(prevCustomer => !currentPeriodCLV.some(curr => curr.id === prevCustomer.id))
    .map(customer => ({
      id: customer.id,
      name: customer.name,
      currentCLV: 0,
      previousCLV: customer.clv.value,
      isLost: true,
      absoluteChange: -customer.clv.value,
      percentChange: -100,
      revenueChange: -customer.clv.avgMonthlyRevenue,
      frequencyChange: -customer.clv.purchaseFrequency
    }));
  
  // Combine current and lost customers
  const allCustomerChanges = [...customerChanges, ...lostCustomers];
  
  // Calculate overall metrics
  const currentTotalCLV = currentPeriodCLV.reduce((sum, c) => sum + c.clv.value, 0);
  const previousTotalCLV = previousPeriodCLV.reduce((sum, c) => sum + c.clv.value, 0);
  const absoluteChange = currentTotalCLV - previousTotalCLV;
  const percentChange = previousTotalCLV !== 0 
    ? (absoluteChange / previousTotalCLV) * 100 
    : null;
  
  // Calculate average CLV
  const currentAvgCLV = currentPeriodCLV.length > 0 
    ? currentTotalCLV / currentPeriodCLV.length 
    : 0;
  const previousAvgCLV = previousPeriodCLV.length > 0 
    ? previousTotalCLV / previousPeriodCLV.length 
    : 0;
  const avgAbsoluteChange = currentAvgCLV - previousAvgCLV;
  const avgPercentChange = previousAvgCLV !== 0 
    ? (avgAbsoluteChange / previousAvgCLV) * 100 
    : null;
  
  return {
    customerChanges: allCustomerChanges,
    overallChanges: {
      totalCLV: {
        current: currentTotalCLV,
        previous: previousTotalCLV,
        absoluteChange,
        percentChange
      },
      averageCLV: {
        current: currentAvgCLV,
        previous: previousAvgCLV,
        absoluteChange: avgAbsoluteChange,
        percentChange: avgPercentChange
      },
      customerCount: {
        current: currentPeriodCLV.length,
        previous: previousPeriodCLV.length,
        change: currentPeriodCLV.length - previousPeriodCLV.length
      }
    }
  };
};

/**
 * Calculate Pareto analysis (80/20 rule)
 * @param {Array} customers - Array of customer objects with transaction history
 * @returns {Object} Pareto analysis results
 */
export const calculatePareto = (customers) => {
  if (!customers || customers.length === 0) {
    return {
      customerRevenues: [],
      paretoPoints: [],
      paretoRatio: 0,
      giniCoefficient: 0
    };
  }
  
  // Calculate total revenue per customer
  const customerRevenues = customers.map(customer => {
    const totalRevenue = customer.transactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      id: customer.id,
      name: customer.name,
      revenue: totalRevenue
    };
  });
  
  // Sort by revenue (descending)
  customerRevenues.sort((a, b) => b.revenue - a.revenue);
  
  // Calculate cumulative revenue and percentages
  const totalRevenue = customerRevenues.reduce((sum, c) => sum + c.revenue, 0);
  let cumulativeRevenue = 0;
  
  const paretoPoints = customerRevenues.map((customer, index) => {
    cumulativeRevenue += customer.revenue;
    return {
      customerPercentage: (index + 1) / customerRevenues.length,
      revenuePercentage: cumulativeRevenue / totalRevenue
    };
  });
  
  // Find the percentage of customers that generate 80% of revenue
  let paretoRatio = 1.0; // Default to 100% if we can't find the 80% point
  for (const point of paretoPoints) {
    if (point.revenuePercentage >= 0.8) {
      paretoRatio = point.customerPercentage;
      break;
    }
  }
  
  // Calculate Gini coefficient (measure of inequality)
  // Formula: G = 1 - 2 * area under Lorenz curve
  let area = 0;
  for (let i = 0; i < paretoPoints.length; i++) {
    const width = 1 / paretoPoints.length;
    const height = paretoPoints[i].revenuePercentage;
    const previousHeight = i > 0 ? paretoPoints[i - 1].revenuePercentage : 0;
    
    // Trapezoidal area
    area += width * (height + previousHeight) / 2;
  }
  
  const giniCoefficient = 1 - 2 * area;
  
  return {
    customerRevenues,
    paretoPoints,
    paretoRatio,
    giniCoefficient
  };
};

/**
 * Compare Pareto results between two time periods
 * @param {Object} currentPeriodPareto - Pareto results for current period
 * @param {Object} previousPeriodPareto - Pareto results for previous period
 * @returns {Object} Comparison results
 */
export const comparePareto = (currentPeriodPareto, previousPeriodPareto) => {
  if (!currentPeriodPareto || !previousPeriodPareto) {
    return {};
  }
  
  return {
    paretoRatioChange: currentPeriodPareto.paretoRatio - previousPeriodPareto.paretoRatio,
    giniCoefficientChange: currentPeriodPareto.giniCoefficient - previousPeriodPareto.giniCoefficient,
    currentParetoRatio: currentPeriodPareto.paretoRatio,
    previousParetoRatio: previousPeriodPareto.paretoRatio,
    currentGiniCoefficient: currentPeriodPareto.giniCoefficient,
    previousGiniCoefficient: previousPeriodPareto.giniCoefficient
  };
};

export { generateSampleData };
