# 🔐 Bolt-Pass

A secure, minimalist password manager built with Node.js, Express, and MySQL. Store and manage your passwords with military-grade AES-256-GCM encryption.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0%2B-orange.svg)

## ✨ Features

- 🔒 **Military-Grade Encryption** - AES-256-GCM encryption for all stored passwords
- 👤 **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- 📝 **Full CRUD Operations** - Create, Read, Update, and Delete password entries
- 🎯 **Smart Categories** - Organize passwords by category (Work, Personal, Banking, etc.)
- 💪 **Password Strength Indicator** - Real-time password strength analysis
- 🔍 **Search & Filter** - Quickly find passwords with search and category filters
- 📱 **Responsive Design** - Clean, modern UI that works on all devices
- 🚀 **Fast Performance** - Optimized API with connection pooling and caching
- 🔐 **Secure by Default** - CORS protection, SQL injection prevention, XSS protection

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16.0.0 or higher
- **MySQL** 8.0 or higher
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bolt-Pass
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**

   Run the database initialization script:
   ```bash
   mysql -u root -p < db-init.sql
   ```

   This creates:
   - Database: `bolt-coin`
   - Tables: `users`, `password_entries`, `categories`
   - Default categories with icons and colors

4. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Generate a secure encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Update `.env` with your settings:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=bolt-coin
   PORT=3000
   JWT_SECRET=your_secure_jwt_secret_key_here
   ENC_KEY=your_generated_32byte_base64_key_here
   ```

5. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**

   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 📖 Usage

### First Time Setup

1. **Register a new account**
   - Click on the "Register" tab
   - Enter your username (can be an email)
   - Choose a strong password
   - Click "Create account"

2. **Add your first password**
   - Click the **+** button (bottom right)
   - Fill in the password details:
     - Title (required): e.g., "Gmail Account"
     - Website URL: e.g., "https://gmail.com"
     - Email/Username: Your account username
     - Password (required): The password to store
     - Category: Select from dropdown
   - Click "Save Password"

3. **View and manage passwords**
   - Click any password card to view details
   - Use the search bar to find passwords
   - Filter by category using the pills
   - Edit or delete from the sidebar menu

### Password Management Features

- **Search**: Type in the search bar to filter passwords by title, email, username, or website
- **Categories**: Click category pills to filter by Work, Personal, Banking, etc.
- **View**: Click a password card to see full details
- **Edit**: Click the edit button (✏️) in the sidebar
- **Delete**: Click menu (⋯) → Delete Password
- **Copy**: Use copy buttons to quickly copy URL, username, or password to clipboard
- **Generate**: Use "Generate Strong Password" button to create secure passwords
- **Strength Indicator**: Visual feedback shows password strength (Weak/Medium/Strong)

## 🛠️ Troubleshooting

### Common Issues

#### "Failed to load passwords" error

**Cause**: Invalid or expired authentication token

**Solution 1 - Clear and re-login:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.clear()` and press Enter
4. Refresh the page (F5)
5. Login again

**Solution 2 - Use debug tool:**
1. Go to `http://localhost:3000/test-login.html`
2. Click "Clear All Data"
3. Login with your credentials
4. Click "Fetch Passwords" to verify
5. Click "Open Main App"

#### Forgot Password

Run the password reset script:
```bash
node reset-password.js "your_username_or_email" "newPassword123"
```

Example:
```bash
node reset-password.js "user@example.com" "myNewPassword"
```

#### Port 3000 already in use

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

Or use a different port in `.env`:
```env
PORT=3001
```

#### Database connection error

1. Verify MySQL is running:
   ```bash
   mysql --version
   ```

2. Check database exists:
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'bolt-coin';"
   ```

3. Verify credentials in `.env` are correct

4. Re-run database initialization if needed:
   ```bash
   mysql -u root -p < db-init.sql
   ```

## 🏗️ Project Structure

```
Bolt-Pass/
├── public/               # Frontend files
│   ├── index.html       # Main HTML file
│   ├── app.js           # Frontend JavaScript logic
│   ├── styles.css       # Styling
│   └── test-login.html  # Debug/testing tool
├── server.js            # Express server & API routes
├── db-init.sql          # Database schema initialization
├── reset-password.js    # Password reset utility
├── .env                 # Environment configuration (not in git)
├── .env.example         # Environment template
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## 🔒 Security Features

- **AES-256-GCM Encryption**: All passwords encrypted before storage
- **Bcrypt Password Hashing**: User account passwords use bcrypt (10 rounds)
- **JWT Authentication**: Secure token-based authentication with 7-day expiry
- **SQL Injection Protection**: Parameterized queries with mysql2
- **XSS Protection**: HTML escaping on all user inputs
- **CORS Enabled**: Cross-Origin Resource Sharing configured
- **Secure Headers**: Authorization headers for all protected routes
- **Connection Pooling**: Efficient database connection management

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Password Entries
- `GET /api/entries` - Get all password entries (full data)
- `GET /api/entries/titles` - Get password entries (without decrypted passwords)
- `GET /api/entries/:id` - Get single entry with decrypted password
- `POST /api/entries` - Create new password entry
- `PUT /api/entries/:id` - Update password entry
- `DELETE /api/entries/:id` - Delete password entry

### Statistics & Categories
- `GET /api/entries/stats` - Get password strength statistics
- `GET /api/categories` - Get available categories

### Health Check
- `GET /api/ping` - Server health check

## 🔧 Development

### Running in Development Mode

Uses `nodemon` for auto-restart on file changes:
```bash
npm run dev
```

### Testing API Endpoints

Use the included test script:
```bash
node test-api.js
```

Or use the debug web interface:
```
http://localhost:3000/test-login.html
```

### Database Management

View all users:
```bash
mysql -u root -p -D bolt-coin -e "SELECT id, username, created_at FROM users;"
```

View all passwords:
```bash
mysql -u root -p -D bolt-coin -e "SELECT id, user_id, title, category FROM password_entries;"
```

Count entries:
```bash
mysql -u root -p -D bolt-coin -e "SELECT COUNT(*) as total FROM password_entries;"
```

## 🎯 Features Roadmap

- [ ] Two-Factor Authentication (2FA)
- [ ] Password sharing (encrypted)
- [ ] Browser extension
- [ ] Mobile app
- [ ] Import/Export passwords
- [ ] Password expiry notifications
- [ ] Breach detection integration
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Biometric authentication

## ⚠️ Important Notes

### Security Recommendations

1. **NEVER commit `.env` file** - It contains sensitive credentials
2. **Use strong JWT_SECRET** - Random, long string
3. **Backup ENC_KEY** - If lost, passwords cannot be decrypted
4. **Use HTTPS in production** - Never use HTTP for production deployment
5. **Regular backups** - Backup your database regularly
6. **Strong passwords** - Use the built-in password generator
7. **Keep dependencies updated** - Run `npm audit` regularly

### Deployment Considerations

- Use environment variables for secrets (not `.env` files)
- Enable HTTPS with SSL certificates
- Use a process manager like PM2
- Set up database backups
- Configure firewall rules
- Use rate limiting for API endpoints
- Monitor server logs
- Consider using a reverse proxy (nginx)

## 📝 License

MIT License - feel free to use this project for learning or personal use.

## 👨‍💻 Author

Created as a learning project to demonstrate:
- Full-stack JavaScript development
- RESTful API design
- Database design and SQL
- Authentication & Authorization
- Encryption and security best practices
- Modern responsive web design

## 🤝 Contributing

This is a learning project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Use the debug tool at `/test-login.html`
3. Check server logs for errors
4. Verify database connection
5. Ensure all dependencies are installed

---

**⚠️ Disclaimer**: This is an educational project. For production use, consider professional password management solutions or conduct a thorough security audit.

**🔐 Remember**: Your master password and ENC_KEY are critical - keep them safe and backed up!
