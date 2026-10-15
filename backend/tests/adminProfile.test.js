const assert = require("node:assert/strict");
const test = require("node:test");
const User = require("../models/User");
const {
  getAdminProfile,
  updateAdminProfile,
} = require("../controllers/userController");

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

test("admin profile reads only the authenticated admin account", async () => {
  const originalFindOne = User.findOne;
  let filter;
  User.findOne = (query) => {
    filter = query;
    return {
      select: () => ({
        lean: async () => ({ userId: 7, roleId: 1, name: "Admin Example" }),
      }),
    };
  };
  try {
    const res = responseRecorder();
    await getAdminProfile({ user: { userId: 7, roleId: 1 } }, res);
    assert.deepEqual(filter, { userId: 7, roleId: 1 });
    assert.equal(res.body.data.name, "Admin Example");
  } finally {
    User.findOne = originalFindOne;
  }
});

test("admin profile update changes only name and phone on the authenticated admin", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  let operation;
  User.findOneAndUpdate = (filter, changes, options) => {
    operation = { filter, changes, options };
    return {
      select: () => ({
        lean: async () => ({ userId: 7, roleId: 1, name: "Updated Admin" }),
      }),
    };
  };
  try {
    const res = responseRecorder();
    await updateAdminProfile({
      user: { userId: 7, roleId: 1 },
      body: {
        name: "Updated Admin",
        mobile: "+1 555 010 1234",
        roleId: 3,
        email: "changed@example.com",
      },
    }, res);
    assert.deepEqual(operation.filter, { userId: 7, roleId: 1 });
    assert.deepEqual(operation.changes, {
      $set: { name: "Updated Admin", mobile: "+1 555 010 1234" },
    });
    assert.equal(operation.options.runValidators, true);
    assert.equal(res.body.data.name, "Updated Admin");
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("admin profile update rejects invalid values without writing", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  let writeAttempted = false;
  User.findOneAndUpdate = () => {
    writeAttempted = true;
    throw new Error("Unexpected profile write");
  };
  try {
    const res = responseRecorder();
    await updateAdminProfile({
      user: { userId: 7, roleId: 1 },
      body: { name: " ", mobile: "1" },
    }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(writeAttempted, false);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
