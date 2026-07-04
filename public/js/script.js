// ---------- Initialisation de la carte ----------
const map = L.map('map', {
  zoomControl: false,
  attributionControl: true,
  minZoom: 6,
  maxZoom: 18
}).setView([14.60, 17.10], 10);

L.control.zoom({ position: 'bottomleft' }).addTo(map);

// ---------- Fonds de carte ----------
// Vue "Marine" : fond sombre stylisé (esthétique, mais simplifie les détails d'infrastructure)
const marineLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
});

// Vue "Standard OSM" : rendu classique, affiche voies ferrées, pistes, chemins, tracés récents
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 19
});

marineLayer.addTo(map); // fond par défaut

L.control.layers(
  { 'Vue Marine': marineLayer, 'Vue Standard OSM': osmLayer },
  null,
  { position: 'bottomleft', collapsed: false }
).addTo(map);

let zoneLayer = null;
let limitesLayer = null;
const labelMarkers = [];

// ---------- Style "zone du projet" ----------
const zoneStyle = {
  color: '#C1552E',
  weight: 2,
  opacity: 1,
  fillColor: '#C1552E',
  fillOpacity: 0.25,
  dashArray: '6 5'
};

// ---------- Style "limites régionales" ----------
const limitesStyle = {
  color: '#2F8F86',
  weight: 1.4,
  opacity: 0.85,
  fillColor: '#2F8F86',
  fillOpacity: 0.03,
  dashArray: '2 4'
};

// Animation "marching ants" sur le contour de la zone
let dashOffset = 0;
function animateZoneBorder() {
  if (zoneLayer) {
    dashOffset = (dashOffset + 1) % 1000;
    zoneLayer.setStyle({ dashOffset: String(-dashOffset) });
  }
  requestAnimationFrame(animateZoneBorder);
}

// ---------- Chargement des données ----------
async function loadZone() {
  const res = await fetch('/api/zone');
  const data = await res.json();

  zoneLayer = L.geoJSON(data, {
    style: zoneStyle,
    onEachFeature: (feature, layer) => {
      const nom = feature.properties.nom || 'Zone du projet';
      layer.bindPopup(`<span class="popup-title">Zone du projet</span>${nom}`);
    }
  }).addTo(map);

  if (zoneLayer.getBounds().isValid()) {
    map.fitBounds(zoneLayer.getBounds(), { padding: [80, 80] });
  }

  requestAnimationFrame(animateZoneBorder);
}

async function loadLimites() {
  const res = await fetch('/api/limites');
  const data = await res.json();

  limitesLayer = L.geoJSON(data, {
    style: limitesStyle,
    onEachFeature: (feature, layer) => {
      const reg = feature.properties.reg || feature.properties.REG || '';
      layer.bindPopup(`<span class="popup-title">Région</span>${reg}`);

      // Étiquette centrée sur chaque région
      const center = layer.getBounds().getCenter();
      const label = L.marker(center, {
        icon: L.divIcon({
          className: 'region-label',
          html: reg.toUpperCase(),
          iconSize: [0, 0]
        }),
        interactive: false
      }).addTo(map);
      labelMarkers.push(label);
    }
  }).addTo(map);
}

loadZone();
loadLimites();

// ---------- Toggle des couches ----------
document.querySelectorAll('.layer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const layerName = btn.dataset.layer;
    btn.classList.toggle('active');
    const isActive = btn.classList.contains('active');

    if (layerName === 'zone' && zoneLayer) {
      isActive ? map.addLayer(zoneLayer) : map.removeLayer(zoneLayer);
    }
    if (layerName === 'limites' && limitesLayer) {
      if (isActive) {
        map.addLayer(limitesLayer);
        labelMarkers.forEach(l => map.addLayer(l));
      } else {
        map.removeLayer(limitesLayer);
        labelMarkers.forEach(l => map.removeLayer(l));
      }
    }
  });
});