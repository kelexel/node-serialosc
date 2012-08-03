var serialosc = require('./../lib/serialosc.js');
serialosc.on('discover', function(device) {
  console.log("discovered " + device.service.name);
  device.focus();
  device.on('msg', function(addr, args) {
    console.log(device.service.name + ": " + addr + " " + args);
  })
})
serialosc.discover();

var device = serialosc.createVirtualDevice({
  name: 'test virtual grid',
  sizeX: 16,
  sizeY: 8
});

var stdin = process.openStdin();
stdin.on('data', function(chunk) { 
  var cmd = chunk.toString();
  console.log("enter press data (ie. 3,5,1): "); 
  var matches = cmd.match(/(\d+),(\d+),(\d+)/);
  if (matches) {
    console.log("sent press");
    device.press(matches[1], matches[2], matches[3]);
  }
});
