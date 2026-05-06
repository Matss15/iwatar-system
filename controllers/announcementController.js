const Announcement = require("../models/announcementModel");

async function listAnnouncements(req, res, next) {
  try {
    res.json(await Announcement.getAll());
  } catch (error) {
    next(error);
  }
}

async function createAnnouncement(req, res, next) {
  try {
    await Announcement.create(req.body);
    res.status(201).json({ message: "Announcement created" });
  } catch (error) {
    next(error);
  }
}

async function updateAnnouncement(req, res, next) {
  try {
    await Announcement.update(req.params.id, req.body);
    res.json({ message: "Announcement updated" });
  } catch (error) {
    next(error);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    await Announcement.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
