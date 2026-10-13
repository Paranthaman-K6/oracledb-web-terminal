# Oracle SQLPlus Web Terminal

A serverless web-based SQLPlus terminal for Oracle Database, built with Next.js 14 and deployable to Vercel.

## Features

- 🖥️ **SQLPlus-like Terminal Interface** - Familiar command-line experience in the browser
- 🔐 **Session-based Authentication** - Enter credentials once per session
- ⚡ **Auto-ping Keep Alive** - Automatically ping database to prevent connection timeout
- 📊 **Formatted Query Results** - Clean table output with pagination
- ⚙️ **Configurable Settings** - Page size, line size, auto-ping interval, timestamps
- 🎨 **Dark Theme** - Easy on the eyes for long coding sessions
- 🚀 **Serverless Ready** - Deploy to Vercel with zero configuration
- 🔒 **Secure** - Credentials never stored, only in memory during session

## Quick Start

### Prerequisites

- Node.js 18+
- Oracle Database (Autonomous DB, On-premises, or Cloud)
- Oracle Instant Client (for Thick mode) or use Thin mode (default)

### Local Development

```bash
# Clone and install
cd oracledb-cli-webapp
npm install

# Copy environment template
cp .env.example .env.local

# Configure your database connection in .env.local
# DB_USER=your_username
# DB_PASSWORD=your_password
# CONNECT_STRING=your_connection_string

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment to Vercel

1. Push this repository to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `DB_USER`
   - `DB_PASSWORD`
   - `CONNECT_STRING`
   - `WALLET_LOCATION` (optional, for Autonomous DB)
   - `WALLET_PASSWORD` (optional)
4. Deploy!

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER` | Yes | Database username |
| `DB_PASSWORD` | Yes | Database password |
| `CONNECT_STRING` | Yes | Oracle connection string (Easy Connect or TNS) |
| `WALLET_LOCATION` | No | Path to Oracle Wallet directory |
| `WALLET_PASSWORD` | No | Wallet password (if encrypted) |
| `HTTPS_PROXY` | No | HTTPS proxy hostname |
| `HTTPS_PROXY_PORT` | No | HTTPS proxy port |

### Connection String Examples

```bash
# Easy Connect (standard)
mydb.example.com:1521/ORCLPDB1

# Autonomous Database (ATP/ADW)
mydb_high.adb.us-ashburn-1.oraclecloud.com:1522/mydb.adb.oraclecloud.com

# With TNS alias (requires tnsnames.ora)
MY_TNS_ALIAS
```

### Oracle Wallet (Autonomous DB)

1. Download wallet from Oracle Cloud Console
2. Extract to a folder (e.g., `./wallet`)
3. Set `WALLET_LOCATION=./wallet`
4. Set `WALLET_PASSWORD` if wallet is encrypted

## Usage

### SQL Commands

All standard SQL and SQLPlus commands work:

```sql
-- Queries
SELECT * FROM employees WHERE department_id = 10;

-- DML
INSERT INTO departments (department_id, department_name) VALUES (999, 'Test');
UPDATE employees SET salary = salary * 1.1 WHERE department_id = 10;
DELETE FROM departments WHERE department_id = 999;

-- DDL
CREATE TABLE test_table (id NUMBER PRIMARY KEY, name VARCHAR2(100));
ALTER TABLE employees ADD (bonus NUMBER);
DROP TABLE test_table;

-- Transaction Control
COMMIT;
ROLLBACK;
SAVEPOINT before_update;
```

### SQLPlus Commands

```sql
-- Help
HELP

-- Show Settings
SHOW ALL

-- Configure Output
SET PAGESIZE 50
SET LINESIZE 200
SET AUTOPING ON
SET AUTOPING INTERVAL 30

-- Repeat Last Command
/

-- Describe Table
DESCRIBE employees
DESC employees

-- Exit
EXIT
QUIT
```

### Auto-Ping Feature

The terminal automatically pings the database every 60 seconds (configurable) to keep the connection alive. This prevents:

- Connection timeouts on Autonomous Database
- Firewall/proxy connection drops
- Pool connection expiration

Toggle with `SET AUTOPING ON/OFF` or use the status bar toggle.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router)                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Backend (Serverless Functions) │
│  ┌─────────────────────┐   │  ┌─────────────────────────┐   │
│  │ Custom Terminal UI  │◄──┼──┤ /api/auth/connect       │   │
│  │ - SQLPlus styling   │   │  │ /api/sql/execute        │   │
│  │ - Command history   │   │  │ /api/sql/ping           │   │
│  │ - Output formatting │   │  │ /api/session/keepalive  │   │
│  └─────────────────────┘   │  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Next.js 14** - App Router with Serverless Functions
- **oracledb (Thin Mode)** - Pure JavaScript Oracle driver
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type safety
- **Phosphor Icons** - Clean iconography

## Security Considerations

- Credentials are only stored in memory during active session
- Sessions expire after 1 hour of inactivity
- All API communication over HTTPS (enforced by Vercel)
- No credentials logged or persisted
- CORS configured for same-origin only

## Limitations

- Thin mode doesn't support all Thick mode features
- Maximum query result rows: 1000 (configurable)
- Maximum execution time: 30 seconds (Vercel limit)
- File-based scripts (`@script.sql`) not supported
- Shell escapes (`!!`) not supported

## License

MIT License - feel free to use and modify!

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push and open PR

## Support

For issues, please open a GitHub issue with:
- Oracle Database version
- Connection type (ATP, ADW, On-prem, etc.)
- Error messages
- Steps to reproduce