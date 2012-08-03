var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('node-osc');
var udp = require('dgram');
var events = require('events');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.browser = null;
serialosc.devices = {};
serialosc.virtualDevices = {};
serialosc.eventsEmitter = new events.EventEmitter();
serialosc.seenServices = {};

// register serialosc event callbacks, currently supported:
//   'discover' -> (device) -- called when device is discovered
serialosc.on = function(event, callback) {
  serialosc.eventsEmitter.on(event, callback);
}

serialosc.discover = function() {
  serialosc.browser = mdns.createBrowser(mdns.udp('monome-osc'))
  serialosc.browser.on('serviceUp', function(service) {
    if (serialosc.seenServices[service.name]) {
      return;
    }
    serialosc.seenServices[service.name] = true;
    device = serialosc.createDevice(service);
    serialosc.eventsEmitter.emit('deviceFound', device);
    serialosc.addDevice(device);
  });
  serialosc.browser.on('serviceDown', function(service) { 
    var device = serialosc.getDevice(service);
    if (device) {
      serialosc.removeDevice(device);
      delete serialosc.seenServices[service.name];
      serialosc.eventsEmitter.emit('deviceLost', device);
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

  // override defaults with virtual device settings
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

  // send an osc message to serialosc (led messages, etc)
  device.msg = function() {
    if (!device.oscClient) {
      device.oscClient = new osc.Client(device.service.addresses[0], device.service.port);
    }
    device.oscClient.send.apply(device.oscClient, arguments);
  }

  // grab focus of this device -- listen on an osc port and tell serialosc
  // also get info about this device (sizeX/sizeY)
  device.focus = function() {
    device.oscServer = new osc.Server(device.listenPort, device.service.addresses[0]);
    device.oscServer.on('message', function(msg, rinfo) {
      device.recvSerialoscMsg(msg);
    });

    device.msg('/sys/port', device.listenPort);
    device.msg('/sys/info');
  };

  // receive a message from serialosc
  device.recvSerialoscMsg = function(msg) {
    var addr = msg.shift();
    if (addr == '/sys/size') {
      device.sizeX = msg[0];
      device.sizeY = msg[1];
    } else if (addr == '/sys/id') {
      device.id = msg[0];
    } else if (addr == '/sys/rotation') {
      device.rotation = msg[0];
    } else if (addr == '/sys/prefix') {
      device.prefix = msg[0];
    } else if (addr == device.prefix + '/grid/key') {
      device.eventsEmitter.emit('press', msg[0], msg[1], msg[2]);
    }
  };

  return device;
};

// creates a virtual device and responds like serialosc would.
// the device can be focused by node-serialosc or another app 
// can listen on the port.
serialosc.createVirtualDevice = function(options) {
  var device = {};
  var options = options || {};
  
  // set up default serialosc options
  options.serialoscHost = options.serialoscHost || '127.0.0.1';
  options.serialoscPort = options.serialoscPort || 1024 + Math.floor(Math.random() * 60000);
  options.name = options.name || 'virtual device ' + (serialosc.devices.length + 1);
  
  // don't allow duplicates
  if (serialosc.getDevice({ name: options.name })) {
    return;
  }

  // init the device and override with provided options
  serialosc.newDevice(device);
  for (key in options) { device[key] = options[key]; }

  // handles a message as if it were serialosc
  device.handleSerialoscMsg = function(msg) {
    var addr = msg.shift();
    var serialoscDevice = serialosc.devices[device.name];
    if (addr == "/sys/port") {
      serialoscDevice.listenPort = msg[0];
      device.msg("/sys/port", serialoscDevice.listenPort);
      device.setupSerialoscServer();
    } else if (addr == "/sys/info") {
      device.msg("/sys/id", serialoscDevice.id);
      device.msg("/sys/size", serialoscDevice.sizeX, serialoscDevice.sizeY);
      device.msg("/sys/host", serialoscDevice.service.addresses[0]);
      device.msg("/sys/port", serialoscDevice.listenPort);
      device.msg("/sys/prefix", serialoscDevice.prefix);
      device.msg("/sys/rotation", serialoscDevice.rotation);
    } else if (addr == serialoscDevice.prefix + "/grid/led/set") {
      serialoscDevice.ledState[msg[0]][msg[1]] = msg[2];
      serialoscDevice.eventsEmitter.emit('stateChange');
    }
  }

  // creates serialosc server socket
  device.setupSerialoscServer = function() {
    if (device.serialoscServer) {
      device.serialoscServer._sock.close();
    }
    device.serialoscServer = new osc.Server(device.serialoscPort, device.serialoscHost);
    device.serialoscServer.on('message', function(msg, rinfo) {
      device.handleSerialoscMsg(msg);
    });

    // create mdns advertisement for this device
    device.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), device.serialoscPort, {
      name: device.name,
      port: device.serialoscPort
    });
    device.ad.start();
  }

  // emulate a press on this device
  device.press = function(x, y, s) {
    var serialoscDevice = serialosc.getDevice({name: device.name});
    device.msg(serialoscDevice.prefix + '/grid/key', x, y, s);
  }

  // send an osc message to the listen port (press, etc.)
  device.msg = function() {
    if (!device.serialoscClient) {
      device.serialoscClient = new osc.Client(device.serialoscHost, device.listenPort);
    }
    device.serialoscClient.send.apply(device.serialoscClient, arguments);
  }

  device.setupSerialoscServer();
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
    device.eventsEmitter.removeAllListeners('press');
    device.eventsEmitter.removeAllListeners('stateChange');
    if (device.oscServer) {
      device.oscServer.removeAllListeners('message');
    }
    if (device.serialoscServer) {
      device.serialoscServer.removeAllListeners('message');
    }
    delete serialosc.devices[device.service.name];
  }
}

// get device by service name
serialosc.getDevice = function(service) {
  return serialosc.devices[service.name];
}

module.exports = serialosc;