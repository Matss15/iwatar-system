const ScanLog = require("../models/scanLogModel");

async function listLogs(req, res, next) {
  try {
    res.json(await ScanLog.getAll());
  } catch (error) {
    next(error);
  }
}

async function createLog(req, res, next) {
  try {
    await ScanLog.create(req.body);
    res.status(201).json({ message: "Scan log created" });
  } catch (error) {
    next(error);
  }
}

async function deleteLog(req, res, next) {
  try {
    await ScanLog.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listLogs, createLog, deleteLog };
