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
  that.eventsEmitter = new events.EventEmitter();
}

serialosc.discoverDevice = function(service) {
  var that = {};

  serialosc.newDevice(that);
  that.service = service;

  // detect arc
  var matches = service.name.match(/arc (\d+)/);
  if (matches) {
    that.type = "arc";
    that.encoders = parseInt(matches[1]);
  }
  // register device event callbacks, currently supported:
  //   'msg' -> (device) -- called when osc message is received
  that.on = function(event, callback) {
    that.eventsEmitter.on(event, callback);
  }

  that.recvMsg = function(msg) {
    if (msg.address == '/sys/size') {
      that.sizeX = msg.arguments[0].value;
      that.sizeY = msg.arguments[1].value;
    } else if (msg.address == '/sys/id') {
      that.id = msg.arguments[0].value;
    } else if (msg.address == '/sys/rotation') {
      that.rotation = msg.arguments[0].value;
    } else if (msg.address == '/sys/prefix') {
      that.prefix = msg.arguments[0].value;
    }

    var args = [];
    for (var i = 0; i < msg.arguments.length; i++) {
      args.push(msg.arguments[i].value);
    }
    that.eventsEmitter.emit('msg', msg.address, args);
  };

  that.msg = function(addr, args) {
    var msg = osc.toBuffer({ address: addr, args: args });
    that.socket.send(msg, 0, msg.length, that.service.port, that.service.addresses[0]);
  }

  that.focus = function() {
    that.socket = udp.createSocket("udp4", function(msg, rinfo) {
      try {
        that.recvMsg(osc.fromBuffer(msg));
      } catch(error) {
        console.log(error);
      }
    });
    that.socket.bind(that.listenPort);

    // tell serialosc our listening port
    that.msg('/sys/port', [that.listenPort]);
    // get info about this monome
    that.msg('/sys/info');
  };

  serialosc.addDevice(that);
  serialosc.eventsEmitter.emit('discover', that);
};

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

// create virtual device, options:
//   listenPort = random port
//   serialoscPort = random port
//   name = 'virtual device #'
serialosc.createVirtualDevice = function(options) {
  device = {};
  serialosc.newDevice(device);
  for (key in options) { device[key] = options[key]; }
  console.log(device);
  device.ledState = [];
  for (var x = 0; x < device.sizeX; x++) {
    device.ledState[x] = [];
    for (var y = 0; y < device.sizeY; y++) {
      device.ledState[x][y] = 0;
    }
  }

  device.serialoscPort = options.serialoscPort || 1024 + Math.floor(Math.random() * 60000);
  device.name = options.name || 'virtual device ' + (serialosc.virtualDevices.length + 1);

  device.msg = function(addr, args) {
    var msg = osc.toBuffer({ address: addr, args: args });
    device.serialoscSocket.send(msg, 0, msg.length, device.listenPort, device.host);
  }

  device.press = function(x, y, s) {
    device.msg(device.prefix + "/grid/key", [x, y, s]);
  }

  // register device event callbacks, currently supported:
  //   'msg' -> (device) -- called when osc message is received
  device.on = function(event, callback) {
    device.eventsEmitter.on(event, callback);
  }

  device.focus = function() {
    device.msg("/sys/port", [ device.listenPort ]);
    device.msg("/sys/info");
  }

  device.serialoscSocket = udp.createSocket("udp4", function(msg, rinfo) {
    try {
      msg = osc.fromBuffer(msg);
      if (msg.address == "/sys/port") {
        device.listenPort = msg.arguments[0].value;
        device.msg("/sys/port", [ device.listenPort ]);
      } else if (msg.address == "/sys/info") {
        device.msg("/sys/id", [ device.id ]);
        device.msg("/sys/size", [ device.sizeX, device.sizeY ]);
        device.msg("/sys/host", [ serialosc.devices[device.name].service.addresses[0] ]);
        device.msg("/sys/port", [ device.listenPort ]);
        device.msg("/sys/prefix", [ device.prefix ]);
        device.msg("/sys/rotation", [ device.rotation ]);
      } else if (msg.address == device.prefix + "/grid/led/set") {
        device.ledState[msg.arguments[0].value][msg.arguments[1].value] = msg.arguments[2].value;
        device.eventsEmitter.emit('stateChange');
      } else {
        var args = [];
        for (var i = 0; i < msg.arguments.length; i++) {
          args.push(msg.arguments[i].value);
        }
        device.eventsEmitter.emit('msg', msg.address, args);
      }

    } catch (error) {
      console.log(error);
    }
  });
  device.serialoscSocket.bind(device.serialoscPort);

  device.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), device.serialoscPort, {
    name: device.name,
    port: device.serialoscPort
  });
  device.ad.start();

  serialosc.virtualDevices[device.name] = device;

  return device;
}

serialosc.discover = function() {
  serialosc.browser = mdns.createBrowser(mdns.udp('monome-osc'))
  serialosc.browser.on('serviceUp', function(service) {
    serialosc.discoverDevice(service);
  });
  serialosc.browser.on('serviceDown', function(service) { 
    var device = serialosc.getDevice(service);
    if (device) {
      serialosc.removeDevice(device);
    }
  });
  serialosc.browser.start();
}

module.exports = serialosc;