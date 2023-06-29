import "leaflet-sidebar-v2";
import items from "./items.js";
import Utils from "./utils.js";

export default class SideBar {

    leafletItem = null;

    tabs = [
        TabAddMapItem,
        TabExport,
        TabHelp
    ];

    constructor(map, tabContents) {
        this.leafletItem = L.control.sidebar({
            autopan: false,       // whether to maintain the centered map point when opening the sidebar
            closeButton: true,    // whether t add a close button to the panes
            container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
            position: 'left',     // left or right
        }).addTo(map);

        // Iterate tab definitions
        this.tabs.forEach((tab) => {
            this.leafletItem.addPanel(new tab(map).getProperties());
        });
        
        this.leafletItem.open('help');
    };

};



class Tab {
    map = null;
    properties = null;
    constructor(map, properties) {
        this.map = map;
        this.properties = properties;
    };

    getContent() {
        throw "getContent must be overwritten";
    }

    getProperties() {
        this.properties.pane = this.getContent();
        return this.properties;
    }
}

class TabAddMapItem extends Tab {
    constructor(map) {
        super(map, {
            id: 'addMapItem',
            tab: '<i class="fa-solid fa-square-plus"></i>',
            title: 'Add Item',
        })
    };

    getContent() {
        var el = L.DomUtil.create('div');

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
            btn.classList.add("btn-category");
            var t = document.createTextNode(item.name);
            btn.style.backgroundColor = item.color;
            btn.style.color = Utils.getTextColor(item.color);
            btn.appendChild(t);
            btn.addEventListener("click", this._onClick.bind(this, data));
        });

        return el;
    };

     _onClick(data, e) {
        App.itemManager.addRevertStep();
        let center = this.map.getCenter();
        data.lat = center.lat;
        data.lng = center.lng;
        App.itemManager.addItem(data);
    };
}


class TabExport extends Tab {
    input_save = null;
    select_load = null;
    btn_load = null;
    btn_delete = null;

    constructor(map) {
        super(map, {
            id: 'export',
            tab: '<i class="fa-solid fa-floppy-disk"></i>',
            title: 'Save &amp; Load',
        })
    };

    _onBtnImportClick(e) {
        var data = JSON.parse(prompt("Exportierte JSON eingeben!"));
        App.itemManager.deleteAllItems();
        App.itemManager.import(data)
    };
    _onBtnExportClick(e) {
        var json = App.itemManager.export();
        window.open("data:text/json;charset=utf-8," + encodeURIComponent(json), "", "_blank");
    };
    _onFormLoadSubmit(e) {
        event.preventDefault(); // to prevent page load
        var saveName = this.select_load.value;

        var jsonRaw = localStorage.getItem(saveName);
        try {
            var json = JSON.parse(jsonRaw);
            if (json != null) {
                App.itemManager.deleteAllItems();
                App.itemManager.import(json);
            } else {
                throw new SyntaxError("JSON seems to be empty:");
            }
        } catch (e) {
            alert("Save '" + saveName + "' might be corrupted:\n\n" + e.message + "\n\n" + jsonRaw);
        }
    };
    _onFormSaveSubmit(e) {
        event.preventDefault(); // to prevent page load
        var data = App.itemManager.export();
        var saveName = this.input_save.value;
        localStorage.setItem(saveName, data);
        this.updateLoadSelect();
        this.select_load.value = saveName
    };
    _onBtnDeleteClick(e) {
        let saveName = this.select_load.value;
        if (confirm("Delete save '" + saveName + "'?")) {
            localStorage.removeItem(saveName)
            this.updateLoadSelect();
        }
    };

    getContent (map) {
        var el = L.DomUtil.create('div');

        // Import & Export
        L.DomUtil.create('h4', '', el).appendChild(document.createTextNode('Import/Export using text'));

        let form_importExport = L.DomUtil.create('form', '', el);
        form_importExport.addEventListener("submit", (event) => {
            event.preventDefault();
        });

        let btn_import = L.DomUtil.create('button', '', form_importExport);
        btn_import.appendChild(document.createTextNode('Import'));
        btn_import.addEventListener("click", this._onBtnImportClick.bind(this));

        let btn_export = L.DomUtil.create('button', '', form_importExport);
        btn_export.appendChild(document.createTextNode('Export'));
        btn_export.addEventListener("click", this._onBtnExportClick.bind(this));

        // Load & Save
        L.DomUtil.create('h4', '', el).appendChild(document.createTextNode('Load/Save using localStorage'));

        let form_save = L.DomUtil.create('form', '', el);
        this.input_save = L.DomUtil.create('input', '', form_save);
        this.input_save.setAttribute("placeholder", "save name")
        let btn_save = L.DomUtil.create('input', '', form_save);
        btn_save.setAttribute("type", "submit")
        btn_save.value = 'Save';
        form_save.addEventListener("submit", this._onFormSaveSubmit.bind(this));

        let form_load = L.DomUtil.create('form', '', el);
        this.select_load = L.DomUtil.create('select', '', form_load);
        this.btn_load = L.DomUtil.create('input', '', form_load);
        this.btn_load.setAttribute("type", "submit")
        this.btn_load.value = 'Load';
        form_load.addEventListener("submit", this._onFormLoadSubmit.bind(this));


        this.btn_delete = L.DomUtil.create('button', '', form_load);
        this.btn_delete.appendChild(document.createTextNode('Delete'));

        this.btn_delete.addEventListener("click", this._onBtnDeleteClick.bind(this));

        this.updateLoadSelect();
        return el;
    };

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
    };
};

class TabHelp extends Tab {
    constructor(map) {
        super(map, {
            id: 'help',
            tab: '<i class="fa-solid fa-question"></i>',
            title: 'Help',
        })
    };

    getContent() {
        var el = L.DomUtil.create('div');

        el.innerHTML = `
        <h4>Objekte hinzufügen</h4>
        <ul>
            <li>Mittels des Menüs auf der rechten Seite können Objekte hinzugefügt werden</li>
            <li>Diese können per Drag-and-drop positioniert werden</li>
            <li>Jedes Objekt kann durch anklicken ausgewählt werden</li>
            <li>Ein ausgewähltes Objekt kann mit der rechten Maustaste gedreht werden</li>
            <li>Ein ausgewähltes Objekt kann über die Schaltfläche in der linken unteren Ecke bearbeitet werden</li>
            <li>\`Entf\` löscht das ausgewählte Objekt </li>
            <li>\`Strg+C\`, \`Strg+V\` und \`Strg+X\` kopieren, fügen ein und schneiden aus</li>
            <li>\`Esc\` oder ein Klick auf die Karte wählen ab</li>
            <li>\`Strg+Z\` und \`Strg+Y\` machen rückgängig und wiederholen</li>
        </ul>
        <h4>Speichern & Exportieren</h4>
        <ul>
            <li>Speichern speichert alle Objekte im \`localStorage\` ab</li>
            <li>Es gibt mehrere Speicherstände, die wieder geladen werden können</li>
            <li>Exportieren gibt alle Objekte als JSON aus</li>
            <li>Mit Import können diese wieder eingelesen werden</li>
            <li>Die Position wird ebenfalls im Speicherstand abgespeichert</li>
        </ul>
        `;

        return el;
    };
}