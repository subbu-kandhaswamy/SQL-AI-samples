# MSSQL MCP Server Tests

This directory contains comprehensive integration tests for the MSSQL MCP Server tools.

## Overview

The test suite validates all MCP server tools including:
- **CreateTableTool**: Create new tables
- **ListTableTool**: List tables in the database
- **DescribeTableTool**: Get table schema information
- **InsertDataTool**: Insert single or multiple records
- **ReadDataTool**: Execute SELECT queries with security validation
- **UpdateDataTool**: Update records with WHERE clauses
- **DropTableTool**: Drop tables

## Prerequisites

To run the tests, you need:
- Node.js 14 or higher
- Access to a MSSQL Server or Azure SQL Database
- Environment variables configured (see below)

## Environment Configuration

Set the following environment variables before running tests:

```bash
export SERVER_NAME="your-server.database.windows.net"
export DATABASE_NAME="your-database-name"
export TRUST_SERVER_CERTIFICATE="true"  # Optional, for development
export AUTH_TYPE="azure-active-directory-default"  # Optional, defaults to azure-active-directory-default
```

Supported authentication types:
- `azure-active-directory-default` (default)
- `azure-active-directory-access-token`
- `azure-active-directory-msi-vm`
- `azure-active-directory-msi-app-service`
- `azure-active-directory-service-principal-secret`
- `default` (SQL Server authentication)

## Running Tests

### Install Dependencies

First, install all dependencies including test dependencies:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Useful during development:

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Structure

Tests are organized by tool in `tools.test.ts`:

### CreateTableTool Tests
- ✓ Create table successfully
- ✓ Handle invalid table creation

### ListTableTool Tests
- ✓ List tables in database
- ✓ Filter tables by schema

### DescribeTableTool Tests
- ✓ Describe existing table
- ✓ Handle non-existent table

### InsertDataTool Tests
- ✓ Insert single record
- ✓ Insert multiple records
- ✓ Handle invalid data

### ReadDataTool Tests
- ✓ Read data with SELECT query
- ✓ Reject non-SELECT queries
- ✓ Reject queries with dangerous keywords
- ✓ Reject SQL injection attempts

### UpdateDataTool Tests
- ✓ Update data successfully
- ✓ Require WHERE clause for security

### DropTableTool Tests
- ✓ Drop table successfully
- ✓ Handle dropping non-existent table

## Security Testing

The test suite includes specific security tests to validate:
- SQL injection prevention
- Dangerous keyword detection
- WHERE clause requirement for updates
- Query validation and sanitization

## Notes

- Tests create temporary tables with unique names to avoid conflicts
- All test tables are automatically cleaned up after each test
- If no database connection is configured, tests will be skipped gracefully
- Tests use the same authentication method as the main application

## Continuous Integration

These tests can be integrated into CI/CD pipelines. Ensure your CI environment has:
1. Access to a test database
2. Required environment variables set
3. Node.js and npm installed

Example GitHub Actions workflow:

```yaml
- name: Run Tests
  env:
    SERVER_NAME: ${{ secrets.TEST_DB_SERVER }}
    DATABASE_NAME: ${{ secrets.TEST_DB_NAME }}
  run: npm test
```

## Troubleshooting

### Tests are being skipped
- Verify environment variables are set correctly
- Check database connectivity
- Ensure you have proper permissions on the database

### Connection timeouts
- Increase CONNECTION_TIMEOUT environment variable
- Check firewall rules
- Verify server name and credentials

### Permission errors
- Ensure the database user has CREATE, DROP, INSERT, UPDATE, and DELETE permissions
- For Azure SQL Database, the user needs db_owner or equivalent permissions for tests
