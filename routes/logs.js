const express = require("express");
const logController = require("../controllers/logController");

const router = express.Router();

router.get("/", logController.listLogs);
router.post("/", logController.createLog);
router.delete("/:id", logController.deleteLog);

module.exports = router;
