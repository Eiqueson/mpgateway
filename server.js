//////// PACKAGES ////////

var bodyParser	= require('body-parser');
var express		= require('express');
var path		= require('path');
var mqtt		= require('mqtt');
var mysql		= require('mysql');
var noble		= require('noble');
var ip			= require('ip');
var ping		= require('ping');
var arp			= require('arp-a');
var five 		= require("johnny-five");
var Raspi 		= require("raspi-io");

//////// CONSTANT VARIABLES ////////

const SERVER_PORT = 8000;

var app = express();

var mqttClient = mqtt.connect('mqtt://127.0.0.1');
var mqttCloud = mqtt.connect('mqtt://m13.cloudmqtt.com',  {
	port: 16514,
	clientId: 'mpgateway_' + Math.random().toString(16).substr(2, 8),
	username: 'robbpzzq',
	password: '5isObLK165G2',
});

var dbConnect = {
	host: 		'localhost',
	user: 		'root',
	password: 	'root',
	database: 	'mpgateway'
};

var gatewayInfo = {
	name: 			'HomeIoT',
	location: 		'Bangkok',
	description: 	'IoT Gateway at BKK Home'
};

// var gatewayInfo = {
// 	name: 'cpekuIoT',
// 	location: 'Bangkok',
// 	description: 'IoT Gateway at CPEKU'
// };

var board = new five.Board(
	{io: new Raspi(), debug: true}
);

var internetHost = ['www.cloudmqtt.com'];

//////// GLOBAL VARIABLES ////////

var mqttLocalConnected	= false;
var mqttCloudConnected	= false;
var internetConnected	= false;

var mpDevices 		= [];
var bleDevices		= [];
var arpTable		= [];
var pingResult		= [];
var deviceStatus	= [];

var devConnect 		= 0;
var devDisconnect 	= 0;

var lcd;

//////// INITIAL SETUP ////////

var mysqlConnection = mysql.createConnection(dbConnect);
mysqlConnection.connect();
	
var queryStr = 'SELECT * FROM device';
mysqlConnection.query(queryStr, function(err, rows) {
	if (err) throw err;
	else console.log("MySQL : Getting devices are successful");

	mpDevices = rows;
	//console.log(rows);
		
	for (var i = 0; i < rows.length; i++) {
		mqttClient.subscribe(rows[i].Topic);
		console.log("LocalMQTT : Subscribe topic %s", rows[i].Topic);
	}
	registerPlugin(rows);
});

mysqlConnection.end();

runArp();

//////// LCD SETTING ////////

board.on("ready", function() {
	
	lcd = new five.LCD({
		controller: "JHD1313M1",
	});

	lcdSetBackgroud();

	lcd.cursor(0, 0).print('Connect: ');
	lcd.cursor(1, 0).print('Disconnect: ');

	lcdSetDevCount();

	setInterval(function() {
		lcdSetBackgroud();
	}, 900000);

	setInterval(function() {
		lcdSetDevCount();
	}, 60000);
});

board.on("exit", function() {
	lcd.bgColor(0x00, 0x00, 0x00)
	lcd.off();
});

function lcdSetBackgroud() {
	pingInternet(internetHost);
	setTimeout(function() {
		if (internetConnected) {
			lcd.bgColor(0x00, 0xff, 0x00);
		} else {
			lcd.bgColor(0xff, 0x00, 0x00);
		}
	}, 3000);
};

function lcdSetDevCount() {
	runPing(arpTable);
	bleGetStatus();
	deviceConnectionNoPlot(pingResult);
	pingResult = [];
	setTimeout(function() {
		lcd.cursor(0, 12).print(devConnect.toString());
		lcd.cursor(1, 12).print(devDisconnect.toString());
		devConnect = 0;
		devDisconnect = 0;
	}, 3000);
};

//////// MYSQL CONNECTION ////////

// function checkUser(data, response) {
// 	var mysqlConnection = mysql.createConnection(dbConnect);
// 	mysqlConnection.connect();

// 	var queryStr = 'SELECT * FROM user WHERE Username="' + data.username + '" AND Password="' + data.password + '"';
// 	mysqlConnection.query(queryStr, function(err, rows) {
// 		if (err) throw err;

// 		if (rows.length == 1) {
// 			response.sendFile(path.join(__dirname + '/admin/index.html'));
// 			response.sendStatus(200);
// 			//response.redirect('/admin/index.html');
// 		} else {
// 			response.sendFile(path.join(__dirname + '/index.html'));
// 			response.sendStatus(200);
// 			//response.redirect('/');
// 		}

// 	});

// 	mysqlConnection.end();
// };

function addDevice(data) {
	var mysqlConnection = mysql.createConnection(dbConnect);
	mysqlConnection.connect();
	
	var queryStr = 'INSERT INTO device (Devicename, Standard, MACaddress, Location, Timeinterval, Topic, Plugin, Description) VALUES ("'+ data.devicename + '","' + data.standard + '","'+ data.macaddress + '","' + data.location + '",' + data.timeinterval + ',"' + data.topic + '","' + data.plugin + '","' + data.description + '")';
	mysqlConnection.query(queryStr, function(err, results) {
		if (err) throw err;
		else console.log('MySQL : Adding a device is successful');
	});
	mqttClient.subscribe(data.topic);
	console.log("LocalMQTT : Subscribe topic %s", data.topic);

	mpDevices = [];
	var queryStr = 'SELECT * FROM device';
	mysqlConnection.query(queryStr, function(err, rows) {
		if (err) throw err;

		mpDevices = rows;
		registerPlugin(rows);
	});

	mysqlConnection.end();
};

function updateDevice(data) {
	var mysqlConnection = mysql.createConnection(dbConnect);
	mysqlConnection.connect();
	
	var queryStr = 'UPDATE device SET Devicename="' + data.devicename + '", Standard="' + data.standard + '", MACaddress="' + data.macaddress + '", Location="' + data.location + '", Timeinterval=' + data.timeinterval + ', Topic="' + data.topic + '", Description="' + data.description + '" WHERE DeviceID=' + data.id;
	mysqlConnection.query(queryStr, function(err, results) {
		if (err) throw err;
		else console.log("MySQL : Updating a device is successful");
	});
	mqttClient.subscribe(data.topic);
	console.log("LocalMQTT : Subscribe topic %s", data.topic);

	mpDevices = [];
	var queryStr = 'SELECT * FROM device';
	mysqlConnection.query(queryStr, function(err, rows) {
		if (err) throw err;

		mpDevices = rows;
		registerPlugin(rows);
	});

	mysqlConnection.end();
};

function deleteDevice(data) {
	var mysqlConnection = mysql.createConnection(dbConnect);
	mysqlConnection.connect();
	
	var queryStr = 'DELETE FROM device WHERE DeviceID=' + data.id;
	mysqlConnection.query(queryStr, function(err, results) {
		if (err) throw err;
		else console.log("MySQL : Removing a device is successful");
	});

	mpDevices = [];
	var queryStr = 'SELECT * FROM device';
	mysqlConnection.query(queryStr, function(err, rows) {
		if (err) throw err;

		mpDevices = rows;
		registerPlugin(rows);
	});

	mysqlConnection.end();
};

//////// MQTT CLIENT ////////

function devStatusForMQTT() {
	runPing(arpTable);
	bleGetStatus();
	setTimeout(function() {
		for (var i = 0; i < pingResult.length; i++) {
			mqttCloud.publish(gatewayInfo.name + '/DevStatus', JSON.stringify(pingResult[i]));
		}
		pingResult = [];
	}, 5000);
};

mqttClient.on('connect', function() {
	mqttConnected = true;
	console.log('xxxxxxxx Connected with LocalMQTT xxxxxxxx');
});

mqttCloud.on('connect', function() {
	mqttCloudConnected = true;
	console.log('xxxxxxxx Connected with CloudMQTT xxxxxxxx');

	mqttCloud.publish(gatewayInfo.name + '/GatewayInfo', JSON.stringify(gatewayInfo));

	for (var i = 0; i < mpDevices.length; i++) {
			mqttCloud.publish(gatewayInfo.name + '/Devices', JSON.stringify(mpDevices[i]));
		}
	mqttCloud.publish(gatewayInfo.name + '/IPv4', ip.address());

	devStatusForMQTT();
	
	// Periodic
	setInterval(function() {
		mqttCloud.publish(gatewayInfo.name + '/GatewayInfo', JSON.stringify(gatewayInfo));
		for (var i = 0; i < mpDevices.length; i++) {
			mqttCloud.publish(gatewayInfo.name + '/Devices', JSON.stringify(mpDevices[i]));
		}
	}, 3600000);

	setInterval(function() {
		devStatusForMQTT();
		mqttCloud.publish(gatewayInfo.name + '/IPv4', ip.address());
	}, 60000);
});

mqttClient.on('message', function(topic, message) {
	
	//console.log(topic);
	for (var i = 0; i < mpDevices.length; i++) {
		if (mpDevices[i].Topic == topic && mpDevices[i].Standard == "80211") {
			var msg = message.toString();

			if (mqttCloudConnected) {
				mqttCloud.publish(gatewayInfo.name + '/' + topic, msg);
			}
		}
	}
});

publishFunction = function(prefix) {
	return function(topic, message) {
		if (mqttConnected) {
			mqttClient.publish(prefix + '/' + topic, message.toString());
		}
		if (mqttCloudConnected) {
			mqttCloud.publish(gatewayInfo.name + '/' + prefix + '/' + topic, message.toString());
		}
	};
};

//////// BLE MANAGER ////////

PluginManager = {
	deviceMapping: {},
	register: function(macAddr, plugin, prefix) {
		this.deviceMapping[macAddr] = {
			plugin: plugin,
			prefix: prefix
		};
	}
};

function registerPlugin(devices) {
	for (var i = 0; i < devices.length; i++) {
	
		if (devices[i].Standard === "ble") {
			console.log('BLE : Registering device %s with plugin %s',
					devices[i].MACaddress, devices[i].Plugin
			);
			PluginManager.register(
				devices[i].MACaddress,
				require('./plugins/' + devices[i].Plugin),
				devices[i].Topic
			);
		}
	}
};

noble.on('scanStart', function() {
	setTimeout(function() {
		console.log('noBLE : Stop BLE Scanner');
		noble.stopScanning();
	}, 29000);
});

noble.on('scanStop', function() {
	setTimeout(function() {
		console.log('noBLE : Start BLE Scanner');
		bleDevices = [];
		noble.startScanning();
	}, 1000);
});

noble.on('stateChange', function(state) {
	console.log('State: ', state);
	if (state == 'poweredOn') {
		// Initial Scanning
		console.log('noBLE : Start BLE Scanner');
		bleDevices = [];
		noble.startScanning();

	} else {
		console.log('noBLE : BLE Scanner Error !');
		noble.stopScanning();
	}
});

noble.on('discover', function(peripheral) {

	var mac 	= peripheral.address;
	var name 	= peripheral.advertisement.localName;
	console.log('Found BLE device : ' + mac + ' ' + name);

	if (mac in PluginManager.deviceMapping) {
		var map = PluginManager.deviceMapping[mac];
		var plugin = map.plugin;
		var prefix = map.prefix;

		console.log('BLE : Attach device to plugin "%s" with prefix "%s"', plugin.name, prefix);
        plugin.handle_device(peripheral, publishFunction(prefix));
        //console.log(plugin.name + ': ' + peripheral.state);
	}
	bleDevices.push({name: name, mac: mac});
});

//////// CONNECTION TEST ////////

function runArp() {
	arp.table(function(err, entry) {
		if (!!err) return console.log('ARP : ' + err);
		if (!entry) return;

		arpTable.push({ ip: entry.ip, mac: entry.mac});
	});
};

function runPing(hosts) {

	arpTable = [];
	runArp();

	//console.log(hosts);
	hosts.forEach(function(host) {
		ping.sys.probe(host.ip, function(isAlive) {
			if (isAlive) {
				console.log('Ping : ' + host.ip + ' is connected');
				pingResult.push({mac: host.mac, ip: host.ip, status: 'CONNECTED'});
			} else {
				console.log('Ping : ' + host.ip + ' is disconnected');
				pingResult.push({mac: host.mac, ip: host.ip, status: 'DISCONNECTED'});
			}
		});
	});
};

function bleGetStatus() {
	for (var i = 0; i < mpDevices.length; i++) {
		if (mpDevices[i].Standard == 'ble') {
			if (mpDevices[i].MACaddress in PluginManager.deviceMapping) {
				var plugin = PluginManager.deviceMapping[mpDevices[i].MACaddress].plugin;
				var status = plugin.getStatus();
				
				pingResult.push({mac: mpDevices[i].MACaddress, ip: 'none', status: status.toUpperCase()});
			}
		}
	}
};

function deviceConnection(devices) {
	
	for (var i = 0; i < mpDevices.length; i++) {
		if (mpDevices[i].Standard == '802154') {
			deviceStatus.push('DISCONNECTED');		
		} else if (mpDevices[i].Standard == '80211' || mpDevices[i].Standard == 'ble') {
			for (var j = 0; j < devices.length; j++) {
				//console.log(mpDevices[i].MACaddress + ' == ' + devices[j].mac);
				if (mpDevices[i].MACaddress == devices[j].mac) {
					deviceStatus.push(devices[j].status);
				}
			}
		}
	}
	console.log('statusPlot: ' + deviceStatus);
};

function pingInternet(hosts) {

	hosts.forEach(function(host) {
		ping.sys.probe(host, function(isAlive) {
			if (isAlive) {
				console.log('Ping : Internet is connected');
				internetConnected = true;
			} else {
				console.log('Ping : Internet is disconnected');
				internetConnected = false;
			}
		});
	});
};

function deviceConnectionNoPlot(devices) {
	
	for (var i = 0; i < mpDevices.length; i++) {
		if (mpDevices[i].Standard == '802154') {
			devDisconnect++;		
		} else if (mpDevices[i].Standard == '80211' || mpDevices[i].Standard == 'ble') {
			for (var j = 0; j < devices.length; j++) {
				//console.log(mpDevices[i].MACaddress + ' == ' + devices[j].mac);
				if (mpDevices[i].MACaddress == devices[j].mac) {
					if (devices[j].status == 'CONNECTED') {
						devConnect++;
					} else {
						devDisconnect++;
					}
				}
			}
		}
	}
};

//////// WEB SERVER ////////

app.listen(SERVER_PORT, function() {
	console.log('Server running at http://' + ip.address() + ':' + SERVER_PORT + '/');
});

app.use('/', express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE')
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
});

// app.post('/login', function(request, response) {
// 	checkUser(request.body, response);
// 	//response.sendStatus(200);
// });

app.post('/api/add', function(request, response) {
	addDevice(request.body);
	response.sendStatus(200);
});

app.post('/api/edit', function(request, response) {
	updateDevice(request.body);
	response.sendStatus(200);
});

app.post('/api/remove', function(request, response) {
	deleteDevice(request.body);
	response.sendStatus(200);
});

app.get('/api/blescan', function(request, response) {
	response.json(bleDevices);
});

app.get('/api/devices', function(request, response) {
	response.json(mpDevices);
});

app.get('/api/status', function(request, response) {
	runPing(arpTable);
	bleGetStatus();
	//console.log(pingResult);
	deviceConnection(pingResult);
	response.json(pingResult);
	pingResult = [];
});

app.get('/api/statusplot', function(request, response) {
	//console.log(deviceStatus);
	setTimeout(function() {
		response.json(deviceStatus);
		deviceStatus = [];
	}, 500);
});

//5C:CF:7F:86:37:60
//5C:CF:7F:2C:E9:A2