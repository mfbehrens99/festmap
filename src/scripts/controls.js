import items from "./items.js";
import Utils from "./utils.js";

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
				App.itemManager.addRevertStep();
				let center = map.getCenter();
				data.lat = center.lat;
				data.lng = center.lng;
				App.itemManager.addItem(data);
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

			App.itemManager.deleteAllItems();
			App.itemManager.import(data)
		});

		let btn_export = L.DomUtil.create('button', '', form_importExport);
		btn_export.appendChild(document.createTextNode('Export'));

		btn_export.addEventListener("click", (event) => {
			var json = App.itemManager.export();
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
			var data = App.itemManager.export();
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
					App.itemManager.import(json);
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
