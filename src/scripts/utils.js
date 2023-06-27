let Utils = {};

Utils.rotate = function(x, y, r) {
	r *= Math.PI / 180.0;
	return [
		Math.cos(r) * x - Math.sin(r) * y,
		Math.sin(r) * x + Math.cos(r) * y
	];
}

Utils.calculateRotationAngle = function(latlngPivot, latlngMouse) {
	var dx = latlngMouse.lng - latlngPivot.lng;
	var dy = latlngMouse.lat - latlngPivot.lat;
	return Math.atan2(dx, dy) * (180 / Math.PI);
}

Utils.countItems = function(list) {
	var count = {};
  
	list.forEach(function(item) {
	  if (count[item]) {
		count[item]++;
	  } else {
		count[item] = 1;
	  }
	});
  
	return count;
}

// Convert hex color of form "#000000" to [0, 0, 0]
Utils.hexToRgb = function(hex){
    if (/^#([A-Fa-f0-9]{6})$/.test(hex)) {
        var c = "0x" + hex.substring(1);
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    }
    return [0, 0, 0];
}

// Black for bright backgroundColor, white for dark backgroundColor
Utils.getTextColor = function (backgroundColor) {
	var colorArr = Utils.hexToRgb(backgroundColor);
	var colorGrey = (colorArr[0] + colorArr[1] + colorArr[2]) / 3.0;
	return colorGrey < 100 ? "#fff" : "#000"; // Threshold
}

export default Utils;
