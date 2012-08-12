var serialosc = require('./../lib/serialosc.js');

var device = serialosc.createDevice({
  name: 'example device',
  sizeX: 8,
  sizeY: 8
});

device.start();

process.openStdin();
