# Urban Travel Blog — Berlijn 2026 (Proof of Concept)

Proof of Concept voor het vak **Grafisch & Functioneel Ontwerp — Periode 4**.
Gemaakt door **Aba & Rick**.

Deze demo bewijst dat de drie technische onderdelen uit het functioneel ontwerp werken:

| PoC | Wat laat het zien | Checklist-eis |
|-----|-------------------|---------------|
| PoC 1 | Posts worden opgehaald uit het CMS (WordPress REST API) en getoond in het dag-overzicht en de tijdlijn | "De frontend haalt succesvol objecten op uit het CMS" |
| PoC 2 | De Instagram-feed wordt dynamisch ingeladen via een script (Behold.so → Instagram Graph API) | "De Instagram-feed is dynamisch gekoppeld (geen statische afbeeldingen)" |
| PoC 3 | Leaflet-kaart toont markers op basis van coördinaten uit het CMS, met filter op categorie | "Een werkende kaart-library die markers toont op basis van coördinaten uit het CMS" |

## Demo starten

Geen installatie nodig. Open de map en start een lokale server:

```bash
# Optie 1: met Python
python3 -m http.server 8000

# Optie 2: met VS Code
# Rechtsklik op index.html → "Open with Live Server"
```

Open daarna http://localhost:8000 in je browser.

> **Let op:** open het bestand niet rechtstreeks via dubbelklikken (file://),
> want dan blokkeert de browser het laden van de JSON-data.

## Hoe de CMS-koppeling werkt (PoC 1 + 3)

1. In WordPress maken we een custom post type **locatie** aan (met de plugin *CPT UI*).
2. Met de plugin *ACF (Advanced Custom Fields)* krijgt elke locatie de velden: `lat`, `lng`, `categorie` en `beschrijving`.
3. WordPress zet alles automatisch open via de REST API:
   - Posts: `https://jouw-site.nl/wp-json/wp/v2/posts?_embed`
   - Locaties: `https://jouw-site.nl/wp-json/wp/v2/locatie`
4. In `js/app.js` vul je bovenaan bij `CONFIG.CMS_URL` de URL van de WordPress-site in.

**Belangrijk:** een content creator hoeft geen code te kennen. Posts, locaties en media worden gewoon in het WordPress-dashboard toegevoegd — de website ververst automatisch.

### Fallback (demodata)

Is het CMS niet bereikbaar (bijv. geen internet tijdens de presentatie)? Dan valt de site automatisch terug op de lokale bestanden `data/posts.json` en `data/locations.json`. De badge bovenin laat zien welke bron actief is. Zo werkt de demo altijd.

## Hoe de Instagram-koppeling werkt (PoC 2)

We gebruiken **Behold.so** (gratis): die koppelt via de officiële **Instagram Graph API** en geeft een simpele JSON-feed terug die automatisch ververst bij nieuwe posts.

1. Maak een gratis account op [behold.so](https://behold.so).
2. Koppel het Instagram-account van de reis.
3. Kopieer de feed-URL en vul die in bij `CONFIG.BEHOLD_FEED_URL` in `js/app.js`.

Zolang de feed nog niet is gekoppeld, toont de site gekleurde placeholders, zodat duidelijk is waar de feed komt.

## Mapstructuur

```
poc-berlijn/
├── index.html          # Eén-pagina demo met alle secties
├── css/style.css       # Styling volgens de styleguide (Berlijn-palet)
├── js/app.js           # PoC 1, 2 en 3 (CMS, Instagram, kaart)
└── data/
    ├── posts.json      # Fallback-demodata voor de blogposts
    └── locations.json  # Fallback-demodata voor de kaartmarkers
```

## Gebruikte technieken

- **CMS:** WordPress + REST API (keuze onderbouwd in het Technisch Adviesrapport)
- **Kaart:** Leaflet 1.9 + OpenStreetMap (gratis, geen API-key nodig)
- **Instagram:** Behold.so (Instagram Graph API)
- **Frontend:** HTML, CSS en vanilla JavaScript (geen frameworks nodig voor de PoC)

## CMS-dashboard (admin.html)

De PoC bevat een eigen CMS-beheerinterface op `admin.html`. Hiermee kan een
content creator **zonder code**:
- Blogposts toevoegen, bewerken en verwijderen (dag, titel, tekst, foto uploaden)
- Locaties beheren (naam, coördinaten, categorie, beschrijving) die als markers op de kaart verschijnen

Wijzigingen in het dashboard worden direct opgeslagen en verschijnen meteen op
de website (index.html). Zo is bewezen dat de frontend data uit het CMS ophaalt
en dat een beheerder de inhoud beheert — precies wat de opdracht vraagt
("laat zien hoe het managementdashboard eruitziet en hoe een content creator
een post kan maken en media kan uploaden").

Open het dashboard via de knop "CMS-dashboard" in de navigatie, of ga naar
`admin.html`.
