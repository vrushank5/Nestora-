const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const Payment = require("../models/Payment");
const Property = require("../models/Property");
const Room = require("../models/Room");
const User = require("../models/User");
const Visit = require("../models/Visit");
const Conversation = require("../models/Conversation");

const SEARCH_FIELDS = ["city", "area", "budget", "roomType", "gender"];
const FIELD_QUESTIONS = {
  city: "Which city would you prefer?",
  area: "Is there a preferred locality or area?",
  budget: "What is your maximum monthly budget in rupees?",
  roomType: "What room type would you like: single, twin, double, triple, or shared?",
  gender: "Do you have a gender preference: male, female, or unisex?",
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseBudget = (text) => {
  const match = text.match(
    /(?:under|below|budget(?:\s+is)?|up\s+to|less than|₹|rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(k)?/i,
  );
  if (!match) return null;
  const parsed = Number(match[1].replace(/,/g, "")) * (match[2] ? 1000 : 1);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 10000000
    ? parsed
    : null;
};

const parseRoomType = (text) => {
  const match = text.match(/\b(single|twin|double|triple|shared|private)\b/i);
  if (!match) return "";
  const normalized = match[1].toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const parseGender = (text) => {
  if (/\b(unisex|any gender|no preference)\b/i.test(text)) return "Unisex";
  if (/\b(female|women|woman|girls)\b/i.test(text)) return "Female";
  if (/\b(male|men|man|boys)\b/i.test(text)) return "Male";
  return "";
};

const parseLocation = (text) => {
  const match = text.match(/\b(?:in|at|near)\s+([a-z][a-z\s-]{1,50}?)(?=\s+(?:under|below|for|with|budget)|[,.;]|$)/i);
  return match ? match[1].trim() : "";
};

const parsePreference = (field, text) => {
  if (/^(skip|any|no preference|doesn't matter)$/i.test(text.trim())) {
    return null;
  }
  if (field === "budget") {
    const budget = parseBudget(text) || Number(text.replace(/[₹,\s]/g, ""));
    return Number.isFinite(budget) && budget > 0 && budget <= 10000000 ? budget : "";
  }
  if (field === "roomType") return parseRoomType(text);
  if (field === "gender") return parseGender(text);
  return text.trim().slice(0, 80);
};

const searchProperties = async (preferences) => {
  const filter = { isActive: true };
  if (preferences.city) {
    filter.city = new RegExp(`^${escapeRegex(preferences.city)}$`, "i");
  }
  if (preferences.area) {
    filter.area = new RegExp(`^${escapeRegex(preferences.area)}$`, "i");
  }
  if (preferences.gender && ["Male", "Female", "Unisex"].includes(preferences.gender)) {
    filter.gender = { $in: [preferences.gender, "Unisex"] };
  }

  const properties = await Property.find(filter)
    .select("propertyId name city area location roomTypes amenities gender isActive verificationStatus")
    .limit(100)
    .lean();
  if (!properties.length) return [];

  const rooms = await Room.find({
    propertyId: { $in: properties.map((property) => property.propertyId) },
    isActive: true,
    status: "Available",
  })
    .select("propertyId roomType price availableCount capacity occupiedCount")
    .lean();

  const roomsByProperty = new Map();
  for (const room of rooms) {
    const available = room.availableCount != null && Number.isFinite(Number(room.availableCount))
      ? Number(room.availableCount)
      : Math.max(0, Number(room.capacity || 0) - Number(room.occupiedCount || 0));
    if (available <= 0) continue;
    if (preferences.budget && Number(room.price) > preferences.budget) continue;
    if (
      preferences.roomType &&
      !room.roomType.toLowerCase().includes(preferences.roomType.toLowerCase())
    ) continue;
    const list = roomsByProperty.get(room.propertyId) || [];
    list.push(room);
    roomsByProperty.set(room.propertyId, list);
  }

  return properties
    .flatMap((property) => {
      const availableRooms = roomsByProperty.get(property.propertyId) || [];
      if (!availableRooms.length) return [];
      const roomTypes = [...new Set(availableRooms.map((room) => room.roomType))];
      return [{
        propertyId: property.propertyId,
        name: property.name,
        city: property.city || "",
        area: property.area || "",
        rent: Math.min(...availableRooms.map((room) => Number(room.price))),
        roomTypes,
        amenities: Array.isArray(property.amenities) ? property.amenities.slice(0, 8) : [],
      }];
    })
    .slice(0, 5);
};

const saveSearchState = async (conversation, preferences, skipped, pendingField, searchActive) => {
  const result = await Conversation.updateOne(
    { _id: conversation._id, status: "bot" },
    {
      $set: {
        searchPreferences: preferences,
        skippedSearchFields: [...skipped],
        pendingSearchField: pendingField || null,
        searchActive,
      },
    },
  );
  return result.matchedCount === 1;
};

const handleSearch = async (conversation, content) => {
  const preferences = { ...(conversation.searchPreferences?.toObject?.() || conversation.searchPreferences || {}) };
  const skipped = new Set(conversation.skippedSearchFields || []);
  const pendingField = conversation.pendingSearchField;

  if (pendingField) {
    const parsed = parsePreference(pendingField, content);
    if (parsed === null) {
      skipped.add(pendingField);
    } else {
      preferences[pendingField] = parsed;
      skipped.delete(pendingField);
    }
  }

  if (!preferences.budget) preferences.budget = parseBudget(content);
  if (!preferences.roomType) preferences.roomType = parseRoomType(content);
  if (!preferences.gender) preferences.gender = parseGender(content);
  if (!preferences.city) preferences.city = parseLocation(content);

  const nextField = SEARCH_FIELDS.find(
    (field) => !preferences[field] && !skipped.has(field),
  );
  if (nextField) {
    const saved = await saveSearchState(conversation, preferences, skipped, nextField, true);
    if (!saved) return { cancelled: true };
    return {
      content: FIELD_QUESTIONS[nextField],
      properties: [],
      senderRole: "assistant",
    };
  }

  const saved = await saveSearchState(conversation, preferences, skipped, null, false);
  if (!saved) return { cancelled: true };
  const properties = await searchProperties(preferences);
  if (!properties.length) {
    return {
      content: "I couldn't find an active listing with available rooms matching those preferences. I won't guess about availability. You can adjust the area or budget, or contact support for help.",
      properties: [],
      senderRole: "assistant",
    };
  }
  return {
    content: `I found ${properties.length} active listing${properties.length === 1 ? "" : "s"} with rooms currently marked available. Rent and room types below come from the listing's room records.`,
    properties,
    senderRole: "assistant",
  };
};

const latestRecordReply = async (Model, query, kind) => {
  const record = await Model.findOne(query).sort({ createdAt: -1 }).lean();
  if (!record) return `I can't find a ${kind} record on your account yet. If you believe that's incorrect, I can connect you with support.`;
  const id = record.bookingId || record.transactionId || record.visitId || record.complaintId || String(record._id);
  const status = record.status || "Status not recorded";
  return `Your latest ${kind} record (${id}) is marked “${status}”.`;
};

const generateBotReply = async ({ conversation, content, residentId }) => {
  const text = content.toLowerCase();
  const residentQuery = {
    $or: [
      { residentId: Number(residentId) },
      { userId: Number(residentId) },
    ],
  };

  const searchIntent = /\b(find|search|looking for|available|availability|recommend|show me|pg|hostel|room to rent)\b/i.test(content);
  if (conversation.searchActive || searchIntent) {
    if (!conversation.searchActive) {
      conversation.searchPreferences = {
        city: "",
        area: "",
        budget: null,
        roomType: "",
        gender: "",
      };
      conversation.skippedSearchFields = [];
      conversation.pendingSearchField = null;
    }
    conversation.searchActive = true;
    return handleSearch(conversation, content);
  }

  if (/\b(my )?(booking|reservation|move.?in)\b/i.test(text)) {
    return {
      content: await latestRecordReply(Booking, residentQuery, "booking"),
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(my )?(payment|rent|transaction|refund)\b/i.test(text)) {
    return {
      content: await latestRecordReply(Payment, residentQuery, "payment"),
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(my )?(visit|tour|viewing)\b/i.test(text)) {
    return {
      content: await latestRecordReply(Visit, residentQuery, "visit"),
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(my )?(complaint|maintenance|issue|repair)\b/i.test(text)) {
    return {
      content: await latestRecordReply(Complaint, residentQuery, "complaint"),
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(my )?(account|profile|email|phone)\b/i.test(text)) {
    const account = await User.findOne({ userId: Number(residentId), roleId: 3 })
      .select("name email mobile")
      .lean();
    return {
      content: account
        ? `Your account is registered as ${account.name} (${account.email}). For profile changes, visit your Profile page.`
        : "I couldn't retrieve your account details. Please contact support.",
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(booking|book|reserve)\b/i.test(text)) {
    return {
      content: "To request a stay, open an active property, choose an available room, and submit a booking request. You can review its current status in Bookings. I can't confirm availability or a booking until the application records it.",
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(pay|payment|rent|invoice)\b/i.test(text)) {
    return {
      content: "Your recorded transactions and payment statuses are available on the Payments page. A payment is confirmed only after the application records its result.",
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(visit|tour|viewing)\b/i.test(text)) {
    return {
      content: "You can schedule a visit from a property's detail page. Your recorded visit date and status appear in Visits.",
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(complaint|maintenance|repair|issue)\b/i.test(text)) {
    return {
      content: "You can submit and track an issue from the Complaints page. If it is urgent or you need a person, use Contact support below.",
      properties: [],
      senderRole: "assistant",
    };
  }
  if (/\b(hello|hi|hey|good morning|good afternoon)\b/i.test(text)) {
    return {
      content: "Hello! I'm the Nestora Assistant. I can help find PGs, check your recorded bookings and payments, or guide you through visits and complaints. What would you like help with?",
      properties: [],
      senderRole: "assistant",
    };
  }
  return {
    content: "I don't have enough verified information to answer that. I can help with active property listings and your recorded bookings, payments, visits, complaints, and account details. For anything else, choose Contact support and a human agent can follow up.",
    properties: [],
    senderRole: "assistant",
  };
};

module.exports = {
  generateBotReply,
  parseBudget,
  parseGender,
  parseRoomType,
};
