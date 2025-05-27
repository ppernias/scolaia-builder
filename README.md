# ADLBuilder - Assistant Definition Language Builder

## Description

ADLBuilder is a web application designed to create, edit, and manage AI assistant configurations in YAML format. The application provides an intuitive interface that allows users to define the behavior, capabilities, and personality of AI assistants following a standardized schema (ADL - Assistant Definition Language).

## Key Features

- **Dual Editor**: Simple mode for basic editing and advanced mode for full control
- **YAML Validation**: Real-time validation against the defined schema
- **Enhanced Security**: JWT authentication with refresh tokens and token revocation
- **User Authentication**: Registration and login to save personal assistants
- **Template Library**: Collection of predefined templates to get started quickly
- **Import/Export**: Support for importing and exporting YAML files
- **Unified Architecture**: A single FastAPI server that serves both backend and frontend

## Project Structure

```
adlbuilder/
│── app/                           # Main application
│   │── api/                       # HTTP endpoints (REST)
│   │── core/                      # Configuration, DB, etc.
│   │── services/                  # Business logic
│   │── schemas/                   # Pydantic models
│   │── models/                    # SQLAlchemy models
│   │── static/                    # Static files (CSS, JS, images)
│   │── templates/                 # HTML templates
│   └── main.py                    # FastAPI entry point
│── scripts/                       # Utility scripts
│── schema.yaml                    # Canonical ADL schema
│── requirements.txt               # Python dependencies
│── start.sh                       # Startup script
└── venv/                          # Virtual environment (not included in repository)
```

## Installation

### Prerequisites

- Python 3.8+
- SQLite (or PostgreSQL for production)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/adlbuilder.git
   cd adlbuilder
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the application**
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
   ```

5. **Access the application**
   - Web application: [http://localhost:8080](http://localhost:8080)
   - API documentation: [http://localhost:8080/docs](http://localhost:8080/docs)

### Docker Installation

You can also use Docker to run the application:

```bash
docker-compose up -d
```

## Application Usage

1. **Registration and Login**
   - The first registered user automatically receives administrator privileges
   - Users can register with email, password, and name

2. **Creating an Assistant**
   - Navigate to the Editor section
   - Select a template or start from scratch
   - Fill in the required fields in simple mode or directly edit the YAML in advanced mode

3. **Save and Export**
   - Assistants are saved to your user account
   - You can export the definition in YAML format

4. **Administration**
   - Administrators can manage users from the admin panel

## Utility Scripts

The `scripts/` directory contains tools to facilitate system maintenance and administration:

### check_users.py

Displays information about registered users in the system.

```bash
# From the project root
./scripts/check_users.py
```

### update_admin.py

Manages users in the system. It has three operation modes:

1. **Create/update administrator**
   ```bash
   ./scripts/update_admin.py admin --email admin@example.com --password secret --name "Administrator"
   ```

2. **Add an individual user**
   ```bash
   ./scripts/update_admin.py add --email user@example.com --password pass123 --name "New User" --admin
   ```
   The `--admin` parameter is optional. If included, the user is created as an administrator.

3. **Import users from CSV**
   ```bash
   ./scripts/update_admin.py import --file users.csv --default-password pass123
   ```
   
   CSV format:
   ```
   email,name,password,is_admin
   user1@example.com,User One,pass123,false
   admin2@example.com,Admin Two,secret,true
   ```
   The `password` and `is_admin` fields are optional.

### test_api.py

Runs tests on the application's API.

```bash
./scripts/test_api.py --url http://localhost:8080 --email admin@example.com --password password
```

Parameters:
- `--url`: Base URL of the application (default: http://localhost:8080)
- `--email`: Administrator email for testing (default: admin@example.com)
- `--password`: Administrator password (default: password)

### update_db.py

Updates the database schema with the latest model changes, including the token blacklist table.

```bash
./scripts/update_db.py
```

### cleanup_tokens.py

Removes expired tokens from the blacklist to keep the database optimized.

```bash
./scripts/cleanup_tokens.py --verbose
```

Parameters:
- `--verbose`, `-v`: Show detailed information during execution

## Database

The application uses SQLite by default and automatically creates the database and necessary tables at startup. For production environments, it is recommended to migrate to PostgreSQL.

## Internationalization (i18n)

The application is prepared to support multiple languages. It currently includes English and Spanish, with a structure to easily add more languages.

## Security Features

ADLBuilder implements several security features to protect user data and prevent unauthorized access:

### JWT Authentication

- **Access Tokens**: Short-lived tokens (30 minutes) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) to obtain new access tokens without re-authentication
- **Token Revocation**: Ability to invalidate tokens before expiration (logout)
- **Token Blacklisting**: Revoked tokens are stored in a database to prevent reuse
- **Enhanced Payload**: Tokens include additional claims (issuer, JWT ID, token type)

### User Session Management

- **Secure Logout**: Properly invalidates tokens on logout
- **Token Refresh**: Seamless token renewal without disrupting user experience
- **Automatic Cleanup**: Expired blacklisted tokens are periodically removed from the database

### Update Database Script

To update your database with the latest security features, run:

```bash
./scripts/update_db.py
```

## License

MIT
