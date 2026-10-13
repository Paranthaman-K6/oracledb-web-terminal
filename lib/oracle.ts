import oracledb from 'oracledb';
import type { ConnectionConfig, SQLResult } from '@/types';

// Thin mode (pure JavaScript) only - required for Vercel.
// Never call oracledb.initOracleClient(): Thick mode fails the build (NJS-045).

export class OracleConnection {
  private pool: oracledb.Pool | null = null;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  async createPool(): Promise<oracledb.Pool> {
    if (this.pool) {
      return this.pool;
    }

    const poolConfig: oracledb.PoolAttributes = {
      user: this.config.user,
      password: this.config.password,
      connectString: this.config.connectString,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 30000,
      enableStatistics: true,
    };

    // Add wallet configuration if provided
    if (this.config.walletLocation) {
      poolConfig.walletLocation = this.config.walletLocation;
      if (this.config.walletPassword) {
        poolConfig.walletPassword = this.config.walletPassword;
      }
    }

    // Add proxy configuration if provided
    if (this.config.httpsProxy) {
      poolConfig.httpsProxy = this.config.httpsProxy;
      if (this.config.httpsProxyPort) {
        poolConfig.httpsProxyPort = this.config.httpsProxyPort;
      }
    }

    try {
      this.pool = await oracledb.createPool(poolConfig);
      console.log('Oracle connection pool created successfully');
      return this.pool;
    } catch (error) {
      console.error('Error creating Oracle connection pool:', error);
      throw error;
    }
  }

  async execute(sql: string): Promise<SQLResult> {
    if (!this.pool) {
      await this.createPool();
    }

    const startTime = Date.now();
    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.pool!.getConnection();
      
      // Set output format to objects
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
      oracledb.autoCommit = true;

      const trimmedSql = sql.trim();
      const isQuery = /^\s*(select|with|desc|describe)\s+/i.test(trimmedSql);

      let result: oracledb.Result<any>;

      if (isQuery) {
        result = await connection.execute(trimmedSql, [], {
          maxRows: 1000,
          fetchArraySize: 100,
        });
      } else {
        result = await connection.execute(trimmedSql);
      }

      const executionTime = Date.now() - startTime;

      if (isQuery && result.rows) {
        const columns = result.metaData?.map((meta) => meta.name) || [];
        return {
          columns,
          rows: result.rows.map((row) => columns.map((col) => row[col])),
          rowCount: result.rows.length,
          executionTime,
          isQuery: true,
        };
      }

      return {
        columns: [],
        rows: [],
        rowCount: result.rowsAffected || 0,
        executionTime,
        isQuery: false,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime,
        error: error.message || 'Unknown error',
        isQuery: false,
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Error closing connection:', e);
        }
      }
    }
  }

  async ping(): Promise<{ success: boolean; latency: number }> {
    const startTime = Date.now();
    try {
      if (!this.pool) {
        await this.createPool();
      }
      const connection = await this.pool!.getConnection();
      await connection.execute('SELECT 1 FROM DUAL');
      await connection.close();
      return { success: true, latency: Date.now() - startTime };
    } catch (error) {
      return { success: false, latency: Date.now() - startTime };
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close(10); // 10 second timeout
        this.pool = null;
        console.log('Oracle connection pool closed');
      } catch (error) {
        console.error('Error closing pool:', error);
        throw error;
      }
    }
  }
}