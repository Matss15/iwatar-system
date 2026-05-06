const Student = require("../models/studentModel");

async function listStudents(req, res, next) {
  try {
    res.json(await Student.getAll());
  } catch (error) {
    next(error);
  }
}

async function getStudent(req, res, next) {
  try {
    const student = await Student.getById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error) {
    next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    if (!req.body.lrn || !req.body.first_name || !req.body.last_name) {
      return res.status(400).json({ error: "LRN, first name, and last name are required" });
    }

    res.status(201).json(await Student.create(req.body));
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await Student.update(req.params.id, req.body);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    await Student.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
};
