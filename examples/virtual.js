var serialosc = require('./../lib/serialosc.js');

var virtualDevice = serialosc.createVirtualDevice({
  name: 'monome 128 (v0000001)',
  sizeX: 16,
  sizeY: 8
});

serialosc.on('deviceFound', function(device) {
  console.log("found device " + device.service.name);
  device.focus(function() {

    device.on('press', function(x, y, s) {
      console.log('press from ' + device.service.name + ': ' + x + ", " + y + ", " + s);
      device.oscOut("/monome/grid/led/set", x, y, s);
    });

    // print out grid representation if this is our virtual device
    if (device.service.name == virtualDevice.name) {
      virtualDevice.on('stateChange', function() {
        console.log('---');
        for (var y = 0; y < device.sizeY; y++) {
          var row = '';
          for (var x = 0; x < device.sizeX; x++) {
            row += virtualDevice.gridState[x][y];
          }
          console.log(row);
        }
      });
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
    virtualDevice.press(parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3]));
  }
  console.log("enter press data (ie. 3,5,1): "); 
});
