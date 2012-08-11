var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('node-osc');
var events = require('events');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.browser = null;
serialosc.devices = {};
serialosc.eventsEmitter = new events.EventEmitter();
serialosc.seenServices = {};
serialosc.oscClients = {};
serialosc.oscServers = {};

// register serialosc event callbacks, currently supported:
//   'discover' -> (device) -- called when device is discovered
serialosc.on = function(event, callback) {
  serialosc.eventsEmitter.on(event, callback);
};

serialosc.discover = function() {
  serialosc.browser = mdns.createBrowser(mdns.udp('monome-osc'))
  serialosc.browser.on('serviceUp', function(service) {
    if (serialosc.seenServices[service.name]) {
      return;
    }
    serialosc.seenServices[service.name] = true;
    device = serialosc.discoverDevice(service);
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
};

// send an osc message to the listen port (press, etc.)
serialosc.oscOut = function(host, port, arguments) {
  if (!serialosc.oscClients[port]) {
    serialosc.oscClients[port] = new osc.Client(host, port);
  }
  serialosc.oscClients[port].send.apply(serialosc.oscClients[port], arguments);
};

serialosc.oscServer = function(host, port, callback) {
  serialosc.oscServers[port] = new osc.Server(port);
  serialosc.oscServers[port].removeAllListeners('message');
  serialosc.oscServers[port].on('message', function(msg, rinfo) {
    callback(msg);
  });
};

serialosc.createDevice = function() {
  var device = {};
  device.socket = null;
  device.listenPort = 1024 + Math.floor(Math.random() * 60000);
  device.listenHost = '127.0.0.1';
  device.type = 'grid';
  device.sizeX = 8;
  device.sizeY = 8;
  device.encoders = 0;
  device.id = 'unknown sup';
  device.prefix = '/monome';
  device.rotation = 0;
  device.gridState = [];
  device.eventsEmitter = new events.EventEmitter();
  device.focusCallback = function() {};

  device.on = function(event, callback) {
    device.eventsEmitter.on(event, callback);
  };

  // grab focus of this device -- listen on an osc port and tell serialosc
  // also get info about this device (sizeX/sizeY)
  device.focus = function(focusCallback) {
    device.focusCallback = focusCallback;
    // TODO: find a way to cleanly close an existing server
    serialosc.oscServer(device.service.host, device.listenPort, function(msg) {
      device.oscIn(msg);
    })
    device.oscOut('/sys/port', device.listenPort);
    device.oscOut('/sys/info', device.listenPort);
  };

  device.oscOut = function() {
    serialosc.oscOut(device.service.addresses[0], device.service.port, arguments);
  };

  // receive a message from serialosc
  device.oscIn = function(msg) {
    var addr = msg.shift();
    switch(addr) {
      case '/sys/size':
        device.sizeX = msg[0];
        device.sizeY = msg[1];
        device.focusCallback();
        break;

      case '/sys/id':
        device.id = msg[0];
        break;

      case '/sys/rotation':
        device.rotation = msg[0];
        break;

      case '/sys/prefix':
        device.prefix = msg[0];
        break;

      case device.prefix + '/grid/key':
        device.eventsEmitter.emit('press', msg[0], msg[1], msg[2]);
        break;
    }
  };

  return device;
}

serialosc.discoverDevice = function(service) {
  var device = serialosc.createDevice();
  device.service = service;

  // detect arc
  var matches = service.name.match(/arc (\d+)/);
  if (matches) {
    device.type = "arc";
    device.encoders = parseInt(matches[1]);
  }

  return device;
};

serialosc.hasDevice = function(device) {
  if (serialosc.devices[device.service.name] != undefined) {
    return true;
  }
  return false;
};

serialosc.addDevice = function(device) {
  // replace the device if we already have one
  if (serialosc.hasDevice(device)) {
    serialosc.removeDevice(device);
  }
  serialosc.devices[device.service.name] = device;
};

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
};

// get device by service name
serialosc.getDevice = function(service) {
  return serialosc.devices[service.name];
};

module.exports = serialosc;