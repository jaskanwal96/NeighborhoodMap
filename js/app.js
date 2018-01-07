var map;
var markers = [];
var locations = [];
var infoWindow;
var solan_location = {
    lat: 30.9045,
    lng: 77.0967
};
var defaultIcon;
var highlightedIcon;
//546f6d8b8d0911c16b19173358b932ad
function initMap() {
    // Creating map with given attributes
    map = new google.maps.Map(document.getElementById('map'), {
        center: solan_location,
        zoom: 13,
        mapTypeControl: false
    });

    //Initialising the infowindow 
    infoWindow = new google.maps.InfoWindow();

    // The following group uses the location array to create an array of markers on initialize.
    solanZomato();
}


function solanZomato() {
    //Creating default and highlighted icon
    var zomatoUrl = 'https://developers.zomato.com/api/v2.1/search?lat='+solan_location.lat+'&lon='+solan_location.lng+'&radius=10000&sort=real_distance';
    defaultIcon = makeMarkerIcon('28A745');
    highlightedIcon = makeMarkerIcon('DC3545');
    $.ajax({
        url: zomatoUrl,
        headers:{'user-key':'546f6d8b8d0911c16b19173358b932ad'},
        dataType: 'json',
        async: true,
    }).done(function(response) {
       	zomatoRestaurants = response.restaurants;
        console.log(zomatoRestaurants[0].restaurant.location.latitude);
        console.log(zomatoRestaurants[0].restaurant.location.longitude);

        for (var i = 0; i < zomatoRestaurants.length; i++) {
            var latitude = parseFloat(zomatoRestaurants[i].restaurant.location.latitude);
            var longitude = parseFloat(zomatoRestaurants[i].restaurant.location.longitude);
            var marker = new google.maps.Marker({
                name: zomatoRestaurants[i].restaurant.name,
                locality: zomatoRestaurants[i].restaurant.location.locality,
                city: zomatoRestaurants[i].restaurant.location.city,
                thumb: zomatoRestaurants[i].restaurant.thumb,
                map: map,
                position: {
                    lat: latitude,
                    lng: longitude
                },
                animation: google.maps.Animation.DROP,
                icon: defaultIcon,
                id: i
            });
            markers.push(marker);
            locations.push({
                title: marker.name,
                marker_id : marker,
                cord: {
                    lat: zomatoRestaurants[i].restaurant.location.latitude,
                    lng: zomatoRestaurants[i].restaurant.location.longitude
                }
            });

            marker.addListener('click', openInfoWindow);
            marker.addListener('mouseover', mouseOverFunction);
            marker.addListener('mouseout', mouseOutFunction);
        }
        ViewModel.makeList();
        showPlaces();

    }).fail(function(response, status, error) {
        ViewModel.resErrorCheck(true);
        ViewModel.restaurantErrorLabel("Restaurants Not found");
    });
    

}
function openInfoWindow(){ 
    newInfoWindow(this, infoWindow);
}

function mouseOverFunction() {
    this.setIcon(highlightedIcon);
}

function mouseOutFunction() {
    this.setIcon(defaultIcon);
}


function clickWindow(marker) {
    
    for (var i = 0; i < markers.length; i++) {
        console.log(markers[i].name);
        if (markers[i].name == marker.title) {

            newInfoWindow(markers[i], infoWindow);
            break;
        }
    }

    
}
// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.

function newInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {

        // Clear the infowindow content to give the streetview time to load.
        marker.setAnimation(google.maps.Animation.DROP);
        infowindow.marker = marker;
        var content = '';
        content += ('<h3 id="marker-heading">' + marker.name + '</h3>');
        content += ('<img id="marker-image" src="'+marker.thumb+'" alt="image not available">');
        content += ('<div>' + marker.locality +', '+ marker.city + '</div>');
        infowindow.setContent(content);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
            marker.setAnimation(null);
        });

        // Open the infowindow on the correct marker.
        if (infowindow) {
            infowindow.close();
        }
        infowindow.open(map, marker);
    }

}

// This function will loop through the places and display Restaurants.
function showPlaces() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        markers[i].setAnimation(google.maps.Animation.DROP);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}
// This function will loop through the places and hide the Restaurants.
function hidePlaces() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;

}

function googleMapError() {
    ViewModel.googleMapCheck(true);
    console.log("Error");
    ViewModel.googleApiError("Error while loading the map");
}


//---------------------------View Model
var ViewModel = {

    list: ko.observableArray([]),
    newlist: ko.observableArray([]),
    search_item: ko.observable(''),
    originalListCheck: ko.observable(true),
    searchListCheck: ko.observable(false),
    googleMapCheck: ko.observable(false),
    resErrorCheck : ko.observable(false),
    googleApiError: ko.observable(''),
    restaurantErrorLabel : ko.observable(''),
    // live search inspired by https://opensoul.org/2011/06/23/live-search-with-knockoutjs/
    search: function(value) {
        ViewModel.originalListCheck(false);
        ViewModel.searchListCheck(true);
        ViewModel.newlist.removeAll();
        if (value === '') {
            ViewModel.searchListCheck(false);
            ViewModel.originalListCheck(true);
            locations.forEach(function(location){
            	location.marker_id.setVisible(true);
            });
            return;
        }
        for (var location in locations) {
            if (locations[location].title.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                ViewModel.newlist.push(locations[location]);
                locations[location].marker_id.setVisible(true);
            }
            else
            {
            	locations[location].marker_id.setVisible(false);
            }
        }
    },
    makeList: function() {
    	locations.forEach(function(location){
    		ViewModel.list.push(location);
    	});
    },
    resetRestaurantList: function() {
        showPlaces();
        ViewModel.list.removeAll();
        ViewModel.makeList();
    }



};
ViewModel.search_item.subscribe(ViewModel.search);
ko.applyBindings(ViewModel);