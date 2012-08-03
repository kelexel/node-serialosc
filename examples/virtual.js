var serialosc = require('./../lib/serialosc.js');

var virtualDevice = serialosc.createVirtualDevice({
  name: 'test virtual grid',
  prefix: '/monome',
  sizeX: 16,
  sizeY: 8,
  serialoscPort: 12345
});

serialosc.on('discover', function(device) {
  console.log("discovered " + device.service.name);
  device.focus();
  device.on('press', function(x, y, s) {
    console.log('press from ' + device.service.name + ': ' + x + ", " + y + ", " + s);
    device.msg("/monome/grid/led/set", x, y, s);
  });
  device.on('stateChange', function() {
    for (var y = 0; y < device.sizeY; y++) {
      var row = '';
      for (var x = 0; x < device.sizeX; x++) {
        row += device.ledState[x][y];
      }
      console.log(row);
    }
  });
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