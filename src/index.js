import css from './styles/main.css';
import L from "leaflet";
import "leaflet.path.drag";
import ItemManager from "./scripts/itemmanager.js";
import "./scripts/controls.js";


// Setup Map
const map = L.map('map').setView([49.02000, 8.42317], 13);

// Add Background imagery
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 22,
	maxNativeZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// var gl = L.mapboxGL({
//     accessToken: '{token}',
//     style: 'https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json'
// }).addTo(map);

// const osm_vector = L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.pbf?key=BunygT2ibwqnRLLrkeEw', {
// 	attribution: 'Map data &copy; <a href="https://www.maptiler.com/">MapTiler</a> contributors',
// 	maxZoom: 18,
// }).addTo(map);

const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
	maxZoom: 22,
	subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

var baseMaps = {
	"Google satellite": googleSat,
	// "OpenStreetMap Vector": osm_vector, 
	"OpenStreetMap": osm,
};

let App = {}
App.itemManager = new ItemManager(map);
App.layerControl = L.control.layers(baseMaps, App.itemManager.categoryLayers).addTo(map);

let itemAdd = new L.Control.ItemAddControl({ position: 'topright' }).addTo(map);
let exportJson = new L.Control.ExportControl({ position: 'topright' }).addTo(map);
App.infoBox = new L.Control.InfoControl({ position: 'bottomleft' }).addTo(map);
let github = new L.Control.GitHubControl({ position: 'topleft' }).addTo(map);

// if (typeof data !== 'undefined') {
// 	App.itemManager.import(data);
// }

window.App = App;
