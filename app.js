/* =====================================================================
   Urban Travel Blog — Berlijn 2026 | Proof of Concept
   ---------------------------------------------------------------------
   CMS: data komt uit een CMS-databron. In deze demo gebruiken we een
   lokale testomgeving (JSON-bestanden in /data) — dit is toegestaan
   volgens de opdracht ("lokale omgeving OF online testomgeving").
   De code is zo gebouwd dat je 'm ook live aan Strapi kunt koppelen:
   zet USE_STRAPI op true en vul STRAPI_URL in.

   PoC 1: Blogposts uit het CMS  | PoC 2: Instagram-feed | PoC 3: kaart
   ===================================================================== */

const CONFIG = {
  // Staat op false -> gebruikt de lokale testomgeving (data/*.json).
  // Zet op true om live aan Strapi te koppelen.
  USE_STRAPI: false,

  // Alleen nodig als USE_STRAPI true is (Strapi Cloud geeft zo'n URL):
  STRAPI_URL: "https://JOUW-PROJECT.strapiapp.com",

  // Behold.so feed-URL voor Instagram (optioneel)
  BEHOLD_FEED_URL: "https://feeds.behold.so/JOUW_FEED_ID",
};

async function laadData(strapiPad, lokaalBestand) {
  if (CONFIG.USE_STRAPI) {
    try {
      const res = await fetch(`${CONFIG.STRAPI_URL}${strapiPad}`);
      if (!res.ok) throw new Error("Strapi gaf status " + res.status);
      setCmsStatus("strapi");
      const json = await res.json();
      return json.data ?? json;
    } catch (e) {
      console.warn("Strapi niet bereikbaar, lokale testomgeving gebruikt:", e.message);
    }
  }
  // Data uit het CMS-dashboard (admin.html) heeft voorrang als die bestaat
  const dashboardKey = lokaalBestand.includes("posts") ? "berlijn_posts" : "berlijn_locaties";
  const uitDashboard = localStorage.getItem(dashboardKey);
  if (uitDashboard) {
    setCmsStatus("lokaal");
    return JSON.parse(uitDashboard);
  }
  setCmsStatus("lokaal");
  const res = await fetch(lokaalBestand);
  return await res.json();
}

function setCmsStatus(bron) {
  const badge = document.getElementById("cms-status");
  if (!badge) return;
  badge.textContent = bron === "strapi"
    ? "CMS-status: live gekoppeld met Strapi \u2713"
    : "CMS-status: data opgehaald uit het CMS (lokale testomgeving)";
}

// Strapi v5 zet velden direct op het object, v4 onder .attributes
function veld(item, naam) {
  if (item[naam] !== undefined) return item[naam];
  if (item.attributes && item.attributes[naam] !== undefined) return item.attributes[naam];
  return undefined;
}

// ===== PoC 1 — BLOGPOSTS UIT HET CMS =====
async function laadPosts() {
  const grid = document.getElementById("posts-grid");
  const data = await laadData("/api/posts?sort=dag:asc", "data/posts.json");
  grid.innerHTML = "";
  data.forEach((post) => {
    const titel = veld(post, "title") ?? post.title;
    const dag = veld(post, "dag") ?? post.dag ?? "";
    const tekst = (veld(post, "excerpt") ?? post.excerpt ?? "").slice(0, 120);
    const img = veld(post, "afbeelding") ?? post.afbeelding ?? "";
    const card = document.createElement("article");
    card.className = "post-card";
    card.innerHTML = `
      ${img ? `<img src="${img}" alt="${titel}">` : ""}
      <div class="card-body">
        ${dag ? `<span class="dag-tag">${dag}</span>` : ""}
        <h3>${titel}</h3>
        <p>${tekst}\u2026</p>
      </div>`;
    grid.appendChild(card);
  });
  const tijdlijn = document.getElementById("timeline");
  tijdlijn.innerHTML = "";
  data.forEach((post) => {
    const titel = veld(post, "title") ?? post.title;
    const dag = veld(post, "dag") ?? post.dag ?? "";
    const tekst = veld(post, "excerpt") ?? post.excerpt ?? "";
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `<h3>${dag} \u2014 ${titel}</h3><p>${tekst}</p>`;
    tijdlijn.appendChild(item);
  });
}

// ===== PoC 3 — KAART (Leaflet), markers uit het CMS =====
let map, alleMarkers = [];
const CATEGORIE_KLEUREN = { museum: "#2B4C8C", "street-art": "#E8703A", school: "#F2C744", horeca: "#2E8B57", overig: "#777777" };

async function laadKaart() {
  map = L.map("map").setView([52.52, 13.405], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(map);
  const locaties = await laadData("/api/locaties", "data/locations.json");
  const categorieen = new Set(["alles"]);
  locaties.forEach((loc) => {
    const naam = veld(loc, "naam") ?? loc.naam;
    const lat = parseFloat(veld(loc, "lat") ?? loc.lat);
    const lng = parseFloat(veld(loc, "lng") ?? loc.lng);
    const cat = (veld(loc, "categorie") ?? loc.categorie ?? "overig").toLowerCase();
    const beschrijving = veld(loc, "beschrijving") ?? loc.beschrijving ?? "";
    if (isNaN(lat) || isNaN(lng)) return;
    categorieen.add(cat);
    const kleur = CATEGORIE_KLEUREN[cat] ?? CATEGORIE_KLEUREN.overig;
    const marker = L.circleMarker([lat, lng], { radius: 10, fillColor: kleur, color: "#fff", weight: 2, fillOpacity: 0.95 })
      .bindPopup(`<strong>${naam}</strong><br>${beschrijving}<br><em>${cat}</em>`);
    marker.categorie = cat;
    marker.addTo(map);
    alleMarkers.push(marker);
  });
  maakFilters([...categorieen]);
}

function maakFilters(categorieen) {
  const container = document.getElementById("filters");
  container.innerHTML = "";
  categorieen.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === "alles" ? " active" : "");
    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterMarkers(cat);
    });
    container.appendChild(btn);
  });
}

function filterMarkers(cat) {
  alleMarkers.forEach((marker) => {
    if (cat === "alles" || marker.categorie === cat) marker.addTo(map);
    else map.removeLayer(marker);
  });
}

// ===== PoC 2 — INSTAGRAM-FEED (dynamisch via Behold.so) =====
async function laadInstagram() {
  const grid = document.getElementById("insta-grid");
  try {
    const res = await fetch(CONFIG.BEHOLD_FEED_URL);
    if (!res.ok) throw new Error("Feed gaf status " + res.status);
    const feed = await res.json();
    const posts = feed.posts ?? feed;
    grid.innerHTML = "";
    posts.slice(0, 8).forEach((p) => {
      const a = document.createElement("a");
      a.href = p.permalink; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `<img src="${p.mediaUrl ?? p.thumbnailUrl}" alt="Instagram post" loading="lazy">`;
      grid.appendChild(a);
    });
  } catch (e) {
    console.warn("Instagram-feed niet bereikbaar:", e.message);
    grid.innerHTML = "";
    const kleuren = ["#2B4C8C", "#E8703A", "#F2C744", "#CFE0E8", "#2B4C8C", "#E8703A", "#F2C744", "#CFE0E8"];
    kleuren.forEach((kleur, i) => {
      const div = document.createElement("div");
      div.className = "insta-fallback";
      div.style.background = kleur;
      div.style.color = (kleur === "#CFE0E8" || kleur === "#F2C744") ? "#1E2430" : "#fff";
      div.textContent = "Instagram post " + (i + 1) + " (feed nog koppelen)";
      grid.appendChild(div);
    });
  }
}

laadPosts();
laadKaart();
laadInstagram();
