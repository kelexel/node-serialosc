var osc = require('osc-min');
var udp = require('dgram');
var serialosc = require('./../lib/serialosc.js');
var stdin = process.openStdin();

var sendMsg = function(addr, args) {
  var msg = osc.toBuffer({ address: addr, args: args });
  udp.send(msg, 0, msg.length, device.serialoscPort, '127.0.0.1');
}

var virtualDevice = serialosc.createVirtualDevice({
  name: 'test virtual grid',
  prefix: '/monome',
  sizeX: 16,
  sizeY: 8,
  serialoscPort: 12345,
});
virtualDevice.on('stateChange', function() {
  for (var y = 0; y < virtualDevice.sizeY; y++) {
    var row = '';
    for (var x = 0; x < virtualDevice.sizeX; x++) {
      row += virtualDevice.ledState[x][y];
    }
    console.log(row);
  }
});

serialosc.on('discover', function(device) {
  console.log("discovered " + device.service.name);
  device.focus();
  device.on('msg', function(addr, args) {
    console.log(device.service.name + ": " + addr + " " + args);
    if (addr == "/monome/grid/key/press") {
      device.msg("/monome/grid/led", [args[0], args[1], args[2]]);
    }
  });
});

serialosc.discover();

stdin.on('data', function(chunk) { 
  var cmd = chunk.toString();
  var matches = cmd.match(/(\d+),(\d+),(\d+)/);
  if (matches) {
    virtualDevice.press(parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3]));
  }
  console.log("enter press data (ie. 3,5,1): "); 
});