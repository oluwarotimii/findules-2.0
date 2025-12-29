-- Initialize branch balances for all active branches
-- Run this in your MySQL client or phpMyAdmin

-- First, let's see what branches exist
SELECT branchId, branchName, branchCode FROM branches WHERE status = 'ACTIVE';

-- Then insert branch balances (adjust the branchId values based on what you see above)
-- Replace 'BR001', 'BR002', etc. with your actual branch IDs

INSERT INTO branch_balances (id, branchId, openingBalance, currentBalance, totalIssued, totalRetired, createdAt, lastUpdated)
VALUES 
  (UUID(), 'BR001', 100000.00, 100000.00, 0.00, 0.00, NOW(), NOW()),
  (UUID(), 'BR002', 100000.00, 100000.00, 0.00, 0.00, NOW(), NOW()),
  (UUID(), 'BR003', 100000.00, 100000.00, 0.00, 0.00, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  openingBalance = VALUES(openingBalance),
  currentBalance = VALUES(currentBalance);

-- Verify the balances were created
SELECT bb.*, b.branchName, b.branchCode 
FROM branch_balances bb
JOIN branches b ON bb.branchId = b.branchId;
