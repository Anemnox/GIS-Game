/************************************************
*            Attraction: The Game               *
*-----------------------------------------------*
* Pick a section of land to develop and compete *
* with other "players" to create the most       *
* attractive land through the use of jobs/      *
* money/natural resources/ and more!            *
*************************************************/
/* Define map bounds    */
const bounds = [
  [-122.7, 47], // [west, south]
  [-121, 48]  // [east, north]
];

const ICON_IMAGE_EXPRESSION = [
  'match', // Use the 'match' expression: https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
  ['get', 'type'], // Use the result 'type' property
  'Office',
  'job-marker',
  'Natural Resource',
  'natural-marker',
  'Housing',
  'house-marker',
  'School',
  'school-marker',
  'house-marker'
];

const ICON_COLOR_EXPRESSION = [
  'match', // Use the 'match' expression: https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
  ['get', 'type'], // Use the result 'type' property
  'Office',
  '#66aa66',
  'Natural Resource',
  '#000000',
  'Housing',
  '#6666aa',
  'School',
  '#aa6666',
  '#000000'
];

const EXTRA_RESOURCES = 3;

/************************
*     Global Vars       *
*************************/
let gameStarted = false;
let currentPlayerIndex = null;
let playerDat = null;
let resourceDat = null;

const inputDat = {
  hoveredBoundaryId: null
};

const layerIDs = [];


/************************
*        Setup          *
*************************/
function main() {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYW5lbW5veCIsImEiOiJja3d5Mmc2cGowaDExMzBtdDMxamc3Z3RvIn0.WtL7UihaM7oOzqBWW26GRw';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/anemnox/ckwxwt3xq02bx14lhzprioiql', // style URL
    zoom: 8.5, // starting zoom
    maxZoom: 13,
    minZoom: 8.5,
    center: [-121.8, 47.5] // starting center
  });

  map.setMaxBounds(bounds);

  mapSetup(map);
  gameSetup(map);
}

async function mapSetup(map) {
  // disable map rotation using right click + drag
  map.dragRotate.disable();

  // disable map rotation using touch rotation gesture
  map.touchZoomRotate.disableRotation();
}

async function gameSetup(m) {
  const map = m;
  await loadImages(map);
  const mapData = (await fetchBoundaries(map))
  const features = mapData.features;

  map.on('load', () => {
    // if no game to load
    const rDat = generateResourceData(features);
    const pDat = generatePlayerData(mapData.features, rDat.features);
    // else load game
    // loadgame();

    loadResources(map, rDat);
    loadBoundaries(map, mapData);
    initResourceHoverHandlers(map);
    initBoundaryHoverHandlers(map, pDat, rDat.features);
  })
}








/************************
*     Mapbox Logic      *
*************************/
async function fetchBoundaries(map) {
  let response = await fetch('assets/school_district_shapes.geojson');
  let mapData = await response.json();

  return mapData;
}

function loadBoundaries(map, mapData) {
  map.addSource('mapData', {
    'type': 'geojson',
    'data': mapData,
    'generateId': true
  });

  map.addLayer({
    'id': 'boundary-layer',
    'type': 'fill',
    'source': 'mapData',
    'paint': {
      'fill-color': '#CCFFCC',
      'fill-outline-color': '#003311',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.5,
        0.2
      ]
    }
  }, layerIDs[0]);
}

function loadImages(map) {
  map.loadImage('./img/house.png', (error, image) => {
      if (error) throw error;
      map.addImage('house-marker', image, { 'sdf': true });
  });
  map.loadImage('./img/nat_res.png', (error, image) => {
      if (error) throw error;
      map.addImage('natural-marker', image, { 'sdf': true });
  });
  map.loadImage('./img/office.png', (error, image) => {
      if (error) throw error;
      map.addImage('job-marker', image, { 'sdf': true });
  });
  map.loadImage('./img/school.png', (error, image) => {
      if (error) throw error;
      map.addImage('school-marker', image, { 'sdf': true });
  });
}

function loadResources(map, resourceData) {
  map.addSource('resourceData', {
    'type': 'geojson',
    'data': resourceData,
    'generateId': true
  });

  for(const feature of resourceData.features) {
    const owner = feature.properties.owner;
    const layerID = `${owner}-icons`;
    if(!map.getLayer(layerID)) {
      map.addLayer({
        'id': layerID,
        'type': 'symbol',
        'source': 'resourceData',
        'paint': {
          'icon-color': ICON_COLOR_EXPRESSION
        },
        'layout': {
          'icon-image': ICON_IMAGE_EXPRESSION
        },
        'filter': ['==', 'owner', owner]
      });

      layerIDs.push(layerID);
    }
  }
}

function initResourceHoverHandlers(map) {
  // Create a popup, but don't add it to the map yet.
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  for(let i = 0; i < layerIDs.length; i++) {
    map.on('mousemove', layerIDs[i], (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const coordinates = e.features[0].geometry.coordinates.slice();
      const type = e.features[0].properties.type;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      popup.setLngLat(coordinates).setHTML(type).addTo(map);
    });

    map.on('mouseout', layerIDs[i], () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }
}

function initBoundaryHoverHandlers(map, pDat, rDat) {
  map.on('mousemove', 'boundary-layer', (e) => {
    if (e.features.length > 0) {
      removeHoveredBoundaryId(map);
      inputDat.hoveredBoundaryId = e.features[0].id;
      const layerID = `${inputDat.hoveredBoundaryId}-icons`;
      map.setFeatureState(
        { source: 'mapData', id: inputDat.hoveredBoundaryId },
        { hover: true }
      );
      map.setLayoutProperty(layerID, "icon-allow-overlap", true);
      map.setLayoutProperty(layerID, "icon-ignore-placement", true);
      showBoundaryInfo(inputDat.hoveredBoundaryId, pDat, rDat);
    }
  });

  // When the mouse leaves the state-fill layer, update the feature state of the
  // previously hovered feature.
  map.on('mouseleave', 'boundary-layer', () => {
    removeHoveredBoundaryId(map);
  });
}

function removeHoveredBoundaryId(map) {
  if (inputDat.hoveredBoundaryId !== null) {
    const layerID = `${inputDat.hoveredBoundaryId}-icons`;
    map.setFeatureState(
      { source: 'mapData', id: inputDat.hoveredBoundaryId },
      { hover: false }
    );
    map.setLayoutProperty(layerID, "icon-allow-overlap", false);
    map.setLayoutProperty(layerID, "icon-ignore-placement", false);
    hideBoundaryInfo();

    inputDat.hoveredBoundaryId = null;
  }
}

function showBoundaryInfo(id, pDat, resDat) {
  let playerDat = calculatePlayerData(pDat[id], resDat);


  document.getElementById("info-name").innerHTML = playerDat["name"];
  document.getElementById("population-tag").innerHTML = playerDat["population"];
  document.getElementById("money-tag").innerHTML = playerDat["money"];
  document.getElementById("education-tag").innerHTML = playerDat["education"];
  document.getElementById("nat-res-tag").innerHTML = playerDat["naturalResource"];
  document.getElementById("job-tag").innerHTML = playerDat["jobs"];

  document.getElementById("boundary-info").classList.remove("hidden");
}

function hideBoundaryInfo() {
  document.getElementById("boundary-info").classList.add("hidden");
}

function getBoundaryFeatures(id, resFeatures) {
  return resFeatures.filter((f) => {
    return f.properties.owner === id
  });
}

//source: https://jsfiddle.net/4c6qn20h/2/
function generateRandomPoint(polygon) {
  let polygonGeoJson = {
    'type': 'geojson',
    'data': polygon
  }
  let bounds = getPolygonBoundingBox(polygonGeoJson);
  //[xMin, yMin][xMax, yMax]
  let x_min = bounds[0][0];
  let x_max = bounds[1][0];
  let y_min = bounds[0][1];
  let y_max = bounds[1][1];

  let lat = y_min + (Math.random() * (y_max - y_min));
  let lng = x_min + (Math.random() * (x_max - x_min));

  let poly = polygonGeoJson;
  let pt = turf.point([lng, lat]);
  let inside = turf.booleanPointInPolygon(pt, polygonGeoJson.data);

  return inside ? pt : generateRandomPoint(polygon);
}








/************************
*       Game Logic      *
*************************/
//Game Consts
const RESOURCE_TYPES = {
  "Office": {
    jobs: 4,
    education: 1,
    naturalResource: 0,
    housing: 0
  },
  "Natural Resource": {
    jobs: 2,
    education: 0,
    naturalResource: 3,
    housing: 0
  },
  "Housing": {
    jobs: 0,
    education: 0,
    naturalResource: 0,
    housing: 5
  },
  "School": {
    jobs: 1,
    education: 4,
    naturalResource: 0,
    housing: 0
  }
}

class Player {
  constructor(id, name) {
    this.boundaryId = id;
    this.name = name;
    this.population = 10;
    this.money = 10;
  }
}

function generateResourceData(features) {
  let resourcesGeojson = {
    "name": "Resources",
    "type": "FeatureCollection",
    "features": []
  };

  for(let i = 0; i < features.length; i++) {
    let poly = features[i];

    let resourceTypes = Object.keys(RESOURCE_TYPES);
    resourceTypes.forEach((item) => {
      let point = generateRandomPoint(poly);
      point.properties = {
        "type": item,
        "owner": i
      }
      resourcesGeojson["features"].push(point);
    });

    for(let j = 0; j < EXTRA_RESOURCES; j++) {
      let ind = Math.floor(Math.random() * resourceTypes.length);
      let point = generateRandomPoint(poly);
      let item = resourceTypes[ind];
      point.properties = {
        "type": item,
        "owner": i
      }
      resourcesGeojson["features"].push(point);
    }
  }

  return resourcesGeojson;
}

function generatePlayerData(boundDat) {
  let data = [];

  for(let i = 0; i < boundDat.length; i++) {
    let name = boundDat[i].properties["NAME"];
    data.push(new Player(i, name));
  }

  return data;
}

function calculatePlayerData(player, resData) {
  let features = getBoundaryFeatures(player.boundaryId, resData);
  let obj = {
    jobs: 0,
    education: 0,
    naturalResource: 0
  }
  features.forEach((item, i) => {
    let props = item.properties
    obj["jobs"] += RESOURCE_TYPES[props["type"]]["jobs"]
    obj["education"] += RESOURCE_TYPES[props["type"]]["education"]
    obj["naturalResource"] += RESOURCE_TYPES[props["type"]]["naturalResource"]
  });

  return {
    ...player,
    ...obj
  }
}

/************************
*       OnLoad Main     *
*************************/
window.addEventListener('load', main);
