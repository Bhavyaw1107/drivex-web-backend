const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/adminMiddleware");
const { getStats, promoteUser, getUsers } = require("../controllers/adminController");

router.use(requireAdmin);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.post("/promote/:clerkId", promoteUser);

module.exports = router;
