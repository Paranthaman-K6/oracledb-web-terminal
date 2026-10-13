declare module 'oracledb' {
  export interface ConnectionAttributes {
    user?: string;
    password?: string;
    connectString?: string;
    walletLocation?: string;
    walletPassword?: string;
    httpsProxy?: string;
    httpsProxyPort?: number;
    [key: string]: any;
  }

  export interface PoolAttributes extends ConnectionAttributes {
    poolMin?: number;
    poolMax?: number;
    poolIncrement?: number;
    poolTimeout?: number;
    queueTimeout?: number;
    enableStatistics?: boolean;
    [key: string]: any;
  }

  export interface Connection {
    execute(sql: string, binds?: any[], options?: ExecuteOptions): Promise<Result<any>>;
    close(): Promise<void>;
  }

  export interface ExecuteOptions {
    maxRows?: number;
    fetchArraySize?: number;
    outFormat?: number;
    autoCommit?: boolean;
    [key: string]: any;
  }

  export interface Result<T> {
    rows?: T[];
    rowsAffected?: number;
    metaData?: MetaData[];
    [key: string]: any;
  }

  export interface MetaData {
    name: string;
    fetchType?: number;
    dbType?: number;
    dbTypeName?: string;
    precision?: number;
    scale?: number;
    nullable?: boolean;
    [key: string]: any;
  }

  export interface Pool {
    getConnection(options?: ConnectionAttributes): Promise<Connection>;
    close(timeout?: number): Promise<void>;
    statistics?: PoolStatistics;
    [key: string]: any;
  }

  export interface PoolStatistics {
    [key: string]: any;
  }

  export interface OracleClientOptions {
    configDir?: string;
    [key: string]: any;
  }

  export const OUT_FORMAT_OBJECT: number;
  export const OUT_FORMAT_ARRAY: number;
  export let outFormat: number;
  export let autoCommit: boolean;

  export function initOracleClient(options?: OracleClientOptions): void;
  export function createPool(attributes: PoolAttributes): Promise<Pool>;
  export function getConnection(attributes: ConnectionAttributes): Promise<Connection>;
  export const version: string;
  export const versionSuffix: string;
}