const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const roleRoutes = require("./routes/roleRoutes");
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const pgtypeRoutes = require("./routes/pgtypeRoutes");
const userRoutes = require("./routes/userRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const residentRoutes = require("./routes/residentRoutes");
const roomRoutes = require("./routes/roomRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const amenityRoutes = require("./routes/amenityRoutes");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
let isDbConnected = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/roles", roleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/pgtypes", pgtypeRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/resident", residentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/amenities", amenityRoutes);
app.use("/api", userRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "Nestora Backend is Running",
    database: isDbConnected ? "connected" : "disconnected",
  });
});

// Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  isDbConnected = await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other server or change PORT in .env.`,
      );
      return;
    }

    console.error("Server Error:", error.message);
  });

  return server;
};

startServer();
