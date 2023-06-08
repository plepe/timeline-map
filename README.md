# geojson-watcher
Loads GeoJSON files from internet sources, puts them into a Git archive and visualizes their development.

## INSTALLATION
```sh
git clone https://github.com/plepe/geojson-watcher
cd geojson-watcher
npm install
cp config.yaml-dist config.yaml
edit config.yaml # Use your favorite editor
npm run update # Loads the files and updates the repository
npm start # Starts the web server
```
