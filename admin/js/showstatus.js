var addr = [];

$(document).ready(function() {

	$.ajax({
		url: '/api/devices',
		success: function(data) {
			 setTimeout(function() {
			 	showData(data);
			 }, 1000);
			 //showData(data);
		}
	});

	$.ajax({
			url: '/api/status',
			success: function(address) {
				addr = address;
				//console.log(addr);
			}
		});

	$('#devlistblock').hide();
	$('#showlist').click(function() {
		$('#devlistblock').toggle();
	});

	/*$.ajax({
		url: '/ping',
		success: function(status) {
			console.log(status);
		}
	});*/
});

function getStatus(obj, std, mac) {
	
	var status;
	for (var i = 0; i < obj.length; i++) {
		if (std == '80211' || std == 'ble') {
			if (obj[i].mac == mac) {
				status = obj[i].status;
			}
		} else {
			status = 'N/A';
		}
	}
	//console.log(status);
	return status;
};

function convertWord(std) {
	
	var word;
	if (std == '80211') {
		word = 'WiFi';
	} else if (std == 'ble') {
		word = 'Bluetooth Low Energy';
	} else if (std == '802154') {
		word = 'IEEE 802.15.4';
	}
	return word;
}

function showData(data) {

	var table = document.getElementById("devtable");
	var row;
	var cell1, cell2, cell3;
	var cell4, cell5;

	for (var i = 0; i < data.length; i++) {
			
		row = table.insertRow(-1);
		cell1 = row.insertCell(0);
		cell2 = row.insertCell(1);
		cell3 = row.insertCell(2);
		cell4 = row.insertCell(3);
		cell5 = row.insertCell(4);

		cell1.innerHTML = data[i].Devicename;
		cell2.innerHTML = data[i].Location;
		cell3.innerHTML = convertWord(data[i].Standard);
		cell4.innerHTML = data[i].Timeinterval;
		//console.log(data[i].Standard + ' ' + data[i].MACaddress);
		cell5.innerHTML = getStatus(addr, data[i].Standard, data[i].MACaddress);
		if (cell5.innerHTML == 'CONNECTED') {
			cell5.setAttribute("style", "color: green;");
		} else if (cell5.innerHTML == 'DISCONNECTED') {
			cell5.setAttribute("style", "color: red;");
		}
	}
};