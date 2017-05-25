$(document).ready(function() {
	
	$.ajax({
		url: '/api/devices',
		success: function(regdev) {
			 showRegistered(regdev);
		}
	});

	setInterval(function() {
		$.ajax(
		{
			url: 		'/api/blescan',
			success: 	function(data) {
				devScan(data);
			}
		});
	}, 30000);

	$("#bleAddBtn").click(function() {
		bleSelect();
		//document.getElementById("test").value = "AAAA";
	});
});

function clearList(oList) {
	var i;

	for (i = oList.options.length-1; i >= 0; i--) {
		oList.remove(i);
	}
}

function devScan(data) {
	var oSelect = document.getElementById("bledevice");
	//var oOption = document.createElement("OPTION");

	if (oSelect.options.length != 0) {
		clearList(oSelect);
	}
	
	//console.log(data.length);
	for (var i = 0; i < data.length; i++) {
		var oOption = document.createElement("OPTION");
		oSelect.options.add(oOption);
		oOption.text = data[i].name + " (" + data[i].mac + ")";
		oOption.value = data[i].mac;
		//console.log(data[i].mac);
	}
}

function bleSelect() {

	var selIndex = document.getElementById("bledevice").selectedIndex;
	var selOption = document.getElementById("bledevice").options;

	var name = selOption[selIndex].text.split(" ");
	var mac = name[1].split("(");
	mac = mac[1].split(")");
	
	//console.log(name[0], ' ', mac[0]);
	document.getElementById("devname").value = name[0];
	document.getElementById("macaddr").value = mac[0];
	document.getElementById("std").selectedIndex = "2";
}

function showRegistered(data) {
	var oSelect = document.getElementById("devregis");
	//var oOption = document.createElement("OPTION");

	if (oSelect.options.length != 0) {
		clearList(oSelect);
	}
	
	//console.log(data.length);
	for (var i = 0; i < data.length; i++) {
		var oOption = document.createElement("OPTION");
		oSelect.options.add(oOption);
		oOption.text = data[i].Devicename + " (" + data[i].MACaddress + ")";
		//oOption.value = data[i].mac;
		//console.log(data[i].mac);
	}
}