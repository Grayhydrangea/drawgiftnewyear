const socket = io();

const personDiv = document.getElementById("person");
const giftDiv = document.getElementById("gift");
const btn = document.getElementById("drawPerson");
const historyDiv = document.getElementById("history");

let personInterval;
let giftInterval;

/* ===== RANDOM ===== */
function randomText() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return chars[Math.floor(Math.random() * chars.length)];
}
function randomNumber() {
  return Math.floor(100 + Math.random() * 900);
}

/* ===== PERSON ===== */
socket.on("start-person-spin", () => {
  clearInterval(personInterval);
  personDiv.classList.add("spinning");

  personInterval = setInterval(() => {
    personDiv.innerText = randomText();
  }, 80);
});

socket.on("stop-person-spin", (name) => {
  clearInterval(personInterval);
  personDiv.classList.remove("spinning");
  personDiv.innerText = name;
  launchFirework();
});

/* ===== GIFT ===== */
socket.on("start-gift-spin", () => {
  clearInterval(giftInterval);
  giftDiv.classList.add("spinning");

  giftInterval = setInterval(() => {
    giftDiv.innerText = randomNumber();
  }, 80);
});

socket.on("stop-gift-spin", (data) => {
  clearInterval(giftInterval);
  giftDiv.classList.remove("spinning");
  giftDiv.innerText = data.gift;
  launchFirework();
});

/* ===== HISTORY ===== */
function renderHistory(list) {
  historyDiv.innerHTML = "";
  list.forEach(item => {
    const p = document.createElement("p");
    p.innerText = `🎉 ${item.person} ได้ของขวัญหมายเลข ${item.gift}`;
    historyDiv.appendChild(p);
  });
}

socket.on("init", ({ history }) => renderHistory(history));
socket.on("update-history", renderHistory);

btn.onclick = () => socket.emit("draw-person");

/* ===== FIREWORK EFFECT ===== */
const fireworkBox = document.querySelector(".fireworks");

function launchFirework() {
  const box = document.querySelector(".fireworks");

  const titleWidth = box.offsetWidth;
  const bursts = 7;            // จำนวนจุดระเบิด
  const particlesPerBurst = 18;

  for (let b = 0; b < bursts; b++) {

    // กระจายตำแหน่งตามความกว้างของตัวอักษร
    const originX = Math.random() * titleWidth;
    const originY = 40 + Math.random() * 30;

    for (let i = 0; i < particlesPerBurst; i++) {
      const dot = document.createElement("div");
      dot.className = "firework";

      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 90;

      dot.style.left = originX + "px";
      dot.style.top = originY + "px";

      dot.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      dot.style.setProperty("--y", `${Math.sin(angle) * distance}px`);

      box.appendChild(dot);
      setTimeout(() => dot.remove(), 1400);
    }
  }
}


/* ===== FLOATING ITEMS ===== */
function spawnFloating() {
  const el = document.createElement("div");
  el.className = "floating";
  el.innerText = Math.random() > 0.5 ? "🧧" : "🪙";

  el.style.left = Math.random() * 100 + "vw";
  el.style.fontSize = 28 + Math.random() * 22 + "px";
  el.style.animationDuration = 8 + Math.random() * 6 + "s";

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 15000);
}

setInterval(spawnFloating, 1200);