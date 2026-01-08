const socket = io();
const myName = prompt("กรอกชื่อของคุณที่ใช้ใน Line open chat (กรุณากรอกให้ตรงตัวเล็ก-ตัวใหญ่ การเว้นวรรค)");
socket.emit("register-user", myName);

const newyear = document.getElementById("newyear");
document.getElementById("username").innerText = `สวัสดี ${myName}`;

const btn = document.getElementById("drawGift");
const result = document.getElementById("result");
let interval;
let myGift = null;

btn.disabled = true;

// ===== WAIT TURN =====
socket.on("your-turn", (winnerName) => {
  if (winnerName === myName) {
    btn.disabled = false;
    result.innerText = "ถึงตาคุณสุ่ม!";
  } else {
    btn.disabled = true;
  }
});

// ===== START SPIN =====
socket.on("start-gift-spin", () => {
  if (myGift) return;
  clearInterval(interval);
  result.classList.add("spinning");

  interval = setInterval(() => {
    result.innerText = Math.floor(100 + Math.random() * 900);
  }, 80);
});

// ===== STOP SPIN =====
socket.on("stop-gift-spin", (data) => {
  clearInterval(interval);
  result.classList.remove("spinning");

  if (data.person === myName) {
    myGift = data.gift;
    result.innerText = `🎉 ได้ของขวัญหมายเลข ${data.gift} ของคุณ ${data.owner}`;
    newyear.innerText = "🎊 สวัสดีปีใหม่ 🎊";
    newyear.classList.add("show-newyear");
  } else {
    if (!myGift) result.innerText = "-";
  }
});

btn.onclick = () => {
  btn.disabled = true;
  socket.emit("draw-gift", myName);
};

/* ===== FLOATING HEARTS ===== */
function spawnHeart() {
  const heart = document.createElement("div");
  heart.className = "floating-heart";
  heart.innerText = "💖";

  heart.style.left = Math.random() * 100 + "vw";
  heart.style.fontSize = 22 + Math.random() * 26 + "px";
  heart.style.animationDuration = 6 + Math.random() * 5 + "s";

  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 12000);
}
setInterval(spawnHeart, 900);
