var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('osc-min');
var udp = require('dgram');
var events = require('events');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.browser = null;
serialosc.devices = {};
serialosc.virtualDevices = {};
serialosc.eventsEmitter = new events.EventEmitter();

// register serialosc event callbacks, currently supported:
//   'discover' -> (device) -- called when device is discovered
serialosc.on = function(event, callback) {
  serialosc.eventsEmitter.on(event, callback);
}

serialosc.discover = function() {
  serialosc.browser = mdns.createBrowser(mdns.udp('monome-osc'))
  serialosc.browser.on('serviceUp', function(service) {
    device = serialosc.createDevice(service);
    serialosc.eventsEmitter.emit('discover', device);
    serialosc.addDevice(device);
  });
  serialosc.browser.on('serviceDown', function(service) { 
    var device = serialosc.getDevice(service);
    if (device) {
      serialosc.removeDevice(device);
    }
  });
  serialosc.browser.start();
}

serialosc.newDevice = function(that) {
  that.socket = null;
  that.listenPort = 1024 + Math.floor(Math.random() * 60000);
  that.type = 'grid';
  that.sizeX = 8;
  that.sizeY = 8;
  that.encoders = 0;
  that.id = 'unknown';
  that.prefix = '/monome';
  that.rotation = 0;
  that.ledState = [];
  that.eventsEmitter = new events.EventEmitter();
  that.on = function(event, callback) {
    that.eventsEmitter.on(event, callback);
  }
}

serialosc.createDevice = function(service) {
  var device = {};
  device.service = service;
  serialosc.newDevice(device);
  if (serialosc.virtualDevices[device.service.name]) {
    for (key in serialosc.virtualDevices[device.service.name]) {
      if (device[key]) {
        device[key] = serialosc.virtualDevices[device.service.name][key];
      }
    }
  }
  for (var x = 0; x < device.sizeX; x++) {
    device.ledState[x] = [];
    for (var y = 0; y < device.sizeY; y++) {
      device.ledState[x][y] = 0;
    }
  }

  // detect arc
  var matches = service.name.match(/arc (\d+)/);
  if (matches) {
    device.type = "arc";
    device.encoders = parseInt(matches[1]);
  }

  device.recvMsg = function(msg) {
    if (msg.address == '/sys/size') {
      device.sizeX = msg.arguments[0].value;
      device.sizeY = msg.arguments[1].value;
    } else if (msg.address == '/sys/id') {
      device.id = msg.arguments[0].value;
    } else if (msg.address == '/sys/rotation') {
      device.rotation = msg.arguments[0].value;
    } else if (msg.address == '/sys/prefix') {
      device.prefix = msg.arguments[0].value;
    } else if (msg.address == device.prefix + '/grid/key') {
      device.eventsEmitter.emit('press', msg.arguments[0].value, msg.arguments[1].value, msg.arguments[2].value);
    }
  };

  device.msg = function(addr, args) {
    var msg = osc.toBuffer({ address: addr, args: args });
    device.socket.send(msg, 0, msg.length, device.service.port, device.service.addresses[0]);
  }

  device.focus = function() {
    device.socket = udp.createSocket("udp4", function(msg, rinfo) {
      try {
        device.recvMsg(osc.fromBuffer(msg));
      } catch(error) {
        console.log(error);
      }
    });
    console.log("bind socket to port " + device.listenPort);
    device.socket.bind(device.listenPort);

    // tell serialosc our listening port
    device.msg('/sys/port', [device.listenPort]);
    // get info about this monome
    device.msg('/sys/info');
  };

  return device;
};

serialosc.createVirtualDevice = function(options) {
  var device = {};
  var options = options || {};
  options.serialoscHost = options.serialoscHost || '127.0.0.1';
  options.serialoscPort = options.serialoscPort || 1024 + Math.floor(Math.random() * 60000);
  options.name = options.name || 'virtual device ' + (serialosc.devices.length + 1);
  serialosc.newDevice(device);
  for (key in options) { device[key] = options[key]; }

  device.serialoscSocket = udp.createSocket("udp4", function(msg, rinfo) {
    //try {
      msg = osc.fromBuffer(msg);
      var serialoscDevice = serialosc.devices[device.name];
      if (msg.address == "/sys/port") {
        console.log("virtual device received /sys/port");
        serialoscDevice.listenPort = msg.arguments[0].value;
        device.msg("/sys/port", [ serialoscDevice.listenPort ]);
      } else if (msg.address == "/sys/info") {
        device.msg("/sys/id", [ serialoscDevice.id ]);
        device.msg("/sys/size", [ serialoscDevice.sizeX, serialoscDevice.sizeY ]);
        device.msg("/sys/host", [ serialoscDevice.service.addresses[0] ]);
        device.msg("/sys/port", [ serialoscDevice.listenPort ]);
        device.msg("/sys/prefix", [ serialoscDevice.prefix ]);
        device.msg("/sys/rotation", [ serialoscDevice.rotation ]);
      } else if (msg.address == serialoscDevice.prefix + "/grid/led/set") {
        serialoscDevice.ledState[msg.arguments[0].value][msg.arguments[1].value] = msg.arguments[2].value;
        serialoscDevice.eventsEmitter.emit('stateChange');
      }
    //} catch (error) {
    //  console.log(er)
    //  console.log(error);
    //}
  });
  device.serialoscSocket.bind(device.serialoscPort);

  device.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), device.serialoscPort, {
    name: device.name,
    port: device.serialoscPort
  });
  device.ad.start();

  device.press = function(x, y, s) {
    serialosc.getDevice({name: device.name}).eventsEmitter.emit('press', x, y, s);
  }

  device.msg = function(addr, args) {
    var msg = osc.toBuffer({ address: addr, args: args });
    device.serialoscSocket.send(msg, 0, msg.length, device.listenPort, device.serialoscHost);
  }

  serialosc.virtualDevices[device.name] = device;
  return device;
}

serialosc.hasDevice = function(device) {
  if (serialosc.devices[device.service.name] != undefined) {
    return true;
  }
  return false;
}

serialosc.addDevice = function(device) {
  // replace the device if we already have one
  // i think this is if it's bound to 2 interfaces?
  if (serialosc.hasDevice(device)) {
    serialosc.removeDevice(device);
  }
  serialosc.devices[device.service.name] = device;
}

serialosc.removeDevice = function(device) {
  if (serialosc.hasDevice(device)) {
    if (serialosc.getDevice(device.service).socket) {
      serialosc.getDevice(device.service).socket.close();
    }
    delete serialosc.devices[device.service.name];
  }
}

// get device by service name
serialosc.getDevice = function(service) {
  return serialosc.devices[service.name];
}

module.exports = serialosc;