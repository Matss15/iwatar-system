const Student = require("../models/studentModel");
const Announcement = require("../models/announcementModel");
const Schedule = require("../models/scheduleModel");
const ScanLog = require("../models/scanLogModel");

async function showKiosk(req, res, next) {
  try {
    const students = await Student.getAll();

    res.render("index", {
      title: "IWATAR Student Information and Monitoring System",
      student: students[0],
      announcements: await Announcement.getToday(),
      schedules: await Schedule.getToday(),
      logs: await ScanLog.getRecent(6),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { showKiosk };
