var serialosc = require('./../lib/serialosc.js');
serialosc.discover();
serialosc.on('discover', function(device) {
  console.log("discovered " + device.service.name);
  device.on('msg', function(addr, args) {
    console.log(device.service.name + ": " + addr + " " + args);
  })
})
var stdin = process.openStdin();