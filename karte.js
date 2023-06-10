const map = L.map('map').setView([49.02000, 8.42317], 20);

const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 22,
	maxNativeZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
	maxZoom: 22,
	subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

var baseMaps = {
	"Google satellite": googleSat,
	"OpenStreetMap": osm,
};

function rotate(x, y, r) {
	r *= Math.PI / 180.0;
	return [
		Math.cos(r) * x - Math.sin(r) * y,
		Math.sin(r) * x + Math.cos(r) * y
	];
}

class Rectangle {
	constructor(latPos, lngPos, xSize, ySize, rotation, color, text, category) {
		this.latPos = latPos;
		this.lngPos = lngPos;
		this.xSize = xSize;
		this.ySize = ySize;
		this.rotation = rotation;
		this.color = color;
		this.text = text;
		this.category = category;
		this.polygon = L.polygon([[0.0,0.0], [0.0,0.0], [0.0,0.0], [0.0,0.0]], {color: color, draggable: true});
		// this.marker = new L.marker([0.0, 0.0], { opacity: 1.0 });
		this.polygon.bindTooltip(text, {
			//permanent: true,
			direction: 'top',
			className: 'my-labels',
			offset: [0, -12],
			sticky: true,
		});

		const rectObj = this;
		this.polygon.on('dragend', function(e) {
			var center = this.getBounds().getCenter();
			// rectObj.marker.setLatLng(center);
			rectObj.latPos = center.lat;
			rectObj.lngPos = center.lng;
			rectObj.update();
			// rectObj.updatePosition();
		  });
		this.update();
	}

	addTo(elem) {
		this.polygon.addTo(elem);
		// this.marker.addTo(elem);
	}

	update() {
		const latLenght = 111300.0; // Meter
		const lngLenght = latLenght * Math.cos(this.latPos / 180.0 * Math.PI); // Meter

		let x1 = 0.5 * (this.xSize * Math.cos(this.rotation) - this.ySize * Math.sin(this.rotation)) / latLenght;
		let y1 = 0.5 * (this.ySize * Math.cos(this.rotation) + this.xSize * Math.sin(this.rotation)) / lngLenght;

		let points = [
			rotate(-this.xSize, this.ySize, this.rotation),
			rotate(this.xSize, this.ySize, this.rotation),
			rotate(this.xSize, -this.ySize, this.rotation),
			rotate(-this.xSize, -this.ySize, this.rotation),
		];
		
		for (let i = 0; i < 4; ++i) {
			points[i][0] /= 2.0 * latLenght;
			points[i][1] /= 2.0 * lngLenght;
			points[i][0] += this.latPos;
			points[i][1] += this.lngPos;
		}

		this.polygon.setLatLngs(points);
		// this.marker.setLatLng([this.latPos, this.lngPos]);
	}

	delete() {
		this.polygon.removeFrom(categoryLayers[this.category]);
	}
}

let categoryLayers = {};
var layerControl = L.control.layers(baseMaps, categoryLayers).addTo(map);

function addRectToCategoryLayer(rect) {
	if (!(rect.category in categoryLayers)) {
		categoryLayers[rect.category] = L.layerGroup();
		layerControl.addOverlay(categoryLayers[rect.category], rect.category);
		categoryLayers[rect.category].addTo(map);
	}
	rect.addTo(categoryLayers[rect.category]);
}

let nextRectNumber = 0;
let rects = [];
let selected = -1;

function selectRect(index) {
	if (index < -1 || index >= rects.length) {
		// Out of index
		return;
	} else if (index == -1) {
		// Select nothing
		infoBox.getContainer().style.display = "none";
	} else {
		// Select Rect
		infoBox.getContainer().style.display = "block";
		

		var rect = rects[index];
		document.getElementById("info_text").value = rect.text;
		document.getElementById("info_xSize").value = rect.xSize;
		document.getElementById("info_ySize").value = rect.ySize;
		// document.getElementById("info_category").value = rect.category;
		document.getElementById("info_color").value = rect.color;
	}

	for (let j = 0; j < rects.length; ++j) {
		rects[j].polygon.setStyle({color: index == j ? 'green' : rects[j].color});
		
		// if (index == j) {
		// 	rects[j].polygon.dragging.enable();
		// } else {
		// 	rects[j].polygon.dragging.disable()
		// }
	}
	selected = index;
}

function addRect(rect) {
	rect.update();
	rects.push(rect);
	addRectToCategoryLayer(rect);
	const i = nextRectNumber;
	nextRectNumber++;
	rect.polygon.on('click', function(e) {
		selectRect(i);
	});
}

function clearRects() {
	for(const [_key, layer] of Object.entries(categoryLayers)) {
		map.removeLayer(layer);
		layerControl.removeLayer(layer);
	}
	categoryLayers = {};
	rects = [];
}

let data = [];
var memoryJSON = JSON.parse(localStorage.getItem("jsondata"));
if (memoryJSON != null) {
	if (confirm("Möchtest du deine letzten Kartendaten wiederherstellen?")) {
		data = memoryJSON;
	}
}


data.forEach((e) => {
	addRect(new Rectangle(e.lat, e.lng, e.width, e.height, e.rotation, e.color, e.name, e.category));
});

let dragging = false;
let rotating = false;
let ctrl = false;
let startLng = 0;
let startRot = 0;
let latDiff = 0;
let lngDiff = 0;
let copyRect = {};

map.on('mousedown', function(e) {
	if (selected < 0) {
		return;
	}
	latDiff = e.latlng.lat - rects[selected].latPos;
	lngDiff = e.latlng.lng - rects[selected].lngPos;
	startLng = e.latlng.lng;
	startRot = rects[selected].rotation;
	dragging = true;
	rotating = ctrl;
});

map.on('mouseup', function(e) {
	dragging = false;
});

map.on('mousemove', function(e) {
	if (dragging) {
		if (rotating) {
			rects[selected].rotation = (startRot + (startLng - e.latlng.lng) * 100000.0) % 360.0; 
		} else {
			rects[selected].latPos = e.latlng.lat - latDiff;
			rects[selected].lngPos = e.latlng.lng - lngDiff;
		}
		rects[selected].update();
	}
});

map.on('keydown', function(e) {
	var key = e.originalEvent.key;
	if (key === "Control") {
		ctrl = true;
	}
	if (key === "Escape") {
		selectRect(-1);
	}
	if (key === "c" && ctrl && selected != -1) {
		// Copy
		var rect = rects[selected];
		copyRect = {
			xSize: rect.xSize,
			ySize: rect.ySize,
			rotation: rect.rotation,
			color: rect.color,
			text: rect.text,
			category: rect.category,
		};
	}
	if (key === "v" && ctrl && copyRect != {}) {
		// Paste
		let center = map.getCenter();
		addRect(new Rectangle(center.lat, center.lng, copyRect.xSize, copyRect.ySize, copyRect.rotation, copyRect.color, copyRect.text, copyRect.category));
		selectRect(nextRectNumber - 1);

	}
	if (key === "Delete" && selected != -1) {
		// Delete
		rects[selected].delete();
		rects.splice(selected, 1);
		selectRect(-1);
	}
});

map.on('keyup', function(e) {
	if (e.originalEvent.key === "Control") {
		ctrl = false;
	}
});

let items = [
	{
		"name": "6x12m Zelt (HaDiKo)",
		"width": 12,
		"height": 6,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "5x10m Zelt (K2-Bar)",
		"width": 10,
		"height": 5,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "3x3m Pavillon",
		"width": 3,
		"height": 3,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "Doppel-Pavillon",
		"width": 6,
		"height": 3,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "Rothaus-Bierinsel",
		"width": 7.5,
		"height": 7.5,
		"color": "yellow",
		"category": "Wagen",
	},
	{
		"name": "Biertisch",
		"width": 2,
		"height": 0.5,
		"color": "orange",
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
		"color": "orange",
		"category": "Biergarnituren",
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"color": "red",
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
		"color": "gray",
		"category": "Abgrenzungen",
	},
	{
		"name": "1x2m Tisch",
		"width": 2.0,
		"height": 1.0,
		"color": "blue",
		"category": "Tische",
	},
	{
		"name": "Stuhl",
		"width": 0.2,
		"height": 0.2,
		"color": "#add8e6",
		"category": "Tische",
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1.0,
		"color": "brown",
		"category": "Sofas",
	},
];

L.Control.ItemAddControl = L.Control.extend({
	onAdd: function(map) {
		var el = L.DomUtil.create('div', 'leaflet-bar item-add-control');

		for (let item in items) {
			const width = items[item].width;
			const height = items[item].height;
			const name = items[item].name;
			const category = items[item].category;
			const color = items[item].color;

			let btn = L.DomUtil.create('button', '', el);
			var t = document.createTextNode(items[item].name);
			btn.style.backgroundColor = color;
			btn.appendChild(t);
			btn.addEventListener("click", (event) => {
				let center = map.getCenter();
				addRect(new Rectangle(center.lat, center.lng, width, height, 0.0, color, name, category));
				selectRect(rects.length - 1);
			});
		}

		return el;
	},

	onRemove: function(map) {
		// Nothing to do here
	}
});

L.Control.ExportControl = L.Control.extend({
	onAdd: function(map) {
		var el = L.DomUtil.create('div', 'leaflet-bar export-control');

		let btn_import = L.DomUtil.create('button', '', el);
		var t_import = document.createTextNode('Import');
		btn_import.appendChild(t_import);

		btn_import.addEventListener("click", (event) => {
			var data = JSON.parse(prompt("Exportierte JSON eingeben!"));

			clearRects();

			data.forEach((e) => {
				addRect(new Rectangle(e.lat, e.lng, e.width, e.height, e.rotation, e.color, e.name, e.category));
			});
		});

		let btn_export = L.DomUtil.create('button', '', el);
		var t_export = document.createTextNode('Export');
		btn_export.appendChild(t_export);

		btn_export.addEventListener("click", (event) => {
			let data = [];
			rects.forEach((rect) => {
				data.push({
					name: rect.text,
					width: rect.xSize,
					height: rect.ySize,
					lat: rect.latPos,
					lng: rect.lngPos,
					rotation: rect.rotation,
					color: rect.color,
					category: rect.category,
				});
			});
			var json = JSON.stringify(data, null, '\t');
			window.open("data:text/json;charset=utf-8," + encodeURIComponent(json), "", "_blank")
		});

		let btn_save = L.DomUtil.create('button', '', el);
		var t = document.createTextNode('Save');
		btn_save.appendChild(t);

		btn_save.addEventListener("click", (event) => {
			let data = [];
			rects.forEach((rect) => {
				data.push({
					name: rect.text,
					width: rect.xSize,
					height: rect.ySize,
					lat: rect.latPos,
					lng: rect.lngPos,
					rotation: rect.rotation,
					color: rect.color,
					category: rect.category,
				});
			});
			var json = JSON.stringify(data, null, '');
			localStorage.setItem("jsondata", json);
		});

		return el;
	},

	onRemove: function(map) {
		// Nothing to do here
	}
});

L.Control.InfoControl = L.Control.extend({
	onAdd: function(map) {
	  var container = L.DomUtil.create('div', 'leaflet-bar info-box');
	  container.innerHTML = `
		<table>
			<tr>
				<td>Name:</td>
				<td><input type="text" id="info_text" onchange="infoBoxUpdateRect()"/></td>
			</tr>
			<tr>
				<td>Größe:</td>
				<td><input type="number" id="info_xSize" size=7 onchange="infoBoxUpdateRect()" /> x <input type="number" id="info_ySize" size=7 onchange="infoBoxUpdateRect()" /></td>
			</tr>
			<!-- <tr>
				<td>Kategorie:</td>
				<td><input type="text" id="info_category" onchange="infoBoxUpdateRect()" /></td>
			</tr> -->
			<tr>
				<td>Farbe:</td>
				<td><input type="color" id="info_color" onchange="infoBoxUpdateRect()" /></td>
			</tr>
		</table>
	  `;

	  return container;
	},

	onRemove: function(map) {
	  // Cleanup code if needed
	}
  });

let itemAdd = new L.Control.ItemAddControl({position: 'topright'}).addTo(map);
let exportJson = new L.Control.ExportControl({position: 'topright'}).addTo(map);
let infoBox = new L.Control.InfoControl({position: 'bottomleft'}).addTo(map);

function infoBoxUpdateRect(){
	var rect = rects[selected];
	rect.text = document.getElementById("info_text").value;
	rect.xSize = document.getElementById("info_xSize").value;
	rect.ySize = document.getElementById("info_ySize").value;
	// rect.category = document.getElementById("info_category").value;
	rect.color = document.getElementById("info_color").value;
	rect.update();
}

selectRect(-1);
