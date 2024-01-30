const locationsSource = () => [
	{
		image: "https://s3.amazonaws.com/architecture-org/files/buildings/sqr_lrg_aon-center-eric-rogers-013.jpg",
		title: "A",
		description: "",
		lat: -33.718234,
		lng: 150.363181,
	},
	{
		image: "https://images.adsttc.com/media/images/5da1/c12e/3312/fd49/8d00/01f1/newsletter/210.jpg?1570881829",
		title: "B",
		description: "",
		lat: -33.727111,
		lng: 150.371124,
	},
	{
		image: "https://www.themillsbuilding.com/userfiles/cms/building/images/1/building.jpg",
		title: "C",
		description: "",
		lat: -33.848588,
		lng: 151.209834,
	},
	{
		image: "https://www.itke.uni-stuttgart.de/.content/fotostrecken_v3/ICD-ITKE-FIT2023_van_Grachten/ICD_ITKE-FIT2023_CvdG_01.jpg?__scale=w:1170,h:658,cx:0,cy:79,cw:1520,ch:854",
		title: "D",
		description: "",
		lat: -33.851702,
		lng: 151.216968,
	},
	{
		image: "https://5.imimg.com/data5/SELLER/Default/2023/1/XH/BI/FH/48148637/residential-building-construction-services.png",
		title: "E",
		description: "",
		lat: -34.671264,
		lng: 150.863657,
	},
	{
		image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI37gwmFwi2vrfEeDYV4JLRYcp2IKZKGjS8A&usqp=CAU",
		title: "F",
		description: "",
		lat: -35.304724,
		lng: 148.662905,
	},
	{
		image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaelwVmOL-6aY8Kc-f-N0V8ncpdCC2zJ5KBw&usqp=CAU",
		title: "G",
		description: "",
		lat: -37.759859,
		lng: 145.128708,
	},
	{
		image: "https://media.blogto.com/articles/2020922-flatiron.jpg?w=2048&cmd=resize_then_crop&height=1365&quality=70",
		title: "H",
		description: "",
		lat: -37.765015,
		lng: 145.133858,
	},
	{
		image: "https://i.pinimg.com/736x/ef/1f/20/ef1f20285259cde1c5d9dd68ed72586b.jpg",
		title: "I",
		description: "",
		lat: -37.770104,
		lng: 145.143299,
	},
	{
		image: "https://i0.wp.com/theconstructor.org/wp-content/uploads/2014/10/Residential-building.jpg?resize=450%2C268&ssl=1",
		title: "J",
		description: "",
		lat: -37.774785,
		lng: 145.137978,
	},
	{
		image: "https://d3rcx32iafnn0o.cloudfront.net/Pictures/460x307/0/7/3/1960073_stantonwilliams_ucleastmarshgate_04_huftoncrow_941683_crop.jpg",
		title: "K",
		description: "",
		lat: -37.819616,
		lng: 144.968119,
	},
	{
		image: "https://www.roofingmegastore.co.uk/media/wysiwyg/9._The_Dancing_House_Prague-min.jpg",
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
