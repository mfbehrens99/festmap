const map = L.map('map').setView([49.02000, 8.42317], 20);

const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 22,
	maxNativeZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
	maxZoom: 22,
	subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

var baseMaps = {
	"Google satellite": googleSat,
	"OpenStreetMap": osm,
};

function rotate(x, y, r) {
	r *= Math.PI / 180.0;
	return [
		Math.cos(r) * x - Math.sin(r) * y,
		Math.sin(r) * x + Math.cos(r) * y
	];
}

class Rectangle {
	constructor(latPos, lngPos, xSize, ySize, rotation, color, text, category) {
		this.latPos = latPos;
		this.lngPos = lngPos;
		this.xSize = xSize;
		this.ySize = ySize;
		this.rotation = rotation;
		this.color = color;
		this.text = text;
		this.category = category;
		this.polygon = L.polygon([[0.0,0.0], [0.0,0.0], [0.0,0.0], [0.0,0.0]], {color: color});
		this.marker = new L.marker([0.0, 0.0], { opacity: 0.01 });
		this.marker.bindTooltip(text, {
			//permanent: true,
			direction: 'center',
			className: 'my-labels',
			offset: [0, 12],
		});
		this.update();
	}

	addTo(elem) {
		this.polygon.addTo(elem);
		this.marker.addTo(elem);
	}

	update() {
		const latLenght = 111300.0; // Meter
		const lngLenght = latLenght * Math.cos(this.latPos / 180.0 * Math.PI); // Meter

		let x1 = 0.5 * (this.xSize * Math.cos(this.rotation) - this.ySize * Math.sin(this.rotation)) / latLenght;
		let y1 = 0.5 * (this.ySize * Math.cos(this.rotation) + this.xSize * Math.sin(this.rotation)) / lngLenght;

		let points = [
			rotate(-this.xSize, this.ySize, this.rotation),
			rotate(this.xSize, this.ySize, this.rotation),
			rotate(this.xSize, -this.ySize, this.rotation),
			rotate(-this.xSize, -this.ySize, this.rotation),
		];
		
		for (let i = 0; i < 4; ++i) {
			points[i][0] /= 2.0 * latLenght;
			points[i][1] /= 2.0 * lngLenght;
			points[i][0] += this.latPos;
			points[i][1] += this.lngPos;
		}

		this.polygon.setLatLngs(points);
		this.marker.setLatLng([this.latPos, this.lngPos]);
	}
}

let categoryLayers = {};
var layerControl = L.control.layers(baseMaps, categoryLayers).addTo(map);

function addRectToCategoryLayer(rect) {
	if (!(rect.category in categoryLayers)) {
		categoryLayers[rect.category] = L.layerGroup();
		layerControl.addOverlay(categoryLayers[rect.category], rect.category);
		categoryLayers[rect.category].addTo(map);
	}
	rect.addTo(categoryLayers[rect.category]);
}

let rects = [];
let selected = -1;

function selectRect(index) {
	if (index < 0 || index >= rects.length) {
		return;
	}

	selected = index;
	for (let j = 0; j < rects.length; ++j) {
		rects[j].polygon.setStyle({color: selected == j ? 'green' : rects[j].color});
	}
}

function addRect(rect) {
	rects.push(rect);
	addRectToCategoryLayer(rect);
	const i = rects.length - 1;
	rect.polygon.on('click', function(e) {
		selectRect(i);
	});
}

let data = [
	{
		"name": "HaDiKo-Zelt",
		"width": 12,
		"height": 6,
		"lat": 49.020301004766736,
		"lng": 8.42291049627781,
		"rotation": -87.60765194892883,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "HaDiKo-Zelt",
		"width": 12,
		"height": 6,
		"lat": 49.01952190420868,
		"lng": 8.422396481037142,
		"rotation": -87.84234523773193,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.020142477245685,
		"lng": 8.423091545386315,
		"rotation": 9.655952453613281,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.020109955635505,
		"lng": 8.423088490962984,
		"rotation": -1.475214958190918,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02007917352782,
		"lng": 8.42309955507517,
		"rotation": -25.112181901931763,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.0200486112816,
		"lng": 8.42311028391123,
		"rotation": 0,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02001607016587,
		"lng": 8.423117995262148,
		"rotation": 20.31773328781128,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01998440850494,
		"lng": 8.42310927808285,
		"rotation": 0,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019952307087856,
		"lng": 8.42310927808285,
		"rotation": 0,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01991954602583,
		"lng": 8.423108942806723,
		"rotation": 0,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019887004813654,
		"lng": 8.423108942806723,
		"rotation": 0.8046627044677734,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.020283654292676,
		"lng": 8.42292755842209,
		"rotation": -87.9429280757904,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02028409403677,
		"lng": 8.422899395227434,
		"rotation": -88.24467658996582,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02028475365025,
		"lng": 8.422870561480524,
		"rotation": -87.74176239967346,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02028541326409,
		"lng": 8.42284206300974,
		"rotation": -88.00998330116272,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertisch überbreit",
		"width": 2.2,
		"height": 0.8,
		"lat": 49.02031641511216,
		"lng": 8.422893024981024,
		"rotation": -88.34525942802429,
		"color": "#FAB57F",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertisch überbreit",
		"width": 2.2,
		"height": 0.8,
		"lat": 49.02031685485407,
		"lng": 8.422861844301226,
		"rotation": -88.44584226608276,
		"color": "#FAB57F",
		"category": "Biergarnituren"
	},
	{
		"name": "Kühlschrank",
		"width": 1,
		"height": 1,
		"lat": 49.02031795420999,
		"lng": 8.422838542610409,
		"rotation": 1.3746321201324463,
		"color": "#2f4f4f",
		"category": "Kühlgeräte"
	},
	{
		"name": "Spüle",
		"width": 1.5,
		"height": 1,
		"lat": 49.020314985977016,
		"lng": 8.422996625304224,
		"rotation": -87.2388482093811,
		"color": "#BCC6CC",
		"category": "Sanitär"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.019515617929265,
		"lng": 8.422345556004048,
		"rotation": -177.52870917320251,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01951541791086,
		"lng": 8.422383405268194,
		"rotation": 1.5087425708770752,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01951431853755,
		"lng": 8.422456830739977,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01951497816218,
		"lng": 8.42242330312729,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01954587055508,
		"lng": 8.422335460782053,
		"rotation": -87.57412433624268,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01954455130361,
		"lng": 8.422373011708261,
		"rotation": -87.64117956161499,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01954367180597,
		"lng": 8.422411233186724,
		"rotation": -88.04351091384888,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01954279230843,
		"lng": 8.422448784112932,
		"rotation": 90.52455425262451,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "K2-Bar-Zelt",
		"width": 10,
		"height": 5,
		"lat": 49.020227477134604,
		"lng": 8.423026129603388,
		"rotation": 0.737607479095459,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02028299468335,
		"lng": 8.422955553978683,
		"rotation": 92.335045337677,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02031377665326,
		"lng": 8.42292806133628,
		"rotation": -89.01581168174744,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02031311704243,
		"lng": 8.422960583120586,
		"rotation": 92.03329682350159,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.020191967861024,
		"lng": 8.423008527606727,
		"rotation": 0.9052455425262451,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02020999734213,
		"lng": 8.423008862882854,
		"rotation": 0.5699694156646729,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.020227806942586,
		"lng": 8.423008862882854,
		"rotation": 0.5364418029785156,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02024583640871,
		"lng": 8.423009198158981,
		"rotation": 0.46938657760620117,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02026364599754,
		"lng": 8.423009198158981,
		"rotation": 0,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02026298638351,
		"lng": 8.4230531193316,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.020245396665786,
		"lng": 8.4230531193316,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02022758707102,
		"lng": 8.4230531193316,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02020955759634,
		"lng": 8.4230531193316,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02019152812846,
		"lng": 8.423052784055473,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Rothaus-Bierinsel",
		"width": 7.5,
		"height": 7.5,
		"lat": 49.02013535082594,
		"lng": 8.423029482364656,
		"rotation": 0,
		"color": "yellow",
		"category": "Wagen"
	},
	{
		"name": "Koeri-Wagen",
		"width": 3,
		"height": 2,
		"lat": 49.02008148218639,
		"lng": 8.42304825782776,
		"rotation": 0,
		"color": "#A67B5B",
		"category": "Wagen"
	},
	{
		"name": "Pavillon",
		"width": 3,
		"height": 3,
		"lat": 49.020074446281626,
		"lng": 8.42282496392727,
		"rotation": 1.911073923110962,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Pavillon",
		"width": 3,
		"height": 3,
		"lat": 49.020075765533946,
		"lng": 8.422783054411413,
		"rotation": 1.9446015357971191,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Rothaus-Zelt",
		"width": 6,
		"height": 3,
		"lat": 49.01980554177636,
		"lng": 8.422881290316584,
		"rotation": -89.48519825935364,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01980609145931,
		"lng": 8.42285178601742,
		"rotation": -0.16763806343078613,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01980587158334,
		"lng": 8.422882966697218,
		"rotation": 0.06705522537231445,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1,
		"lat": 49.01980499209873,
		"lng": 8.422911129891874,
		"rotation": -0.8046627044677734,
		"color": "brown",
		"category": "Sofas"
	},
	{
		"name": "Bühne",
		"width": 6,
		"height": 5,
		"lat": 49.01979859628504,
		"lng": 8.422739170176984,
		"rotation": 90.9268856048584,
		"color": "#222222",
		"category": "Wagen"
	},
	{
		"name": "Pavillon",
		"width": 3,
		"height": 3,
		"lat": 49.019923781669036,
		"lng": 8.42303651770149,
		"rotation": 0,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Doppel-Pavillon",
		"width": 6,
		"height": 3,
		"lat": 49.019889093608455,
		"lng": 8.42238910496235,
		"rotation": -178.13220620155334,
		"color": "white",
		"category": "Zelte"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.019898328281364,
		"lng": 8.422459848225119,
		"rotation": 3.084540367126465,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.01987963907094,
		"lng": 8.422458507120611,
		"rotation": 1.8104910850524902,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.019906683457016,
		"lng": 8.422387428581716,
		"rotation": 91.42979979515076,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01988689488353,
		"lng": 8.422387763857843,
		"rotation": -88.1776213645935,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01986864541578,
		"lng": 8.422386087477209,
		"rotation": 91.12805128097534,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Stuhl",
		"width": 0.2,
		"height": 0.2,
		"lat": 49.019899298246166,
		"lng": 8.422471619827748,
		"rotation": 0,
		"color": "#add8e6",
		"category": "Tische"
	},
	{
		"name": "Stuhl",
		"width": 0.2,
		"height": 0.2,
		"lat": 49.01988744456734,
		"lng": 8.422470912337305,
		"rotation": 0,
		"color": "#add8e6",
		"category": "Tische"
	},
	{
		"name": "Stuhl",
		"width": 0.2,
		"height": 0.2,
		"lat": 49.01987755027578,
		"lng": 8.422470577061178,
		"rotation": 0,
		"color": "#add8e6",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.020044543638605,
		"lng": 8.42252690345049,
		"rotation": -89.95458483695984,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02002959231185,
		"lng": 8.422510810196401,
		"rotation": -0.5029141902923584,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.02001024353279,
		"lng": 8.42250980436802,
		"rotation": -0.46938657760620117,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.01999661141528,
		"lng": 8.422546014189722,
		"rotation": 0,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02003289040849,
		"lng": 8.422546014189722,
		"rotation": 0,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.02001354162065,
		"lng": 8.422545678913595,
		"rotation": 0.33527612686157227,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Spüle",
		"width": 1.5,
		"height": 1,
		"lat": 49.019992873604025,
		"lng": 8.42250879853964,
		"rotation": 0,
		"color": "#BCC6CC",
		"category": "Sanitär"
	},
	{
		"name": "Eistruhe",
		"width": 1.5,
		"height": 1,
		"lat": 49.01997825206809,
		"lng": 8.422509469091894,
		"rotation": -1.2069940567016602,
		"color": "#2f2f2f",
		"category": "Kühlgeräte"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.01985765175082,
		"lng": 8.42254400253296,
		"rotation": 1.4081597328186035,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.019876121098626,
		"lng": 8.422544673085214,
		"rotation": 1.2069940567016602,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.019895030171305,
		"lng": 8.422545343637468,
		"rotation": 1.5422701835632324,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"lat": 49.01991349951606,
		"lng": 8.422546014189722,
		"rotation": 1.5422701835632324,
		"color": "red",
		"category": "Biergarnituren"
	},
	{
		"name": "Spüle",
		"width": 1.5,
		"height": 1,
		"lat": 49.01984621835621,
		"lng": 8.42249169945717,
		"rotation": 0,
		"color": "#BCC6CC",
		"category": "Sanitär"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01990118663403,
		"lng": 8.422520197927954,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01990162636197,
		"lng": 8.422504775226118,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.019874801859125,
		"lng": 8.422504775226118,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Tisch",
		"width": 2,
		"height": 1,
		"lat": 49.01987480186106,
		"lng": 8.422519192099573,
		"rotation": 0,
		"color": "blue",
		"category": "Tische"
	},
	{
		"name": "Eistruhe",
		"width": 1.5,
		"height": 1,
		"lat": 49.019945161229515,
		"lng": 8.422499746084215,
		"rotation": 0,
		"color": "#2f2f2f",
		"category": "Kühlgeräte"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019937245795376,
		"lng": 8.422555401921274,
		"rotation": 0.4023313522338867,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01995439581051,
		"lng": 8.422521874308588,
		"rotation": 91.46332740783691,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01994208297691,
		"lng": 8.422488346695902,
		"rotation": 2.7492642402648926,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01990998154195,
		"lng": 8.422485664486887,
		"rotation": 3.285706043243408,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01987919932538,
		"lng": 8.422482982277872,
		"rotation": 3.7550926208496094,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019846218361394,
		"lng": 8.422479629516603,
		"rotation": 2.0116567611694336,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01998913576124,
		"lng": 8.422499746084215,
		"rotation": 1.3075768947601318,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.0200225563349,
		"lng": 8.422500416636469,
		"rotation": 1.0058283805847168,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01996956709579,
		"lng": 8.422524556517603,
		"rotation": 90.65866470336914,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01982071303994,
		"lng": 8.422807529568674,
		"rotation": 89.78694677352905,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.0198211527862,
		"lng": 8.422858491539957,
		"rotation": 89.11639451980591,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01982203228107,
		"lng": 8.422908112406732,
		"rotation": 86.63535118103027,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01982796885385,
		"lng": 8.422956392169,
		"rotation": 73.55958223342896,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01980444240547,
		"lng": 8.422460183501245,
		"rotation": 0,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01978773201413,
		"lng": 8.422485664486887,
		"rotation": 91.99976921081543,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01978751213599,
		"lng": 8.422534279525282,
		"rotation": 89.988112449646,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01978729226512,
		"lng": 8.422583900392057,
		"rotation": -89.18344974517822,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01977893708515,
		"lng": 8.42262949794531,
		"rotation": -62.3948872089386,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01977014211679,
		"lng": 8.422663025557997,
		"rotation": -11.1311674118042,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01974067909237,
		"lng": 8.42273209244013,
		"rotation": 75.77240467071533,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01974573616917,
		"lng": 8.422688506543638,
		"rotation": 124.38744306564331,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019802463522076,
		"lng": 8.422661349177362,
		"rotation": 156.74158930778503,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01974815474037,
		"lng": 8.422779366374018,
		"rotation": 75.80593228340149,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019757389434986,
		"lng": 8.422826640307905,
		"rotation": 74.02896881103516,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01976728375406,
		"lng": 8.422873914241793,
		"rotation": 72.21847772598267,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019776518453234,
		"lng": 8.422921523451807,
		"rotation": 76.20826363563538,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019789491020795,
		"lng": 8.422965779900553,
		"rotation": 54.41531538963318,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02034181025096,
		"lng": 8.422782719135286,
		"rotation": 91.19510650634766,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02043877324883,
		"lng": 8.42277266085148,
		"rotation": 90.99394083023071,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02044427005445,
		"lng": 8.422726057469847,
		"rotation": 109.2664897441864,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02044031239203,
		"lng": 8.42267878353596,
		"rotation": 92.26799011230469,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02044119187492,
		"lng": 8.422630168497564,
		"rotation": 91.3962721824646,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02042558102726,
		"lng": 8.42260502278805,
		"rotation": 3.0174851417541504,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02039413951381,
		"lng": 8.422604687511923,
		"rotation": -2.4139881134033203,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02045306490966,
		"lng": 8.422807529568674,
		"rotation": 24.67632293701172,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02040722181034,
		"lng": 8.422699905931951,
		"rotation": 2.514570951461792,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02037819887939,
		"lng": 8.422684483230116,
		"rotation": 36.913901567459106,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019859410737354,
		"lng": 8.422345519065859,
		"rotation": 81.77384734153748,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019848636832876,
		"lng": 8.422151729464533,
		"rotation": 89.14992213249207,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01985743186804,
		"lng": 8.422296904027464,
		"rotation": 90.39044380187988,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019856112566075,
		"lng": 8.422248624265196,
		"rotation": 86.19949221611023,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01986534731572,
		"lng": 8.422205708920957,
		"rotation": 128.9471983909607,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01985721197515,
		"lng": 8.422393128275873,
		"rotation": -73.35841655731201,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01985237469796,
		"lng": 8.42244040220976,
		"rotation": 91.66449308395386,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.02016624285901,
		"lng": 8.423116318881513,
		"rotation": 237.8113567829132,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01995791384381,
		"lng": 8.422463536262514,
		"rotation": 91.73154830932617,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019836324030315,
		"lng": 8.422463200986387,
		"rotation": 3.688037395477295,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01995263688312,
		"lng": 8.422414585947992,
		"rotation": 69.20099258422852,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01993174897001,
		"lng": 8.422380387783052,
		"rotation": 202.80852913856506,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.01980960943035,
		"lng": 8.423004336655142,
		"rotation": 46.737492084503174,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Kühlschrank",
		"width": 1,
		"height": 1,
		"lat": 49.019500686299665,
		"lng": 8.422382399439813,
		"rotation": 0,
		"color": "#2f4f4f",
		"category": "Kühlgeräte"
	},
	{
		"name": "Kühlschrank",
		"width": 1,
		"height": 1,
		"lat": 49.01950068630043,
		"lng": 8.422422967851164,
		"rotation": 0,
		"color": "#2f4f4f",
		"category": "Kühlgeräte"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.019813567150265,
		"lng": 8.422674760222437,
		"rotation": 103.39915752410889,
		"color": "gray",
		"category": "Abgrenzungen"
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"lat": 49.020362588069,
		"lng": 8.422606363892557,
		"rotation": -0.6370246410369873,
		"color": "gray",
		"category": "Abgrenzungen"
	}
];

data.forEach((e) => {
	addRect(new Rectangle(e.lat, e.lng, e.width, e.height, e.rotation, e.color, e.name, e.category));
});

let dragging = false;
let rotating = false;
let ctrl = false;
let startLng = 0;
let startRot = 0;
let latDiff = 0;
let lngDiff = 0;

map.on('mousedown', function(e) {
	if (selected < 0) {
		return;
	}
	latDiff = e.latlng.lat - rects[selected].latPos;
	lngDiff = e.latlng.lng - rects[selected].lngPos;
	startLng = e.latlng.lng;
	startRot = rects[selected].rotation;
	dragging = true;
	rotating = ctrl;
});

map.on('mouseup', function(e) {
	dragging = false;
});

map.on('mousemove', function(e) {
	if (dragging) {
		if (rotating) {
			rects[selected].rotation = (startRot + (startLng - e.latlng.lng) * 100000.0) % 360.0; 
		} else {
			rects[selected].latPos = e.latlng.lat - latDiff;
			rects[selected].lngPos = e.latlng.lng - lngDiff;
		}
		rects[selected].update();
	}
});

map.on('keydown', function(e) {
	if (e.originalEvent.key === "Control") {
		ctrl = true;
	}
});

map.on('keyup', function(e) {
	if (e.originalEvent.key === "Control") {
		ctrl = false;
	}
});

var getJSON = function(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'json';
	xhr.onload = function() {
	  var status = xhr.status;
	  if (status === 200) {
		callback(null, xhr.response);
	  } else {
		callback(status, xhr.response);
	  }
	};
	xhr.send();
};

let items = [
	{
		"name": "HaDiKo-Zelt",
		"width": 12,
		"height": 6,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "Rothaus-Zelt",
		"width": 6,
		"height": 3,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "K2-Bar-Zelt",
		"width": 10,
		"height": 5,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "Pavillon",
		"width": 3,
		"height": 3,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "Doppel-Pavillon",
		"width": 6,
		"height": 3,
		"color": "white",
		"category": "Zelte",
	},
	{
		"name": "Rothaus-Bierinsel",
		"width": 7.5,
		"height": 7.5,
		"color": "yellow",
		"category": "Wagen",
	},
	{
		"name": "Biertisch",
		"width": 2,
		"height": 0.5,
		"color": "orange",
		"category": "Biergarnituren",
	},
	{
		"name": "Biertisch überbreit",
		"width": 2.2,
		"height": 0.8,
		"color": "#FAB57F",
		"category": "Biergarnituren",
	},
	{
		"name": "Bierbank",
		"width": 2,
		"height": 0.25,
		"color": "orange",
		"category": "Biergarnituren",
	},
	{
		"name": "Biertheke",
		"width": 2,
		"height": 0.5,
		"color": "red",
		"category": "Biergarnituren",
	},
	{
		"name": "Kühlschrank",
		"width": 1,
		"height": 1,
		"color": "#2f4f4f",
		"category": "Kühlgeräte",
	},
	{
		"name": "Eistruhe",
		"width": 1.5,
		"height": 1,
		"color": "#2f2f2f",
		"category": "Kühlgeräte",
	},
	{
		"name": "Spüle",
		"width": 1.5,
		"height": 1,
		"color": "#BCC6CC",
		"category": "Sanitär",
	},
	{
		"name": "Bauzaun",
		"width": 3.5,
		"height": 0.04,
		"color": "gray",
		"category": "Abgrenzungen",
	},
	{
		"name": "Tisch",
		"width": 2.0,
		"height": 1.0,
		"color": "blue",
		"category": "Tische",
	},
	{
		"name": "Stuhl",
		"width": 0.2,
		"height": 0.2,
		"color": "#add8e6",
		"category": "Tische",
	},
	{
		"name": "Sofa",
		"width": 2.5,
		"height": 1.0,
		"color": "brown",
		"category": "Sofas",
	},
	{
		"name": "Koeri-Wagen",
		"width": 3.0,
		"height": 2.0,
		"color": "#A67B5B",
		"category": "Wagen",
	},
	{
		"name": "Bühne",
		"width": 6.0,
		"height": 5.0,
		"color": "#222222",
		"category": "Wagen",
	},
];

L.Control.ItemAddControl = L.Control.extend({
	onAdd: function(map) {
		var el = L.DomUtil.create('div', 'leaflet-bar item-add-control');

		for (let item in items) {
			const width = items[item].width;
			const height = items[item].height;
			const name = items[item].name;
			const category = items[item].category;
			const color = items[item].color;

			let btn = L.DomUtil.create('button', '', el);
			var t = document.createTextNode(items[item].name);
			btn.style.backgroundColor = color;
			btn.appendChild(t);
			btn.addEventListener("click", (event) => {
				let center = map.getCenter();
				addRect(new Rectangle(center.lat, center.lng, width, height, 0.0, color, name, category));
				selectRect(rects.length - 1);
			});
		}

		return el;
	},

	onRemove: function(map) {
		// Nothing to do here
	}
});

L.Control.ExportControl = L.Control.extend({
	onAdd: function(map) {
		var el = L.DomUtil.create('div', 'leaflet-bar export-control');

		let btn = L.DomUtil.create('button', '', el);
		var t = document.createTextNode('Exportiere als JSON');
		btn.appendChild(t);

		btn.addEventListener("click", (event) => {
			let data = [];
			rects.forEach((rect) => {
				data.push({
					name: rect.text,
					width: rect.xSize,
					height: rect.ySize,
					lat: rect.latPos,
					lng: rect.lngPos,
					rotation: rect.rotation,
					color: rect.color,
					category: rect.category,
				});
			});
			var json = JSON.stringify(data, null, '\t');
			window.open("data:text/json;charset=utf-8," + encodeURIComponent(json), "", "_blank")
		});

		return el;
	},

	onRemove: function(map) {
		// Nothing to do here
	}
});

let itemAdd = new L.Control.ItemAddControl({position: 'topright'}).addTo(map);
let exportJson = new L.Control.ExportControl({position: 'topright'}).addTo(map);

