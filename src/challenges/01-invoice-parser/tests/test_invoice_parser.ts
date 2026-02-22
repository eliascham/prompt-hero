import { parseInvoice, InvoiceLineItem } from "../starter/invoice_parser";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

function approxEqual(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) < epsilon;
}

// Test 1: Basic CSV parsing
const basicCsv = `item_name,quantity,unit_price,date
Widget A,10,50.00,2024-01-15`;

const basic = parseInvoice(basicCsv);
assert(basic.length === 1, "basic parsing - parses single row");
assert(basic[0].item_name === "Widget A", "basic parsing - correct item name");
assert(basic[0].quantity === 10, "basic parsing - correct quantity");
assert(basic[0].unit_price === 50.0, "basic parsing - correct unit price");

// Test 2: Simple tax (items $1000 or under)
const simpleTaxCsv = `item_name,quantity,unit_price,date
Small Item,2,100.00,2024-01-15`;

const simpleTax = parseInvoice(simpleTaxCsv);
const expectedSubtotal = 200.0;
const expectedSimpleTax = 16.0; // 8% of 200
assert(
  approxEqual(simpleTax[0].subtotal, expectedSubtotal),
  "simple tax - subtotal is quantity × unit_price"
);
assert(
  approxEqual(simpleTax[0].tax, expectedSimpleTax),
  "simple tax - 8% flat tax for items ≤ $1000 - tax amount incorrect"
);
assert(
  approxEqual(simpleTax[0].total, expectedSubtotal + expectedSimpleTax),
  "simple tax - total = subtotal + tax"
);

// Test 3: Compound tax (line items over $1000)
const compoundCsv = `item_name,quantity,unit_price,date
Server Rack,1,2500.00,2024-03-20`;

const compound = parseInvoice(compoundCsv);
const compSubtotal = 2500.0;
const stateTax = compSubtotal * 0.08; // 200.00
const cityTax = (compSubtotal + stateTax) * 0.02; // 54.00
const compoundTotalTax = stateTax + cityTax; // 254.00
assert(
  approxEqual(compound[0].tax, compoundTotalTax),
  "compound tax - compound tax for items > $1000 - tax calculation incorrect"
);
assert(
  approxEqual(compound[0].total, compSubtotal + compoundTotalTax),
  "compound tax - total includes compound tax"
);

// Test 4: ISO 8601 date formatting
const datesCsv = `item_name,quantity,unit_price,date
Item A,1,10.00,03/20/2024
Item B,1,10.00,March 5, 2024
Item C,1,10.00,2024-01-15`;

const dated = parseInvoice(datesCsv);
assert(
  dated[0].date.startsWith("2024-03-20"),
  "ISO dates - MM/DD/YYYY converted to ISO 8601 - date format incorrect"
);
assert(
  dated[1].date.startsWith("2024-03-05"),
  "ISO dates - Month DD, YYYY converted to ISO 8601 - date format incorrect"
);
assert(
  dated[2].date.startsWith("2024-01-15"),
  "ISO dates - YYYY-MM-DD preserved as ISO 8601"
);

// Test 5: Quoted CSV fields with commas
const quotedCsv = `item_name,quantity,unit_price,date
"Premium Gadget, Deluxe",2,750.00,2024-03-05`;

const quoted = parseInvoice(quotedCsv);
assert(
  quoted[0].item_name === "Premium Gadget, Deluxe",
  "quoted fields - handles commas inside quoted fields"
);

// Test 6: Empty rows skipped
const emptyRowCsv = `item_name,quantity,unit_price,date
Widget A,10,50.00,2024-01-15
,,,
Monitor Stand,3,89.50,2024-01-10`;

const withEmpty = parseInvoice(emptyRowCsv);
assert(
  withEmpty.length === 2,
  "empty rows - skips empty rows gracefully"
);

console.log("All tests passed!");
