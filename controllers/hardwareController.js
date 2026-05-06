const fingerprint = require("../hardware/fingerprint");
const thermal = require("../hardware/thermal");

async function getHardwareStatus(req, res, next) {
  try {
    res.json({
      fingerprint: await fingerprint.status(),
      thermal: await thermal.status(),
    });
  } catch (error) {
    next(error);
  }
}

async function enrollFingerprint(req, res, next) {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    const enrollment = await fingerprint.enroll(student_id);
    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
}

async function scanFingerprint(req, res, next) {
  try {
    const scan = await fingerprint.scan();
    res.json(scan);
  } catch (error) {
    next(error);
  }
}

async function scanTemperature(req, res, next) {
  try {
    const scan = await thermal.scan();
    res.json(scan);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHardwareStatus,
  enrollFingerprint,
  scanFingerprint,
  scanTemperature,
};
