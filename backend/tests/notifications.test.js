const assert = require("node:assert/strict");
const test = require("node:test");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  broadcastNotification,
  getNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");

const responseRecorder = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("notification records require a valid target role and content", async () => {
  const notification = new Notification({
    recipientId: 42,
    roleId: 2,
    type: "message",
    title: "New resident message",
    message: "A resident sent a message.",
  });
  await notification.validate();
  assert.equal(notification.readAt, null);

  const invalid = new Notification({
    recipientId: 42,
    roleId: 4,
    type: "unknown",
    title: "",
    message: "",
  });
  await assert.rejects(invalid.validate());
});

test("notification listing is scoped to the authenticated account and role", async () => {
  const originalFind = Notification.find;
  const originalCountDocuments = Notification.countDocuments;
  let findFilter;
  let countFilter;
  Notification.find = (filter) => {
    findFilter = filter;
    return {
      sort: () => ({
        limit: () => ({
          lean: async () => [{
            _id: "507f1f77bcf86cd799439011",
            type: "booking",
            title: "Booking request",
            message: "A request was received.",
            readAt: null,
            createdAt: new Date("2026-10-15T00:00:00Z"),
          }],
        }),
      }),
    };
  };
  Notification.countDocuments = async (filter) => {
    countFilter = filter;
    return 1;
  };
  try {
    const res = responseRecorder();
    await getNotifications({ user: { userId: 42, roleId: 2 } }, res);
    assert.deepEqual(findFilter, { recipientId: 42, roleId: 2 });
    assert.deepEqual(countFilter, { recipientId: 42, roleId: 2, readAt: null });
    assert.equal(res.body.unreadCount, 1);
    assert.equal(res.body.data[0].read, false);
  } finally {
    Notification.find = originalFind;
    Notification.countDocuments = originalCountDocuments;
  }
});

test("mark-read updates only a notification belonging to the authenticated recipient", async () => {
  const originalFindOneAndUpdate = Notification.findOneAndUpdate;
  let filter;
  Notification.findOneAndUpdate = (query) => {
    filter = query;
    return {
      lean: async () => ({
        _id: "507f1f77bcf86cd799439011",
        type: "payment",
        title: "Payment received",
        message: "Payment saved.",
        readAt: new Date(),
        createdAt: new Date(),
      }),
    };
  };
  try {
    const res = responseRecorder();
    await markNotificationRead(
      {
        params: { id: "507f1f77bcf86cd799439011" },
        user: { userId: 42, roleId: 3 },
      },
      res,
    );
    assert.deepEqual(filter, {
      _id: "507f1f77bcf86cd799439011",
      recipientId: 42,
      roleId: 3,
      readAt: null,
    });
    assert.equal(res.body.data.read, true);
  } finally {
    Notification.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("broadcast is forbidden for non-admin accounts", async () => {
  const res = responseRecorder();
  await broadcastNotification({
    user: { userId: 42, roleId: 2 },
    body: { title: "Notice", message: "Content", audience: "all" },
  }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
});

test("admin broadcasts persist separate notifications for the selected roles", async () => {
  const originals = {
    userFindOne: User.findOne,
    userFind: User.find,
    insertMany: Notification.insertMany,
  };
  const saved = [];
  User.findOne = () => ({
    select: () => ({ lean: async () => ({ userId: 9 }) }),
  });
  User.find = (filter) => ({
    select: () => ({
      lean: async () => [{ userId: filter.roleId * 100 + 1 }],
    }),
  });
  Notification.insertMany = async (documents) => {
    saved.push(...documents);
    return documents.map((document, index) => ({
      ...document,
      _id: `notification-${index}`,
      createdAt: new Date(),
      readAt: null,
    }));
  };
  try {
    const res = responseRecorder();
    await broadcastNotification({
      user: { userId: 9, roleId: 1 },
      body: {
        title: "Service update",
        message: "The service is available.",
        type: "system",
        audience: "all",
      },
    }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.recipients, 3);
    assert.deepEqual(saved.map((notification) => notification.roleId), [1, 2, 3]);
    assert.ok(saved.every((notification) => notification.title === "Service update"));
  } finally {
    User.findOne = originals.userFindOne;
    User.find = originals.userFind;
    Notification.insertMany = originals.insertMany;
  }
});
