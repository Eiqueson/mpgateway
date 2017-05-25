
$(document).ready(function() {

	$.ajax({
			url: '/api/statusplot',
			success: function(data) {
				 //listDevice(data);
				 countConnection(data);
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

/*function listDevice(data) {
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
};*/

function countConnection(data) {
	var i;
	var countConnected = 0;
	var countDisconnected = 0;
	var dataset = [];

	for (i = 0; i < data.length; i++) {

		if (data[i] == 'CONNECTED') {
			countConnected++;
		} else if (data[i] == 'DISCONNECTED') {
			countDisconnected++;
		}
	}

	dataset.push({label: 'Connected', count: countConnected});
	dataset.push({label: 'Disconnected', count: countDisconnected});

	var total = countConnected+countDisconnected;
	createSChart(dataset, total);
};

//var data2 = [{label: 'Connected', count: 2}, {label: 'Disconnected', count: 1}]

function createSChart(data, total) {

	var svgWidth = 480;
	var svgHeight = 240;
	var radius = Math.min(svgWidth, svgHeight) / 2;
	var donutRadius = radius / 2;
	var legendRectSize = 20;
	var legendSpacing = 4;

	var color = d3.scaleOrdinal().range(["#009900", "#990000", "#000099"]);

	var arc = d3.arc().outerRadius(radius).innerRadius(radius - donutRadius);

	var pie = d3.pie().sort(null).value(function(d) { return d.count; });

	var svg = d3.select('#schart').append('svg')
		.attr('width', svgWidth)
		.attr('height', svgHeight)
		.append('g')
		.attr('transform', 'translate(' + radius + ',' + (svgHeight/2) + ')');

	data.forEach(function(d) {
		d.count = +d.count;
	});

	var g = svg.selectAll('.arc').data(pie(data)).enter().append('g').attr('class', 'arc');
	g.append('path').attr('d', arc).style('fill', function(d) {return color(d.data.label); });
	g.append('text').attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; })
	.attr('dy', '.35em').style('text-anchor', 'middle')
	.text(function(d) { var percent = Math.round(1000 * d.data.count / total) / 10; return percent + ' %'; });

	var legend = svg.selectAll('.legend')
		.data(color.domain())
		.enter()
		.append('g')
		.attr('class', 'legend')
		.attr('transform', function(d, i) {
			var height = legendRectSize + legendSpacing;
			var offset = height * color.domain().length / 2;
			var horz = 8 * legendRectSize;
			var vert = i * height - offset;
			return 'translate(' + horz + ',' + vert + ')';
		});

	legend.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.style('fill', color)
		.style('stroke', color);

	legend.append('text')
		.attr('x', legendRectSize + 2*legendSpacing)
		.attr('y', legendRectSize - legendSpacing)
		.text(function(d) {return d;} );
};

