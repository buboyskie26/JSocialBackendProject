const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const { verifiedUser } = require("../middleware/authMiddleware");

router.post("/registerUser", usersController.registerUser);
router.post("/loginUser", usersController.loginUser);
router.post("/logoutUser", usersController.logoutUser);
router.get("/userProfile", verifiedUser, usersController.userProfile);
router.get("/getAllUsers", verifiedUser, usersController.getAllUsers);
router.get(
  "/getAllUsersBySearch",
  verifiedUser,
  usersController.getAllUsersBySearch
);

module.exports = router;
