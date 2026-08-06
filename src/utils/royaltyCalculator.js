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
