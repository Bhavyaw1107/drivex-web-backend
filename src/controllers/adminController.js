const User = require("../models/User");
const File = require("../models/file.models");
const Folder = require("../models/folder.models");

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments({ deletedAt: null });
    const totalFolders = await Folder.countDocuments({ deletedAt: null });

    const storageResult = await File.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, total: { $sum: "$size" } } }
    ]);
    const totalStorage = storageResult[0]?.total || 0;

    const filesPerUser = await File.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: "$owner",
          fileCount: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "clerkId",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          clerkId: "$_id",
          email: "$user.email",
          name: "$user.name",
          fileCount: 1,
          totalSize: 1
        }
      },
      { $sort: { totalSize: -1 } }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = await User.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const fileTypeDistribution = await File.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: { $arrayElemAt: [{ $split: ["$mimeType", "/"] }, 0] },
          count: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      },
      { $project: { type: "$_id", count: 1, totalSize: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    const thirtyDaysAgoStart = new Date();
    thirtyDaysAgoStart.setDate(thirtyDaysAgoStart.getDate() - 30);
    thirtyDaysAgoStart.setHours(0, 0, 0, 0);
    const storageTrend = await File.aggregate([
      { $match: { deletedAt: null, createdAt: { $gte: thirtyDaysAgoStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSize: { $sum: "$size" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalFiles,
      totalFolders,
      totalStorage,
      filesPerUser,
      recentSignups: recentSignups.map(u => ({
        email: u.email,
        name: u.name,
        createdAt: u.createdAt
      })),
      fileTypeDistribution,
      storageTrend: storageTrend.map(s => ({ date: s._id, size: s.totalSize }))
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.promoteUser = async (req, res) => {
  try {
    const { clerkId } = req.params;

    if (!clerkId) {
      return res.status(400).json({ error: "clerkId is required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { isAdmin: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found in database. User must sign in first." });
    }

    res.json({ message: "User promoted to admin", user: updatedUser });
  } catch (err) {
    console.error("PROMOTE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
