# Email Setup Guide for LMS

## 📧 Email Configuration

The LMS now supports sending real invitation emails to employees. Follow these steps to configure email sending:

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Configure Email Settings

Edit the `.env` file with your email provider settings:

#### For Gmail:
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@yourdomain.com
```

#### For Outlook/Hotmail:
```env
MAIL_SERVER=smtp.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_DEFAULT_SENDER=noreply@yourdomain.com
```

### 3. Gmail App Password Setup (Recommended)

For Gmail, use an App Password instead of your regular password:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account settings → Security → App passwords
3. Generate a new app password for "Mail"
4. Use this app password in the `MAIL_PASSWORD` field

### 4. Restart the Server

After configuring the `.env` file, restart your Flask server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd backend
source ../.venv/bin/activate
python app.py
```

### 5. Test Email Invitations

1. Log in as a portal admin
2. Go to the Employees section
3. Click "Invite Employee"
4. Enter an email address matching your organization domain
5. The employee will receive a professional invitation email with login credentials

## 🔄 Demo Mode

If no email configuration is provided, the system will run in **demo mode**:
- Invitation details are printed to the server console
- Employee accounts are still created
- No actual emails are sent

## 🔧 Troubleshooting

### Common Issues:

1. **Authentication Error**: Make sure you're using an app password for Gmail
2. **Connection Refused**: Check your MAIL_SERVER and MAIL_PORT settings
3. **TLS/SSL Errors**: Verify MAIL_USE_TLS and MAIL_USE_SSL settings

### Testing Configuration:

You can test your email configuration by checking the server logs when sending invitations. Look for either:
- ✅ "Email sent successfully" 
- ❌ Error messages with specific details

## 📋 Features

### Email Template Features:
- Professional HTML design with your organization branding
- Secure temporary password generation
- Direct login link
- Security reminders
- Mobile-friendly responsive design

### Security Features:
- Automatic temporary password generation
- Account creation with email verification
- Unique username generation (handles duplicates)
- Secure password requirements reminder

## 🎯 Production Recommendations

For production use:
1. Use a dedicated email service (SendGrid, AWS SES, etc.)
2. Set up proper SPF/DKIM records for your domain
3. Use environment variables instead of hardcoded credentials
4. Monitor email delivery rates and bounces
5. Implement email rate limiting if needed
