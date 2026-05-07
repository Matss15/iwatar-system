# IWATAR Student Information and Monitoring System

Local-only prototype classroom web system using Node.js, Express, MySQL, EJS, and Bootstrap 5.

The tablet display opens the web app through a browser on the local network. This prototype does not use QR scanning and does not include Raspberry Pi.

## Features

- Full-screen tablet kiosk display
- Student photo, name, LRN, section, guardian, and contact details
- Announcements for the current day only
- Schedule and recent scan logs
- Fingerprint and temperature status area
- Admin login and sidebar dashboard
- Manage students, announcements, schedules, scan logs, and admin accounts
- Upload student photos from the admin student form
- MySQL CRUD API routes

## Setup with XAMPP MySQL

1. Open XAMPP and start **Apache** and **MySQL**.
2. Open phpMyAdmin: `http://localhost/phpmyadmin`.
3. Go to **Import**.
4. Choose this file:

```text
C:\Users\amark\iwatar-system\database.sql
```

5. Click **Import**. The database name is `iwatar_system`.
6. Install Node.js packages:

```bash
npm install
```

7. Start the local server:

```bash
npm run dev
```

The dev server uses nodemon and restarts automatically when you edit files. If you see `EADDRINUSE: address already in use :::3000`, another server is already running on port 3000. Stop it with:

```bash
npm run stop:port
```

Then run `npm run dev` again.

8. Open the tablet/kiosk display:

```text
http://localhost:3000
```

9. Open the admin panel:

```text
http://localhost:3000/admin/login
```

Sample admin login:

```text
Username: admin
Password: admin123
```

## Google Authenticator OTP

After the username and password are accepted, the admin login asks for a 6-digit code from Google Authenticator.

On the first successful password login, the app shows a setup key. Open Google Authenticator, choose **Add a code**, choose **Enter a setup key**, enter the setup key, then submit the generated 6-digit code. Future logins will ask for the OTP code only.

## Gmail Attendance PDF Reports

The admin scan logs page can send attendance summary reports as PDF attachments to teacher email addresses. It supports manual sending and daily automatic sending.

Add these values to `.env`:

```text
GMAIL_SMTP_USER=your-gmail-address@gmail.com
GMAIL_SMTP_APP_PASSWORD=your-16-character-gmail-app-password
```

Use a Gmail app password, not your normal Gmail password. In Gmail, enable 2-Step Verification, then create an app password for this local system.

Open:

```text
http://localhost:3000/admin/logs
```

Enter teacher email addresses, save the report settings, then click **Send PDF Report**. To enable automatic daily sending, check **Send automatically every day** and set the time.

## Local Network Tablet Access

On the server laptop, find the local IP address using:

```bash
ipconfig
```

On the tablet browser, open:

```text
http://YOUR-LAPTOP-IP:3000
```

Example:

```text
http://192.168.1.10:3000
```

## Main API Routes

- `GET /api/health`
- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `GET /api/announcements`
- `POST /api/announcements`
- `PUT /api/announcements/:id`
- `DELETE /api/announcements/:id`
- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`
- `GET /api/logs`
- `POST /api/logs`
- `DELETE /api/logs/:id`
- `GET /api/admins`
- `POST /api/admins`
- `PUT /api/admins/:id`
- `DELETE /api/admins/:id`

## Notes

This is a local prototype for school demonstration and development. The admin password is stored plainly in the sample database to keep the beginner code readable. Use hashed passwords before real deployment.

Uploaded student photos are saved locally in:

```text
public/uploads/students
```
