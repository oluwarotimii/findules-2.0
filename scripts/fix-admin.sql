-- Delete any existing admin users
DELETE FROM users WHERE email LIKE 'admin@findules%';

-- Create fresh admin user with correct password hash
INSERT INTO users (id, name, email, passwordHash, role, branchId, status, createdAt, updatedAt)
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

-- Verify the user was created
SELECT id, name, email, role, branchId, status FROM users WHERE email = 'admin@findules.com';
