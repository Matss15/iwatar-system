const express = require("express");
const studentController = require("../controllers/studentController");

const router = express.Router();

router.get("/", studentController.listStudents);
router.get("/:id", studentController.getStudent);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
