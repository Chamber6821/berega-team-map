const listFrom = async (url) => (await (await fetch(url)).json())?.response?.results || [];

const baseUrl = () =>
	window.location.href.includes("version-test") ? "https://berega.team/version-test" : "https://berega.team";

const listOfType = async (type) => await listFrom(`${baseUrl()}/api/1.1/obj/${type}`);

const idMap = (list) => list.reduce((obj, element) => ({ ...obj, [element._id]: element }), {});

const getResidentialComplexes = async () => {
	const [developers, features, complexes, apartments] = await Promise.all([
		listOfType("developer"),
		listOfType("features"),
		listOfType("residentialcomplex"),
		listOfType("apartments"),
	]);
	const developerMap = idMap(developers);
	const featureMap = idMap(features);
	const apartmentMap = idMap(apartments);
	return complexes.map((x) => ({
		title: x.name,
		description: `${x.apartments?.length || 0} апартаментов`,
		longDescription: [
			`Дата сдачи • ${x["due_date (OS)"] || "Не изветно"}`,
			`Застройщик • ${developerMap[x["Developer"]]?.name || "Не известен"}`,
		],
		tag: featureMap?.[x.features?.[0]]?.name || "",
		price: x.apartments
			? `от ${x.apartments.map((x) => apartmentMap[x]?.total_price).reduce(Math.min, Infinity)} $`
			: "Не определено",
		lat: x.address?.lat || 0,
		lng: x.address?.lng || 0,
		address: x.address?.address || "Нет адреса",
		image: x.pictures?.[0] || "",
		page: `https://berega.team/residential_complex/${x._id}`,
	}));
};

const getSecondHomes = async () => {
	const [homes, features] = await Promise.all([listOfType("secondhomes"), listOfType("features")]);
	const featureMap = idMap(features);
	return homes.map((x) => ({
		title: x.name,
		description: "Не понял откуда брать",
		longDescription: ["Дата сдачи неизвестна", "Застройщик неизвестен"],
		tag: featureMap?.[x.Features?.[0]]?.name || "",
		price: `${x.price} $`,
		lat: x.address?.lat || 0,
		lng: x.address?.lng || 0,
		address: x.address?.address || "Нет адреса",
		image: x.pictures?.[0] || "",
		page: `https://berega.team/second_home/${x._id}`,
	}));
};

const locationsSource = async () =>
	(await Promise.all([getResidentialComplexes(), getSecondHomes()])).reduce((a, b) => [...a, ...b], []);

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

window.initMap = async () => {
	const locations = await locationsSource();

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
			label: "",
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
