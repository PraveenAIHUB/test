-- Seed default admin user for Property Pro
-- Password: admin123 (change after first login in production)
-- To generate a new hash: cd backend && node -e "require('bcryptjs').hash('admin123',10).then(h=>console.log(h))"

INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES (
    'admin',
    'admin@propertypro.com',
    '$2b$10$X59oXpS6976Jq6S4XCGtTOSUSJJSLUy.lFZJviqUvqq7cno4dOaui',
    'Administrator',
    'ADMIN',
    'ACTIVE'
);

COMMIT;
