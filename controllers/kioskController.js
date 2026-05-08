const Announcement = require("../models/announcementModel");
const Schedule = require("../models/scheduleModel");
const ScanLog = require("../models/scanLogModel");

async function showKiosk(req, res, next) {
  try {
    res.render("index", {
      title: "IWATAR Student Information and Monitoring System",
      student: null,
      announcements: await Announcement.getToday(),
      schedules: await Schedule.getToday(),
      logs: await ScanLog.getRecent(6),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { showKiosk };
