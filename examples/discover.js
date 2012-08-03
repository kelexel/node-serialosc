var serialosc = require('./../lib/serialosc.js');
serialosc.on('discover', function(device) {
  console.log("discovered " + device.service.name);
  device.focus();
  device.on('msg', function(addr, args) {
    console.log(device.service.name + ": " + addr + " " + args);
    if (addr == "/monome/grid/key") {
      device.msg("/monome/grid/led/set", [args[0], args[1], args[2]]);
    }
  });
});
serialosc.discover();
process.openStdin();