export interface InvoiceLineItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax: number;
  total: number;
  date: string;
}

/**
 * Parses CSV invoice data into structured line items.
 * @param csvData - Raw CSV string with headers: item_name, quantity, unit_price, date
 * @returns Array of parsed and calculated line items
 */
export function parseInvoice(csvData: string): InvoiceLineItem[] {
  // TODO: Implement parser
  return [];
}
