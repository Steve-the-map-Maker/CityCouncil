console.log("coming from map.js file!!!!");

fetch("Precinct_2022.geojson")
  .then((response) => response.json())
  .then((json) => {
    var geojson = json; // Store the GeoJSON data in a variable
    initializeMap(geojson); // Call initializeMap with the GeoJSON data
  });

const style = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

const map = new maplibregl.Map({
  container: "map",
  style: style,
  center: [-122.62283427563828, 45.50856459753845],
  zoom: 11,
});

function initializeMap(geojsonData) {
  map.on("load", function () {
    map.addSource("precinct", {
      type: "geojson",
      data: geojsonData,
    });

    map.addLayer({
      id: "precinct-fill",
      type: "fill",
      source: "precinct",
      layout: {},
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.8,
        "fill-outline-color": "#000000", // Light black outline for polygons
      },
    });

    updateColors();
  });
}

function getColor(value) {
  // Updated distinct color palette
  return value >= 0.8
    ? "#00441b" // Dark Green
    : value >= 0.6
    ? "#238b45" // Medium Green
    : value >= 0.4
    ? "#41ab5d" // Light Green
    : value >= 0.2
    ? "#74c476" // Lighter Green
    : "#c7e9c0"; // Lightest Green
}

function updateColors() {
  const source = map.getSource("precinct");
  if (source) {
    let data = source._data;
    data.features = data.features.map((feature) => {
      let value = feature.properties.RG_Percent;
      feature.properties.color = getColor(value);
      return feature;
    });
    source.setData(data);
  }
}
// Add click event listener to the map
map.on("click", "precinct-fill", function (e) {
  // Ensure that if the map is clicked on more than one feature, only one will be used
  if (e.features.length > 0) {
    var feature = e.features[0]; // Get the first feature from the array of clicked features

    // Create HTML content for the pop-up
    var popupContent =
      `<h3>Precinct: ${feature.properties.Precinct}</h3>` +
      `<p>RG_Percent: ${feature.properties.RG_Percent}</p>`;

    // Create a pop-up and set its content and location
    new maplibregl.Popup()
      .setLngLat(e.lngLat) // Set the popup at the location of the click
      .setHTML(popupContent) // Set the HTML content defined above
      .addTo(map); // Add the popup to the map
  }
});

// Add this outside of the initializeMap function
// Ensure the cursor changes to a pointer when over clickable features
map.on("mouseenter", "precinct-fill", function () {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "precinct-fill", function () {
  map.getCanvas().style.cursor = "";
});
