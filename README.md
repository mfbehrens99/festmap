# [Festmap](https://mfbehrens99.github.io/festmap/)

[HIER](https://mfbehrens99.github.io/festmap/dist) gehts zur Karte

## Tutorial (in German)
### Benutzung der Karte
* Mittels des Menüs auf der rechten Seite können Objekte hinzugefügt werden
* Diese können per Drag-and-drop positioniert werden
* Jedes Objekt kann durch anklicken ausgewählt werden
* Ein ausgewähltes Objekt kann mit der rechten Maustaste gedreht werden
* Ein ausgewähltes Objekt kann über die Schaltfläche in der linken unteren Ecke bearbeitet werden
* Entf löscht das ausgewählte Objekt 
* `Strg+C`, `Strg+V` und `Strg+X` kopieren, fügen ein und schneiden aus
* `Esc` oder ein Klick auf die Karte wählen ab
* `Strg+Z` und `Strg+Y` machen rückgängig und wiederholen

### Speichern und Exportieren
* Speichern speichert alle Objekte im `localStorage` ab
* Es kann immer nur einen Speicherstand geben
* Expotieren gibt alle Objekte als JSON aus
* Mit Import können diese wieder eingelesen werden
* Die Position wird ebenfalls im Speicherstand abgespeichert
* Wenn eine Datei mit dem Namen `data.js` existiert wird diese automatisch geladen

## Build from source
`Node.js` is required for building the project

```
git clone https://github.com/mfbehrens99/festmap.git
cd festmap
npm install
npm run build
```

Output will be in `/dist` folder. Only `index.html`, `festmap.js`, `festmap.css` and `/images/*` are required.

`npm run deploy` will push the current state to the gh-pages branch

## Development
`npm run watch` executes a watch script that rebuilds the code whenever it is changed.

`npm start` will start the development server.

When running rollup and using the `--watch` option the code will not be minified
