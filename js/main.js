// Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1Ijoic3dteXRob3MiLCJhIjoiY2xkeHNqZnp1MGsxYzNwcDdsejRsMzB3NyJ9.w7mugAoFZk8NYDjZzqGV8Q";
const map = new mapboxgl.Map({
  container: "map", // HTML container ID
  style: "mapbox://styles/mapbox/streets-v12", // style URL
  center: [-35.353, 30.8789], // starting position [lng, lat]
  zoom: 2.5, // starting zoom
});

// Disable double click zoom
map.doubleClickZoom.disable();

// Add and remove marker to map on single click
let markers = []; // an array to store all markers

map.on("click", function (e) {
  const marker = new mapboxgl.Marker({ draggable: true }) // draggable marker
    .setLngLat(e.lngLat)
    .addTo(map);

  marker.id = markers.length; // assigns ID to the marker

  marker.getElement().addEventListener("click", function () {
    marker.remove(); // remove the marker from the map
    markers = markers.filter((m) => m.id !== marker.id); // remove the marker from the array
  });

  markers.push(marker);
});

map.on("click", function (e) {
  var lat = e.lngLat.lat;
  var lng = e.lngLat.lng;

  var wikipediaUrl =
    "https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=10000&gscoord=" +
    lat +
    "|" +
    lng +
    "&format=json&origin=*&extracts=1&prop=pageimages&pithumbsize=50";

  fetch(wikipediaUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      // Extract the first 100 pages from the Wikipedia API response
      var pages = data.query.geosearch.slice(0, 100);

      // Shuffle pages
      function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // Shuffle pages
      pages = shuffle(pages);

      // Extract the first 4 historical facts from the pages
      var historicalFacts = pages.slice(0, 4).map(function (page) {
        // Get the page's title, extract a historical fact from the page and the page id
        var title = page.title;
        var extract = page.extract;
        var pageid = page.pageid;
        var wikipediaUrl = "https://en.wikipedia.org/?curid=" + pageid;
        if (extract) {
          return (
            "<h3><a href='" +
            wikipediaUrl +
            "' target='_blank'>" +
            title +
            "</a></h3><p>" +
            extract +
            "</p>"
          );
        } else {
          return (
            "<h3><a href='" +
            wikipediaUrl +
            "' target='_blank'>" +
            title +
            "</a></h3>"
          );
        }
      });
      console.log("historicalFacts: ", historicalFacts);

      // Show historical facts in info window
      new mapboxgl.Popup()
        .setLngLat([lng, lat])
        .setHTML(historicalFacts.join(""))
        .addTo(map);
    });
});

let lat, lng;
map.on("click", function (e) {
  var lat = e.lngLat.lat;
  var lng = e.lngLat.lng;

  // Show popup when users clicks
  marker.getElement().addEventListener("click", function () {
    popup.setHTML(`
      <h3><a href='${wikipediaUrl}' target='_blank'>${title}</a></h3>
      <p>${extract}</p>
    `);
    popup.addTo(map);
  });
});

// Create a new popup object
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});

// Test and example code for loading in historical images
// It currently works, but will be fully implemented in later versions
map.on("load", () => {
  map.addSource("portland", {
    type: "raster",
    url: "mapbox://examples.32xkp0wd",
  });

  map.addLayer({
    id: "portland",
    source: "portland",
    type: "raster",
  });

  // Day in History portion
  async function getHistory() {
    // Get the current date
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1; // January is 0
    let year = date.getFullYear();

    // Request URL
    let url = `https://history.muffinlabs.com/date/${month}/${day}`;

    // Make the API request
    let response = await fetch(url);
    let data = await response.json();

    // Extract the events from the response
    let events = data.data.Events;

    // Display the events in the "This Day in History" section
    let historyDiv = document.querySelector("#history");
    historyDiv.innerHTML = "";
    for (let event of events) {
      historyDiv.innerHTML += `<p>${event.year}: ${event.text}</p>`;
    }
  }

  // Call the function to retrieve and display the history events
  getHistory();
});

document.getElementById("search-button").addEventListener("click", function () {
  var searchInput = document.getElementById("search-input").value;
  geocode(searchInput, mapboxgl.accessToken).then(function (result) {
    map.jumpTo({
      center: result,
      zoom: 7.5,
    });
  });
});

function geocode(searchInput, accessToken) {
  return fetch(
    "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      searchInput +
      ".json?access_token=" +
      accessToken
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      return result.features[0].center;
    });
}

document
  .getElementById("search-input")
  .addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      document.getElementById("search-button").click();
    }
  });
