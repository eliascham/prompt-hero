# Invoice Line Item Parser

## Overview
Build a parser that reads CSV invoice data and produces structured JSON output with tax calculations and date formatting.

## Requirements
1. Parse CSV input with columns: item_name, quantity, unit_price, date
2. Calculate line totals as quantity × unit_price
3. Apply flat 8% tax on all line items regardless of amount
4. Format all dates as MM/DD/YYYY format
5. Output JSON array of line items with: item_name, quantity, unit_price, subtotal, tax, total, date
