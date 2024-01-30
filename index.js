const locations = () => [
	{
		image: "",
		title: "A",
		description: "",
		lat: -33.718234,
		lng: 150.363181,
	},
	{
		image: "",
		title: "B",
		description: "",
		lat: -33.727111,
		lng: 150.371124,
	},
	{
		image: "",
		title: "C",
		description: "",
		lat: -33.848588,
		lng: 151.209834,
	},
	{
		image: "",
		title: "D",
		description: "",
		lat: -33.851702,
		lng: 151.216968,
	},
	{
		image: "",
		title: "E",
		description: "",
		lat: -34.671264,
		lng: 150.863657,
	},
	{
		image: "",
		title: "F",
		description: "",
		lat: -35.304724,
		lng: 148.662905,
	},
	{
		image: "",
		title: "G",
		description: "",
		lat: -37.759859,
		lng: 145.128708,
	},
	{
		image: "",
		title: "H",
		description: "",
		lat: -37.765015,
		lng: 145.133858,
	},
	{
		image: "",
		title: "I",
		description: "",
		lat: -37.770104,
		lng: 145.143299,
	},
	{
		image: "",
		title: "J",
		description: "",
		lat: -37.774785,
		lng: 145.137978,
	},
	{
		image: "",
		title: "K",
		description: "",
		lat: -37.819616,
		lng: 144.968119,
	},
	{
		image: "",
		title: "L",
		description: "",
		lat: -38.330766,
		lng: 144.695692,
	},
];

const locations = locationsSource();

const initPosition = () => {
	const sum = locations.reduce((a, b) => ({ lat: a.lat + b.lat, lng: a.lng + b.lng }), { lat: 0, lng: 0 });
	return {
		zoom: 6,
		center: { lat: sum.lat / locations.length, lng: sum.lng / locations.length },
	};
};

window.initMap = () => {
	const map = new google.maps.Map(document.getElementById("map"), initPosition());
	const markers = locations.map((location, i) => {
		const marker = new google.maps.Marker({
			position: { lat: location.lat, lng: location.lng },
			label: location.title,
		});
		return marker;
	});

	// Add a marker clusterer to manage the markers.
	new markerClusterer.MarkerClusterer({ markers, map });
};

const elementFromHtml = (html) => {
	const element = document.createElement("div");
	element.innerHTML = html;
	return element.firstChild;
};

const card = (image, title, description) =>
	`<div class="building">
  <img src="${image}">
  <button>
    <div style="scale: 1.9;">
      <ion-icon name="heart-outline" aria-label="Favorite"></ion-icon>
      <ion-icon name="heart" aria-label="Favorite"></ion-icon>
    </div>
  </button>
  <div class="body">
    <h1>${title}</h1>
    <p>${description}</p>
  </div>
</div>`;

const buildings = document.getElementById("buildings");
locations.forEach((x) => buildings.appendChild(elementFromHtml(card(x.image, x.title, x.description))));
