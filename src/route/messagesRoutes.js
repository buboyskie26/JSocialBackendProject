const express = require("express");
const router = express.Router();
const { verifiedUser } = require("../middleware/authMiddleware");
const messagesController = require("../controllers/messagesController");

router.delete(
  "/deleteMessage/:messageId",
  verifiedUser,
  messagesController.deleteMessage
);

router.put(
  "/updateConversation",
  verifiedUser,
  messagesController.updateConversation
);

router.post(
  "/addConversation",
  verifiedUser,
  messagesController.addConversation
);

router.post(
  "/sendMessageToUser",
  verifiedUser,
  messagesController.sendMessageToUser
);

router.get(
  "/getUserMessages",
  verifiedUser,
  messagesController.getUserMessages
);

router.get(
  "/searchUserMessages",
  verifiedUser,
  messagesController.searchUserMessages
);

module.exports = router;
