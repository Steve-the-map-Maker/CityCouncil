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

function filterByPercentRange(minPercent, maxPercent) {
  map.setFilter("precinct-fill", [
    "all",
    [">=", ["get", "RG_Percent"], minPercent],
    ["<=", ["get", "RG_Percent"], maxPercent],
  ]);
}

function filterByVoteRange(minVotes, maxVotes) {
  map.setFilter("precinct-fill", [
    "all",
    [">=", ["get", "Total Votes"], minVotes],
    ["<=", ["get", "Total Votes"], maxVotes],
  ]);
}

function resetFilters() {
  // This resets the filter to show all precincts by applying a filter that always returns true.
  map.setFilter("precinct-fill", null);
}

// Add click event listener to the map
map.on("click", "precinct-fill", function (e) {
  if (e.features.length > 0) {
    var feature = e.features[0];
    var precinct = feature.properties.Precinct;
    var rg_percent = feature.properties.RG_Percent;
    var totalVotes = feature.properties["Total Votes"]; // Assuming the property name is "Total Votes"
    var rgVotes = feature.properties["RG_Votes"]; // Assuming the property name is "RG_Votes"

    // Updated popupContent with requested information
    var popupContent = `
    <div class="card border-light mb-3" style="max-width: 18rem;">
        <div class="card-header bg-transparent border-success"><strong>${precinct} Precinct</strong></div>
        <div class="card-body text-success">
            <h3 class="card-title">Rene Votes: ${Math.round(
              rg_percent * 100
            )}%</h3>

            <p class="card-text">RG Votes: ${rgVotes}</p>
            <p class="card-text">Total Votes: ${totalVotes}</p>
        </div>
    </div>
    `;

    new maplibregl.Popup().setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
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
