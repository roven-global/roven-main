# MongoDB Atlas Authentication Fix Guide

## Issue: Authentication failed (code: 8000)

This error typically occurs due to incorrect credentials, URL encoding issues, or Atlas configuration problems.

## Step 1: Create .env File

Create a `.env` file in the `server/` directory with the following content:

```env
# Database Configuration
# MongoDB Atlas Connection String
# Replace <username>, <password>, and <cluster-url> with your actual values
# IMPORTANT: URL-encode special characters in password (@, #, $, %, &, +, etc.)
# Example: password "my@pass#word" becomes "my%40pass%23word"
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# JWT Secret Keys (REQUIRED - Generate strong random strings)
SECRET_KEY_ACCESS_TOKEN=your_very_strong_access_token_secret_key_here
SECRET_KEY_REFRESH_TOKEN=your_very_strong_refresh_token_secret_key_here

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email Configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth (if using Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Step 2: URL Encoding for Passwords

If your MongoDB password contains special characters, you MUST URL-encode them:

| Character | URL Encoded |
| --------- | ----------- |
| @         | %40         |
| #         | %23         |
| $         | %24         |
| %         | %25         |
| &         | %26         |
| +         | %2B         |
| /         | %2F         |
| :         | %3A         |
| ;         | %3B         |
| =         | %3D         |
| ?         | %3F         |
| [         | %5B         |
| ]         | %5D         |
| \         | %5C         |
| ^         | %5E         |
| `         | %60         |
| {         | %7B         |
| }         | %7C         |
| ~         | %7E         |

### Example:

- Original password: `my@pass#word$123`
- URL-encoded password: `my%40pass%23word%24123`
- Connection string: `mongodb+srv://username:my%40pass%23word%24123@cluster.mongodb.net/database`

## Step 3: MongoDB Atlas Configuration

### 3.1 Verify Database User

1. Log into MongoDB Atlas
2. Go to "Database Access" in the left sidebar
3. Verify your database user exists
4. Check that the user has the correct role (at minimum: "Read and write to any database")
5. If needed, create a new user or reset the password

### 3.2 IP Whitelist

1. Go to "Network Access" in the left sidebar
2. Add your current IP address
3. For development, you can temporarily add `0.0.0.0/0` (allows access from anywhere - NOT recommended for production)

### 3.3 Connection String Format

Your connection string should follow this format:

```
mongodb+srv://<username>:<password>@<cluster-name>.<random-string>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

## Step 4: Common Issues and Solutions

### Issue 1: Special Characters in Password

**Solution**: URL-encode all special characters in your password

### Issue 2: Wrong Username/Password

**Solution**:

- Double-check credentials in Atlas
- Reset password if necessary
- Ensure username matches exactly (case-sensitive)

### Issue 3: IP Not Whitelisted

**Solution**: Add your current IP to the Atlas IP whitelist

### Issue 4: Database User Permissions

**Solution**: Ensure the user has "Read and write to any database" role

### Issue 5: Cluster URL Format

**Solution**: Use the exact connection string from Atlas (copy from "Connect" button)

## Step 5: Testing the Connection

After updating your `.env` file:

1. Restart your server
2. Check the console for connection success message
3. If still failing, check the exact error message for more details

## Step 6: Alternative Connection String Formats

If the SRV connection string doesn't work, try the standard format:

```
mongodb://<username>:<password>@<cluster-name>-shard-00-00.<random-string>.mongodb.net:27017,<cluster-name>-shard-00-01.<random-string>.mongodb.net:27017,<cluster-name>-shard-00-02.<random-string>.mongodb.net:27017/<database-name>?ssl=true&replicaSet=atlas-<random-string>-shard-0&authSource=admin&retryWrites=true&w=majority
```

## Security Notes

- Never commit your `.env` file to version control
- Use strong, unique passwords
- Regularly rotate your database credentials
- Use IP whitelisting in production
- Consider using MongoDB Atlas VPC peering for production environments
