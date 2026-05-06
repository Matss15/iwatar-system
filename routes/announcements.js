const express = require("express");
const announcementController = require("../controllers/announcementController");

const router = express.Router();

router.get("/", announcementController.listAnnouncements);
router.post("/", announcementController.createAnnouncement);
router.put("/:id", announcementController.updateAnnouncement);
router.delete("/:id", announcementController.deleteAnnouncement);

module.exports = router;
