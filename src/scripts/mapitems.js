import 'leaflet-draw'
import 'leaflet-path-drag'

import Utils from "./utils.js";

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

		// Attach handlers
		this.leafletItem.on('dragstart', this._onDragStart.bind(this));
		this.leafletItem.on('dragend', this._onDragEnd.bind(this));
		this.leafletItem.on('click', this._onClick.bind(this));

		this.leafletItem.addTo(elem);
		this.update();
	};

	_onDragStart(e) {
		this.itemManager.addRevertStep();
	};

	_onDragEnd(e) {
		// Update the item whenever the polygon has been moved
		var position = this.getPosition();
		this.lat = position.lat;
		this.lng = position.lng;
		this.update();
	};

	_onClick(e) {
		if (e.originalEvent.ctrlKey) {
			// Multi select
			if (this.selected) {
				this.deselect();
			} else {
				this.select();
			}
		} else {
			this.itemManager.deselect();
			this.select();
		}
	}

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
		this.leafletItem.removeFrom(this.itemManager.categoryLayers[this.category]);
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
	};

	getInfoBox() {
		var tbl = document.createElement('table');

		var row_name = tbl.insertRow();
		var label_name = row_name.insertCell();
		var name = row_name.insertCell();
		label_name.append(document.createTextNode("Name: "));
		var input_name = document.createElement('input');
		input_name.id = "info_name";
		input_name.value = this.name;
		input_name.onchange = this._onInfoBoxNameChange.bind(this);
		name.append(input_name);

		var row_category = tbl.insertRow();
		var label_category = row_category.insertCell();
		var category = row_category.insertCell();
		label_category.append(document.createTextNode("Kategorie: "));
		var input_category = document.createElement('input');
		input_category.id = "info_category";
		input_category.value = this.category;
		input_category.onchange = this._onInfoBoxCategoryChange.bind(this);
		category.append(input_category);

		var row_color = tbl.insertRow();
		var label_color = row_color.insertCell();
		var color = row_color.insertCell();
		label_color.append(document.createTextNode("Color: "));
		var input_color = document.createElement('input');
		input_color.id = "info_name";
		input_color.type = "color";
		input_color.value = this.color;
		input_color.onchange = this._onInfoBoxColorChange.bind(this);
		color.append(input_color);

		return tbl;
	};

	_onInfoBoxNameChange(e) {
		this.itemManager.addRevertStep();
		this.name = e.target.value;
		this.update();
	};
	_onInfoBoxCategoryChange(e) {
		this.itemManager.addRevertStep();
		this.setCategory(e.target.value);
		this.update();
	};
	_onInfoBoxColorChange(e) {
		this.itemManager.addRevertStep();
		this.color = e.target.value;
		this.update();
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

export class MarkerItem extends MapItem {
	constructor(parent, data) {
		super(parent, data);
		// var icon = new L.icon();
		this.leafletItem = new L.marker([data.lat, data.lng], {draggable: true});

		// Bind function for rotation
	};

	getPosition() {
		return this.leafletItem.getLatLng();
	};

	styleSelected() {};

	styleDeselected() {};
};

export class Rectangle extends MapItem {
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

		this._onMouseDown = this._onMouseDown.bind(this);
		this._onMouseMove = this._onMouseMove.bind(this);
	};

	_onMouseDown(e) {
		if (e.originalEvent.button == 2) {
			this.itemManager.addRevertStep();
		}
		this.startRot = this.rotation - Utils.calculateRotationAngle(this.leafletItem.getBounds().getCenter(), e.latlng);
	};

	_onMouseMove(e) {
		if (e.originalEvent.buttons == 2) {
			this.rotation = (this.startRot + Utils.calculateRotationAngle(this.leafletItem.getBounds().getCenter(), e.latlng)) % 360.0;
			this.update();
		}
	};

	update() {
		super.update();

		const latLenght = 111300.0; // Meter
		const lngLenght = latLenght * Math.cos(this.lat / 180.0 * Math.PI); // Meter

		let points = [
			Utils.rotate(-this.xSize, this.ySize, this.rotation),
			Utils.rotate(this.xSize, this.ySize, this.rotation),
			Utils.rotate(this.xSize, -this.ySize, this.rotation),
			Utils.rotate(-this.xSize, -this.ySize, this.rotation),
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
		super.select();
		this.itemManager.map.on('mousedown', this._onMouseDown);
		this.itemManager.map.on('mousemove', this._onMouseMove);
	  }
	  
	  deselect() {
		super.deselect();
		this.itemManager.map.off('mousedown', this._onMouseDown);
		this.itemManager.map.off('mousemove', this._onMouseMove);
	  }

	getInfoBox() {
		var tbl = super.getInfoBox()

		var row_size = tbl.insertRow();
		var label_size = row_size.insertCell();
		var size = row_size.insertCell();
		label_size.append(document.createTextNode("Size: "));
		var input_xSize = document.createElement('input');
		input_xSize.type = "number";
		input_xSize.size = "6"
		input_xSize.value = this.xSize;
		input_xSize.onchange = this._onInfoBoxXSizeChange.bind(this);
		var input_ySize = document.createElement('input');
		input_ySize.type = "number";
		input_ySize.size = "6"
		input_ySize.value = this.ySize;
		input_ySize.onchange = this._onInfoBoxYSizeChange.bind(this);
		size.append(input_xSize);
		size.append(document.createTextNode(" x "));
		size.append(input_ySize);

		return tbl;
	};

	_onInfoBoxXSizeChange(e) {
		this.itemManager.addRevertStep();
		this.xSize = e.target.value;
		this.update();
	};
	_onInfoBoxYSizeChange(e) {
		this.itemManager.addRevertStep();
		this.ySize = e.target.value;
		this.update();
	};

};

export class Circle extends MapItem {
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
		input_radius.onchange = this._onInfoBoxRadiusChange.bind(this);

		radius.append(input_radius);

		return tbl;
	};

	_onInfoBoxRadiusChange(e) {
		this.itemManager.addRevertStep();
		this.radius = e.target.value;
		this.update();
	};
};

export class Path extends MapItem {
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
		this.leafletItem.on("editable:vertex:drag", this.update.bind(this));
		this.leafletItem.on("editable:editing", this._onDrawStart.bind(this));

		this.leafletItem.on("drag", (e) => {mapItem.update()});
	};

	_onDrawStart(e) {
		this.itemManager.addRevertStep();
	}

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
		this.leafletItem.editing.enable();
	};

	deselect() {
		this.leafletItem.editing.disable();
		super.deselect();
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

export class Cable extends Path {
	constructor(itemManager, data) {
		super(itemManager, data);

		this.length = data.length;
		this.current = data.current;
	}

	getInfoBox() {
		var tbl = super.getInfoBox()

		var row_length = tbl.insertRow();
		var label_length = row_length.insertCell();
		var length = row_length.insertCell();
		label_length.append(document.createTextNode("Länge: "));
		var input_length = document.createElement('input');
		input_length.type = "number";
		input_length.value = this.length;
		input_length.onchange = this._onInfoBoxLengthChange.bind(this);
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
		select_current.onchange = this._onInfoBoxCurrentChange.bind(this);
		current.append(select_current);
		
		return tbl;
	};

	_onInfoBoxLengthChange(e) {
		this.itemManager.addRevertStep();
		this.length = e.target.value;
		this.update();
	};
	_onInfoBoxCurrentChange(e) {
		this.itemManager.addRevertStep();
		this.current = e.target.value;
		this.update();
	};

	export() {
		var json = super.export();
		json.type = "Cable";
		json.length = this.length;
		json.current = this.current;
		return json;
	};
}

export class Socket extends MarkerItem {
	constructor(parent, data) {
		super(parent, data);
	};


}
