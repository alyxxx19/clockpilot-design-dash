# Database Seeding Scripts

## Security Notice

The seed script has been updated to use environment variables for password hashes to improve security.

## Usage

### Default Development Setup
```bash
# Uses default password "password123" for all test accounts
./scripts/seed-db.sh
```

### Custom Password Setup
```bash
# Use custom password hash (generate with bcrypt)
export SEED_PASSWORD_HASH='$2a$12$your_custom_hash_here'
./scripts/seed-db.sh
```

### Generate Custom Password Hash
```bash
# Using Node.js bcrypt (recommended)
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your_password', 12));"

# Using Python bcrypt
python3 -c "import bcrypt; print(bcrypt.hashpw(b'your_password', bcrypt.gensalt(rounds=12)).decode())"
```

## Security Best Practices

1. **Never use default passwords in production**
2. **Always set custom SEED_PASSWORD_HASH for any deployed environment**
3. **The script automatically prevents execution in production environment**
4. **Change all default passwords immediately after seeding**

## Test Accounts Created

| Email | Role | Default Password |
|-------|------|------------------|
| admin@clockpilot.com | admin | password123 |
| manager.rh@clockpilot.com | manager | password123 |
| manager.dev@clockpilot.com | manager | password123 |
| employee.dev1@clockpilot.com | employee | password123 |
| employee.dev2@clockpilot.com | employee | password123 |
| employee.marketing@clockpilot.com | employee | password123 |
| employee.support@clockpilot.com | employee | password123 |

**Important**: Change these passwords immediately in any non-development environment.