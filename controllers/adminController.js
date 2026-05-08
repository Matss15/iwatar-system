const db = require("../config/database");
const crypto = require("crypto");
const Student = require("../models/studentModel");
const Announcement = require("../models/announcementModel");
const Schedule = require("../models/scheduleModel");
const ScanLog = require("../models/scanLogModel");
const Admin = require("../models/adminModel");
const ReportSettings = require("../models/reportSettingsModel");
const ReportService = require("../services/reportService");
const Totp = require("../utils/totp");
const fingerprint = require("../hardware/fingerprint");

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getGoogleRedirectUri(req) {
  return process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get("host")}/admin/auth/google/callback`;
}

function googleConfigReady() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function renderLogin(res, status, error = null) {
  return res.status(status).render("admin/login", {
    title: "Admin Login",
    error,
    googleEnabled: googleConfigReady(),
  });
}

function renderOtp(res, status, data) {
  return res.status(status).render("admin/otp", {
    title: "Admin OTP",
    error: null,
    setup: false,
    secret: null,
    otpAuthUri: null,
    ...data,
  });
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect("/admin/login");
  next();
}

function showLogin(req, res) {
  delete req.session.pendingAdmin;
  renderLogin(res, 200);
}

async function login(req, res, next) {
  try {
    const admin = await Admin.findByUsername(req.body.username);

    // Prototype note: password_hash stores plain text in sample data for beginner readability.
    if (!admin || admin.password_hash !== req.body.password) {
      return renderLogin(res, 401, "Invalid username or password");
    }

    let otpSecret = admin.otp_secret;

    if (!otpSecret) {
      otpSecret = Totp.generateSecret();
      await Admin.setOtpSecret(admin.id, otpSecret);
    }

    req.session.pendingAdmin = { id: admin.id };

    res.redirect("/admin/login/otp");
  } catch (error) {
    next(error);
  }
}

async function showOtp(req, res, next) {
  try {
    if (!req.session.pendingAdmin) return res.redirect("/admin/login");

    const admin = await Admin.findById(req.session.pendingAdmin.id);
    if (!admin) return res.redirect("/admin/login");

    renderOtp(res, 200, {
      setup: !admin.otp_enabled,
      secret: admin.otp_secret,
      otpAuthUri: Totp.createOtpAuthUri({
        secret: admin.otp_secret,
        username: admin.username,
      }),
    });
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    if (!req.session.pendingAdmin) return res.redirect("/admin/login");

    const admin = await Admin.findById(req.session.pendingAdmin.id);
    if (!admin) return res.redirect("/admin/login");

    const isValid = Totp.verifyToken(admin.otp_secret, req.body.otp);

    if (!isValid) {
      return renderOtp(res, 401, {
        error: "Invalid authenticator code",
        setup: !admin.otp_enabled,
        secret: admin.otp_secret,
        otpAuthUri: Totp.createOtpAuthUri({
          secret: admin.otp_secret,
          username: admin.username,
        }),
      });
    }

    if (!admin.otp_enabled) {
      await Admin.enableOtp(admin.id);
    }

    req.session.admin = { id: admin.id, username: admin.username, full_name: admin.full_name };
    delete req.session.pendingAdmin;
    res.redirect("/admin/dashboard");
  } catch (error) {
    next(error);
  }
}

function redirectToGoogle(req, res) {
  if (!googleConfigReady()) {
    return renderLogin(res, 503, "Google login is not configured yet.");
  }

  const state = crypto.randomUUID();
  req.session.googleAuthState = state;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE_OAUTH_URL}?${params.toString()}`);
}

async function exchangeGoogleCode(req, code) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleRedirectUri(req),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) throw new Error("Google rejected the authorization code.");
  return response.json();
}

async function getGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Unable to read your Google profile.");
  return response.json();
}

async function googleCallback(req, res, next) {
  try {
    if (!googleConfigReady()) {
      return renderLogin(res, 503, "Google login is not configured yet.");
    }

    if (!req.query.code || req.query.state !== req.session.googleAuthState) {
      return renderLogin(res, 401, "Google sign-in could not be verified.");
    }

    delete req.session.googleAuthState;

    const tokens = await exchangeGoogleCode(req, req.query.code);
    const profile = await getGoogleProfile(tokens.access_token);

    if (!profile.verified_email) {
      return renderLogin(res, 401, "Your Google email is not verified.");
    }

    const admin = await Admin.findByGoogleProfile(profile);

    if (!admin) {
      return renderLogin(res, 403, "This Google account is not linked to an admin account.");
    }

    if (admin.google_email !== profile.email || admin.google_id !== profile.id) {
      await Admin.linkGoogleProfile(admin.id, profile);
    }

    req.session.admin = { id: admin.id, username: admin.username, full_name: admin.full_name };
    res.redirect("/admin/dashboard");
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  req.session.destroy(() => res.redirect("/admin/login"));
}

async function dashboard(req, res, next) {
  try {
    const [studentCount] = await db.query("SELECT COUNT(*) AS total FROM students");
    const [logCount] = await db.query("SELECT COUNT(*) AS total FROM scan_logs WHERE DATE(scanned_at) = CURDATE()");
    const [flaggedCount] = await db.query("SELECT COUNT(*) AS total FROM scan_logs WHERE status = 'flagged'");

    res.render("admin/dashboard", {
      title: "Dashboard",
      admin: req.session.admin,
      counts: {
        students: studentCount.total,
        todayLogs: logCount.total,
        flagged: flaggedCount.total,
      },
      logs: await ScanLog.getRecent(8),
    });
  } catch (error) {
    next(error);
  }
}

async function studentsPage(req, res, next) {
  try {
    res.render("admin/students", {
      title: "Manage Students",
      admin: req.session.admin,
      students: await Student.getAll(),
      studentMessage: req.session.studentMessage || null,
      studentError: req.session.studentError || null,
    });
    delete req.session.studentMessage;
    delete req.session.studentError;
  } catch (error) {
    next(error);
  }
}

function studentRegistrationPage(req, res) {
  res.render("admin/student-registration", {
    title: "Register Student",
    admin: req.session.admin,
  });
}

async function saveStudent(req, res, next) {
  try {
    if (!req.body.lrn || !req.body.first_name || !req.body.last_name) {
      return res.status(400).send("LRN, first name, and last name are required.");
    }

    if (req.file) {
      req.body.photo = `/uploads/students/${req.file.filename}`;
    }

    if (req.body.id) await Student.update(req.body.id, req.body);
    else await Student.create(req.body);
    res.redirect("/admin/students");
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    await Student.remove(req.params.id);
    res.redirect("/admin/students");
  } catch (error) {
    next(error);
  }
}

async function enrollStudentFingerprint(req, res, next) {
  try {
    const student = await Student.getById(req.params.id);

    if (!student) {
      req.session.studentError = "Student not found.";
      return res.redirect("/admin/students");
    }

    const enrollment = await fingerprint.enroll(student.id);
    await Student.updateFingerprintId(student.id, enrollment.fingerprint_id);

    req.session.studentMessage = `Fingerprint registered for ${student.first_name} ${student.last_name}.`;
    res.redirect("/admin/students");
  } catch (error) {
    next(error);
  }
}

async function enrollFingerprintForForm(req, res, next) {
  try {
    const enrollmentKey = req.body.student_id || req.body.lrn || "new-student";
    const enrollment = await fingerprint.enroll(enrollmentKey);
    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
}

async function announcementsPage(req, res, next) {
  try {
    res.render("admin/announcements", {
      title: "Manage Announcements",
      admin: req.session.admin,
      announcements: await Announcement.getAll(),
    });
  } catch (error) {
    next(error);
  }
}

async function saveAnnouncement(req, res, next) {
  try {
    req.body.is_active = req.body.is_active === "on";
    if (req.body.id) await Announcement.update(req.body.id, req.body);
    else await Announcement.create(req.body);
    res.redirect("/admin/announcements");
  } catch (error) {
    next(error);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    await Announcement.remove(req.params.id);
    res.redirect("/admin/announcements");
  } catch (error) {
    next(error);
  }
}

async function schedulesPage(req, res, next) {
  try {
    res.render("admin/schedules", {
      title: "Manage Schedules",
      admin: req.session.admin,
      schedules: await Schedule.getAll(),
    });
  } catch (error) {
    next(error);
  }
}

async function saveSchedule(req, res, next) {
  try {
    if (req.body.id) await Schedule.update(req.body.id, req.body);
    else await Schedule.create(req.body);
    res.redirect("/admin/schedules");
  } catch (error) {
    next(error);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    await Schedule.remove(req.params.id);
    res.redirect("/admin/schedules");
  } catch (error) {
    next(error);
  }
}

async function logsPage(req, res, next) {
  try {
    const reportSettings = await ReportSettings.get();
    res.render("admin/logs", {
      title: "Attendance / Scan Logs",
      admin: req.session.admin,
      logs: await ScanLog.getAll(),
      reportSettings,
      reportDate: ReportService.formatDate(),
      reportMessage: req.session.reportMessage || null,
      reportError: req.session.reportError || null,
    });
    delete req.session.reportMessage;
    delete req.session.reportError;
  } catch (error) {
    next(error);
  }
}

async function saveReportSettings(req, res, next) {
  try {
    await ReportSettings.update({
      recipients: req.body.recipients,
      auto_enabled: req.body.auto_enabled === "on",
      send_time: req.body.send_time,
    });
    req.session.reportMessage = "Report settings saved.";
    res.redirect("/admin/logs");
  } catch (error) {
    next(error);
  }
}

async function sendAttendanceReport(req, res) {
  try {
    const settings = await ReportSettings.get();
    const result = await ReportService.sendAttendanceReport({
      recipients: req.body.recipients || settings.recipients,
      reportDate: req.body.report_date,
    });
    req.session.reportMessage = `PDF report sent to ${result.recipientCount} email address(es). Logs included: ${result.logCount}.`;
  } catch (error) {
    req.session.reportError = error.message;
  }

  res.redirect("/admin/logs");
}

async function adminsPage(req, res, next) {
  try {
    res.render("admin/admins", {
      title: "Manage Admin Account",
      admin: req.session.admin,
      admins: await Admin.getAll(),
    });
  } catch (error) {
    next(error);
  }
}

async function saveAdmin(req, res, next) {
  try {
    const data = {
      username: req.body.username,
      full_name: req.body.full_name,
      google_email: req.body.google_email,
      role: req.body.role,
      password_hash: req.body.password,
    };

    if (req.body.id) await Admin.update(req.body.id, data);
    else await Admin.create(data);
    res.redirect("/admin/admins");
  } catch (error) {
    next(error);
  }
}

async function deleteAdmin(req, res, next) {
  try {
    await Admin.remove(req.params.id);
    res.redirect("/admin/admins");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAdmin,
  showLogin,
  login,
  showOtp,
  verifyOtp,
  redirectToGoogle,
  googleCallback,
  logout,
  dashboard,
  studentsPage,
  studentRegistrationPage,
  saveStudent,
  deleteStudent,
  enrollStudentFingerprint,
  enrollFingerprintForForm,
  announcementsPage,
  saveAnnouncement,
  deleteAnnouncement,
  schedulesPage,
  saveSchedule,
  deleteSchedule,
  logsPage,
  saveReportSettings,
  sendAttendanceReport,
  adminsPage,
  saveAdmin,
  deleteAdmin,
};
