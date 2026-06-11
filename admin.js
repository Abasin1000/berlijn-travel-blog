/* =====================================================================
   CMS Dashboard — Urban Travel Blog Berlijn 2026
   Beheerinterface waarmee een content creator posts en locaties kan
   toevoegen, bewerken en verwijderen — zonder code te kennen.
   De data wordt in de browser opgeslagen (localStorage) en gedeeld
   met de website (index.html), zodat wijzigingen direct zichtbaar zijn.
   ===================================================================== */

const KEY_POSTS = "berlijn_posts";
const KEY_LOC = "berlijn_locaties";

// ---- Data laden: eerst uit opslag, anders uit de start-JSON ----
async function getData(key, bestand) {
  const opgeslagen = localStorage.getItem(key);
  if (opgeslagen) return JSON.parse(opgeslagen);
  const res = await fetch(bestand);
  const data = await res.json();
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}
function setData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

let posts = [];
let locaties = [];
let bewerkIndex = null; // null = nieuw item

// ===== Navigatie tussen views =====
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.getElementById("view-posts").classList.toggle("hidden", view !== "posts");
    document.getElementById("view-locaties").classList.toggle("hidden", view !== "locaties");
  });
});

// ===== POSTS renderen =====
function renderPosts() {
  const lijst = document.getElementById("posts-lijst");
  if (!posts.length) { lijst.innerHTML = '<p class="leeg">Nog geen posts. Klik op "+ Nieuwe post".</p>'; return; }
  lijst.innerHTML = "";
  posts.forEach((post, i) => {
    const div = document.createElement("div");
    div.className = "rij-item";
    div.innerHTML = `
      ${post.afbeelding ? `<img src="${post.afbeelding}" alt="">` : '<img alt="">'}
      <div class="info">
        ${post.dag ? `<span class="tag">${post.dag}</span>` : ""}
        <h3>${post.title}</h3>
        <p>${(post.excerpt || "").slice(0, 90)}</p>
      </div>
      <div class="rij-acties">
        <button class="icon-btn" data-edit="${i}">Bewerken</button>
        <button class="icon-btn verwijder" data-del="${i}">Verwijderen</button>
      </div>`;
    lijst.appendChild(div);
  });
  lijst.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openPost(+b.dataset.edit));
  lijst.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    if (confirm("Deze post verwijderen?")) { posts.splice(+b.dataset.del, 1); setData(KEY_POSTS, posts); renderPosts(); }
  });
}

// ===== LOCATIES renderen =====
function renderLocaties() {
  const lijst = document.getElementById("locaties-lijst");
  if (!locaties.length) { lijst.innerHTML = '<p class="leeg">Nog geen locaties. Klik op "+ Nieuwe locatie".</p>'; return; }
  lijst.innerHTML = "";
  locaties.forEach((loc, i) => {
    const div = document.createElement("div");
    div.className = "rij-item";
    div.innerHTML = `
      <div class="info">
        <span class="tag cat">${loc.categorie}</span>
        <h3>${loc.naam}</h3>
        <p>${loc.lat}, ${loc.lng} — ${(loc.beschrijving || "").slice(0, 70)}</p>
      </div>
      <div class="rij-acties">
        <button class="icon-btn" data-edit="${i}">Bewerken</button>
        <button class="icon-btn verwijder" data-del="${i}">Verwijderen</button>
      </div>`;
    lijst.appendChild(div);
  });
  lijst.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openLocatie(+b.dataset.edit));
  lijst.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    if (confirm("Deze locatie verwijderen?")) { locaties.splice(+b.dataset.del, 1); setData(KEY_LOC, locaties); renderLocaties(); }
  });
}

// ===== POST modal =====
const modalPost = document.getElementById("modal-post");
function openPost(index) {
  bewerkIndex = index;
  const p = index === null ? {} : posts[index];
  document.getElementById("post-modal-titel").textContent = index === null ? "Nieuwe post" : "Post bewerken";
  document.getElementById("post-dag").value = p.dag || "";
  document.getElementById("post-titel").value = p.title || "";
  document.getElementById("post-tekst").value = p.excerpt || "";
  document.getElementById("post-foto-url").value = p.afbeelding || "";
  const prev = document.getElementById("post-foto-preview");
  if (p.afbeelding) { prev.src = p.afbeelding; prev.classList.remove("hidden"); } else { prev.classList.add("hidden"); }
  document.getElementById("post-foto").value = "";
  modalPost.classList.remove("hidden");
}
document.getElementById("nieuwe-post").onclick = () => openPost(null);

// foto uploaden -> als data-URL inlezen (media upload demo)
document.getElementById("post-foto").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById("post-foto-url").value = ev.target.result;
    const prev = document.getElementById("post-foto-preview");
    prev.src = ev.target.result; prev.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});
document.getElementById("post-foto-url").addEventListener("input", e => {
  const prev = document.getElementById("post-foto-preview");
  if (e.target.value) { prev.src = e.target.value; prev.classList.remove("hidden"); } else { prev.classList.add("hidden"); }
});

document.getElementById("post-opslaan").onclick = () => {
  const nieuwePost = {
    dag: document.getElementById("post-dag").value.trim(),
    title: document.getElementById("post-titel").value.trim(),
    excerpt: document.getElementById("post-tekst").value.trim(),
    afbeelding: document.getElementById("post-foto-url").value.trim(),
  };
  if (!nieuwePost.title) { alert("Vul minstens een titel in."); return; }
  if (bewerkIndex === null) posts.push(nieuwePost);
  else posts[bewerkIndex] = nieuwePost;
  setData(KEY_POSTS, posts);
  renderPosts();
  modalPost.classList.add("hidden");
};

// ===== LOCATIE modal =====
const modalLoc = document.getElementById("modal-locatie");
function openLocatie(index) {
  bewerkIndex = index;
  const l = index === null ? {} : locaties[index];
  document.getElementById("loc-modal-titel").textContent = index === null ? "Nieuwe locatie" : "Locatie bewerken";
  document.getElementById("loc-naam").value = l.naam || "";
  document.getElementById("loc-lat").value = l.lat || "";
  document.getElementById("loc-lng").value = l.lng || "";
  document.getElementById("loc-categorie").value = l.categorie || "museum";
  document.getElementById("loc-beschrijving").value = l.beschrijving || "";
  modalLoc.classList.remove("hidden");
}
document.getElementById("nieuwe-locatie").onclick = () => openLocatie(null);

document.getElementById("loc-opslaan").onclick = () => {
  const nieuweLoc = {
    naam: document.getElementById("loc-naam").value.trim(),
    lat: document.getElementById("loc-lat").value.trim(),
    lng: document.getElementById("loc-lng").value.trim(),
    categorie: document.getElementById("loc-categorie").value,
    beschrijving: document.getElementById("loc-beschrijving").value.trim(),
  };
  if (!nieuweLoc.naam || !nieuweLoc.lat || !nieuweLoc.lng) { alert("Vul naam, latitude en longitude in."); return; }
  if (bewerkIndex === null) locaties.push(nieuweLoc);
  else locaties[bewerkIndex] = nieuweLoc;
  setData(KEY_LOC, locaties);
  renderLocaties();
  modalLoc.classList.add("hidden");
};

// ===== Modals sluiten =====
document.querySelectorAll("[data-sluit]").forEach(b => b.onclick = () => {
  modalPost.classList.add("hidden"); modalLoc.classList.add("hidden");
});
[modalPost, modalLoc].forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.add("hidden"); }));

// ===== Start =====
(async function init() {
  posts = await getData(KEY_POSTS, "data/posts.json");
  locaties = await getData(KEY_LOC, "data/locations.json");
  renderPosts();
  renderLocaties();
})();
