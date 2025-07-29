# Instructions for Testing Email Functionality

## Option 1: Gmail with App Password (Real emails)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security > 2-Step Verification
   - App passwords > Generate new password
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update .env file:**
   ```
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   ```

## Option 2: Mailtrap (Development testing - catches emails)

1. **Sign up at https://mailtrap.io** (free tier available)
2. **Get SMTP credentials** from your inbox
3. **Update .env file:**
   ```
   MAIL_SERVER=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=your-mailtrap-username
   MAIL_PASSWORD=your-mailtrap-password
   MAIL_USE_TLS=true
   MAIL_USE_SSL=false
   ```

## Option 3: Temporary Email Services for Testing

1. **Temp-Mail.org** - Get temporary email addresses for testing
2. **10MinuteMail** - Temporary emails that last 10 minutes
3. **Guerrilla Mail** - Disposable temporary email addresses

## Testing Steps:

1. Configure your chosen email service in .env
2. Restart the Flask application
3. Create or invite an employee with a real email address
4. Check the email inbox (or Mailtrap dashboard)

## Troubleshooting:

- **Gmail "Less secure apps"**: Use App Password instead
- **SSL/TLS errors**: Check MAIL_USE_TLS and MAIL_USE_SSL settings
- **Authentication failed**: Verify username and password
- **Connection timeout**: Check firewall and port settings
