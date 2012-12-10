node-serialosc
==============
serialosc module for monome device emulation

usage
-----
    // create a virtual device
    var device = serialosc.createDevice({
      name: 'monome 64 (v0000001)',
      prefix: '/monome',
      sizeX: 8,
      sizeY: 8
    });

    // listen for led state change events
    device.on('stateChange', function(data) {
      console.log('stateChange: ' + data.x + ', ' + data.y + ', ' + data.s);
    });

    // listen for led level change events
    device.on('levelChange', function(data) {
      console.log('levelChange: ' + data.x + ', ' + data.y + ', ' + data.s);
    });

    // begin listening on serialoscHost/serialoscPort, start bonjour
    device.start();

    // emulate a press
    device.oscOut('/grid/key', x, y, s);

see [https://github.com/dinchak/node-asciimonome] for a more complete example