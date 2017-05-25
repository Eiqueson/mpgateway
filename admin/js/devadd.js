$(document).ready(function() {
	
	$("form").submit(function(event) {
		var devName 	= $('input[name="devname"]').val();
		var mac 		= $('input[name="macaddress"]').val();
		var location 	= $('input[name="location"]').val();
		var timeInt 	= $('input[name="timeint"]').val();
		var topic 		= $('input[name="topic"]').val();
		var plugin 		= $('input[name="plugin"]').val();
		var desc 		= $('input[name="desc"]').val();

		var sel = document.getElementById('std');
		var std = sel.options[sel.selectedIndex].value;

		$.ajax({
			method: 'POST',
			url: 	'/api/add',
			data: {
				devicename: 	devName,
				standard: 		std,
				macaddress: 	mac,
				location: 		location,
				timeinterval: 	timeInt,
				topic: 			topic,
				plugin: 		plugin,
				description: 	desc
			}
		}).done(function(message) {
			alert('Add Success !!');
			window.location.replace('/admin/devadd.html');
		});
	});
});