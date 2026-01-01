const usersModel = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//
//
exports.registerUser = async (req, res) => {
  //
  try {
    //
    const { username, email, password, display_name } = req.body;
    //
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    const userExists = await usersModel.checkExistingUser(username, email);

    // console.log({ userExists });
    // return;
    if (userExists.rows.length > 0)
      return res.status(400).json({ error: "User already exists." });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    //
    const data = await usersModel.insertUserAccount(
      username,
      email,
      password_hash,
      display_name
    );
    res.status(201).json({
      data: { id: data.id, username: data.username, email: data.email },
    });

    //  user: {
    //     id: user.rows[0].id,
    //     username: user.rows[0].username,
    //     email: user.rows[0].email,
    //   },
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating record" });
  }
};

exports.loginUser = async (req, res) => {
  //
  try {
    //
    const { email, password } = req.body;
    //
    if (!email || !password)
      return res.status(400).json({ error: "All fields are required." });

    const user = await usersModel.checkExistingUserByEmail(email);

    // console.log({ user });
    // return;
    if (user.rows.length === 0)
      return res.status(400).json({ error: "Invalid credentials (email)" });

    const userPassword = user.rows[0].password_hash;

    const validPassword = await bcrypt.compare(password, userPassword);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials. (password)" });

    // Create JWT Token
    //
    const token = jwt.sign(
      { userId: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 3️⃣ Send Token (best practice: use httpOnly cookie)
    // res.cookie("token", token, { httpOnly: true, secure: false });
    res.cookie("token", token, {
      httpOnly: true, // prevents JS access
      secure: process.env.NODE_ENV === "production", // only use HTTPS in production
      sameSite: "strict", // prevents CSRF
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    //
    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
      },
    });
    //
    //
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out" });
};

exports.userProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await usersModel.checkExistingUserById(userId);
    //
    //
    const recentChatUser = await usersModel.getUserRecentlyChatted(userId);

    res.json({
      user: result.rows[0],
      // recentChatUser: recentChatUser.rows[0] || null,
    });
    //
    //
    // res.json({
    //   user: {
    //     id: 999,
    //     username: "test",
    //     email: "test1",
    //     display_name: "test",
    //   },
    // });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
//
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await usersModel.getAllUsers();
    res.json({ data: result.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllUsersBySearch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { searchQuery } = req.query;
    console.log({ searchQuery });
    const result = await usersModel.getUsersSearch(searchQuery);
    res.status(200).json({ data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
//
//
