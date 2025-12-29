const express = require("express");
const router = express.Router();
const { verifiedUser } = require("../middleware/authMiddleware");
const conversationsController = require("../controllers/conversationsController");

router.get(
  "/getMessagesByConversationId/:conversationId",
  verifiedUser,
  conversationsController.getConversationMessageById
);

router.get(
  "/checkRecentSearchHasConvo/:otherUserId",
  verifiedUser,
  conversationsController.checkRecentSearchHasConvo
);

router.delete(
  "/deleteConversation/:messageId",
  verifiedUser,
  conversationsController.deleteMessage
);

router.put(
  "/updateConversation",
  verifiedUser,
  conversationsController.updateConversation
);

router.post(
  "/addConversation",
  verifiedUser,
  conversationsController.addConversation
);
//

//
module.exports = router;
