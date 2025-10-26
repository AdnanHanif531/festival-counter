// === Google Sheet CSV URL ===
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7DKkAN495Ts2mtAgCIVzNLrBky9qRSYnMNwNLgHitgYAWXBlMhihTQ1LcPseEVoO6Wy5LbWSV0gxa/pub?output=csv";

// === DOM Elements ===
const listSection = document.getElementById("listSection");
const loadingEl = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("dropdown");
const showAllBtn = document.getElementById("showAllBtn");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

let festivals = [];
let filteredFestivals = [];
let activeIndex = -1; // for dropdown keyboard navigation

// === Fetch CSV and Parse ===
async function fetchFestivals() {
  try {
    const res = await fetch(SHEET_URL);
    const csvText = await res.text();
    const rows = csvText.split("\n").map(r => r.trim()).filter(r => r);
    const headers = rows[0].split(",");

    const data = rows.slice(1).map(r => {
      const cols = r.split(",");
      const rawName = cols[0]?.trim();
      const date = cols[1]?.trim();
      const emoji = cols[2]?.trim();
      const region = cols[3]?.trim();
      const type = cols[4]?.trim();

      const parsed = new Date(date);
      const diff = Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24));
      const displayDate = parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return {
        name: rawName,
        date: parsed,
        emoji,
        region,
        type,
        days: diff,
        displayDate
      };
    });

    festivals = data.filter(f => f.name && !isNaN(f.date));
    festivals.sort((a, b) => a.date - b.date);
    filteredFestivals = festivals;
    renderFestivals(festivals);
  } catch (err) {
    loadingEl.textContent = "Error loading data. Check your Google Sheet URL.";
    console.error(err);
  }
}

// === Render Cards ===
function renderFestivals(list) {
  listSection.innerHTML = "";

  if (!list.length) {
    listSection.innerHTML = `<div class="loading">No matching festivals found.</div>`;
    return;
  }

  list.forEach(f => {
    const card = document.createElement("div");
    card.className = "card";

    const cardTop = document.createElement("div");
    cardTop.className = "card-top";

    const icon = document.createElement("div");
    icon.className = "icon";
    icon.textContent = f.emoji || "🎉";

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <h3 class="card-title">${f.name}</h3>
      <div class="card-meta">${f.region || "Global"} · ${f.type || "Festival"}</div>
      <div class="card-meta">${f.displayDate}</div>
    `;

    const daysLeft = document.createElement("div");
    daysLeft.className = "days-left";
    daysLeft.textContent = f.days >= 0 ? `${f.days} days` : "Passed";

    cardTop.appendChild(icon);
    cardTop.appendChild(body);
    cardTop.appendChild(daysLeft);

    // Share Button
    const shareBtn = document.createElement("button");
    shareBtn.className = "share-btn";
    shareBtn.textContent = "Share";
    shareBtn.onclick = () => shareFestival(f);

    card.appendChild(cardTop);
    card.appendChild(shareBtn);
    listSection.appendChild(card);
  });
}

// === Search and Filter ===
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  activeIndex = -1; // reset active highlight
  if (!q) {
    dropdown.style.display = "none";
    renderFestivals(festivals);
    return;
  }

  const matches = festivals.filter(f => f.name.toLowerCase().includes(q));
  dropdown.innerHTML = matches.map(f => `<div class="item">${f.name}</div>`).join("");
  dropdown.style.display = matches.length ? "block" : "none";

  dropdown.querySelectorAll(".item").forEach(item => {
    item.addEventListener("click", () => {
      const name = item.textContent;
      searchInput.value = name;
      const selected = festivals.filter(f => f.name === name);
      renderFestivals(selected);
      dropdown.style.display = "none";
    });
  });
});

// === Keyboard navigation for dropdown ===
searchInput.addEventListener("keydown", e => {
  const items = dropdown.querySelectorAll(".item");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % items.length;
    updateActive(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = (activeIndex - 1 + items.length) % items.length;
    updateActive(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeIndex >= 0) {
      items[activeIndex].click();
    }
 else {
    // fallback: search normally, case-insensitive
    const q = searchInput.value.trim().toLowerCase();
    const matched = festivals.filter(f => f.name.toLowerCase().includes(q));
    renderFestivals(matched);
    dropdown.style.display = "none";
  }
  }
});

function updateActive(items) {
  items.forEach((el, i) => {
    el.classList.toggle("active", i === activeIndex);
  });
}

showAllBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderFestivals(festivals);
  dropdown.style.display = "none";
});

// === Share Logic ===
async function shareFestival(f) {
  const shareText = `${f.emoji || "🎉"} ${f.name} is coming up in ${f.days} days (${f.displayDate})!`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: f.name, text: shareText, url: shareUrl });
    } catch (err) {
      console.warn("Share canceled or unsupported", err);
    }
  } else {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert("Copied to clipboard!");
  }
}

// === Init ===
fetchFestivals();

