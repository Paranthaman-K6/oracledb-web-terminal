import { z } from 'zod';

export const connectSchema = z.object({
  user: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  connectString: z.string().min(1, 'Connection string is required'),
  walletLocation: z.string().optional(),
  walletPassword: z.string().optional(),
  httpsProxy: z.string().optional(),
  httpsProxyPort: z.number().int().positive().optional(),
});

export const executeSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID').optional(),
  sql: z.string().min(1, 'SQL statement is required'),
});

export const pingSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID').optional(),
});

export const disconnectSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID').optional(),
});

export type ConnectInput = z.infer<typeof connectSchema>;
export type ExecuteInput = z.infer<typeof executeSchema>;
export type PingInput = z.infer<typeof pingSchema>;
export type DisconnectInput = z.infer<typeof disconnectSchema>;