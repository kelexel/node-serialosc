var serialosc = require('./../lib/serialosc.js');

serialosc.on('deviceFound', function(device) {
  console.log("found device " + device.service.name);
  device.focus(function() {
    device.on('press', function(x, y, s) {
      console.log('press from ' + device.service.name + ': ' + x + ", " + y + ", " + s);
      device.oscOut(device.prefix + "/grid/led/set", x, y, s);
    });
  });
});

serialosc.on('deviceLost', function(device) {
  console.log("lost device " + device.service.name);
});

serialosc.discover();

process.openStdin();
