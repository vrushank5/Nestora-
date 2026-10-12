const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Complaint = require("../models/Complaint");
const Visit = require("../models/Visit");
const Property = require("../models/Property");
const User = require("../models/User");
const {
  createPaypalOrder,
  capturePaypalOrder,
} = require("../services/paypalService");
const {
  getConfiguredRecipients,
  sendNestoraEmail,
} = require("../services/emailService");

const requireResident = (req, res, next) => {
  if (Number(req.user?.roleId) !== 3)
    return res
      .status(403)
      .json({ success: false, message: "Resident access required" });
  return next();
};

const residentQuery = (req) => ({
  $or: [
    { residentId: Number(req.user.userId) },
    { userId: Number(req.user.userId) },
  ],
});

const toDateString = (value = new Date()) =>
  new Date(value).toLocaleDateString("en-GB");

const getResidentProfile = async (req) =>
  User.findOne({ userId: Number(req.user.userId) })
    .select("name email mobile address occupation")
    .lean();

const getPropertyWithOwner = async (propertyId) => {
  if (!propertyId) return { property: null, owner: null };
  const property = await Property.findOne({
    propertyId: Number(propertyId),
  }).lean();
  if (!property?.ownerId) return { property, owner: null };
  const owner = await User.findOne({ userId: Number(property.ownerId) })
    .select("name email mobile")
    .lean();
  return { property, owner };
};

const notifyBookingFlow = async ({
  type,
  resident,
  owner,
  booking,
  payment,
}) => {
  const adminRecipients = getConfiguredRecipients();
  const details = {
    bookingId: booking?.bookingId || booking?.id,
    transactionId: payment?.transactionId,
    paypalOrderId: payment?.paypalOrderId,
    resident: resident?.name || booking?.resident,
    residentEmail: resident?.email,
    residentPhone: resident?.mobile,
    property: booking?.property || payment?.property,
    room: booking?.room,
    moveInDate: booking?.date,
    stayDuration: booking?.stayDuration,
    securityDeposit: booking?.securityDeposit,
    amount: booking?.amount || payment?.amount,
    paymentMethod: payment?.method,
    paymentStatus: booking?.payment || payment?.status,
    bookingStatus: booking?.status,
    owner: owner?.name,
    ownerEmail: owner?.email,
  };

  const subjectMap = {
    booking: `Nestora booking received - ${details.bookingId}`,
    payment: `Nestora payment update - ${details.bookingId}`,
    visit: `Nestora visit scheduled - ${details.bookingId || details.property}`,
  };

  try {
    await sendNestoraEmail({
      to: resident?.email ? [resident.email] : adminRecipients,
      cc: [...adminRecipients, owner?.email].filter(Boolean),
      subject: subjectMap[type] || "Nestora booking notification",
      title:
        type === "payment"
          ? "Payment Details"
          : type === "visit"
            ? "Visit Details"
            : "Booking Details",
      intro: "All submitted details are listed below for your records.",
      details,
    });
  } catch (error) {
    console.error("Email notification failed:", error.message);
  }
};

const getResidentSummary = async (req, res) => {
  try {
    const query = residentQuery(req);
    const [bookings, payments, reviews, complaints, visits] = await Promise.all(
      [
        Booking.find(query).lean(),
        Payment.find(query).lean(),
        Review.countDocuments(query),
        Complaint.countDocuments(query),
        Visit.countDocuments(query),
      ],
    );
    const activeBookings = bookings.filter(
      (booking) =>
        !["cancelled", "completed"].includes(
          String(booking.status || "").toLowerCase(),
        ),
    ).length;
    const pendingPayments = payments.filter(
      (payment) => String(payment.status || "").toLowerCase() === "pending",
    ).length;
    const paidPayments = payments.filter(
      (payment) => String(payment.status || "").toLowerCase() === "paid",
    ).length;

    return res.json({
      success: true,
      data: {
        bookings: bookings.length,
        activeBookings,
        payments: payments.length,
        pendingPayments,
        paidPayments,
        reviews,
        complaints,
        visits,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load resident summary" });
  }
};

const getResidentData = async (req, res) => {
  try {
    const Model = {
      bookings: Booking,
      payments: Payment,
      reviews: Review,
      complaints: Complaint,
      visits: Visit,
    }[req.params.collection];
    if (!Model) return res.json({ success: true, data: [] });
    const data = await Model.find(residentQuery(req))
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load resident data" });
  }
};

const createResidentBooking = async (req, res) => {
  try {
    const {
      propertyId,
      roomId,
      date,
      amount,
      resident,
      property,
      room,
      stayDuration,
      securityDeposit,
    } = req.body;
    const count = await Booking.countDocuments();
    const bookingId = `BK-${1000 + count + 1}`;
    const [residentProfile, propertyBundle] = await Promise.all([
      getResidentProfile(req),
      getPropertyWithOwner(propertyId),
    ]);
    const propertyDoc = propertyBundle.property;

    const newBooking = await Booking.create({
      bookingId,
      residentId: Number(req.user.userId),
      ownerId: propertyDoc?.ownerId ? Number(propertyDoc.ownerId) : undefined,
      propertyId: Number(propertyId),
      roomId: roomId ? Number(roomId) : undefined,
      resident:
        resident || residentProfile?.name || req.user.name || "Resident",
      residentEmail: residentProfile?.email,
      residentPhone: residentProfile?.mobile,
      property: property || propertyDoc?.name || "Nestora Property",
      room: room || "Standard Room",
      date: date || toDateString(),
      stayDuration: stayDuration || "Not specified",
      securityDeposit:
        Number(securityDeposit) || propertyDoc?.securityDeposit || 0,
      amount: Number(amount) || 0,
      payment: "Pending",
      status: "Pending",
    });

    await notifyBookingFlow({
      type: "booking",
      resident: residentProfile,
      owner: propertyBundle.owner,
      booking: newBooking,
    });

    return res.status(201).json({
      success: true,
      message:
        "Booking request submitted successfully! Details were sent by email when email is configured.",
      data: newBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create booking" });
  }
};

const cancelResidentBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const query = {
      $and: [
        residentQuery(req),
        {
          $or: [
            { bookingId: id },
            { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
          ],
        },
      ],
    };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    booking.status = "Cancelled";
    if (booking.payment === "Paid") {
      booking.payment = "Refunded";
    }
    await booking.save();

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel booking" });
  }
};

const createResidentPayment = async (req, res) => {
  try {
    const { bookingId, propertyId, amount, method, propertyName, isCod } =
      req.body;
    const count = await Payment.countDocuments();
    const transactionId = `TXN-${9000 + count + 1}`;
    const today = toDateString();
    const [residentProfile, propertyBundle] = await Promise.all([
      getResidentProfile(req),
      getPropertyWithOwner(propertyId),
    ]);
    const existingBooking = bookingId
      ? await Booking.findOne({
          $and: [
            residentQuery(req),
            {
              $or: [
                { bookingId },
                {
                  _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null,
                },
              ],
            },
          ],
        })
      : null;

    if (
      existingBooking &&
      !["approved", "active"].includes(
        String(existingBooking.status || "").toLowerCase(),
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Payment is available after the owner approves your booking.",
      });
    }

    const paymentStatus = isCod ? "Pending" : "Paid";
    const paymentMethod = isCod
      ? "Cash on Delivery (Pay at Property)"
      : method || "PayPal Online";

    // Create payment record
    const payment = await Payment.create({
      transactionId,
      bookingId: bookingId || `BK-${1000 + count + 1}`,
      residentId: Number(req.user.userId),
      propertyId: propertyId ? Number(propertyId) : existingBooking?.propertyId,
      resident: residentProfile?.name || req.user.name || "Resident",
      residentEmail: residentProfile?.email,
      residentPhone: residentProfile?.mobile,
      property:
        propertyName ||
        existingBooking?.property ||
        propertyBundle.property?.name ||
        "Nestora Co-Living",
      booking: bookingId || `BK-${1000 + count + 1}`,
      amount: Number(amount) || 0,
      method: paymentMethod,
      date: today,
      status: paymentStatus,
    });

    // Update corresponding booking if provided
    if (bookingId) {
      await Booking.findOneAndUpdate(
        {
          $and: [
            residentQuery(req),
            {
              $or: [
                { bookingId },
                {
                  _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null,
                },
              ],
            },
          ],
        },
        {
          payment: isCod ? "Pending" : "Paid",
          status: isCod ? "Approved" : "Active",
        },
      );
    }

    const updatedBooking = bookingId
      ? await Booking.findOne({
          $and: [
            residentQuery(req),
            {
              $or: [
                { bookingId },
                {
                  _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null,
                },
              ],
            },
          ],
        })
      : null;

    await notifyBookingFlow({
      type: "payment",
      resident: residentProfile,
      owner: propertyBundle.owner,
      booking: updatedBooking ||
        existingBooking || {
          bookingId,
          property: propertyName,
          amount,
          payment: paymentStatus,
          status: isCod ? "Approved" : "Active",
        },
      payment,
    });

    return res.status(201).json({
      success: true,
      message: isCod
        ? "COD reservation confirmed! Pay in cash on move-in day."
        : "Payment processed successfully! Details were sent by email when email is configured.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process payment" });
  }
};

const createResidentVisit = async (req, res) => {
  try {
    const { propertyId, propertyName, visitDate, visitTime, notes } = req.body;
    const count = await Visit.countDocuments();
    const visitId = `VST-${100 + count + 1}`;
    const [residentProfile, propertyBundle] = await Promise.all([
      getResidentProfile(req),
      getPropertyWithOwner(propertyId),
    ]);

    const newVisit = await Visit.create({
      visitId,
      residentId: Number(req.user.userId),
      residentName: residentProfile?.name || req.user.name || "Resident",
      residentEmail: residentProfile?.email,
      residentPhone: residentProfile?.mobile,
      propertyId: Number(propertyId),
      propertyName: propertyName || "Nestora Property",
      visitDate: visitDate || new Date().toISOString().split("T")[0],
      visitTime: visitTime || "11:00 AM",
      notes: notes || "",
      status: "Scheduled",
    });

    await notifyBookingFlow({
      type: "visit",
      resident: residentProfile,
      owner: propertyBundle.owner,
      booking: {
        bookingId: visitId,
        property:
          propertyName || propertyBundle.property?.name || "Nestora Property",
        room: notes,
        date: `${newVisit.visitDate} ${newVisit.visitTime}`,
        status: "Scheduled",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Visit scheduled successfully!",
      data: newVisit,
    });
  } catch (error) {
    console.error("Create visit error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to schedule visit" });
  }
};

/**
 * POST /api/resident/payments/paypal/create-order
 * Creates a PayPal order and returns the orderID to the frontend.
 */
const paypalCreateOrder = async (req, res) => {
  try {
    const { amount, bookingId, propertyName } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount" });
    }
    if (bookingId) {
      const booking = await Booking.findOne({
        $and: [
          residentQuery(req),
          {
            $or: [
              { bookingId },
              { _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null },
            ],
          },
        ],
      });
      if (!booking)
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      if (
        !["approved", "active"].includes(
          String(booking.status || "").toLowerCase(),
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Payment is available after the owner approves your booking.",
          });
      }
    }
    const order = await createPaypalOrder({
      amount: Number(amount),
      bookingId,
      description: propertyName
        ? `Nestora Co-Living - ${propertyName}`
        : "Nestora PG & Co-Living Stay",
    });
    return res.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("PayPal create order error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to create PayPal order",
      });
  }
};

/**
 * POST /api/resident/payments/paypal/capture-order
 * Captures an approved PayPal order and records the payment in MongoDB.
 */
const paypalCaptureOrder = async (req, res) => {
  try {
    const { orderId, bookingId, propertyId, propertyName, amount } = req.body;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "PayPal orderId is required" });
    }
    if (bookingId) {
      const booking = await Booking.findOne({
        $and: [
          residentQuery(req),
          {
            $or: [
              { bookingId },
              { _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null },
            ],
          },
        ],
      });
      if (!booking)
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      if (
        !["approved", "active"].includes(
          String(booking.status || "").toLowerCase(),
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Payment is available after the owner approves your booking.",
          });
      }
    }

    // Capture the payment from PayPal
    const capture = await capturePaypalOrder(orderId);

    const captureStatus = capture.status; // 'COMPLETED' on success
    if (captureStatus !== "COMPLETED") {
      return res
        .status(400)
        .json({
          success: false,
          message: `PayPal order not completed. Status: ${captureStatus}`,
        });
    }

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const paypalTxnId = captureUnit?.id || orderId;
    const capturedAmount = captureUnit?.amount?.value || amount;
    const today = toDateString();
    const [residentProfile, propertyBundle] = await Promise.all([
      getResidentProfile(req),
      getPropertyWithOwner(propertyId),
    ]);

    const count = await Payment.countDocuments();
    const transactionId = `PPL-${9000 + count + 1}`;

    // Save payment record to MongoDB
    const payment = await Payment.create({
      transactionId,
      paypalOrderId: orderId,
      paypalCaptureId: paypalTxnId,
      bookingId: bookingId || `BK-${1000 + count + 1}`,
      residentId: Number(req.user.userId),
      propertyId: propertyId ? Number(propertyId) : undefined,
      resident: residentProfile?.name || req.user.name || "Resident",
      residentEmail: residentProfile?.email,
      residentPhone: residentProfile?.mobile,
      property:
        propertyName || propertyBundle.property?.name || "Nestora Co-Living",
      booking: bookingId || `BK-${1000 + count + 1}`,
      amount: Number(capturedAmount) || Number(amount) || 0,
      method: "PayPal",
      date: today,
      status: "Paid",
    });

    // Update the booking status
    if (bookingId) {
      await Booking.findOneAndUpdate(
        {
          $and: [
            residentQuery(req),
            {
              $or: [
                { bookingId },
                {
                  _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null,
                },
              ],
            },
          ],
        },
        { payment: "Paid", status: "Active" },
      );
    }

    const booking = bookingId
      ? await Booking.findOne({
          $and: [
            residentQuery(req),
            {
              $or: [
                { bookingId },
                {
                  _id: bookingId.match(/^[0-9a-fA-F]{24}$/) ? bookingId : null,
                },
              ],
            },
          ],
        })
      : null;

    await notifyBookingFlow({
      type: "payment",
      resident: residentProfile,
      owner: propertyBundle.owner,
      booking: booking || {
        bookingId,
        property: propertyName,
        amount: Number(capturedAmount) || Number(amount) || 0,
        payment: "Paid",
        status: "Active",
      },
      payment,
    });

    return res.status(201).json({
      success: true,
      message: "PayPal payment completed successfully!",
      data: payment,
      paypalOrderId: orderId,
      paypalCaptureId: paypalTxnId,
    });
  } catch (error) {
    console.error("PayPal capture order error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to capture PayPal payment",
      });
  }
};

module.exports = {
  requireResident,
  getResidentSummary,
  getResidentData,
  createResidentBooking,
  cancelResidentBooking,
  createResidentPayment,
  createResidentVisit,
  paypalCreateOrder,
  paypalCaptureOrder,
};
