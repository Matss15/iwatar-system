const Schedule = require("../models/scheduleModel");

async function listSchedules(req, res, next) {
  try {
    res.json(await Schedule.getAll());
  } catch (error) {
    next(error);
  }
}

async function createSchedule(req, res, next) {
  try {
    await Schedule.create(req.body);
    res.status(201).json({ message: "Schedule created" });
  } catch (error) {
    next(error);
  }
}

async function updateSchedule(req, res, next) {
  try {
    await Schedule.update(req.params.id, req.body);
    res.json({ message: "Schedule updated" });
  } catch (error) {
    next(error);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    await Schedule.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listSchedules, createSchedule, updateSchedule, deleteSchedule };
