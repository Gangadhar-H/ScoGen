const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/advisorController");

router.post("/suggest", ctrl.suggest);

module.exports = router;
