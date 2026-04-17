import apiClient from '@/lib/apiClient';

/**
 * Calculates the royalty amount based on book type.
 * Ebook: Royalty = MRP - Platform Commission
 * Physical: Royalty = MRP - Platform Commission - Printing Cost
 */
export const calculateRoyalty = (mrp, platformCommissionPercentage, printingCost, quantity, bookType) => {
  const validMrp = parseFloat(mrp) || 0;
  const validCommission = parseFloat(platformCommissionPercentage) || 0;
  const validPrintingCost = parseFloat(printingCost) || 0;
  const validQuantity = parseInt(quantity, 10) || 1;
  const type = (bookType || 'physical').toLowerCase().trim();

  const commissionAmount = validMrp * (validCommission / 100);
  let royaltyPerBook = 0;

  if (type === 'ebook') {
    // Ebook: No printing cost
    royaltyPerBook = validMrp - commissionAmount;
  } else {
    // Physical book: Subtract printing cost
    royaltyPerBook = validMrp - commissionAmount - validPrintingCost;
  }

  return Math.max(0, royaltyPerBook * validQuantity);
};

export const calculateTotalRoyalty = async (authorId) => {
  try {
    const response = await apiClient.get('/api/sales', { params: { limit: 10000 } });
    const sales = response.data.data || response.data;

    // Filter sales by authorId
    const filteredSales = sales.filter(sale => {
      const saleAuthorId = sale.authorId?._id || sale.authorId;
      return saleAuthorId === authorId || saleAuthorId?.toString() === authorId?.toString();
    });

    return filteredSales.reduce((sum, sale) => {
      const mrp = sale.mrp || 0;
      const qty = sale.quantity || 1;
      const comm = sale.platformId?.commission_percentage || 0;
      const printCost = sale.bookId?.printing_cost || 0;
      const bookType = sale.bookId?.format || sale.format || 'physical';
      return sum + calculateRoyalty(mrp, comm, printCost, qty, bookType);
    }, 0);
  } catch (error) {
    console.error("Error calculating total royalty:", error);
    return 0;
  }
};

export const calculatePaidRoyalty = async (mobileNumber) => {
  try {
    const response = await apiClient.get('/api/royalties', { params: { limit: 10000 } });
    const records = response.data.data || response.data;

    // Filter by mobile number if provided (for per-author calculations)
    const filteredRecords = mobileNumber
      ? records.filter(r => r.author_contact_number === mobileNumber)
      : records;

    return filteredRecords.reduce((sum, r) => {
      const amount = parseFloat(r.paid_amount) || 0;
      return amount > 0 ? sum + amount : sum;
    }, 0);
  } catch (error) {
    console.error("Error calculating paid royalty:", error);
    return 0;
  }
};

export const calculateAuthorBalance = async (authorId, mobileNumber) => {
  try {
    const total = await calculateTotalRoyalty(authorId);
    const paid = await calculatePaidRoyalty(mobileNumber);
    return Math.max(0, total - paid);
  } catch (error) {
    console.error("Error calculating author balance:", error);
    return 0;
  }
};

export const calculateBalanceRoyalty = async (authorId) => {
  try {
    const res = await apiClient.get('/api/auth/profile');
    const user = res.data;
    return await calculateAuthorBalance(authorId, user.mobile_number);
  } catch (error) {
    console.error("Error calculating balance royalty:", error);
    return 0;
  }
};

export const calculatePublishedWorks = async (authorId) => {
  try {
    const res = await apiClient.get('/api/books', { params: { limit: 10000 } });
    const books = res.data.data || res.data;
    const authorBooks = books.filter(book => book.authorId === authorId || book.authorId?._id === authorId);
    return authorBooks.length || 0;
  } catch (error) {
    console.error("Error calculating published works:", error);
    return 0;
  }
};

export const calculateTotalQuantitySold = async (authorId) => {
  try {
    const res = await apiClient.get('/api/sales', { params: { limit: 10000 } });
    const sales = res.data.data || res.data;
    const authorSales = sales.filter(sale => {
      const saleAuthorId = sale.authorId?._id || sale.authorId;
      return saleAuthorId === authorId || saleAuthorId?.toString() === authorId?.toString();
    });
    return authorSales.reduce((sum, s) => sum + (s.quantity || 1), 0);
  } catch (error) {
    console.error("Error calculating total quantity sold:", error);
    return 0;
  }
};
