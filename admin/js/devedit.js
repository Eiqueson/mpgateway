var device;
var devID;

$(document).ready(function() {
	
	$.ajax({
		url: '/api/devices',
		success: function(data) {
			 device = data;
			 listDevice(device);
		}
	});

	$("#devInfoBtn").click(function() {
		/*$.ajax({
			url: 'http://localhost:8000/api/devices/select',
			success: function(data) {
				 showDevice(data);
			}
		});*/
		console.log(device);
		var selIndex = document.getElementById("devname").selectedIndex;
		var selOption = document.getElementById("devname").options;
		var name = selOption[selIndex].text;

		for (var i = 0; i < device.length; i++) {
			if (device[i].Devicename === name) {
				devID = device[i].DeviceID;
				document.getElementById("newdevname").value = device[i].Devicename;
				document.getElementById("macaddr").value = device[i].MACaddress;
				document.getElementById("location").value = device[i].Location;
				document.getElementById("timeint").value = device[i].Timeinterval;
				document.getElementById("topic").value = device[i].Topic;
				document.getElementById("plugin").value = device[i].Plugin;
				document.getElementById("desc").value = device[i].Description;
				switch (device[i].Standard) {
					case "80211":
						document.getElementById("std").selectedIndex = "1";
						break;

					case "ble":
						document.getElementById("std").selectedIndex = "2";
						break;

					case "802154":
						document.getElementById("std").selectedIndex = "3";
						break;
				}
			}
		}
		console.log(devID);
	});

	$("form").submit(function(event) {
		var devName = $("input[name='devname']").val();
		var mac = $("input[name='macaddress']").val();
		var location = $("input[name='location']").val();
		var timeInt = $("input[name='timeint']").val();
		var topic = $("input[name='topic']").val();
		var plugin = $("input[name='plugin']").val();
		var desc = $("input[name='desc']").val();

		var sel = document.getElementById("std");
		var std = sel.options[sel.selectedIndex].value;

		$.ajax({
			method: "POST",
			url: '/api/edit',
			data: {
				id: devID,
				devicename: devName,
				standard: std,
				macaddress: mac,
				location: location,
				timeinterval: timeInt,
				topic: topic,
				plugin: plugin,
				description: desc
			}
		}).done(function(message) {
			alert('Edit Success !!');
			window.location.replace("/admin/devedit.html");
		});
	});
});

function clearList(oList) {
	var i;

	for (i = oList.options.length-1; i >= 0; i--) {
		oList.remove(i);
	}
}

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