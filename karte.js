// Utils
function rotate(x, y, r) {
	r *= Math.PI / 180.0;
	return [
		Math.cos(r) * x - Math.sin(r) * y,
		Math.sin(r) * x + Math.cos(r) * y
	];
}

function calculateRotationAngle(latlngPivot, latlngMouse) {
	// var center = rect.polygon.getBounds().getCenter();
	var dx = latlngMouse.lng - latlngPivot.lng;
	var dy = latlngMouse.lat - latlngPivot.lat;
	return Math.atan2(dx, dy) * (180 / Math.PI);
}


// Map Items
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
			// Update the rectangle object whenever the polygon has been moved
			var center = this.getBounds().getCenter();
			rectObj.latPos = center.lat;
			rectObj.lngPos = center.lng;
			rectObj.update();
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


class ObjectManager {
	constructor(layerControl, categoryLayers) {
		this.rects = [];
		this.selected = -1;
		this.copyRect = {}
	};

	addRect(rect) {
		rect.update();
		this.rects.push(rect);
		this.addRectToCategoryLayer(rect);

		// Setup select rect handler
		const objMan = this;
		const i = this.rects.length - 1;
		rect.polygon.on('click', function(e) {
			objMan.select(i);
		});
		this.select(i);
	};

	select(index) {
		if (index < -1 || index >= this.rects.length) {
			// Out of index
			return;
		} else if (index == -1) {
			// Select nothing
			infoBox.getContainer().style.display = "none";
		} else {
			// Select Rect
			infoBox.getContainer().style.display = "block";
			
	
			var rect = this.rects[index];
			document.getElementById("info_text").value = rect.text;
			document.getElementById("info_xSize").value = rect.xSize;
			document.getElementById("info_ySize").value = rect.ySize;
			// document.getElementById("info_category").value = rect.category;
			document.getElementById("info_color").value = rect.color;
		}
	
		for (let j = 0; j < this.rects.length; ++j) {
			if (this.rects[j] == null) {
				continue;
			}
			this.rects[j].polygon.setStyle({color: index == j ? 'green' : this.rects[j].color});
			
			// if (index == j) {
			// 	rects[j].polygon.dragging.enable();
			// } else {
			// 	rects[j].polygon.dragging.disable()
			// }
		}
		this.selected = index;
	};

	deselect() {
		this.select(-1);
	};

	getSelected() {
		if (this.selected == -1) {
			return null;
		}
		return this.rects[this.selected];
	};

	addRectToCategoryLayer(rect) {
		if (!(rect.category in categoryLayers)) {
			categoryLayers[rect.category] = L.layerGroup();
			layerControl.addOverlay(categoryLayers[rect.category], rect.category);
			categoryLayers[rect.category].addTo(map);
		}
		rect.addTo(categoryLayers[rect.category]);
	};

	addRects(data) {
		data.forEach((r) => {
			this.addRect(new Rectangle(r.lat, r.lng, r.width, r.height, r.rotation, r.color, r.name, r.category));
		});
	};
	
	exportRects() {
		let data = [];
		this.rects.forEach((rect) => {
			if (rect == null) {
				return;
			}
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
		return JSON.stringify(data, null, '\t');
	};

	deleteRect(id) {
		var rect = this.rects[id];
		rect.polygon.removeFrom(categoryLayers[rect.category]);
		delete this.rects[id];
		if (this.selected == id){
			this.deselect();
		}
	}

	clearRects() {
		for(const [_key, layer] of Object.entries(this.categoryLayers)) {
			map.removeLayer(layer);
			this.layerControl.removeLayer(layer);
		}
		categoryLayers = {};
		rects = [];
	};

	copy() {
		var rect = this.getSelected();
		if (rect == null) {
			return;
		}

		this.copyRect = {
			xSize: rect.xSize,
			ySize: rect.ySize,
			rotation: rect.rotation,
			color: rect.color,
			text: rect.text,
			category: rect.category,
		};
	}

	paste(pos) {
		if (this.copyRect == null) {
			return;
		}
		objects.addRect(new Rectangle(pos.lat, pos.lng, this.copyRect.xSize, this.copyRect.ySize, this.copyRect.rotation, this.copyRect.color, this.copyRect.text, this.copyRect.category));
	}
}


// Setup Map
const map = L.map('map').setView([49.02000, 8.42317], 20);


// Add Background imagery
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


// Setup the Categories
let categoryLayers = {};
var layerControl = L.control.layers(baseMaps, categoryLayers).addTo(map);


let objects = new ObjectManager(layerControl, categoryLayers);



// Object Rotation
let startRot = 0;

map.on('mousedown', function(e) {
	var selected = objects.getSelected();
	if (selected == null) {
		return;
	}
	startRot = selected.rotation - calculateRotationAngle(selected.polygon.getBounds().getCenter(), e.latlng);

	// Ctrl+Z function for Rotation
	revertRects = objects.exportRects();
});

map.on('mousemove', function(e) {
	var selected = objects.getSelected();
	if (selected == null) {
		return;
	}
	if (e.originalEvent.buttons == 2) {
		selected.rotation = (startRot + calculateRotationAngle(selected.polygon.getBounds().getCenter(), e.latlng)) % 360.0; 
		selected.update();
	}
});


// Hotkeys
let revertRects = null;

map.on('keydown', function(e) {
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
		let position = map.getCenter();
		objects.paste(position);
	}
	else if (key === "z" && e.originalEvent.ctrlKey && revertRects != null) {
		// Revert
		objects.clearRects();
		objects.addRects(JSON.parse(revertRects));
	}
	else if (key === "Delete" && objects.getSelected() != null) {
		// Delete
		objects.deleteRect(objects.selected)
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
				objects.addRect(new Rectangle(center.lat, center.lng, width, height, 0.0, color, name, category));
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

			objects.clearRects();
			objects.addRects(data)
		});

		let btn_export = L.DomUtil.create('button', '', el);
		var t_export = document.createTextNode('Export');
		btn_export.appendChild(t_export);

		btn_export.addEventListener("click", (event) => {
			var json = objects.exportRects();
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
	var rect = objects.getSelected();
	rect.text = document.getElementById("info_text").value;
	rect.xSize = document.getElementById("info_xSize").value;
	rect.ySize = document.getElementById("info_ySize").value;
	// rect.category = document.getElementById("info_category").value;
	rect.color = document.getElementById("info_color").value;
	rect.update();
}

let data = [];
var memoryJSON = JSON.parse(localStorage.getItem("jsondata"));
if (memoryJSON != null) {
	if (confirm("Möchtest du deine letzten Kartendaten wiederherstellen?")) {
		data = memoryJSON;
	}
}


objects.addRects(data);

objects.deselect();
