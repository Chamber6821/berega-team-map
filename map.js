const locationsSource = () =>
	[
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
	].map((x) => ({
		...x,
		description: "очень много апартаментов",
		price: "от 99 999 $",
		tag: "Лучший вариант",
		address: "г.Пушкина д.Колотушкина",
		longDescription: ["Сдали без б", "Застройщик лучший просто"],
		page: x.image,
	}));

const enablePaintingOnMap = (map, onPoligonChanged = (polygon) => {}) => {
	const draggable = { draggable: true, zoomControl: true, scrollwheel: true, disableDoubleClickZoom: false };
	const notDraggable = { draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true };
	const polygon = new google.maps.Polygon({
		map,
		paths: [],
		strokeColor: "#00FF00",
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: "#00FF00",
		fillOpacity: 0.1,
		clickable: false,
	});
	const mouseover = map.addListener("mouseover", () => {
		let fired = false;
		const altKeyDown = (e) => {
			if (!e.altKey) return;
			if (fired) return;
			fired = true;
			polygon.setPath([]);
			onPoligonChanged(polygon);
		};
		const altKeyUp = (e) => (fired = false);
		document.addEventListener("keydown", altKeyDown);
		document.addEventListener("keyup", altKeyUp);

		const mousedown = (e) => {
			if (!e.altKey) return;
			map.setOptions(notDraggable);

			const polyline = new google.maps.Polyline({
				map,
				path: [],
				geodesic: true,
				strokeColor: "#FFFF00",
				strokeOpacity: 1.0,
				strokeWeight: 2,
			});

			const mousemove = map.addListener("mousemove", (e) => {
				if (!(e.domEvent.altKey && e.domEvent.buttons & 1)) return;
				polyline.getPath().push(e.latLng);
			});

			const mouseup = (e) => {
				document.removeEventListener("mouseup", mouseup);
				google.maps.event.removeListener(mousemove);

				map.setOptions(draggable);
				polyline.setMap(null);
				polygon.setPath(polyline.getPath());
				onPoligonChanged(polygon);
			};
			document.addEventListener("mouseup", mouseup);
		};
		document.addEventListener("mousedown", mousedown);

		const mouseout = map.addListener("mouseout", () => {
			google.maps.event.removeListener(mouseout);
			document.removeEventListener("mousedown", mousedown);
			document.removeEventListener("keydown", altKeyDown);
			document.removeEventListener("keyup", altKeyUp);
		});
	});
	return {
		disable: () => google.maps.event.removeListener(mouseover),
	};
};

window.initMap = () => {
	const locations = locationsSource();

	const buildings = document.getElementById("buildings");
	buildings.innerHTML = ""; // remove element children
	const buildingElements = locations.map((x) =>
		buildings.appendChild(elementFromHtml(card(x.image, x.title, x.description)))
	);

	const map = new google.maps.Map(document.getElementById("map"), {
		zoom: 6,
		center: {
			lat: average(locations.map((x) => x.lat)),
			lng: average(locations.map((x) => x.lng)),
		},
	});
	const markers = locations.map((location, i) => {
		const marker = new google.maps.Marker({
			position: { lat: location.lat, lng: location.lng },
			label: location.title,
			card: buildingElements[i],
		});
		marker.addListener("click", () => showModal(location));
		return marker;
	});

	const updateCards = (polygon) =>
		polygon.getPath().length == 0
			? markers.forEach((x) => show(x.card))
			: markers.forEach((x) =>
					google.maps.geometry.poly.containsLocation(x.getPosition(), polygon) ? show(x.card) : hide(x.card)
			  );

	enablePaintingOnMap(map, updateCards);
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
  <button class="like">
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

const hide = (element) => element.setAttribute("hidden", "");
const show = (element) => element.removeAttribute("hidden");
const average = (numbers) => numbers.reduce((a, b) => a + b, 0) / numbers.length;

const showModal = ({ tag, image, title, address, description, price, longDescription, page }) => {
	document.getElementById("map-modal-tag").textContent = tag;
	document.getElementById("map-modal-image").setAttribute("src", image);
	document.getElementById("map-modal-title").textContent = title;
	document.getElementById("map-modal-address").textContent = address;
	document.getElementById("map-modal-description").textContent = description;
	document.getElementById("map-modal-price").textContent = price;
	document.getElementById("map-modal-long-description").innerHTML = longDescription
		.map((x) => `<p>${x}</p>`)
		.reduce((a, b) => a + b, "");
	document.getElementById("map-modal-page").setAttribute("href", page);

	const modal = document.getElementById("map-modal");
	const click = (e) => {
		if (e.target !== modal) return;
		modal.style.display = "none";
		modal.removeEventListener("click", click);
	};
	modal.addEventListener("click", click);
	modal.style.display = "";
};
