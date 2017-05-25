function celcius_filter(x) {
  var B = 4050;
  var R0 = 10000;
  var T0 = 298.15;
  var Rinf = R0*Math.exp(-B/T0);
  var r = R0*(1024-x)/x;
  return B/Math.log(r/Rinf) - 273;
}

var status = 'disconnected';

module.exports = {
  name : "ble_temperature",
  description : "BLE temperature sensor plugin",
  version : "0.1",
  supported_devices : [ 'Temperature' ],
  handle_device : function(peripheral,publish) {
    var Struct = require('struct');

    var Data = Struct().word16Ule('raw');

    peripheral.connect(function(error) {
      console.log("ble_temperature: " + peripheral.state);
      status = peripheral.state;
      peripheral.discoverServices(['ffe0'], function(error,services) {
        services[0].discoverCharacteristics(['ffe1'], function(error,characteristics) {
          var tempChar = characteristics[0];
          tempChar.subscribe(function(error) {
            console.log('BLE : Subscribed to Temperature characteristic');
          });
          tempChar.on('data',dataReceived);
        });
      });
    });

    peripheral.disconnect(function(error) {
      console.log("ble_temperature: " + peripheral.state);
      status = peripheral.state;
    });

    dataReceived = function(data,isNotification) {
      if ( data.length != 2)
        return;
      Data._setBuff(data);
      raw = Data.get('raw');
      temp = celcius_filter(raw);
      //console.log('raw=%d,temp=%d',raw,temp);
      publish('temperature',temp);
    };
  },

  getStatus :  function() {
      return status;
  }
};
