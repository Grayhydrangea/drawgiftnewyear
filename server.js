const express = require("express");
const http = require("http");
const cors = require("cors");
const admin = require("firebase-admin");
const { Server } = require("socket.io");
require("dotenv").config();

// ===============================
// Firebase Admin Init
// ===============================
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  ),
});

const db = admin.firestore();

// ===============================
// Express App
// ===============================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // 👈 serve admin / user page

// ===============================
// HTTP + Socket.IO
// ===============================
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ===============================
// Firestore Collections
// ===============================
const userCol = db.collection("user");
const giftCol = db.collection("gift");
const historyCol = db.collection("history");

// ===============================
// Express Routes
// ===============================
app.get("/", (req, res) => {
  res.send("🔥 Draw Gift New Year is running");
});

/* ===============================
   ✅ API ROUTES (เปลี่ยนจาก /user → /api/user)
   =============================== */

app.post("/api/user", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const docRef = await userCol.add({
      name,
      draw: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/user", async (req, res) => {
  try {
    const snapshot = await userCol.orderBy("createdAt").get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Socket.IO Logic
// ===============================
let spinning = false;
const userSockets = {}; // name -> socket.id

io.on("connection", (socket) => {

  // ----- REGISTER USER -----
  socket.on("register-user", async (name) => {
    socket.userName = name;
    userSockets[name] = socket.id;
    console.log(`✅ User connected: ${name}`);

    const historySnap = await historyCol.orderBy("createdAt").get();
    const history = historySnap.docs.map(doc => doc.data());
    socket.emit("init", { history });
  });

  // ----- ADMIN: Draw Person -----
  socket.on("draw-person", async () => {
    if (spinning) return;
    spinning = true;

    io.emit("start-person-spin");

    setTimeout(async () => {
      const userSnap = await userCol.where("draw", "==", false).get();
      const users = userSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (!users.length) {
        io.emit("stop-person-spin", "ไม่มีชื่อ");
        spinning = false;
        return;
      }

      const winner = users[Math.floor(Math.random() * users.length)];
      await userCol.doc(winner.id).update({ draw: true });

      io.emit("stop-person-spin", winner.name);

      const winnerSocketId = userSockets[winner.name];
      if (winnerSocketId) {
        io.to(winnerSocketId).emit("your-turn", winner.name);
      }

      spinning = false;
    }, 2000);
  });

  // ----- USER: Draw Gift -----
  socket.on("draw-gift", async (name) => {
    if (spinning) return;
    spinning = true;

    io.emit("start-gift-spin");

    setTimeout(async () => {
      const giftSnap = await giftCol.where("used", "==", false).get();

      const availableGifts = giftSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(g => g.owner !== name); // ❌ ห้ามจับของตัวเอง

      if (!availableGifts.length) {
        io.emit("stop-gift-spin", {
          person: name,
          gift: "ไม่มีของขวัญว่าง",
        });
        spinning = false;
        return;
      }

      const giftItem =
        availableGifts[Math.floor(Math.random() * availableGifts.length)];

      await giftCol.doc(giftItem.id).update({ used: true });

      await historyCol.add({
        person: name,
        gift: giftItem.code,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      io.emit("stop-gift-spin", {
        person: name,
        gift: giftItem.code,
      });

      const historySnap = await historyCol.orderBy("createdAt").get();
      const historyUpdated = historySnap.docs.map(doc => doc.data());
      io.emit("update-history", historyUpdated);

      spinning = false;
    }, 2000);
  });

  // ----- DISCONNECT -----
  socket.on("disconnect", () => {
    if (socket.userName) {
      console.log(`❌ User disconnected: ${socket.userName}`);
      delete userSockets[socket.userName];
    }
  });
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);