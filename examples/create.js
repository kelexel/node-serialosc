var serialosc = require('./../lib/serialosc.js');

// create a device
// example is show with all options and their defaults
var device = serialosc.createDevice({
  type: 'grid',
  serialoscId: 'virtual',
  name: 'monome 64 (v0000001)',
  prefix: '/monome',
  sizeX: 8,
  sizeY: 8,
  encoders: 0,
  rotation: 0,
  listenHost: '127.0.0.1',
  listenPort: 1024 + Math.floor(Math.random() * 60000),
  serialoscHost: '127.0.0.1',
  serialoscPort: 1024 + Math.floor(Math.random() * 60000)
});

// listen for led state change events
// this will be called every time a led is turned on or off
device.on('stateChange', function(data) {
  console.log('stateChange: ' + data.x + ', ' + data.y + ', ' + data.s);
});

// listen for led level change events
// this will be called every time a led's level is changed
device.on('levelChange', function(data) {
  console.log('levelChange: ' + data.x + ', ' + data.y + ', ' + data.s);
});

// begin listening on serialoscHost/serialoscPort
// start bonjour advertisement
device.start();

// parse input looking for messages such as 0,0,1 or 2,3,0
// send out a /grid/key message in response to emulate a press
var stdin = process.openStdin();
stdin.on('data', function(chunk) { 
  var cmd = chunk.toString();
  var matches = cmd.match(/(\d+),(\d+),(\d+)/);
  if (matches && matches.length == 4) {
    var x = parseInt(matches[1]);
    var y = parseInt(matches[2]);
    var s = parseInt(matches[3]);
    device.oscOut('/grid/key', x, y, s);
    console.log('sent /grid/key ' + x + ', ' + y + ', ' + s);
  } else {
    console.log('error, enter key data (ex: 3,5,1): ');
  }
});
console.log('enter key data (ex: 3,5,1): ');