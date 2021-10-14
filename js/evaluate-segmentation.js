settings_questions = '{ \
    "scale": {"question": "Crossroad scale", "type": "multiple_choice", "values": ["correct", "too large", "too small"], "default": "correct" }, \
    "nb_branches": { "question": "Number of branches", "type": "multiple_choice", "values": ["correct", "too few", "too much"], "default": "correct" }, \
    "branches": { "question": "Branches configuration", "type": "multiple_choice", "values": ["correct", "two or more branches are merged", "one or more branch is split", "merged and split branches"], "default": "correct" }, \
    "edges": {"question": "Edge position", "type": "multiple_choice", "values": ["correct", "too far", "too close"], "default": "correct" }, \
    "completness": {"question": "Completness", "type": "multiple_choice", "values": ["correct", "missing parts", "excess parts"], "default": "correct" }, \
    "comments": {"question": "Comments", "type": "text", "default": "" } \
}';


// from jquery.color.js plugin
Colors = {};
Colors.names = {
    blue: "#0000ff",
    lime: "#00ff00",
    yellow: "#ffff00",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    black: "#000000",
    white: "#ffffff",
    brown: "#a52a2a",
    indigo: "#4b0082",
    khaki: "#f0e68c",
    olive: "#808000",
    orange: "#ffa500",
    pink: "#ffc0cb",
    violet: "#800080",
    silver: "#c0c0c0"
};
// from https://stackoverflow.com/a/10014969/5319942
Colors.list = function(nb) {
    var result = [];
    for (var key in Colors.names) {
        result.push(Colors.names[key]);
        if (result.length == nb)
            break;
    }
    return result;

};


function evalute_crossroad(current_crossroad, divID, crossroadLinksID) {
    // sort using first branches, then crossroad core
    current_crossroad.sort((x1, x2) => x1["type"].localeCompare(x2["type"]));
    
    if (typeof window.map === 'undefined') {
        window.map = L.map(divID);

        L.tileLayer(
            "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts?" +
            "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
            "&STYLE=normal" +
            "&TILEMATRIXSET=PM" +
            "&FORMAT=image/jpeg"+
            "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS"+
            "&TILEMATRIX={z}" +
            "&TILEROW={y}" +
            "&TILECOL={x}",
            {
                minZoom : 0,
                maxNativeZoom: 19,
                maxZoom : 21,
                attribution : "IGN-F/Geoportail",
                tileSize : 256 
            }
        ).addTo(window.map);
        
        var scale = L.control.scale();
        scale.addTo(window.map);
    }
    else {
                            
        // remove the existing crossroad layer
        if (typeof window.layergroup !== 'undefined') {
            window.map.removeLayer(window.layergroup);
        }
        
    }
    
    window.crossroad_layers = [];
    
    
    // build a random list of colors
    colors = Colors.list(current_crossroad.length);
    
    // for each element of the crossroad create a layer
    for(var eid in current_crossroad) {
        element = current_crossroad[eid];
        if (element["type"] != "evaluation") {
            
            // build latlng
            latlng = [];
            if (element["edges_by_nodes"].length == 0) {
                if (element["nodes"].length != 0 && element["nodes"]["border"].length != 0) {
                    coord = element["coordinates"][element["nodes"]["border"][0]];
                    latlng.unshift([[coord["y"], coord["x"]], [coord["y"], coord["x"]]]);
                }
            }
            else {
                for (var eidi in element["edges_by_nodes"]) {
                    edge = element["edges_by_nodes"][eidi];
                    latlng.push([[element["coordinates"][edge[0]]["y"], element["coordinates"][edge[0]]["x"]],
                                [element["coordinates"][edge[1]]["y"], element["coordinates"][edge[1]]["x"]]]);
                }
            }
            
            // choose color
            if (element["type"] == "branch") {
                options = {color: colors[eid]};
            }
            else if (element["type"] == "crossroad") {
                options = {color: 'red', weight: '10', opacity: '0.6'};
            }
                                
            // create crossroad layer
            layer = L.polyline(latlng, options);
            window.crossroad_layers.push(layer);
            if (element["type"] == "crossroad") {
                center = layer.getBounds().getCenter();
            }
        }
    }
    
    // create a layergroup
    window.layergroup = L.featureGroup(window.crossroad_layers).addTo(window.map);
    
    // set the zoom adjusted on this layergroup
    window.map.fitBounds(window.layergroup.getBounds());
    

    // add a footer with a link on google street view
    if (typeof center !== "undefined") {
        // see https://stackoverflow.com/questions/387942/google-street-view-url for details
        zoom = window.map.getZoom();
        st_url = 'http://maps.google.com/maps?q=&layer=c&cbll=' + center.lat + "," + center.lng + '&cbp=11,0,0,0,0';
        gm_url = 'https://www.google.fr/maps/@'+ center.lat + "," + center.lng + ',' + zoom + 'z';
        osm_url = 'https://www.openstreetmap.org/?zoom=' + zoom + '&mlat=' + center.lat + '&mlon=' + center.lng;
        $("#" + crossroadLinksID).html('<span class="badge bg-secondary"><a href="' + osm_url + '" target=”_blank”>osm</a></span> \
                                    <span class="badge bg-secondary"><a href="' + gm_url + '" target=”_blank”>gmaps</a></span> \
                                    <span class="badge bg-secondary"><a href="' + st_url + '" target=”_blank”>streetview</a></span>');
    }
    else {
        $("#" + crossroadLinksID).html("");
    }
}
