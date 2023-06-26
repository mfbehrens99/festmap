import css from './styles/main.css';
import L from "leaflet";
import "leaflet.path.drag";
import Utils from "./scripts/utils.js";
import { Rectangle, Circle, Path, Cable, MarkerItems, Socket } from "./scripts/mapitems.js";
import items from "./scripts/items.js";


class ItemManager {
	constructor(map) {
		this.map = map;
		this.items = [];
		this.copyItems = null;
		this.revertSteps = [];
		this.revertIndex = -1;

		const itemManager = this;

		// When clicked into empty map
		this.map.on('click', function (e) {
			if (e.originalEvent.target === map.getContainer()) {
				itemManager.deselect();
			}
		})


		// Hotkeys
		this.map.on('keydown', function (e) {
			var key = e.originalEvent.key;
			var ctrlKey = e.originalEvent.ctrlKey || e.originalEvent.metaKey; // CTRL on Windows/Linux, CMD on Apple
			var shiftKey = e.originalEvent.shiftKey;
			var anySelected = itemManager.getSelected().length > 0;

			if (key === "Escape") {
				itemManager.deselect();
			}
			else if (key === "c" && ctrlKey && anySelected) {
				// Copy
				itemManager.copy();
			}
			else if (key === "v" && ctrlKey) {
				// Paste
				itemManager.addRevertStep();
				let position = itemManager.map.getCenter();
				itemManager.paste(position);
			}
			else if (key === "x" && ctrlKey && anySelected) {
				// Cut
				itemManager.copy();
				itemManager.addRevertStep();
				itemManager.getSelected().forEach((item) => {itemManager.deleteItem(item);});
			}
			else if (key === "z" && ctrlKey && !shiftKey) {
				// Revert
				itemManager.revert();
			}
			else if ((key === "y" && ctrlKey) || (key === "z" && ctrlKey && shiftKey)) {
				// Repeat
				itemManager.repeat();
			}
			else if ((key === "Delete" || key == "Backspace") && anySelected) {
				// Delete
				itemManager.addRevertStep();
				itemManager.getSelected().forEach((item) => {itemManager.deleteItem(item);});
			}
		});
	};

	addItem(itemData) {
		// Create a Item from itemData
		var item;
		switch (itemData.type) {
			case "Rectangle":
				item = new Rectangle(this, itemData);
				break;
			case "Circle":
				item = new Circle(this, itemData);
				break;
			case "Path":
				item = new Path(this, itemData);
				break;
			case "Cable":
				item = new Cable(this, itemData);
				break;
			case "Socket":
				item = new Socket(this, itemData);
				break;
			default:
				item = new Rectangle(this, itemData);
				console.log(itemData);
				break;
		}

		// Add Item to Items list
		this.items.push(item);

		this.addToCategory(item)

		item.update();
		
		return item;
	};

	updateInfobox() {
		var container = infoBox.getContainer();
		container.innerHTML = '';
		this.getSelected().forEach((item) => {
			container.append(item.getInfoBox());
		})
		container.style.display = "block";
	};

	deselect() {
		this.getSelected().forEach((item) => {
			item.deselect();
		});
		// Hide Info Box
		var container = infoBox.getContainer();
		container.style.display = "none";
	};

	getSelected() {
		return this.items.filter((item) => {if (item == null) {return false}; return item.selected;});
	};

	import(data) {
		data.items.forEach((itemData) => {
			this.addItem(itemData);
		});
		if (data.map) {
			map.setView([data.map.lat, data.map.lng], data.map.zoom);
		}
	};

	export(sep = '\t', exportPos = true) {
		var data = {
			items: []
		};
		// Add Map Items
		this.items.forEach((item) => {
			if (item == null) {
				return;
			}
			data.items.push(item.export());
		});
		if (exportPos) {
			// Add Map Position
			data.map = this.map.getCenter();
			data.map.zoom = this.map.getZoom();
		}
		return JSON.stringify(data, null, sep);
	};

	addToCategory(item) {
		// Create new category layer if it does not already exist
		if (!(item.category in categoryLayers)) {
			categoryLayers[item.category] = L.layerGroup();
			layerControl.addOverlay(categoryLayers[item.category], item.category);
			categoryLayers[item.category].addTo(map);
		}

		// Add Item to category Layer
		item.addTo(categoryLayers[item.category]);
	};

	removeFromCategory(item) {
		item.leafletItem.removeFrom(categoryLayers[item.category]);
	};

	deleteAllCategories() {
		var layers = Object.values(categoryLayers);
		if (layers.length == 0) {
			return;
		}
		layers.forEach((category) => {
			layerControl.removeLayer(category);
		});
		categoryLayers = {};
	};

	deleteItem(item) {
		item.deselect();
		this.removeFromCategory(item);
		this.items[this.items.indexOf(item)] = null;
	};

	deleteAllItems() {
		this.items.forEach((item) => {
			if (item == null) {return;}
			item.delete();
		})
		this.items = [];
		this.deleteAllCategories();
	};

	copy() {
		var selected = this.getSelected();
		if (selected.length == 0) {
			return;
		}

		this.copyItems = [];
		selected.forEach((item) => {
			this.copyItems.push(item.export());
		});
	};

	paste(pos) {
		if (this.copyItems != null && this.copyItems.length == 0) {
			return;
		}
		// this.copyItems.lat = pos.lat;
		// this.copyItems.lng = pos.lng;
		this.copyItems.forEach((item) => {
			var mapItem = this.addItem(item);
			mapItem.setPosition(pos);
			
		})
	};

	addRevertStep() {
		if (this.revertIndex > -1) {
			this.revertSteps.splice(this.revertSteps.length - this.revertIndex - 1);
			this.revertIndex = -1;
		}
		this.revertSteps.push(this.export('', false));
		// Maybe limit stack size by calling this.revertSteps.shift() once a certain size has been exceeded
	};

	revert() {
		if (this.revertSteps.length - this.revertIndex - 1 < 1) {
			return;
		}
		if (this.revertIndex == -1) {
			this.addRevertStep();
			this.revertIndex = 0;
		}
		this.revertIndex++;
		this.deleteAllItems();
		this.import(JSON.parse(this.revertSteps[this.revertSteps.length - this.revertIndex - 1]));
	};

	repeat() {
		if (this.revertIndex < 1) {
			return;
		}
		this.revertIndex--;
		this.deleteAllItems();
		this.import(JSON.parse(this.revertSteps[this.revertSteps.length - this.revertIndex - 1]));
	};

	getMaterialList() {
		var materials = [];
		this.items.forEach((item) => {
			materials = materials.concat(item.getMaterial());
		});
		var materialList = Utils.countItems(materials);
		var result = "";
		for (const item in materialList)
		{
			result += materialList[item] + "x " + item + "\n";
		}
		return result;
	}
}


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


// Setup the Categories
window.categoryLayers = {};
var layerControl = L.control.layers(baseMaps, categoryLayers).addTo(map);

window.objects = new ItemManager(map);

L.Control.ItemAddControl = L.Control.extend({
	onAdd: function (map) {
		var el = L.DomUtil.create('div', 'leaflet-bar item-add-control');

		items.forEach((item) => {
			const data = {
				xSize: item.width,
				ySize: item.height,
				rotation: 0,
				color: item.color,
				name: item.name,
				category: item.category,
			}

			let btn = L.DomUtil.create('button', '', el);
			var t = document.createTextNode(item.name);
			btn.style.backgroundColor = item.color;
			btn.style.color = Utils.getTextColor(item.color);
			btn.appendChild(t);
			btn.addEventListener("click", (event) => {
				objects.addRevertStep();
				let center = map.getCenter();
				data.lat = center.lat;
				data.lng = center.lng;
				objects.addItem(data);
			});
		});

		return el;
	},

	onRemove: function (map) { }
});

L.Control.GitHubControl = L.Control.extend({
	onAdd: function (map) {
		var el = L.DomUtil.create('div', 'leaflet-bar github-control');
		var a = L.DomUtil.create('a', 'github', el);
		a.setAttribute("href", "https://github.com/mfbehrens99/festmap");
		a.setAttribute("target", "_blank");
		a.innerHTML = '<svg width="70" height="70" viewBox="0 0 250 250"><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" class="octo-body"></path></svg>';
		return el;
	},

	onRemove: function (map) { }
});

L.Control.ExportControl = L.Control.extend({
	select_load: null,
	btn_load: null,
	btn_delete: null,

	onAdd: function (map) {
		var el = L.DomUtil.create('div', 'leaflet-bar export-control');

		L.DomUtil.create('h4', '', el).appendChild(document.createTextNode('Import/Export using text'));

		let form_importExport = L.DomUtil.create('form', '', el);
		form_importExport.addEventListener("submit", (event) => {
			event.preventDefault();
		});
		let btn_import = L.DomUtil.create('button', '', form_importExport);
		btn_import.appendChild(document.createTextNode('Import'));

		btn_import.addEventListener("click", (event) => {
			var data = JSON.parse(prompt("Exportierte JSON eingeben!"));

			objects.deleteAllItems();
			objects.import(data)
		});

		let btn_export = L.DomUtil.create('button', '', form_importExport);
		btn_export.appendChild(document.createTextNode('Export'));

		btn_export.addEventListener("click", (event) => {
			var json = objects.export();
			window.open("data:text/json;charset=utf-8," + encodeURIComponent(json), "", "_blank")
		});

		L.DomUtil.create('h4', '', el).appendChild(document.createTextNode('Load/Save using localStorage'));

		let form_save = L.DomUtil.create('form', '', el);
		let input_save = L.DomUtil.create('input', '', form_save);
		input_save.setAttribute("placeholder", "save name")
		let btn_save = L.DomUtil.create('input', '', form_save);
		btn_save.setAttribute("type", "submit")
		btn_save.value = 'Save';

		form_save.addEventListener("submit", (event) => {
			event.preventDefault(); // to prevent page load
			var data = objects.export();
			var saveName = input_save.value;
			localStorage.setItem(saveName, data);
			this.updateLoadSelect();
			this.select_load.value = saveName
		});

		let form_load = L.DomUtil.create('form', '', el);
		this.select_load = L.DomUtil.create('select', '', form_load);
		this.btn_load = L.DomUtil.create('input', '', form_load);
		this.btn_load.setAttribute("type", "submit")
		this.btn_load.value = 'Load';
		form_load.addEventListener("submit", (event) => {
			event.preventDefault(); // to prevent page load
			var saveName = this.select_load.value;

			var jsonRaw = localStorage.getItem(saveName);

			try {
				var json = JSON.parse(jsonRaw);
				if (json != null) {
					objects.import(json);
				} else {
					throw new SyntaxError("JSON seems to be empty:");
				}
			} catch (e) {
				alert("Save '" + saveName + "' might be corrupted:\n\n" + e.message + "\n\n" + jsonRaw);
			}
		});


		this.btn_delete = L.DomUtil.create('button', '', form_load);
		this.btn_delete.appendChild(document.createTextNode('Delete'));

		this.btn_delete.addEventListener("click", (event) => {
			saveName = this.select_load.value;
			if (confirm("Delete save '" + saveName + "'?")) {
				localStorage.removeItem(saveName)
				this.updateLoadSelect();
			}
		});

		this.updateLoadSelect();
		return el;
	},

	updateLoadSelect() {
		this.select_load.innerHTML = '';

		var option = L.DomUtil.create('option', '', this.select_load);
		option.setAttribute("value", "");
		option.disabled = true;
		option.selected = true;
		option.appendChild(document.createTextNode("Select save..."));


		for (var i = 0; i < localStorage.length; i++) {
			var saveName = localStorage.key(i);

			var option = L.DomUtil.create('option', '', this.select_load);
			option.setAttribute("value", saveName);
			option.appendChild(document.createTextNode(saveName));
		}
		
		var noSaves = localStorage.length == 0;
		this.btn_load.disabled = noSaves;
		this.btn_delete.disabled = noSaves;
	},

	onRemove: function (map) { }
});

L.Control.InfoControl = L.Control.extend({
	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-bar info-box');
		container.style.display = "none";
		L.DomEvent.disableClickPropagation(container);
		L.DomEvent.disableScrollPropagation(container);

		return container;
	},

	onRemove: function (map) { }
});

let itemAdd = new L.Control.ItemAddControl({ position: 'topright' }).addTo(map);
let exportJson = new L.Control.ExportControl({ position: 'topright' }).addTo(map);
let infoBox = new L.Control.InfoControl({ position: 'bottomleft' }).addTo(map);
let github = new L.Control.GitHubControl({ position: 'topleft' }).addTo(map);

if (typeof data !== 'undefined') {
	objects.import(data);
}

