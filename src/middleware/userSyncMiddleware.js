const User = require("../models/User");

const syncUser = async (req, res, next) => {
  try {
    const auth = req.auth || {};
    const clerkId = auth.userId;

    if (!clerkId) {
      return next();
    }

    const email = auth.email;
    const name = auth.name || auth.fullName || auth.username;

    if (!email || !name) {
      console.error("USER SYNC ERROR: missing email or name from Clerk auth object");
      return res.status(400).json({ error: "Incomplete user data from Clerk" });
    }

    await User.findOneAndUpdate(
      { clerkId },
      { $set: { email, name } },
      { upsert: true, new: true }
    );

    next();
  } catch (err) {
    console.error("USER SYNC ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { syncUser };
