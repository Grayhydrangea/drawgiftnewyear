const socket = io();
const myName = prompt("กรอกชื่อของคุณที่ใช้ใน Line Openchat (กรุณากรอกให้ตรง)");
const newyear = document.getElementById("newyear");

document.getElementById("username").innerText = `สวัสดี ${myName}`;

const btn = document.getElementById("drawGift");
const result = document.getElementById("result");

let interval;
let myGift = null; // ✅ เก็บผลถาวรของ user

function randomNumber() {
  return Math.floor(100 + Math.random() * 900);
}

btn.disabled = true;

// ===== WAIT TURN =====
socket.on("your-turn", (name) => {
  if (name === myName) {
    btn.disabled = false;
    result.innerText = "ถึงตาคุณสุ่ม!";
  }
});

// ===== START SPIN =====
socket.on("start-gift-spin", () => {
  if (myGift) return; // ❗ ถ้าเคยได้แล้ว ไม่ต้องหมุนอีก

  clearInterval(interval);
  result.classList.add("spinning");

  interval = setInterval(() => {
    result.innerText = randomNumber();
  }, 80);
});

// ===== STOP SPIN =====
socket.on("stop-gift-spin", (data) => {
  clearInterval(interval);
  result.classList.remove("spinning");

  if (data.person === myName) {
    myGift = data.gift;

    result.innerText = `🎉 ได้ของขวัญหมายเลข ${data.gift}`;

    // ✅ แสดงคำอวยพร
    newyear.innerText = "🎊 สวัสดีปีใหม่ 🎊";
    newyear.classList.add("show-newyear");
  } else {
    if (!myGift) {
      result.innerText = "-";
    }
  }
});

btn.onclick = () => {
  btn.disabled = true;
  socket.emit("draw-gift", myName);
};

/* ===== FLOATING HEARTS (USER PAGE) ===== */
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

// ปล่อยหัวใจเรื่อย ๆ
setInterval(spawnHeart, 900);
