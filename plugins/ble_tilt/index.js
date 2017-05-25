var status = 'disconnected';

module.exports = {
  name : "ble_tilt",
  description : "BLE tilt sensor plugin",
  version : "0.1",
  handle_device : function(peripheral,publish) {
    var Struct = require('struct');

    var Data = Struct()
               .word8('fd')
               .floatle('ax')
               .floatle('ay')
               .floatle('az');
	
    peripheral.connect(function(error) {
      console.log("ble_tilt: " + peripheral.state);
      status = peripheral.state;
      peripheral.discoverServices(['ffe0'], function(error,services) {
        services[0].discoverCharacteristics(['ffe1'], function(error,characteristics) {
          var mpuChar = characteristics[0];
          mpuChar.subscribe(function(error) {
            console.log('BLE : Subscribed to MPU characteristic');
          });
          mpuChar.on('data',dataReceived);
        });
      });
    });

    peripheral.disconnect(function(error) {
      console.log("ble_tilt: " + peripheral.state);
      status = peripheral.state;
    });

    dataReceived = function(data,isNotification) {
      if ( (data[0] != 0x7e) || data.length != 13)
        return;
      Data._setBuff(data);
      ax = Data.get('ax');
      ay = Data.get('ay');
      az = Data.get('az');
      //console.log('ax=%d ay=%d az=%d',ax,ay,az);
      publish('tilt',JSON.stringify({ax:ax,ay:ay,az:az}));
    };
  },

  getStatus :  function() {
      return status;
  }
};
