const range = (n) => [...Array(n).keys()];

const jsonFrom = async (url) => await (await fetch(url)).json();

const listFrom = async (url) => (await jsonFrom(url))?.response?.results || [];

const baseUrl = () =>
	window.location.href.includes("version-test")
		? "https://berega.team/version-test"
		: "https://berega.team";

const urlForType = (type) => new URL(`${baseUrl()}/api/1.1/obj/${type}`);

const urlWithParam = (url, param, value) => {
	const newUrl = new URL(url);
	newUrl.searchParams.set(param, value);
	return newUrl;
};

const listOfType = async (type, cursor = 0) =>
	await listFrom(urlWithParam(urlForType(type), "cursor", cursor));

const countOfType = async (type) =>
	(await jsonFrom(urlWithParam(urlForType(type), "limit", 1)))?.response
		?.remaining || 0;

const idMap = (list) =>
	list.reduce((obj, element) => ({ ...obj, [element._id]: element }), {});

const markerWithColor = (hex, size = 20) => ({
	url: `https://img.icons8.com/ios-filled/100/${hex}/100-percents.png`,
	scaledSize: new google.maps.Size(size, size),
	anchor: new google.maps.Point(size / 2, size / 2),
});

const getResidentialComplexes = async () => {
	const pageSize = 100;
	const [developers, features, complexes, apartments] = await Promise.all([
		listOfType("developer"),
		listOfType("features"),
		listOfType("residentialcomplex"),
		countOfType("apartments")
			.then((count) =>
				Promise.all(
					range(Math.ceil(count / pageSize)).map(
						async (page) =>
							await listOfType("apartments", page * pageSize)
					)
				)
			)
			.then((parts) => parts.reduce((a, b) => [...a, ...b], [])),
	]);
	const developerMap = idMap(developers);
	const featureMap = idMap(features);
	const apartmentMap = idMap(apartments);
	console.log(apartmentMap);
	return complexes.map((x) => {
		const apartments = x.apartments || [];
		const minApartmentPrice = apartments
			.map((x) => apartmentMap[x])
			.filter((x) => x !== undefined)
			.map((x) => x.total_price || x.total_area * x.price_per_meter)
			.reduce((a, b) => (a < b ? a : b), Infinity);
		if (minApartmentPrice === Infinity || !(minApartmentPrice > 1)) {
			console.log(
				x.name,
				apartments,
				apartments.map((x) => apartmentMap[x]?.total_price)
			);
		}
		const apartmentsInfo = [
			`${x.apartments?.length || 0} апартаментов`,
			`от ${minApartmentPrice.toFixed(2)} $`,
		];
		return {
			title: x.name,
			shortDescription: apartmentsInfo,
			description: [
				apartmentsInfo,
				[`Дата сдачи • ${x["due_date (OS)"] || "Не известно"}`],
				[
					`Застройщик • ${
						developerMap[x["Developer"]]?.name || "Не известен"
					}`,
				],
			],
			tag: featureMap?.[x.features?.[0]]?.name || "",
			lat: x.address?.lat || 0,
			lng: x.address?.lng || 0,
			address: x.address?.address || "Нет адреса",
			image: x.pictures?.[0] || "",
			page: `https://berega.team/residential_complex/${x._id}`,
			marker: markerWithColor("395296"),
		};
	});
};

const getSecondHomes = async () => {
	const [homes, features] = await Promise.all([
		listOfType("secondhomes"),
		listOfType("features"),
	]);
	const featureMap = idMap(features);
	return homes.map((x) => ({
		title: x.name,
		shortDescription: ["Цена", `${x.price} $`],
		description: [
			["Цена", `${x.price} $`],
			["Цена за м²", `${x.price_per_meter?.toFixed(2)} $`],
			[`${x.floor} этаж, ${x.total_area} м²`],
		],
		tag: featureMap?.[x.Features?.[0]]?.name || "",
		price: `${x.price} $`,
		lat: x.address?.lat || 0,
		lng: x.address?.lng || 0,
		address: x.address?.address || "Нет адреса",
		image: x.pictures?.[0] || "",
		page: `https://berega.team/second_home/${x._id}`,
		marker: markerWithColor("439639"),
	}));
};

const locationsSource = async () =>
	(await Promise.all([getResidentialComplexes(), getSecondHomes()])).reduce(
		(a, b) => [...a, ...b],
		[]
	);

const on = (target, eventName, handler) => {
	target.addEventListener(eventName, handler);
	return {
		disable: () => target.removeEventListener(eventName, handler),
	};
};

const onOnce = (target, eventName, handler) => {
	const subscription = on(target, eventName, (...args) => {
		subscription.disable();
		handler(...args);
	});
	return subscription;
};

const eventSourceFromGoogle = (googleObject) => {
	const subscriptionMap = {};
	return {
		addEventListener: (eventName, handler) => {
			if (!subscriptionMap[eventName])
				subscriptionMap[eventName] = new Map();
			subscriptionMap[eventName][handler] = googleObject.addListener(
				eventName,
				handler
			);
		},
		removeEventListener: (eventName, handler) => {
			const mapForEvent = subscriptionMap[eventName];
			google.maps.event.removeListener(mapForEvent[handler]);
			mapForEvent.delete[handler];
		},
	};
};

const attachControl = (controlArray, element) => {
	const newLength = controlArray.push(element);
	return {
		detach: () => {
			controlArray.removeAt(newLength - 1);
		},
	};
};

const button = (title) =>
	elementFromHtml(`<button class="primary">${title}</button>`);

const buttonGroup = (...buttons) => {
	const div = document.createElement("div");
	div.replaceChildren(...buttons);
	return div;
};

const enablePaintingOnMap = (map, onPolygonChanged = (polygon) => {}) => {
	const draggable = {
		draggable: true,
		zoomControl: true,
		scrollwheel: true,
		disableDoubleClickZoom: false,
	};
	const notDraggable = {
		draggable: false,
		zoomControl: false,
		scrollwheel: false,
		disableDoubleClickZoom: true,
	};
	const polygon = new google.maps.Polygon({
		map,
		paths: [],
		strokeColor: "#439639",
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: "#439639",
		fillOpacity: 0.1,
		clickable: false,
	});
	const mapEventSource = eventSourceFromGoogle(map);
	const drawAreaButton = button("Нарисовать область");
	const cancelDrawingButton = button("Закончить рисование");
	const removeAreaButton = button("Удалить область");
	const drawingControls = attachControl(
		map.controls[google.maps.ControlPosition.TOP_LEFT],
		buttonGroup(drawAreaButton, removeAreaButton, cancelDrawingButton)
	);
	show(drawAreaButton);
	hide(cancelDrawingButton);
	hide(removeAreaButton);

	const removeArea = on(removeAreaButton, "click", () => {
		hide(removeAreaButton);
		polygon.setPath([]);
		onPolygonChanged(polygon);
	});
	const enablePainting = on(drawAreaButton, "click", () => {
		hide(drawAreaButton);
		show(cancelDrawingButton);

		const mouseover = on(mapEventSource, "mouseover", () => {
			const mousedown = on(document, "mousedown", () => {
				map.setOptions(notDraggable);

				const polyline = new google.maps.Polyline({
					map,
					path: [],
					geodesic: true,
					strokeColor: "#439639",
					strokeOpacity: 1.0,
					strokeWeight: 2,
				});

				const mousemove = on(mapEventSource, "mousemove", (e) => {
					if (!(e.domEvent.buttons & 1)) return;
					polyline.getPath().push(e.latLng);
				});

				onOnce(document, "mouseup", () => {
					mousemove.disable();

					map.setOptions(draggable);
					polyline.setMap(null);
					polygon.setPath(polyline.getPath());
					onPolygonChanged(polygon);
					show(removeAreaButton);
				});
			});
			onOnce(mapEventSource, "mouseout", mousedown.disable);
		});
		onOnce(cancelDrawingButton, "click", () => {
			mouseover.disable();
			show(drawAreaButton);
			show(removeAreaButton);
			hide(cancelDrawingButton);
		});
	});

	return {
		disable: () => {
			removeArea.disable();
			enablePainting.disable();
			drawingControls.detach();
		},
	};
};

window.initMap = async () => {
	const locations = await locationsSource();

	const buildings = document.getElementById("buildings");
	buildings.innerHTML = ""; // remove element children
	const buildingElements = locations.map((x) =>
		buildings.appendChild(
			elementFromHtml(card(x.image, x.title, x.shortDescription, x.page))
		)
	);

	const map = new google.maps.Map(document.getElementById("map"), {
		zoom: 6,
		gestureHandling: "greedy",
		center: {
			lat: average(locations.map((x) => x.lat)),
			lng: average(locations.map((x) => x.lng)),
		},
		styles: [
			{
				elementType: "labels",
				stylers: [
					{
						visibility: "off",
					},
				],
			},
			{
				featureType: "administrative.land_parcel",
				stylers: [
					{
						visibility: "off",
					},
				],
			},
			{
				featureType: "administrative.neighborhood",
				stylers: [
					{
						visibility: "off",
					},
				],
			},
		],
	});
	const markers = locations.map((location, i) => {
		const marker = new google.maps.Marker({
			position: { lat: location.lat, lng: location.lng },
			card: buildingElements[i],
			icon: location.marker,
		});
		marker.addListener("click", () => showModal(location));
		return marker;
	});

	let updateInstance = {};
	let lastPolygon = new google.maps.Polygon({});
	const updateCards = (polygon) => {
		if (polygon) lastPolygon = polygon;
		const localInstance = (updateInstance = {});
		const bounds = map.getBounds();
		const showInBounds = (x) => show(x.card);
		const showInPolygon = (x) =>
			google.maps.geometry.poly.containsLocation(
				x.getPosition(),
				lastPolygon
			)
				? show(x.card)
				: hide(x.card);
		const showIf =
			lastPolygon.getPath().length == 0 ? showInBounds : showInPolygon;

		const packSize = 16;
		const iteration = (base) => {
			if (updateInstance !== localInstance) return;
			for (let i = 0; i < packSize; i++) {
				if (base + i >= markers.length) return;
				showIf(markers[base + i]);
			}
			setTimeout(() => iteration(base + packSize), 1);
		};
		setTimeout(() => iteration(0), 1);
	};

	enablePaintingOnMap(map, updateCards);
	map.addListener(
		"zoom_changed",
		() => map.getZoom() > 17 && map.setZoom(17)
	);

	new markerClusterer.MarkerClusterer({
		markers,
		map,
		algorithmOptions: {
			maxZoom: 17,
		},
		renderer: {
			render: (cluster, stat, map) =>
				new google.maps.Marker({
					position: cluster.position,
					label: { text: `${cluster.count}`, color: "white" },
					icon: markerWithColor("439639", 30),
				}),
		},
	});
};

const elementFromHtml = (html) => {
	const element = document.createElement("div");
	element.innerHTML = html;
	return element.firstChild;
};

const card = (image, title, description, page) =>
	`<a href="${page}" style="text-decoration: none;" target="_blank"><div class="building">
  <img loading="lazy" src="${image}">
  <button class="like">
    <div style="scale: 1.9;">
      <ion-icon name="heart-outline" aria-label="Favorite"></ion-icon>
      <ion-icon name="heart" aria-label="Favorite"></ion-icon>
    </div>
  </button>
  <div class="body">
    <h1>${title}</h1>
    <div class="flex-column">
      ${modalRow(description[0], description[1])}
    </div>
  </div>
</div></a>`;

const modalRow = (simpleText = "", greenText = "") =>
	`<div class="group">
		<p>${simpleText}</p>
		<p class="price">${greenText}</p>
	</div>`;

const hide = (element) => element.setAttribute("hidden", "");
const show = (element) => element.removeAttribute("hidden");
const average = (numbers) =>
	numbers.reduce((a, b) => a + b, 0) / numbers.length;

const showModal = ({ tag, image, title, address, description, page }) => {
	document.getElementById("map-modal-tag").textContent = tag;
	document.getElementById("map-modal-image").setAttribute("src", image);
	document.getElementById("map-modal-title").textContent = title;
	document.getElementById("map-modal-address").textContent = address;
	document
		.getElementById("map-modal-description")
		.replaceChildren(
			...description.map(([simple, green]) =>
				elementFromHtml(modalRow(simple, green))
			)
		);
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
