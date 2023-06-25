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

function countItems(list) {
	var count = {};
  
	list.forEach(function(item) {
	  if (count[item]) {
		count[item]++;
	  } else {
		count[item] = 1;
	  }
	});
  
	return count;
  }


// Convert hex color of form "#000000" to [0, 0, 0]
function hexToRgb(hex){
    if (/^#([A-Fa-f0-9]{6})$/.test(hex)) {
        var c = "0x" + hex.substring(1);
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    }
    return [0, 0, 0];
}

// Black for bright backgroundColor, white for dark backgroundColor
function getTextColor(backgroundColor) {
	var colorArr = hexToRgb(backgroundColor);
	var colorGrey = (colorArr[0] + colorArr[1] + colorArr[2]) / 3.0;
	return colorGrey < 100 ? "#fff" : "#000"; // Threshold
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
		if (data.material == null) {
			data.material = [];
		}
		this.material = data.material;
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
			var position = mapItem.getPosition();
			mapItem.lat = position.lat;
			mapItem.lng = position.lng;
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
			this.styleSelected();
		} else {
			this.styleDeselected();
		}
	};

	delete() {
		this.deselect();
		this.leafletItem.removeFrom(categoryLayers[this.category]);
	};

	select() {
		this.selected = true;
		this.update();
		this.itemManager.updateInfobox();
	};

	deselect() {
		this.selected = false;
		this.update();
	};

	setPosition(latLng) {
		this.lat = latLng.lat;
		this.lng = latLng.lng;
		this.update()
	}

	styleSelected() {
		this.leafletItem.setStyle({ color: "green" });
	};

	styleDeselected() {
		this.leafletItem.setStyle({ color: this.color });
	}

	export() {
		return {
			name: this.name,
			category: this.category,
			color: this.color,
			lat: this.lat,
			lng: this.lng,
			material: this.material,
		}
	};

	getPosition() {
		return this.leafletItem.getBounds().getCenter();
	};

	setCategory(category) {
		if (this.category != category) {
			this.itemManager.removeFromCategory(this);
			this.category = category;
			this.itemManager.addToCategory(this)
		}
	}

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
			mapItem.itemManager.addRevertStep();
			mapItem.name = this.value;
			mapItem.update();
		}
		name.append(input_name);

		var row_category = tbl.insertRow();
		var label_category = row_category.insertCell();
		var category = row_category.insertCell();
		label_category.append(document.createTextNode("Kategorie: "));
		var input_category = document.createElement('input');
		input_category.id = "info_category";
		input_category.value = this.category;
		input_category.onchange = function () {
			mapItem.itemManager.addRevertStep();
			mapItem.setCategory(this.value);
			mapItem.update();
		}
		category.append(input_category);

		var row_color = tbl.insertRow();
		var label_color = row_color.insertCell();
		var color = row_color.insertCell();
		label_color.append(document.createTextNode("Color: "));
		var input_color = document.createElement('input');
		input_color.id = "info_name";
		input_color.type = "color";
		input_color.value = this.color;
		input_color.onchange = function () {
			mapItem.itemManager.addRevertStep();
			mapItem.color = this.value;
			mapItem.update();
		}
		color.append(input_color);

		return tbl;
	};

	getMaterial() {
		if (this.material.length == 0) {
			return [this.name];
		}
		else {
			return this.material;
		}
	}
};

class MarkerItem extends MapItem {
	constructor(parent, data) {
		super(parent, data);
		// var icon = new L.icon();
		this.leafletItem = new L.marker([data.lat, data.lng], {draggable: true});
	};

	getPosition() {
		return this.leafletItem.getLatLng();
	};

	styleSelected() {};

	styleDeselected() {};
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
			mapItem.itemManager.addRevertStep();
			mapItem.xSize = this.value;
			mapItem.update();
		}
		var input_ySize = document.createElement('input');
		input_ySize.type = "number";
		input_ySize.size = "6"
		input_ySize.value = this.ySize;
		input_ySize.onchange = function () {
			mapItem.itemManager.addRevertStep();
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
			mapItem.itemManager.addRevertStep();
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

		this.length_text = document.createTextNode("");
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

		this.length_text.nodeValue = this.getLength().toFixed(1).toString() + " m";
	};

	select() {
		super.select();
		// Spawn point handlers
		const mapItem = this;
		this.markers = [];
		var latLngs = this.leafletItem.getLatLngs();
		latLngs.forEach((latLng, i) => {
			const marker = new L.circleMarker(latLng, {radius: 8, fillOpacity: 1, draggable: true});
			marker.on("dragstart", (e) => {
				mapItem.itemManager.addRevertStep();
			});
			marker.on("drag", (e) => {
				mapItem.updatePoint(i, marker.getLatLng())
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
			marker.on("dragstart", (e) => {
				m.setStyle({color: '#3388ff', radius: 8});
			});
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

	setPosition(latLng) {
		var latLngs = this.leafletItem.getLatLngs();
		var offsetLat = latLng.lat - latLngs[0].lat;
		var offsetLng = latLng.lng - latLngs[0].lng;
		latLngs.forEach((l) => {
			l.lat += offsetLat;
			l.lng += offsetLng;
		});
		this.leafletItem.setLatLngs(latLngs);
		this.update();
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

	getInfoBox() {
		const mapItem = this;
		var tbl = super.getInfoBox()

		var row_length = tbl.insertRow();
		var label_length = row_length.insertCell();
		var length = row_length.insertCell();
		label_length.append(document.createTextNode("Länge: "));
		length.append(this.length_text);

		return tbl;
	};

	export() {
		var json = super.export();
		json.type = "Path";
		json.latLngs = this.leafletItem.getLatLngs();
		return json;
	};

	getLength() {
		var latLngs = this.leafletItem.getLatLngs();
		var length = 0;

		if (latLngs.length < 2) {
			return 0;
		}

		for (var i = 0; i < latLngs.length - 1; i++) {
			length += latLngs[i].distanceTo(latLngs[i + 1]);
		}
		return length;
	}
}

class Cable extends Path {
	constructor(itemManager, data) {
		super(itemManager, data);

		this.length = data.length;
		this.current = data.current;
	}

	getInfoBox() {
		const mapItem = this;
		var tbl = super.getInfoBox()

		var row_length = tbl.insertRow();
		var label_length = row_length.insertCell();
		var length = row_length.insertCell();
		label_length.append(document.createTextNode("Länge: "));
		var input_length = document.createElement('input');
		input_length.type = "number";
		input_length.value = this.length;
		input_length.onchange = function () {
			mapItem.itemManager.addRevertStep();
			mapItem.length = this.value;
			mapItem.update();
		};
		length.append(input_length);

		const currentItems = ["Schuko", "16A", "32A", "63A", "125A"]
		var row_current = tbl.insertRow();
		var label_current = row_current.insertCell();
		var current = row_current.insertCell();
		label_current.append(document.createTextNode("Länge: "));
		var select_current = document.createElement('select');
		currentItems.forEach((item) => {
			var option = document.createElement("option");
			option.value = item;
			option.text = item;
			if (item == this.current) {
				option.selected ="selected";
			}
			select_current.appendChild(option);
		});
		// select_current.type = "number";
		select_current.value = this.current;
		select_current.onchange = function () {
			mapItem.itemManager.addRevertStep();
			mapItem.current = this.value;
			mapItem.update();
		};
		current.append(select_current);
		

		return tbl;
	};

	export() {
		var json = super.export();
		json.type = "Cable";
		json.length = this.length;
		json.current = this.current;
		return json;
	};
}

class Socket extends MarkerItem {
	constructor(parent, data) {
		super(parent, data);
	};


}

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
		var materialList = countItems(materials);
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
let categoryLayers = {};
var layerControl = L.control.layers(baseMaps, categoryLayers).addTo(map);

let objects = new ItemManager(map);

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
			btn.style.color = getTextColor(item.color);
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
			saveName = this.select_load.value;

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

