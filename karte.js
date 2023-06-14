// Utils
function rotate(x, y, r) {
	r *= Math.PI / 180.0;
	return [
		Math.cos(r) * x - Math.sin(r) * y,
		Math.sin(r) * x + Math.cos(r) * y
	];
}

function calculateRotationAngle(latlngPivot, latlngMouse) {
	var dx = latlngMouse.lng - latlngPivot.lng;
	var dy = latlngMouse.lat - latlngPivot.lat;
	return Math.atan2(dx, dy) * (180 / Math.PI);
}


// Map Items
class MapItem {
	constructor(itemManager, data) {
		this.itemManager = itemManager;
		if (data.name == null || data.category == null || data.color == null) {
			console.log(data);
			throw "Name, Kategorie und Farbe müssen angegeben werden."
		}
		this.name = data.name;
		this.category = data.category;
		this.color = data.color;

		if (data.lat == null || data.lng == null) {
			console.log(data);
			throw "Die Position muss angegeben werden.";
		}
		this.lat = data.lat;
		this.lng = data.lng;
		this.leafletItem = {};
		this.selected = false;
	};

	addTo(elem) {
		this.leafletItem.bindTooltip(this.name, {
			//permanent: true,
			direction: 'top',
			className: 'my-labels',
			offset: [0, -12],
			sticky: true,
		});

		// Dragging
		const mapItem = this;
		this.leafletItem.on('dragstart', function (e) {
			objects.addRevertStep();
		});
		this.leafletItem.on('dragend', function (e) {
			// Update the item whenever the polygon has been moved
			var center = mapItem.leafletItem.getBounds().getCenter();
			mapItem.lat = center.lat;
			mapItem.lng = center.lng;
			mapItem.update();
		});

		// Selecting
		this.leafletItem.on('click', function (e) {
			if (e.originalEvent.ctrlKey) {
				// Multi select
				if (mapItem.selected) {
					mapItem.deselect();
				} else {
					mapItem.select();
				}
			} else {
				mapItem.itemManager.deselect();
				mapItem.select();
			}
		});

		this.leafletItem.addTo(elem);
		this.update();
	};

	update() {
		if (this.leafletItem.getTooltip().getContent() != this.name) {
			this.leafletItem.getTooltip().setContent(this.name);
		}

		if (this.selected) {
			this.leafletItem.setStyle({ color: "green" });
		} else {
			this.leafletItem.setStyle({ color: this.color });
		}
	};

	delete() {
		this.leafletItem.removeFrom(categoryLayers[this.category]);
	};

	select() {
		this.selected = true;
		this.update();
		this.itemManager.updateInfobox();
	}

	deselect() {
		this.selected = false;
		this.update();
	}

	export() {
		return {
			name: this.name,
			category: this.category,
			color: this.color,
			lat: this.lat,
			lng: this.lng,
		}
	};

	getInfoBox() {
		const mapItem = this;
		var tbl = document.createElement('table');

		var row_name = tbl.insertRow();
		var label_name = row_name.insertCell();
		var name = row_name.insertCell();
		label_name.append(document.createTextNode("Name: "));
		var input_name = document.createElement('input');
		input_name.id = "info_name";
		input_name.value = this.name;
		input_name.onchange = function () {
			objects.addRevertStep();
			mapItem.name = this.value;
			mapItem.update();
		}
		name.append(input_name);

		// Kategorie

		var row_color = tbl.insertRow();
		var label_color = row_color.insertCell();
		var color = row_color.insertCell();
		label_color.append(document.createTextNode("Color: "));
		var input_color = document.createElement('input');
		input_color.id = "info_name";
		input_color.type = "color";
		input_color.value = this.color;
		input_color.onchange = function () {
			objects.addRevertStep();
			mapItem.color = this.value;
			mapItem.update();
		}
		color.append(input_color);

		return tbl;
	};
};

class Rectangle extends MapItem {
	constructor(itemManager, data) {
		super(itemManager, data);
		if (data.xSize == null || data.ySize == null || data.rotation == null) {
			console.log(data);
			throw "Die Dimensionen und die Rotation muss für ein Rechteck angegeben werden.";
		}
		this.xSize = data.xSize;
		this.ySize = data.ySize;
		this.rotation = data.rotation;

		this.leafletItem = L.polygon([[0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]], { color: data.color, draggable: true });

		this.mouseDownHandler = (e) => {
			if (e.originalEvent.button == 2) {
				objects.addRevertStep();
			}
			this.startRot = this.rotation - calculateRotationAngle(this.leafletItem.getBounds().getCenter(), e.latlng);
		};
		this.mouseMoveHandler = (e) => {
			if (e.originalEvent.buttons == 2) {
				this.rotation = (this.startRot + calculateRotationAngle(this.leafletItem.getBounds().getCenter(), e.latlng)) % 360.0;
				this.update();
			}
		};
	}

	update() {
		super.update();

		const latLenght = 111300.0; // Meter
		const lngLenght = latLenght * Math.cos(this.lat / 180.0 * Math.PI); // Meter

		let points = [
			rotate(-this.xSize, this.ySize, this.rotation),
			rotate(this.xSize, this.ySize, this.rotation),
			rotate(this.xSize, -this.ySize, this.rotation),
			rotate(-this.xSize, -this.ySize, this.rotation),
		];

		for (let i = 0; i < 4; ++i) {
			points[i][0] /= 2.0 * latLenght;
			points[i][1] /= 2.0 * lngLenght;
			points[i][0] += this.lat;
			points[i][1] += this.lng;
		}

		this.leafletItem.setLatLngs(points);
	};

	export() {
		var json = super.export();
		json.type = "Rectangle";
		json.xSize = this.xSize;
		json.ySize = this.ySize;
		json.rotation = this.rotation;
		return json;
	};

	select() {
		super.select()
		this.itemManager.map.on('mousedown', this.mouseDownHandler);
		this.itemManager.map.on('mousemove', this.mouseMoveHandler);
	}

	deselect() {
		super.deselect()
		this.itemManager.map.off('mousedown', this.mouseDownHandler);
		this.itemManager.map.off('mousemove', this.mouseMoveHandler);
	}

	getInfoBox() {
		const mapItem = this;
		var tbl = super.getInfoBox()

		var row_size = tbl.insertRow();
		var label_size = row_size.insertCell();
		var size = row_size.insertCell();
		label_size.append(document.createTextNode("Size: "));
		var input_xSize = document.createElement('input');
		input_xSize.type = "number";
		input_xSize.size = "6"
		input_xSize.value = this.xSize;
		input_xSize.onchange = function () {
			objects.addRevertStep();
			mapItem.xSize = this.value;
			mapItem.update();
		}
		var input_ySize = document.createElement('input');
		input_ySize.type = "number";
		input_ySize.size = "6"
		input_ySize.value = this.ySize;
		input_ySize.onchange = function () {
			objects.addRevertStep();
			mapItem.ySize = this.value;
			mapItem.update();
		}
		size.append(input_xSize);
		size.append(document.createTextNode(" x "));
		size.append(input_ySize);

		return tbl;
	};

};

class Circle extends MapItem {
	constructor(itemManager, data) {
		super(itemManager, data);
		if (data.radius == null) {
			throw "Der Radius muss für einen Kreis angegeben werden.";
		}
		this.radius = data.radius;

		this.leafletItem = L.circle([0.0, 0.0], { radius: this.radius, color: data.color, draggable: true });
	};

	update() {
		super.update();
		this.leafletItem.setLatLng(L.latLng(this.lat, this.lng))
		this.leafletItem.setRadius(this.radius);
	};

	export() {
		var json = super.export()
		json.type = "Circle";
		json.radius = this.radius;
		return json;
	}

	getInfoBox() {
		const mapItem = this;
		var tbl = super.getInfoBox()

		var row_radius = tbl.insertRow();
		var label_radius = row_radius.insertCell();
		var radius = row_radius.insertCell();
		label_radius.append(document.createTextNode("Radius: "));
		var input_radius = document.createElement('input');
		input_radius.type = "number";
		input_radius.value = this.radius;
		input_radius.onchange = function () {
			objects.addRevertStep();
			mapItem.radius = this.value;
			mapItem.update();
		}

		radius.append(input_radius);

		return tbl;
	};
};

class Path extends MapItem {
	constructor(itemManager, data) {
		super(itemManager, data);
		if (data.latLngs == null) {
			throw "Die Liste der Punkte muss für einen Weg angegeben werden.";
		}
		this.markers = [];
		this.interMarkers = [];

		this.leafletItem = L.polyline(data.latLngs, {color: data.color, draggable: true });
	};

	addTo(elem) {
		super.addTo(elem);

		const mapItem = this;

		this.leafletItem.on('dragend', function (e) {
			// Update the item whenever the polygon has been moved
			// mapItem.latLngs = mapItem.leafletItem.getLatLngs();
			// mapItem.update();
		});

		this.leafletItem.on("drag", (e) => {mapItem.update()});
	};

	update() {
		// this.leafletItem.setLatLngs(this.latLngs);
		super.update();
		this.leafletItem.redraw();

		var latLngs = this.leafletItem.getLatLngs();
		this.markers.forEach((marker, i) => {
			marker.setLatLng(latLngs[i]);
		});
		for (var i = 0; i < this.markers.length - 1; i++) {
			var midpoint = L.latLngBounds(latLngs[i], latLngs[i + 1]).getCenter();
			this.interMarkers[i].setLatLng(midpoint);
		}
	};

	delete() {
		super.delete();
		this.markers.forEach((marker) => {
			marker.removeFrom(this.itemManager.map);
		});
		this.interMarkers.forEach((marker) => {
			marker.removeFrom(this.itemManager.map);
		});
	};

	select() {
		super.select();
		// Spawn point handlers
		const mapItem = this;
		this.markers = [];
		var latLngs = this.leafletItem.getLatLngs();
		latLngs.forEach((latLng, i) => {
			var marker = new L.circleMarker(latLng, {radius: 8, fillOpacity: 1, draggable: true});
			marker.on("dragstart", (e) => {
				mapItem.itemManager.addRevertStep();
			});
			marker.on("drag", (e) => {
				mapItem.updatePoint(i, e.latlng)
			});
			marker.on("contextmenu", (e) => {
				mapItem.deletePoint(i);
			});
			this.markers.push(marker);
			marker.addTo(this.itemManager.map);
		});
		this.interMarkers = [];
		for (var i = 0; i < this.markers.length - 1; i++) {
			var midpoint = L.latLngBounds(latLngs[i], latLngs[i + 1]).getCenter();
			var marker = new L.circleMarker(midpoint, {color: "green", radius: 4, draggable: true, fillOpacity: 1});
			const m = marker;
			const index = i + 1;
			marker.on("click", (e) => {
				mapItem.addPoint(index, m.getLatLng());
			})
			marker.on("dragend", (e) => {
				mapItem.addPoint(index, m.getLatLng());
			})
			this.interMarkers.push(marker);
			marker.addTo(this.itemManager.map);
		}
	};

	deselect() {
		this.markers.forEach((marker) => {
			marker.removeFrom(this.itemManager.map);
		});
		this.markers = [];
		this.interMarkers.forEach((marker) => {
			marker.removeFrom(this.itemManager.map);
		});
		this.interMarkers = [];
		super.deselect();
	};

	addPoint(i, latLng) {
		this.itemManager.addRevertStep();
		var latLngs = this.leafletItem.getLatLngs();
		latLngs.splice(i, 0, latLng);
		this.leafletItem.setLatLngs(latLngs);
		this.deselect();
		this.select();
		this.update();
	};

	updatePoint(i, latLng) {
		var latLngs = this.leafletItem.getLatLngs();
		latLngs[i] = latLng;
		this.leafletItem.setLatLngs(latLngs);
		this.update();
	};

	deletePoint(i) {
		this.itemManager.addRevertStep();
		var latLngs = this.leafletItem.getLatLngs();
		latLngs.splice(i, 1);
		this.leafletItem.setLatLngs(latLngs);
		this.deselect();
		this.select();
		this.update();
	};

	export() {
		var json = super.export();
		json.type = "Path";
		json.latLngs = this.leafletItem.getLatLngs();
		return json;
	};
}

class ItemManager {
	constructor(map) {
		this.map = map;
		this.items = [];
		this.copyItems = null;
		this.revertSteps = [];
		this.revertIndex = -1;
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
			case "Path" :
				item = new Path(this, itemData);
				break;
			default:
				item = new Rectangle(this, itemData);
				console.log(itemData);
				break;
		}

		// Add Item to Items list
		this.items.push(item);

		// Create new category layer if it does not already exist
		if (!(item.category in categoryLayers)) {
			categoryLayers[item.category] = L.layerGroup();
			layerControl.addOverlay(categoryLayers[item.category], item.category);
			categoryLayers[item.category].addTo(map);
		}

		// Add Item to category Layer
		item.addTo(categoryLayers[item.category]);

		item.update();
		// this.select(i);
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
		return this.items.filter(item => item.selected);
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
			data.map = map.getCenter();
			data.map.zoom = map.getZoom();
		}
		return JSON.stringify(data, null, sep);
	};

	deleteItem(item) {
		item.leafletItem.removeFrom(categoryLayers[item.category]);
		item.deselect();
		this.items[this.items.indexOf(item)] = null;
	}

	deleteAllItems() {
		this.items.forEach((item) => {
			item.delete();
		})
		categoryLayers = {};
		this.items = [];
	};

	copy() {
		var selected = this.getSelected();
		if (selected.length == 0) {
			return;
		}

		this.copyItems = [];
		selected.foreach((item) => {
			this.copyItems.push(item.export());
		});
	};

	paste(pos) {
		if (this.copyItems.length == 0) {
			return;
		}
		// this.copyItems.lat = pos.lat;
		// this.copyItems.lng = pos.lng;
		this.copyItems.forEach((item) => {
			this.addItem(item);
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
	}

	repeat() {
		if (this.revertIndex < 1) {
			return;
		}
		this.revertIndex--;
		this.deleteAllItems();
		this.import(JSON.parse(this.revertSteps[this.revertSteps.length - this.revertIndex - 1]));
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
let categoryLayers = {};
var layerControl = L.control.layers(baseMaps, categoryLayers).addTo(map);


let objects = new ItemManager(map);

// When clicked into empty map
map.on('click', function (e) {
	if (e.originalEvent.target === map.getContainer()) {
		objects.deselect();
	}
})


// Hotkeys
map.on('keydown', function (e) {
	var key = e.originalEvent.key;
	if (key === "Escape") {
		objects.deselect();
	}
	else if (key === "c" && e.originalEvent.ctrlKey) {
		// Copy
		objects.copy();
	}
	else if (key === "v" && e.originalEvent.ctrlKey) {
		// Paste
		objects.addRevertStep();
		let position = map.getCenter();
		objects.paste(position);
	}
	else if (key === "x" && e.originalEvent.ctrlKey) {
		// Cut
		objects.copy();
		objects.addRevertStep();
		objects.deleteItem(objects.selected);
	}
	else if (key === "z" && e.originalEvent.ctrlKey) {
		// Revert
		objects.revert();
	}
	else if (key === "y" && e.originalEvent.ctrlKey) {
		// Repeat
		objects.repeat();
	}
	else if (key === "Delete" && objects.getSelected().length > 0) {
		// Delete
		objects.addRevertStep();
		objects.getSelected().forEach((item) => {objects.deleteItem(item);});
	}
});

let items = [
	{
		"name": "6x12m Zelt (HaDiKo)",
		"width": 12,
		"height": 6,
		"color": "#ffffff",
		"category": "Zelte",
	},
	{
		"name": "5x10m Zelt (K2-Bar)",
		"width": 10,
		"height": 5,
		"color": "#ffffff",
		"category": "Zelte",
	},
	{
		"name": "3x3m Pavillon",
		"width": 3,
		"height": 3,
		"color": "#ffffff",
		"category": "Zelte",
	},
	{
		"name": "Doppel-Pavillon",
		"width": 6,
		"height": 3,
		"color": "#ffffff",
		"category": "Zelte",
	},
	{
		"name": "Rothaus-Bierinsel",
		"width": 7.5,
		"height": 7.5,
		"color": "#FFFF00",
		"category": "Wagen",
	},
	{
		"name": "Biertisch",
		"width": 2,
		"height": 0.5,
		"color": "#ffa500",
		"category": "Biergarnituren",
	},
	{
		"name": "Biertisch überbreit",
		"width": 2.2,
		"height": 0.8,
		"color": "#FAB57F",
		"category": "Biergarnituren",
	},
	{
		"name": "Bierbank",
		"width": 2,
		"height": 0.25,
		"color": "#ffa500",
		"category": "Biergarnituren",
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"color": "#ff0000",
		"category": "Biergarnituren",
	},
	{
		"name": "Kühlschrank",
		"width": 1,
		"height": 1,
		"color": "#2f4f4f",
		"category": "Kühlgeräte",
	},
	{
		"name": "Eistruhe",
		"width": 1.5,
		"height": 1,
		"color": "#2f2f2f",
		"category": "Kühlgeräte",
	},
	{
		"name": "Spüle",
		"width": 1.5,
		"height": 1,
		"color": "#BCC6CC",
		"category": "Sanitär",
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"color": "#808080",
		"category": "Abgrenzungen",
	},
	{
		"name": "1x2m Tisch",
		"width": 2.0,
		"height": 1.0,
		"color": "#0000FF",
		"category": "Tische",
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1.0,
		"color": "#a52a2a",
		"category": "Sofas",
	},
];

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
			btn.appendChild(t);
			btn.addEventListener("click", (event) => {
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

L.Control.ExportControl = L.Control.extend({
	onAdd: function (map) {
		var el = L.DomUtil.create('div', 'leaflet-bar export-control');

		let btn_import = L.DomUtil.create('button', '', el);
		var t_import = document.createTextNode('Import');
		btn_import.appendChild(t_import);

		btn_import.addEventListener("click", (event) => {
			var data = JSON.parse(prompt("Exportierte JSON eingeben!"));

			objects.deleteAllItems();
			objects.import(data)
		});

		let btn_export = L.DomUtil.create('button', '', el);
		var t_export = document.createTextNode('Export');
		btn_export.appendChild(t_export);

		btn_export.addEventListener("click", (event) => {
			var json = objects.export();
			window.open("data:text/json;charset=utf-8," + encodeURIComponent(json), "", "_blank")
		});

		let btn_save = L.DomUtil.create('button', '', el);
		var t = document.createTextNode('Save');
		btn_save.appendChild(t);

		btn_save.addEventListener("click", (event) => {
			var data = objects.export();
			localStorage.setItem("jsondata", data);
		});

		return el;
	},

	onRemove: function (map) { }
});

L.Control.InfoControl = L.Control.extend({
	onAdd: function (map) {
		var container = L.DomUtil.create('div', 'leaflet-bar info-box');
		L.DomEvent.disableClickPropagation(container);
		L.DomEvent.disableScrollPropagation(container);

		return container;
	},

	onRemove: function (map) { }
});

let itemAdd = new L.Control.ItemAddControl({ position: 'topright' }).addTo(map);
let exportJson = new L.Control.ExportControl({ position: 'topright' }).addTo(map);
let infoBox = new L.Control.InfoControl({ position: 'bottomleft' }).addTo(map);

if (typeof data !== 'undefined') {
	objects.import(data);
}
else {
	let data = [];
	var memoryJSON = JSON.parse(localStorage.getItem("jsondata"));
	if (memoryJSON != null) {
		if (confirm("Möchtest du deine letzten Kartendaten wiederherstellen?")) {
			data = memoryJSON;
		}
	}

	objects.import(data);
}
