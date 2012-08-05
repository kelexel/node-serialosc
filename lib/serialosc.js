var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('node-osc');
var udp = require('dgram');
var events = require('events');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.browser = null;
serialosc.devices = {};
serialosc.eventsEmitter = new events.EventEmitter();
serialosc.seenServices = {};
serialosc.oscClients = {};
serialosc.oscServers = {};
serialosc.virtualDevices = {};

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

// send an osc message to the listen port (press, etc.)
serialosc.oscOut = function(host, port, arguments) {
  if (!serialosc.oscClients[port]) {
    serialosc.oscClients[port] = new osc.Client(host, port);
  }
  serialosc.oscClients[port].send.apply(serialosc.oscClients[port], arguments);
}

serialosc.oscServer = function(host, port, callback) {
  serialosc.oscServers[port] = new osc.Server(port);
  serialosc.oscServers[port].removeAllListeners('message');
  serialosc.oscServers[port].on('message', function(msg, rinfo) {
    callback(msg);
  });
}

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
  }

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
  }

  // receive a message from serialosc
  device.oscIn = function(msg) {
    var addr = msg.shift();
    if (addr == '/sys/size') {
      device.sizeX = msg[0];
      device.sizeY = msg[1];
      device.focusCallback();
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
}

serialosc.discoverDevice = function(service) {
  var device = serialosc.createDevice();
  device.service = service;

  // override defaults with virtual device settings
  // var virtualDevice = serialosc.virtualDevices[service.name];
  // if (virtualDevice) {
  //   for (key in virtualDevice) {
  //     device[key] = virtualDevice[key];
  //   }
  //   device.serialoscServerStart();
  // }

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
  var virtualDevice = {
    id: 'virtual',
    name: 'monome 64 (v0000001)',
    prefix: '/monome',
    sizeX: 8,
    sizeY: 8,
    encoders: 0,
    rotation: 0,
    listenHost: '127.0.0.1',
    listenPort: 1024 + Math.floor(Math.random() * 60000),
    serialoscPort: 1024 + Math.floor(Math.random() * 60000),
    serialoscHost: '127.0.0.1',
    eventsEmitter: new events.EventEmitter(),
    gridState: []
  };

  virtualDevice.on = function(event, callback) {
    virtualDevice.eventsEmitter.on(event, callback);
  }

  virtualDevice.createMDNSAdvertisement = function() {
    // create mdns advertisement for this device
    virtualDevice.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), virtualDevice.serialoscPort, {
      name: virtualDevice.name,
      port: virtualDevice.serialoscPort
    });
    virtualDevice.ad.start();
  }

  virtualDevice.serialoscServerStart = function() {
    serialosc.oscServer(virtualDevice.serialoscHost, virtualDevice.serialoscPort, function(msg) {
      virtualDevice.serialoscOscIn(msg);
    });
  }

  // handles a message as if it were serialosc
  virtualDevice.serialoscOscIn = function(msg) {
    var addr = msg.shift();
    // if the library has focus of the device we'll want to update it on /sys/port etc.
    switch(addr) {

      case '/sys/port':
        virtualDevice.listenPort = msg[0];
        // echo back the port message with our new setting
        virtualDevice.serialoscOscOut("/sys/port", virtualDevice.listenPort);
        // restart socket / mdns advertisement
        virtualDevice.serialoscServerStart();
        break;

      case '/sys/info':
        if (msg.length > 0) {
          if (msg.length == 1) {
            virtualDevice.listenPort = msg[0];
          }
          if (msg.length == 2) {
            virtualDevice.listenHost = msg[0];
            virtualDevice.listenPort = msg[1];
          }
          virtualDevice.serialoscServerStart();
        }
        virtualDevice.serialoscOscOut("/sys/id", virtualDevice.id);
        virtualDevice.serialoscOscOut("/sys/size", virtualDevice.sizeX, virtualDevice.sizeY);
        virtualDevice.serialoscOscOut("/sys/host", virtualDevice.listenHost);
        virtualDevice.serialoscOscOut("/sys/port", virtualDevice.listenPort);
        virtualDevice.serialoscOscOut("/sys/prefix", virtualDevice.prefix);
        virtualDevice.serialoscOscOut("/sys/rotation", virtualDevice.rotation);
        break;

      case '/sys/prefix':
        if (msg.length > 0) {
          virtualDevice.prefix = msg[0];
        }
        virtualDevice.serialoscOscOut("/sys/prefix", virtualDevice.prefix);
        break;

      case virtualDevice.prefix + '/grid/led/set':
        virtualDevice.setGridState(msg[0], msg[1], msg[2]);
        break;
    }
  }

  virtualDevice.serialoscOscOut = function() {
    serialosc.oscOut(virtualDevice.listenHost, virtualDevice.listenPort, arguments);
  }

  // emulate a press on this device, utility function meant to be called by apps
  // for virtual devices
  virtualDevice.press = function(x, y, s) {
    virtualDevice.serialoscOscOut(virtualDevice.prefix + '/grid/key', x, y, s);
  }

  virtualDevice.setGridState = function(x, y, s) {
    if (virtualDevice.gridState.length != virtualDevice.sizeX || 
       (virtualDevice.gridState[0] && virtualDevice.gridState[0].length != virtualDevice.sizeY)) {
      virtualDevice.gridState = [];
      for (var gx = 0; gx < virtualDevice.sizeX; gx++) {
        virtualDevice.gridState[gx] = [];
        for (var gy = 0; gy < virtualDevice.sizeY; gy++) {
          virtualDevice.gridState[gx][gy] = 0;
        }
      }
    }
    if (virtualDevice.gridState[x][y] != s) {
      virtualDevice.gridState[x][y] = s;
      virtualDevice.eventsEmitter.emit('stateChange');
    }
  }

  options = options || {};
  for (key in options) {
    virtualDevice[key] = options[key];
  }

  virtualDevice.name = "monome " + ((virtualDevice.sizeX * 8) + (virtualDevice.sizeY * 8)) + " (v000000" + (serialosc.devices.length) + ")";

  if (options.name) {
    virtualDevice.name = options.name;
  }

  // don't allow duplicates
  if (serialosc.virtualDevices[options.name]) {
    return;
  }

  // run a browser to determine the interface we're bound on
  virtualDevice.browser = mdns.createBrowser(mdns.udp('monome-osc'))
  virtualDevice.browser.on('serviceUp', function(service) {
    if (service.name == virtualDevice.name) {
      virtualDevice.serialoscHost = service.addresses[0];
      virtualDevice.serialoscServerStart();
    }
  });
  virtualDevice.browser.start();
  // register the service with mdns
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