import L from "leaflet";

const displayMap = function (locations) {
   //? Create map
   const map = L.map("map", { scrollWheelZoom: false });
   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
         '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
   }).addTo(map);

   //.
   //? Fitting the map with all the coordinates
   const latlngs = locations.map((location) =>
      L.latLng(...location.coordinates.reverse())
   );
   map.fitBounds(latlngs);
   // map.setZoom(map.getZoom() - 1);

   //.
   //? adding marker and toolTip
   for (let i in locations) {
      const latlng = locations[i].coordinates;

      var myIcon = L.icon({
         iconUrl: "../img/pin.png",
         iconSize: [28, 38],
      });

      L.marker(latlng, { className: "marker", icon: myIcon })
         .addTo(map)
         .bindPopup(`${locations[i].description}`, {
            className: "custom-popup",
            autoClose: false,
         })
         .openPopup();
   }
};

export default displayMap;
