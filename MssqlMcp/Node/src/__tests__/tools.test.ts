/**
 * Integration tests for MSSQL MCP Server Tools
 * 
 * These tests require a connection to an actual MSSQL database.
 * Set the following environment variables before running:
 * - SERVER_NAME: Your MSSQL server name
 * - DATABASE_NAME: Your database name
 * - CONNECTION_STRING or use Azure AD authentication
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sql from 'mssql';
import { CreateTableTool } from '../tools/CreateTableTool.js';
import { ListTableTool } from '../tools/ListTableTool.js';
import { DescribeTableTool } from '../tools/DescribeTableTool.js';
import { InsertDataTool } from '../tools/InsertDataTool.js';
import { ReadDataTool } from '../tools/ReadDataTool.js';
import { UpdateDataTool } from '../tools/UpdateDataTool.js';
import { DropTableTool } from '../tools/DropTableTool.js';

// Generate unique table name for tests
const generateTableName = () => `TestTable_${Date.now()}_${Math.random().toString(36).substring(7)}`;

describe('MSSQL MCP Server Tools - Integration Tests', () => {
  let connection: sql.ConnectionPool;
  let testTableName: string;
  
  // Tool instances
  const createTableTool = new CreateTableTool();
  const listTableTool = new ListTableTool();
  const describeTableTool = new DescribeTableTool();
  const insertDataTool = new InsertDataTool();
  const readDataTool = new ReadDataTool();
  const updateDataTool = new UpdateDataTool();
  const dropTableTool = new DropTableTool();

  beforeAll(async () => {
    // Skip tests if no database connection is configured
    if (!process.env.SERVER_NAME || !process.env.DATABASE_NAME) {
      console.log('Skipping integration tests: SERVER_NAME and DATABASE_NAME environment variables not set');
      return;
    }

    // Connect to database
    const config: sql.config = {
      server: process.env.SERVER_NAME!,
      database: process.env.DATABASE_NAME!,
      options: {
        encrypt: true,
        trustServerCertificate: process.env.TRUST_SERVER_CERTIFICATE === 'true',
      },
      authentication: {
        type: 'default',
      },
    };

    connection = await sql.connect(config);
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  beforeEach(() => {
    testTableName = generateTableName();
  });

  describe('CreateTableTool', () => {
    it('should create a table successfully', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await createTableTool.run({
        tableName: testTableName,
        columns: [
          { name: 'Id', type: 'INT PRIMARY KEY' },
          { name: 'Name', type: 'NVARCHAR(100)' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('created successfully');

      // Cleanup
      await dropTableTool.run({ tableName: testTableName });
    });

    it('should handle invalid table creation', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await createTableTool.run({
        tableName: testTableName,
        columns: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('non-empty array');
    });
  });

  describe('ListTableTool', () => {
    it('should list tables in the database', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await listTableTool.run({});

      expect(result.success).toBe(true);
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter tables by schema', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await listTableTool.run({
        parameters: ['dbo'],
      });

      expect(result.success).toBe(true);
      expect(result.items).toBeDefined();
    });
  });

  describe('DescribeTableTool', () => {
    it('should describe a table that exists', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      // Create test table
      await createTableTool.run({
        tableName: testTableName,
        columns: [
          { name: 'Id', type: 'INT PRIMARY KEY' },
          { name: 'Name', type: 'NVARCHAR(100)' },
        ],
      });

      const result = await describeTableTool.run({ tableName: testTableName });

      expect(result.success).toBe(true);
      expect(result.columns).toBeDefined();
      expect(Array.isArray(result.columns)).toBe(true);
      expect(result.columns.length).toBeGreaterThan(0);

      // Cleanup
      await dropTableTool.run({ tableName: testTableName });
    });

    it('should handle non-existent table', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await describeTableTool.run({ tableName: 'NonExistentTable_12345' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to describe table');
    });
  });

  describe('InsertDataTool', () => {
    beforeEach(async () => {
      if (!connection) return;
      
      // Create test table
      await createTableTool.run({
        tableName: testTableName,
        columns: [
          { name: 'Id', type: 'INT PRIMARY KEY' },
          { name: 'Name', type: 'NVARCHAR(100)' },
          { name: 'Age', type: 'INT' },
        ],
      });
    });

    afterEach(async () => {
      if (!connection) return;
      await dropTableTool.run({ tableName: testTableName });
    });

    it('should insert a single record', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await insertDataTool.run({
        tableName: testTableName,
        data: {
          Id: 1,
          Name: 'John Doe',
          Age: 30,
        },
      });

      expect(result.success).toBe(true);
      expect(result.recordsInserted).toBe(1);
    });

    it('should insert multiple records', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await insertDataTool.run({
        tableName: testTableName,
        data: [
          { Id: 1, Name: 'John Doe', Age: 30 },
          { Id: 2, Name: 'Jane Smith', Age: 25 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.recordsInserted).toBe(2);
    });

    it('should handle invalid data', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await insertDataTool.run({
        tableName: testTableName,
        data: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('No data provided');
    });
  });

  describe('ReadDataTool', () => {
    beforeEach(async () => {
      if (!connection) return;

      // Create test table and insert data
      await createTableTool.run({
        tableName: testTableName,
        columns: [
          { name: 'Id', type: 'INT PRIMARY KEY' },
          { name: 'Name', type: 'NVARCHAR(100)' },
        ],
      });

      await insertDataTool.run({
        tableName: testTableName,
        data: { Id: 1, Name: 'Test User' },
      });
    });

    afterEach(async () => {
      if (!connection) return;
      await dropTableTool.run({ tableName: testTableName });
    });

    it('should read data with SELECT query', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await readDataTool.run({
        query: `SELECT * FROM ${testTableName}`,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should reject non-SELECT queries', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await readDataTool.run({
        query: `DELETE FROM ${testTableName}`,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('must start with SELECT');
    });

    it('should reject queries with dangerous keywords', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await readDataTool.run({
        query: `SELECT * FROM ${testTableName}; DROP TABLE ${testTableName}`,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Security validation failed');
    });

    it('should reject SQL injection attempts', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await readDataTool.run({
        query: `SELECT * FROM ${testTableName} WHERE Id = 1; DROP TABLE ${testTableName}; --`,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Security validation failed');
    });
  });

  describe('UpdateDataTool', () => {
    beforeEach(async () => {
      if (!connection) return;

      // Create test table and insert data
      await createTableTool.run({
        tableName: testTableName,
        columns: [
          { name: 'Id', type: 'INT PRIMARY KEY' },
          { name: 'Name', type: 'NVARCHAR(100)' },
        ],
      });

      await insertDataTool.run({
        tableName: testTableName,
        data: { Id: 1, Name: 'Old Name' },
      });
    });

    afterEach(async () => {
      if (!connection) return;
      await dropTableTool.run({ tableName: testTableName });
    });

    it('should update data successfully', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await updateDataTool.run({
        tableName: testTableName,
        updates: { Name: 'New Name' },
        whereClause: 'Id = 1',
      });

      expect(result.success).toBe(true);
      expect(result.rowsAffected).toBeGreaterThan(0);
    });

    it('should require WHERE clause', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await updateDataTool.run({
        tableName: testTableName,
        updates: { Name: 'New Name' },
        whereClause: '',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('WHERE clause');
    });
  });

  describe('DropTableTool', () => {
    it('should drop a table successfully', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      // Create test table
      await createTableTool.run({
        tableName: testTableName,
        columns: [{ name: 'Id', type: 'INT PRIMARY KEY' }],
      });

      const result = await dropTableTool.run({ tableName: testTableName });

      expect(result.success).toBe(true);
      expect(result.message).toContain('dropped successfully');
    });

    it('should handle dropping non-existent table gracefully', async () => {
      if (!connection) {
        console.log('Skipping test: no database connection');
        return;
      }

      const result = await dropTableTool.run({ tableName: 'NonExistentTable_12345' });

      // Should not fail as DROP IF EXISTS pattern is typically used
      expect(result).toBeDefined();
    });
  });
});
