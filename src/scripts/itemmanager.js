import { Rectangle, Circle, Path, Cable, MarkerItem, Socket } from "./mapitems.js";

export default class ItemManager {
	constructor(map) {
		this.App = window.App;
		this.map = map;
		this.categoryLayers = {};
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
		var container = App.infoBox.getContainer();
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
		var container = App.infoBox.getContainer();
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
			this.map.setView([data.map.lat, data.map.lng], data.map.zoom);
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
		if (!(item.category in this.categoryLayers)) {
			this.categoryLayers[item.category] = L.layerGroup();
			App.layerControl.addOverlay(this.categoryLayers[item.category], item.category);
			this.categoryLayers[item.category].addTo(this.map);
		}

		// Add Item to category Layer
		item.addTo(this.categoryLayers[item.category]);
	};

	removeFromCategory(item) {
		item.leafletItem.removeFrom(this.categoryLayers[item.category]);
	};

	deleteAllCategories() {
		var layers = Object.values(this.categoryLayers);
		if (layers.length == 0) {
			return;
		}
		layers.forEach((category) => {
			App.layerControl.removeLayer(category);
		});
		this.categoryLayers = {};
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
