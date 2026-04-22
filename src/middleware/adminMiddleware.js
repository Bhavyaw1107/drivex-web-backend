const { getAuth } = require('@clerk/express');
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const dbUser = await User.findOne({ clerkId: auth.userId });

    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
  } catch (err) {
    console.error("ADMIN CHECK ERROR:", err);
    return res.status(500).json({ error: "Failed to verify admin status" });
  }

  next();
};

module.exports = { requireAdmin };
