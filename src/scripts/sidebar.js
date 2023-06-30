import "leaflet-sidebar-v2";
import items from "./items.js";
import Utils from "./utils.js";

export default class SideBar {

    leafletItem = null;
    infoTab = null;

    TabClasses = [
        TabAddMapItem,
        TabExport,
        TabInfo,
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
        this.TabClasses.forEach((TabClass) => {
            var tab = new TabClass(map, this.leafletItem);
            if (TabClass === TabInfo) {
                this.infoTab = tab;
            }
            this.leafletItem.addPanel(tab.getProperties());
        });
        this.leafletItem.open('addMapItem');
    };

};



class Tab {
    map = null;
    properties = null;
    constructor(map, sidebar, id, title, icon) {
        this.map = map;
        this.sidebar = sidebar;
        this.id = id;
        this.title = title;
        this.icon = icon;
    };

    getContent() {
        throw "getContent must be overwritten";
    }

    getProperties() {
        // create DOM nodes to add as tab content
        var container = L.DomUtil.create('div', 'tab-container');
        
        // add Heading
        var heading = L.DomUtil.create('h2', '', container);
        L.DomUtil.create('i', 'fa-solid fa-xl ' + this.icon, heading);
        heading.appendChild(document.createTextNode(this.title));
        
        // add content specified by concrete Tab
        var content = L.DomUtil.create('div', 'tab-content', container);
        content.appendChild(this.getContent());

        // return properties as required by leaflet-sidebar-v2
        return {
            id: this.id,
            title: this.title,
            tab: '<i class="fa-solid fa-xl ' + this.icon + '"></i>',
            pane: container
        };
    }
}

class TabAddMapItem extends Tab {
    constructor(map, sidebar) {
        super(map, sidebar, 'addMapItem', 'Objekte hinzufügen', 'fa-square-plus');
    };

    getContent() {
        var el = L.DomUtil.create('div');

        // sort items with custom compareTo
        items.sort(this._sortByCategory);
        var lastCategory = null;
        items.forEach((item) => {
            
            // add category heading
            if (lastCategory != item.category) {
                if (lastCategory != null) {
                    L.DomUtil.create('hr', '', el);
                }
                var heading_category = L.DomUtil.create('h3', '', el);
                heading_category.appendChild(document.createTextNode(item.category));
                lastCategory = item.category;
            }

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

    _sortByCategory(a, b) {
        let compareCategory = a.category.localeCompare(b.category);
        if (compareCategory == 0) {
            return a.name.localeCompare(b.name);
        }
        return compareCategory;
    }

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

    constructor(map, sidebar) {
        super(map, sidebar, 'export', 'Export', 'fa-floppy-disk');
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
        L.DomUtil.create('h3', '', el).appendChild(document.createTextNode('Import/Export using text'));

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

        L.DomUtil.create('hr', '', el);

        // Load & Save
        L.DomUtil.create('h3', '', el).appendChild(document.createTextNode('Load/Save using localStorage'));

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

class TabInfo extends Tab {
    constructor(map, sidebar) {
        super(map, sidebar, 'info', 'Info', 'fa-circle-info');
    };

    getContent() {
        this.el = L.DomUtil.create('div');
        this.el.appendChild(this.getEmptyContent());
        return this.el;
    };

    show(el) {
        this.el.innerHTML = '';
        this.el.appendChild(el);
        this.sidebar.open('info');
    }

    hide() {
        this.el.innerHTML = '';
        this.el.appendChild(this.getEmptyContent());
        this.sidebar.close('info');
    }

    getEmptyContent() {
        var el = L.DomUtil.create('div');
        el.innerHTML = `
            Klicke auf ein Map-Objekt um Details anzuzeigen.
        `;
        return el;
    }
}

class TabHelp extends Tab {
    constructor(map, sidebar) {
        super(map, sidebar, 'help', 'Hilfe', 'fa-question');
    };

    getContent() {
        var el = L.DomUtil.create('div');

        el.innerHTML = `
        <h3>Objekte hinzufügen</h3>
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
        <hr />
        <h3>Speichern & Exportieren</h3>
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