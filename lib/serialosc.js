var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('node-osc');
var events = require('events');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.createDevice = function(options) {

  var device = {
    type: 'grid',
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
    ledState: [],
    ledLevel: [],
    oscServer: null,
    oscClient: null,
    ad: null,
    browser: null,
    eventEmitter: new events.EventEmitter()
  };

  device.start = function() {
    device.browser = mdns.createBrowser(mdns.udp('monome-osc'))
    device.browser.on('serviceUp', function(service) {
      if (service.name == device.name && service.port == device.serialoscPort) {
        device.serialoscHost = service.addresses[0];
        device.startServer();
      }
    });
    device.browser.start();
    // register the service with mdns
    device.createMDNSAdvertisement();
  }

  device.createMDNSAdvertisement = function() {
    // create mdns advertisement for this device
    device.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), device.serialoscPort, {
      name: device.name,
      port: device.serialoscPort
    });
    device.ad.start();
  }

  device.startServer = function() {
    device.oscServer = new osc.Server(device.serialoscPort, device.serialoscHost);
    device.oscServer.on('message', function(msg, rinfo) {
      device.oscIn(msg);
    });
  }

  device.on = function(event, callback) {
    device.eventsEmitter.on(event, callback);
  }

  // handles a message as if it were serialosc
  device.oscIn = function(msg) {
    var addr = msg.shift();
    device.eventsEmitter.emit(addr, msg);
    // if the library has focus of the device we'll want to update it on /sys/port etc.
    switch(addr) {

      case '/sys/port':
        device.listenPort = msg[0];
        // echo back the port message with our new setting
        device.oscOut("/sys/port", device.listenPort);
        // restart socket / mdns advertisement
        device.startServer();
        break;

      case '/sys/info':
        if (msg.length > 0) {
          if (msg.length == 1) {
            device.listenPort = msg[0];
          }
          if (msg.length == 2) {
            device.listenHost = msg[0];
            device.listenPort = msg[1];
          }
          device.fakedevice.erverStart();
        }
        device.oscOut("/sys/id", device.id);
        device.oscOut("/sys/size", device.sizeX, device.sizeY);
        device.oscOut("/sys/host", device.listenHost);
        device.oscOut("/sys/port", device.listenPort);
        device.oscOut("/sys/prefix", device.prefix);
        device.oscOut("/sys/rotation", device.rotation);
        break;

      case '/sys/prefix':
        if (msg.length > 0) {
          device.prefix = msg[0];
        }
        device.oscOut("/sys/prefix", device.prefix);
        break;

      case device.prefix + '/grid/led/set':
        device.setLedState(msg[0], msg[1], msg[2]);
        break;

      case device.prefix + '/grid/led/row':
        for (var x = msg[0]; x < (msg.length - 2) * 8; x++) {
          device.setLedState(x, msg[1], msg[2 + Math.floor(x / 8)] & Math.pow(2, x % 8) ? 1 : 0);
        }
        break;

      case device.prefix + '/grid/led/col':
        for (var y = msg[1]; y < (msg.length - 2) * 8; y++) {
          device.setLedState(msg[0], y, msg[2 + Math.floor(y / 8)] & Math.pow(2, y % 8) ? 1 : 0);
        }
        break;

      case device.prefix + '/grid/led/map':
        for (var x = msg[0]; x < 8 + msg[0]; x++) {
          for (var y = msg[1]; y < 8 + msg[1]; y++) {
            device.setLedState(x, y, msg[2 + (y - msg[1])] & Math.pow(2, (x - msg[0])) ? 1 : 0);
          }
        }
        break;

      case device.prefix + '/grid/led/all':
        for (var x = 0; x < device.sizeX; x++) {
          for (var y = 0; y < device.sizeY; y++) {
            device.setLedState(x, y, msg[0]);
          }
        }
        break;

      case device.prefix + '/grid/led/level/set':
        device.setLedLevel(msg[0], msg[1], msg[2]);
        break;

      case device.prefix + '/grid/led/level/row':
        for (var x = msg[0]; x < msg.length + msg[0] - 2; x++) {
          device.setLedLevel(x, msg[1], msg[2 + x - msg[0]]);
        }
        break;

      case device.prefix + '/grid/led/level/col':
        for (var y = msg[1]; y < msg.length + msg[1] - 2; y++) {
          device.setLedLevel(msg[0], y, msg[2 + y - msg[1]]);
        }
        break;

      case device.prefix + '/grid/led/level/map':
        for (var x = msg[0]; x < 8 + msg[0]; x++) {
          for (var y = msg[1]; y < 8 + msg[1]; y++) {
            device.setLedLevel(x, y, msg[2 + ((y * 8) + x)]);
          }
        }
        break;

      case device.prefix + '/grid/led/level/all':
        for (var x = 0; x < device.sizeX; x++) {
          for (var y = 0; y < device.sizeY; y++) {
            device.setLedLevel(x, y, msg[0]);
          }
        }
        break;
    }
  }

  device.oscOut = function(host, port, arguments) {
    if (!device.oscClient) {
      device.oscClient = new osc.Client(host, port);
    }
    device.oscClient.send.apply(device.oscClient, arguments);
  }

  device.setLedState = function(x, y, s) {
    if (device.ledState.length != device.sizeX || 
       (device.ledState[0] && device.ledState[0].length != device.sizeY)) {
      device.ledState = device.init2DArray(device.sizeX, device.sizeY, 0);
    }
    if (device.ledState[x][y] != s) {
      device.ledState[x][y] = s;
      device.eventsEmitter.emit('stateChange', { x: x, y: y, s: s });
    }
  }

  device.setLedLevel = function(x, y, s) {
    if (device.ledLevel.length != device.sizeX || 
       (device.ledLevel[0] && device.ledLevel[0].length != device.sizeY)) {
      device.ledLevel = device.init2DArray(device.sizeX, device.sizeY, 15)
    }
    if (device.ledLevel[x][y] != s) {
      device.ledLevel[x][y] = s;
      device.eventsEmitter.emit('levelChange', { x: x, y: y, s: s });
    }
  }

  device.init2DArray = function(sizeX, sizeY, val) {
    var arr = [];
    for (var x = 0; x < sizeX; x++) {
      arr[x] = [];
      for (var y = 0; y < sizeY; y++) {
        arr[x][y] = val;
      }
    }
    return arr;
  }

  options = options || {};
  for (key in options) {
    device[key] = options[key];
  }

  device.ledState = device.init2DArray(device.sizeX, device.sizeY, 0);
  device.ledLevel = device.init2DArray(device.sizeX, device.sizeY, 15);

  return device;
}

module.exports = serialosc;