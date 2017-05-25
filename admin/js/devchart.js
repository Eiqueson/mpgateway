var device;

$(document).ready(function() {

	$.ajax({
		url: '/api/devices',
		success: function(data) {
			 device = data;
			 //listDevice(data);
			 countDevice(device);
		}
	});

	/*$("#devInfoBtn").click(function() {
		var selIndex = document.getElementById("devname").selectedIndex;
		var selOption = document.getElementById("devname").options;
		var name = selOption[selIndex].text;

		for (var i = 0; i < device.length; i++) {
			if (device[i].Devicename === name) {
				//devID = device[i].DeviceID;
				document.getElementById("devnameinfo").value = device[i].Devicename;
				document.getElementById("macaddr").value = device[i].MACaddress;
				document.getElementById("location").value = device[i].Location;
				document.getElementById("timeint").value = device[i].Timeinterval;
				document.getElementById("topic").value = device[i].Topic;
				document.getElementById("plugin").value = device[i].Plugin;
				document.getElementById("desc").value = device[i].Description;
				document.getElementById("std").value = device[i].Standard;
			}
		}
	});*/

});

function listDevice(data) {
	var i;
	var oSelect = document.getElementById("devname");

	if (oSelect.options.length != 0) {
		clearList(oSelect);
	}

	var oInit = document.createElement("OPTION");
		oSelect.options.add(oInit);
		oInit.text = '- Select a device -';

	for (i = 0; i < data.length; i++) {
		var oOption = document.createElement("OPTION");
		oSelect.options.add(oOption);
		oOption.text = data[i].Devicename;
		oOption.value = data[i].Devicename;
	}
};

function countDevice(data) {
	var i;
	var countWifi = 0;
	var countBle = 0;
	var count802154 = 0;
	var dataset = [];

	for (i = 0; i < data.length; i++) {

		if (data[i].Standard === "80211") {
			countWifi++;
		} else if (data[i].Standard === "ble") {
			countBle++;
		} else if (data[i].Standard === "802154") {
			count802154++;
		}
	}

	dataset.push({label: 'WiFi', count: countWifi});
	dataset.push({label: 'BLE', count: countBle});
	dataset.push({label: 'IEEE 802.15.4', count: count802154});

	//var total = countWifi+countBle+count802154;

	//document.getElementById("count").innerHTML = countWifi+countBle+count802154;
	createChart(dataset);
};

function createChart(data) {

	var svgWidth = 480;
	var svgHeight = 240;

	var margin = {left: 20, right: 20, top: 10, bottom: 30};
	var color = d3.scaleOrdinal().range(["#99e000", "#000099", "#96d3ff"]);
	var fontSize = 20;

	var x = d3.scaleBand().range([0, svgWidth]).padding(0.7);
	var y = d3.scaleLinear().range([svgHeight-margin.bottom, 0]);

	var svg = d3.select('#chart').append('svg')
		.attr('height', svgHeight).attr('width', svgWidth)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


	data.forEach(function(d) {
		d.count = +d.count;
	});

	x.domain(data.map(function(d) { return d.label; }));
	y.domain([0, d3.max(data, function(d) {return d.count; })+5]);

	svg.selectAll('.bar').data(data)
		.enter().append('rect')
		.attr('class', 'bar').style('fill', function(d,i) {return color(i);})
		.attr('x', function(d) { return x(d.label); })
		.attr('width', x.bandwidth())
		.attr('y', function(d) { return y(d.count); })
		.attr('height', function(d) { return svgHeight - y(d.count) - margin.bottom; });

	svg.selectAll('.text').data(data)
		.enter().append('text')
		.attr('class', 'label').style('fill', 'black').style('font-size', fontSize+'px')
		.attr('x', function(d) { return (x(d.label) + x.bandwidth() / 2) - 7;})
		.attr('y', function(d) { return y(d.count) - fontSize; })
		.attr('dy', '0.75em')
		.text(function(d) { return d.count; });

	var xAxisoffset = svgHeight-margin.bottom;

	svg.append('g')
		.attr('transform', 'translate(0,' + xAxisoffset + ')')
		.style('font-size', '16px')
		.call(d3.axisBottom(x));
};

