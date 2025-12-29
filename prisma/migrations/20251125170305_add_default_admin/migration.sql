-- Create HQ branch if it doesn't exist
INSERT IGNORE INTO branches (branchId, branchName, branchCode, location, status, createdAt)
VALUES ('BR-HQ', 'Head Office', 'HQ', 'Headquarters', 'ACTIVE', NOW());

-- Create default admin user
-- Password: "password" (bcrypt hash with cost 10)
INSERT IGNORE INTO users (id, name, email, passwordHash, role, branchId, status, createdAt, updatedAt)
VALUES (
    'USR-ADMIN',
    'System Administrator',
    'admin@findules.com',
    '$2a$10$CwTycUXWue0Thq9StjUM0u.rTsJrjpIpZXY5CRado3VQZZ3Z3Z3Z3Z',
    'MANAGER',
    'BR-HQ',
    'ACTIVE',
    NOW(),
    NOW()
);