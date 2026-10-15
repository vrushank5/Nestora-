const assert = require("node:assert/strict");
const test = require("node:test");
const ChatMessage = require("../models/ChatMessage");
const {
  canAccessConversation,
} = require("../controllers/chatController");
const {
  generateBotReply,
  parseBudget,
  parseGender,
  parseRoomType,
} = require("../services/chatBot");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Room = require("../models/Room");
const Conversation = require("../models/Conversation");

test("conversation authorization is restricted to the resident, owner, or assigned admin", () => {
  const conversation = {
    type: "owner",
    residentId: 101,
    ownerId: 202,
    assignedAdminId: null,
  };

  assert.equal(canAccessConversation(conversation, { userId: 101, roleId: 3 }), true);
  assert.equal(canAccessConversation(conversation, { userId: 999, roleId: 3 }), false);
  assert.equal(canAccessConversation(conversation, { userId: 202, roleId: 2 }), true);
  assert.equal(canAccessConversation(conversation, { userId: 203, roleId: 2 }), false);
  assert.equal(canAccessConversation(conversation, { userId: 301, roleId: 1 }), false);

  conversation.assignedAdminId = 301;
  assert.equal(canAccessConversation(conversation, { userId: 301, roleId: 1 }), true);
  assert.equal(canAccessConversation(conversation, { userId: 302, roleId: 1 }), false);
});

test("preference parsers accept supported budgets, room types, and gender choices", () => {
  assert.equal(parseBudget("under ₹15,000"), 15000);
  assert.equal(parseBudget("budget 18k"), 18000);
  assert.equal(parseGender("female"), "Female");
  assert.equal(parseGender("no preference"), "Unisex");
  assert.equal(parseRoomType("I prefer a twin room"), "Twin");
});

test("chat messages enforce required content and maximum length", async () => {
  const invalid = new ChatMessage({
    conversationId: "507f1f77bcf86cd799439011",
    senderRole: "resident",
    senderId: 101,
    content: "x".repeat(1001),
  });
  await assert.rejects(
    invalid.validate(),
    (error) => error.errors.content.kind === "maxlength",
  );

  const valid = new ChatMessage({
    conversationId: "507f1f77bcf86cd799439011",
    senderRole: "resident",
    senderId: 101,
    content: "Hello",
  });
  await valid.validate();
});

test("assistant reports only booking data for the authenticated resident", async () => {
  const originalFindOne = Booking.findOne;
  let receivedQuery;
  Booking.findOne = (query) => {
    receivedQuery = query;
    return {
      sort: () => ({ lean: async () => ({ bookingId: "BK-1", status: "Active" }) }),
    };
  };
  try {
    const reply = await generateBotReply({
      conversation: { searchActive: false },
      content: "What is my booking status?",
      residentId: 101,
    });
    assert.match(reply.content, /BK-1.*Active/);
    assert.deepEqual(receivedQuery, {
      $or: [{ residentId: 101 }, { userId: 101 }],
    });
  } finally {
    Booking.findOne = originalFindOne;
  }
});

test("assistant does not invent a booking when no account record exists", async () => {
  const originalFindOne = Booking.findOne;
  Booking.findOne = () => ({
    sort: () => ({ lean: async () => null }),
  });
  try {
    const reply = await generateBotReply({
      conversation: { searchActive: false },
      content: "What is my booking status?",
      residentId: 101,
    });
    assert.match(reply.content, /can't find a booking record/i);
    assert.doesNotMatch(reply.content, /confirmed|active/i);
  } finally {
    Booking.findOne = originalFindOne;
  }
});

test("assistant property recommendations use active records and available room prices", async () => {
  const originals = {
    propertyFind: Property.find,
    roomFind: Room.find,
    conversationUpdateOne: Conversation.updateOne,
  };
  Property.find = () => ({
    select: () => ({
      limit: () => ({
        lean: async () => [{
          propertyId: 7,
          name: "Verified listing",
          city: "Ahmedabad",
          area: "Satellite",
          amenities: ["Wi-Fi", "Laundry"],
        }],
      }),
    }),
  });
  Room.find = () => ({
    select: () => ({
      lean: async () => [{
        propertyId: 7,
        roomType: "Twin",
        price: 12000,
        availableCount: 1,
      }],
    }),
  });
  Conversation.updateOne = async () => ({ matchedCount: 1 });
  try {
    const reply = await generateBotReply({
      conversation: {
        _id: "507f1f77bcf86cd799439011",
        status: "bot",
        searchActive: true,
        pendingSearchField: null,
        skippedSearchFields: [],
        searchPreferences: {
          city: "Ahmedabad",
          area: "Satellite",
          budget: 15000,
          roomType: "Twin",
          gender: "Unisex",
        },
      },
      content: "Show matching options",
      residentId: 101,
    });
    assert.equal(reply.properties.length, 1);
    assert.deepEqual(reply.properties[0], {
      propertyId: 7,
      name: "Verified listing",
      city: "Ahmedabad",
      area: "Satellite",
      rent: 12000,
      roomTypes: ["Twin"],
      amenities: ["Wi-Fi", "Laundry"],
    });
  } finally {
    Property.find = originals.propertyFind;
    Room.find = originals.roomFind;
    Conversation.updateOne = originals.conversationUpdateOne;
  }
});
