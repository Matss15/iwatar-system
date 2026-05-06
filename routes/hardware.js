const express = require("express");
const hardwareController = require("../controllers/hardwareController");

const router = express.Router();

router.get("/status", hardwareController.getHardwareStatus);
router.post("/fingerprint/enroll", hardwareController.enrollFingerprint);
router.post("/fingerprint/scan", hardwareController.scanFingerprint);
router.post("/thermal/scan", hardwareController.scanTemperature);

module.exports = router;
