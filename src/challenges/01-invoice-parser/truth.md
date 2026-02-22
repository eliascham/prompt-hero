# Invoice Line Item Parser

## Overview
Build a parser that reads CSV invoice data and produces structured JSON output with correct tax calculations and date formatting.

## Requirements
1. Parse CSV input with columns: item_name, quantity, unit_price, date
2. Calculate line totals as quantity × unit_price
3. Apply **compound tax** for line items over $1000: 8% state tax on subtotal, then 2% city tax on (subtotal + state tax)
4. Apply simple 8% tax for line items $1000 or under
5. Format all dates as **ISO 8601** (YYYY-MM-DDTHH:mm:ssZ)
6. Output JSON array of line items with: item_name, quantity, unit_price, subtotal, tax, total, date

## Edge Cases
- Handle quoted CSV fields that contain commas
- Handle empty rows gracefully (skip them)
- Dates may come in various formats (MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY)
- Quantities and prices may have leading/trailing whitespace

## Test Summary
6 tests covering: basic parsing, compound tax calculation, simple tax, ISO date formatting, quoted fields, and empty row handling.
