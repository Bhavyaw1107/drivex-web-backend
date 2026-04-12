const { clerkMiddleware, getAuth } = require('@clerk/express');

const clerk = clerkMiddleware();

const requireApiAuth = (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

const attachUser = (req, res, next) => {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = {
    clerkId: auth.userId,
  };

  next();
};

module.exports = {
  clerk,
  requireAuth: requireApiAuth,
  attachUser,
};
