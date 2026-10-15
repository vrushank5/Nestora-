const assert = require("node:assert/strict");
const test = require("node:test");
const User = require("../models/User");
const {
  getResidentProfile,
  updateResidentProfile,
} = require("../controllers/residentController");

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

test("resident profile reads only the authenticated resident account", async () => {
  const originalFindOne = User.findOne;
  let filter;
  User.findOne = (query) => {
    filter = query;
    return {
      select: () => ({
        lean: async () => ({ userId: 42, roleId: 3, name: "Resident Example" }),
      }),
    };
  };
  try {
    const res = responseRecorder();
    await getResidentProfile({ user: { userId: 42, roleId: 3 } }, res);
    assert.deepEqual(filter, { userId: 42, roleId: 3 });
    assert.equal(res.body.data.name, "Resident Example");
  } finally {
    User.findOne = originalFindOne;
  }
});

test("resident profile update validates fields before writing", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  let update;
  User.findOneAndUpdate = (filter, changes) => {
    update = { filter, changes };
    return {
      select: () => ({
        lean: async () => ({ userId: 42, roleId: 3, name: "New Name" }),
      }),
    };
  };
  try {
    const res = responseRecorder();
    await updateResidentProfile({
      user: { userId: 42, roleId: 3 },
      body: {
        firstName: "New",
        lastName: "Name",
        mobile: "+1 555 010 1234",
        gender: "Other",
        address: "12 Example Street",
        occupation: "Student",
      },
    }, res);
    assert.deepEqual(update.filter, { userId: 42, roleId: 3 });
    assert.deepEqual(update.changes.$set, {
      name: "New Name",
      mobile: "+1 555 010 1234",
      gender: "Other",
      address: "12 Example Street",
      occupation: "Student",
    });
    assert.equal(res.body.data.name, "New Name");
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("resident profile update rejects invalid phone and empty personal details", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  let writeAttempted = false;
  User.findOneAndUpdate = () => {
    writeAttempted = true;
    throw new Error("Unexpected profile write");
  };
  try {
    const res = responseRecorder();
    await updateResidentProfile({
      user: { userId: 42, roleId: 3 },
      body: {
        firstName: "New",
        lastName: "Name",
        mobile: "invalid",
        gender: "",
        address: "",
        occupation: "Student",
      },
    }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(writeAttempted, false);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
