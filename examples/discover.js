var serialosc = require('./../lib/serialosc.js');
serialosc.on('discover', function(device) {
  console.log("discovered " + device.service.name);
  device.focus();
  device.on('press', function(x, y, s) {
    console.log('press from ' + device.service.name + ': ' + x + ", " + y + ", " + s);
    device.msg("/monome/grid/led/set", x, y, s);
  });
});
serialosc.discover();
process.openStdin();