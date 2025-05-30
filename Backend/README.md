# Node.js Authentication API

This is a Node.js authentication API built with Express and MySQL that provides user registration and login functionality.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=auth_db
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

3. Set up the database:
- Make sure MySQL is installed and running
- Run the SQL commands in `database.sql` to create the database and tables

4. Start the server:
```bash
node server.js
```

## API Endpoints

### Register a new user
```
POST /api/auth/signup
Content-Type: application/json

{
    "username": "example",
    "email": "example@email.com",
    "password": "yourpassword"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
    "email": "example@email.com",
    "password": "yourpassword"
}
```

## Response Format

### Successful Registration
```json
{
    "message": "User created successfully"
}
```

### Successful Login
```json
{
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "username": "example",
        "email": "example@email.com"
    }
}
``` 