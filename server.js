const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
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

// ===============================
// Routes
// ===============================

// health check
app.get("/", (req, res) => {
  res.send("🔥 Firebase Server is running");
});

// เพิ่มสมาชิก
app.post("/members", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const docRef = await db.collection("members").add({
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: docRef.id,
      name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงรายชื่อสมาชิกทั้งหมด
app.get("/members", async (req, res) => {
  try {
    const snapshot = await db.collection("members").orderBy("createdAt").get();
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
