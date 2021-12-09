/*
* Some utility functions
*/

/* source: https://jsfiddle.net/4c6qn20h/2/*/
function getPolygonBoundingBox(feature) {
    var bounds = [[], []];
    var polygon;
    var latitude;
    var longitude;

    for (var i = 0; i < feature.data.geometry.coordinates.length; i++) {
        if (feature.data.geometry.coordinates.length === 1) {
            // Polygon coordinates[0][nodes]
            polygon = feature.data.geometry.coordinates[0];
        } else {
            // Polygon coordinates[poly][0][nodes]
            polygon = feature.data.geometry.coordinates[i][0];
        }

        for (var j = 0; j < polygon.length; j++) {
            longitude = polygon[j][0];
            latitude = polygon[j][1];

            bounds[0][0] = bounds[0][0] < longitude ? bounds[0][0] : longitude;
            bounds[1][0] = bounds[1][0] > longitude ? bounds[1][0] : longitude;
            bounds[0][1] = bounds[0][1] < latitude ? bounds[0][1] : latitude;
            bounds[1][1] = bounds[1][1] > latitude ? bounds[1][1] : latitude;
        }
    }

    return bounds;
}
