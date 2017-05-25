var device;

$(document).ready(function() {
	
	$.ajax({
		url: '/api/devices',
		success: function(data) {
			 device = data;
			 listDevice(device);
		}
	});

	$("form").submit(function(event) {
		var selIndex = document.getElementById("devname").selectedIndex;
		var selOption = document.getElementById("devname").options;
		var name = selOption[selIndex].text;

		for (var i = 0; i < device.length; i++) {
			if (device[i].Devicename === name) {
				var devID = device[i].DeviceID;
				var devName = device[i].Devicename;
			}
		}

		$.ajax({
			method: "POST",
			url: '/api/remove',
			data: {
				id: devID,
				devicename: devName,
			}
		}).done(function(message) {
			alert('Remove Success !!');
			window.location.replace("/admin/devremove.html");
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