const express = require("express");
const attendanceController = require("../controllers/attendanceController");

const router = express.Router();

router.get("/", attendanceController.listAttendance);
router.post("/fingerprint", attendanceController.recordFingerprintAttendance);
router.post("/manual", attendanceController.recordManualAttendance);

module.exports = router;
