const express = require("express");
const adminController = require("../controllers/adminController");
const { uploadStudentPhoto } = require("../config/upload");

const router = express.Router();

router.get("/login", adminController.showLogin);
router.post("/login", adminController.login);
router.get("/login/otp", adminController.showOtp);
router.post("/login/otp", adminController.verifyOtp);
router.post("/logout", adminController.logout);

router.use(adminController.requireAdmin);

router.get("/", (req, res) => res.redirect("/admin/dashboard"));
router.get("/dashboard", adminController.dashboard);

router.post("/fingerprint/enroll", adminController.enrollFingerprintForForm);

router.get("/students", adminController.studentsPage);
router.get("/students/register", adminController.studentRegistrationPage);
router.post("/students/save", uploadStudentPhoto.single("student_photo"), adminController.saveStudent);
router.post("/students/:id/enroll-fingerprint", adminController.enrollStudentFingerprint);
router.post("/students/:id/delete", adminController.deleteStudent);

router.get("/announcements", adminController.announcementsPage);
router.post("/announcements/save", adminController.saveAnnouncement);
router.post("/announcements/:id/delete", adminController.deleteAnnouncement);

router.get("/schedules", adminController.schedulesPage);
router.post("/schedules/save", adminController.saveSchedule);
router.post("/schedules/:id/delete", adminController.deleteSchedule);

router.get("/logs", adminController.logsPage);
router.post("/logs/report-settings", adminController.saveReportSettings);
router.post("/logs/send-report", adminController.sendAttendanceReport);

router.get("/admins", adminController.adminsPage);
router.post("/admins/save", adminController.saveAdmin);
router.post("/admins/:id/delete", adminController.deleteAdmin);

module.exports = router;
