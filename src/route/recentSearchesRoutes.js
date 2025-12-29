const express = require("express");
const router = express.Router();

const recentSearchesController = require("../controllers/recentSearchesController");
const { verifiedUser } = require("../middleware/authMiddleware");

router.get(
  "/getUserRecentSearches",
  verifiedUser,
  recentSearchesController.getUserRecentSearches
);
router.post(
  "/addUpdateRecentSearches",
  verifiedUser,
  recentSearchesController.addUpdateRecentSearches
);
router.delete(
  "/deletedRecentSearches",
  verifiedUser,
  recentSearchesController.deletedRecentSearches
);
//

module.exports = router;
