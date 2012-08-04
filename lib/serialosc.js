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
}

serialosc.createDevice = function() {
  var device = {};
  device.socket = null;
  device.listenPort = 1024 + Math.floor(Math.random() * 60000);
  device.type = 'grid';
  device.sizeX = 8;
  device.sizeY = 8;
  device.encoders = 0;
  device.id = 'unknown';
  device.prefix = '/monome';
  device.rotation = 0;
  device.gridState = [];
  device.eventsEmitter = new events.EventEmitter();

  device.on = function(event, callback) {
    device.eventsEmitter.on(event, callback);
  }

  // grab focus of this device -- listen on an osc port and tell serialosc
  // also get info about this device (sizeX/sizeY)
  device.focus = function() {
    // TODO: find a way to cleanly close an existing server
    device.oscServer = new osc.Server(device.listenPort, device.service.addresses[0]);
    device.oscServer.on('message', function(msg, rinfo) {
      device.oscIn(msg);
    });

    device.oscOut('/sys/port', device.listenPort);
    device.oscOut('/sys/info');
  };

  // receive a message from serialosc
  device.oscIn = function(msg) {
    var addr = msg.shift();
    if (addr == '/sys/size') {
      device.sizeX = msg[0];
      device.sizeY = msg[1];
      if (device.type == 'grid') {
        if (device.gridState.length != device.sizeX || device.gridstate[0].length != device.sizeY) {
          for (var x = 0; x < device.sizeX; x++) {
            device.gridState[x] = [];
            for (var y = 0; y < device.sizeY; y++) {
              device.gridState[x][y] = 0;
            }
          }
        }
      }
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

  // send an osc message to serialosc (led messages, etc)
  device.oscOut = function() {
    if (!device.oscClient) {
      device.oscClient = new osc.Client(device.service.addresses[0], device.service.port);
    }
    device.oscClient.send.apply(device.oscClient, arguments);
  }

  // creates serialosc server socket
  device.serialoscOscStart = function() {
    // TODO: find a way to cleanly close an existing server
    device.serialoscServer = new osc.Server(device.serialoscPort, device.serialoscHost);
    device.serialoscServer.on('message', function(msg, rinfo) {
      device.serialoscOscIn(msg);
    });
  }

  // handles a message as if it were serialosc
  device.serialoscOscIn = function(msg) {
    var addr = msg.shift();
    // if the library has focus of the device we'll want to update it on /sys/port etc.
    switch(addr) {
      case '/sys/port':
        device.listenPort = msg[0];
        // echo back the port message with our new setting
        device.serialoscOscOut("/sys/port", device.listenPort);
        // restart socket / mdns advertisement
        device.serialoscOscStart();
        break;
      case '/sys/info':
        device.serialoscOscOut("/sys/id", device.id);
        device.serialoscOscOut("/sys/size", device.sizeX, device.sizeY);
        device.serialoscOscOut("/sys/host", device.service.addresses[0]);
        device.serialoscOscOut("/sys/port", device.listenPort);
        device.serialoscOscOut("/sys/prefix", device.prefix);
        device.serialoscOscOut("/sys/rotation", device.rotation);
        break;
      case device.prefix + '/grid/led/set':
        if (device.gridState[msg[0]][msg[1]] != msg[2]) {
          device.gridState[msg[0]][msg[1]] = msg[2];
          device.eventsEmitter.emit('stateChange');
        }
        break;
    }
  }

  // send an osc message to the listen port (press, etc.)
  device.serialoscOscOut = function() {
    if (!device.serialoscClient) {
      device.serialoscClient = new osc.Client(device.service.addresses[0], device.listenPort);
    }
    device.serialoscClient.send.apply(device.serialoscClient, arguments);
  }

  // emulate a press on this device, utility function meant to be called by apps
  // for virtual devices
  device.press = function(x, y, s) {
    device.serialoscOscOut(device.prefix + '/grid/key', x, y, s);
  }

  return device;
}

serialosc.discoverDevice = function(service) {
  var device = serialosc.createDevice();
  device.service = service;

  // override defaults with virtual device settings
  var virtualDevice = serialosc.virtualDevices[service.name];
  if (virtualDevice) {
    for (key in virtualDevice) {
      device[key] = virtualDevice[key];
    }
    device.serialoscOscStart();
  }

  // detect arc
  var matches = service.name.match(/arc (\d+)/);
  if (matches) {
    device.type = "arc";
    device.encoders = parseInt(matches[1]);
  }

  return device;
};

// creates a virtual device and responds like serialosc would.
// the device can be focused by node-serialosc or another app 
// can listen on the port.
serialosc.createVirtualDevice = function(options) {
  var virtualDevice = options || {};
  
  // set up default serialosc options
  virtualDevice.serialoscHost = virtualDevice.serialoscHost || '127.0.0.1';
  virtualDevice.serialoscPort = virtualDevice.serialoscPort || 1024 + Math.floor(Math.random() * 60000);
  virtualDevice.name = virtualDevice.name || 'virtual device ' + (serialosc.devices.length + 1);

  virtualDevice.createMDNSAdvertisement = function() {
    // create mdns advertisement for this device
    virtualDevice.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), virtualDevice.serialoscPort, {
      name: virtualDevice.name,
      port: virtualDevice.serialoscPort

    });
    virtualDevice.ad.start();
  }
  
  // don't allow duplicates
  if (serialosc.virtualDevices[options.name]) {
    return;
  }

  virtualDevice.createMDNSAdvertisement();
  serialosc.virtualDevices[virtualDevice.name] = virtualDevice;
  return virtualDevice;
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