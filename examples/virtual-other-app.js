var serialosc = require('./../lib/serialosc.js');

var virtualDevice = serialosc.createVirtualDevice({
  name: 'test virtual grid',
  prefix: '/monome',
  sizeX: 16,
  sizeY: 8,
  serialoscPort: 1234
});

serialosc.on('deviceFound', function(device) {
  console.log("found device " + device.service.name);
  device.on('stateChange', function() {
    console.log('---');
    for (var y = 0; y < device.sizeY; y++) {
      var row = '';
      for (var x = 0; x < device.sizeX; x++) {
        row += device.gridState[x][y];
      }
      console.log(row);
    }
  });
});
serialosc.on('deviceLost', function(device) {
  console.log("lost device " + device.service.name);
});

serialosc.discover();

var stdin = process.openStdin();
stdin.on('data', function(chunk) { 
  var cmd = chunk.toString();
  var matches = cmd.match(/(\d+),(\d+),(\d+)/);
  if (matches) {
    var device = serialosc.devices['test virtual grid'];
    device.press(parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3]));
  }
  console.log("enter press data (ie. 3,5,1): "); 
});
