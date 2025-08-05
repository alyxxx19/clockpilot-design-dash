# Database Seeding Scripts

## Security Notice

This directory contains database seeding scripts for development environments. These scripts have been updated to follow security best practices.

## seed-db.sh

A secure database seeding script that creates test data for ClockPilot development environments.

### Security Features

- **No hardcoded passwords**: Requires `SEED_PASSWORD_HASH` environment variable
- **Environment protection**: Refuses to run in production environments
- **Secure by default**: Fails safely if security requirements aren't met

### Usage

1. **Generate a secure password hash:**
   ```bash
   # Using htpasswd (recommended)
   htpasswd -bnBC 12 "" yourpassword | tr -d ':\n'
   
   # Using Node.js bcrypt (alternative)
   node -e "console.log(require('bcrypt').hashSync('yourpassword', 12))"
   ```

2. **Set the environment variable:**
   ```bash
   export SEED_PASSWORD_HASH='$2a$12$YOUR_GENERATED_HASH_HERE'
   ```

3. **Run the seeding script:**
   ```bash
   ./scripts/seed-db.sh seed
   ```

### Available Commands

- `seed` - Populate database with test data (default)
- `clean` - Clean all existing data
- `summary` - Show current data summary
- `help` - Show usage information

### Environment Variables

- `ENVIRONMENT` - Environment (development, staging) [default: development]
- `SEED_PASSWORD_HASH` - Bcrypt hash for test account passwords (REQUIRED)

### Test Accounts Created

After running with your secure password hash, the following test accounts will be available:

- `admin@clockpilot.com` - Admin role
- `manager.rh@clockpilot.com` - HR Manager
- `manager.dev@clockpilot.com` - Development Manager  
- `employee.dev1@clockpilot.com` - Developer
- `employee.support@clockpilot.com` - Support

All accounts use the password corresponding to your `SEED_PASSWORD_HASH`.

## Security Best Practices

1. **Never commit password hashes to version control**
2. **Use strong, unique passwords for each environment**
3. **Rotate passwords regularly**
4. **Limit access to seeding scripts in production-like environments**
5. **Use different passwords for different environments**

## Recent Security Updates

- **2024-08**: Removed hardcoded bcrypt hash vulnerability
- **2024-08**: Added required environment variable for password security
- **2024-08**: Updated documentation to reflect security requirements