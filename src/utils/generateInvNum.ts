export function generateInvoiceNumber() {
  const prefix = "INV";

  // Get current date as YYYYMMDD
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Generate a random 4-digit number (1000 to 9999)
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${date}-${random}`;
}
