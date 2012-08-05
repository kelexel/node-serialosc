var serialosc = require('./../lib/serialosc.js');

var virtualDevice = serialosc.createVirtualDevice({
  name: 'monome 128 (v0000001)',
  prefix: '/v0000001',
  sizeX: 16,
  sizeY: 8,
  serialoscPort: 14883
});

serialosc.on('deviceFound', function(device) {
  console.log("found device " + device.service.name);

  // we do not focus the monome, instead we let some other app use it
  // we do bind to the stateChange event so we can be informed when led state changes
  if (device.service.name == virtualDevice.name) {
    virtualDevice.on('stateChange', function() {
      console.log('---');
      for (var y = 0; y < virtualDevice.sizeY; y++) {
        var row = '';
        for (var x = 0; x < virtualDevice.sizeX; x++) {
          row += virtualDevice.gridState[x][y];
        }
        console.log(row);
      }
    });
  }

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
    virtualDevice.press(parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3]));
  }
  console.log("enter press data (ie. 3,5,1): "); 
});
