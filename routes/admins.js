const express = require("express");
const Admin = require("../models/adminModel");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json(await Admin.getAll());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    await Admin.create({
      username: req.body.username,
      password_hash: req.body.password || req.body.password_hash,
      google_email: req.body.google_email,
      full_name: req.body.full_name,
      role: req.body.role,
    });
    res.status(201).json({ message: "Admin created" });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    await Admin.update(req.params.id, {
      username: req.body.username,
      password_hash: req.body.password || req.body.password_hash,
      google_email: req.body.google_email,
      full_name: req.body.full_name,
      role: req.body.role,
    });
    res.json({ message: "Admin updated" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Admin.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
