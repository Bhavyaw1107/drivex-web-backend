const { getAuth, clerkMiddleware } = require('@clerk/express');
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
  const email = auth.email || auth.externalAccount?.email;
  const name = auth.fullName || auth.username || auth.firstName;

  console.log("attachUser auth:", JSON.stringify({ clerkId, email, name, authKeys: Object.keys(auth) }));

  if (!name) {
    console.error("attachUser ERROR: name is empty. auth object:", JSON.stringify(auth));
  }

  try {
    const result = await User.findOneAndUpdate(
      { clerkId },
      { $set: { email: email || null, name: name || null } },
      { upsert: true, new: true }
    );
    console.log("attachUser result:", result?._id, result?.email, result?.name);
  } catch (err) {
    console.error("USER SYNC ERROR:", err);
  }

  req.user = { clerkId };
  next();
};

module.exports = {
  clerkMiddleware,
  requireAuth: requireApiAuth,
  attachUser,
};
