# Log Aggregator

## Overview
Build a log aggregator that processes JSON log arrays, aggregates by service and level, and calculates statistics.

## Requirements
1. Accept a **JSON array** of log entries
2. Each log entry has: service, level (info/warn/error/debug), message, timestamp
3. Aggregate logs by service + level combination
4. Calculate error count per service
5. Assume all timestamps are already in **UTC**
6. Return: aggregation map, error counts per service, total log count
