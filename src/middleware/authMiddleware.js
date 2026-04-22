const { getAuth, clerkMiddleware, clerkClient } = require('@clerk/express');
const User = require('../models/User');

const requireApiAuth = (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

const attachUser = async (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const clerkId = auth.userId;

  try {
    // Fetch user details from Clerk API
    const user = await clerkClient.users.getUser(clerkId);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    const email = user.emailAddresses[0]?.emailAddress || null;

    const result = await User.findOneAndUpdate(
      { clerkId },
      { $set: { email, name } },
      { upsert: true, new: true }
    );
    console.log("attachUser result:", result?._id, result?.email, result?.name);
    req.user = { clerkId };
    next();
  } catch (err) {
    console.error("USER SYNC ERROR:", err);
    req.user = { clerkId };
    next();
  }
};

module.exports = {
  clerkMiddleware,
  requireAuth: requireApiAuth,
  attachUser,
};
