$(document).ready(function() {
	
	$("form").submit(function(event) {
		var userName 	= $('input[name="username"]').val();
		var pwd			= $('input[name="password"]').val();

		$.ajax({
			method: 'POST',
			url: 	'/login',
			data: {
				username: 	userName,
				password: 		pwd
			}
		});
		//.done(function(message) {
		// 	alert('Login Success !!');
		// 	window.location.replace('/admin/index.html');
		// });
	});
});