const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notificationController");
const { sendEmail } = require("../services/notificationService");

router.get("/test-email", async (req, res) => {
  await sendEmail(
    "gangadharhaladodi@gmail.com",
    "TEST_NOTIFICATION",
    "SentinelGRC email service working successfully"
  );

  res.json({
    success: true,
    message: "Email sent",
  });
});

router.get("/", ctrl.listNotifications);
router.put("/mark-all-read", ctrl.markAllRead);
router.put("/:id/read", ctrl.markRead);
router.delete("/:id", ctrl.deleteNotification);

module.exports = router;
