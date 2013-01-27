var mdns = require('mdns');
var osc = require('node-osc');
var events = require('events');

var nextId = 1;

function createDevice(options) {

  // default device settings
  var device = {
    id: nextId,
    type: 'grid',
    serialoscId: 'virtual',
    name: 'monome 64 (v0000001)',
    prefix: '/monome',
    sizeX: 8,
    sizeY: 8,
    encoders: 0,
    rotation: 0,
    listenHost: '127.0.0.1',
    listenPort: 1024 + Math.floor(Math.random() * 60000),
    serialoscHost: '127.0.0.1',
    serialoscPort: 1024 + Math.floor(Math.random() * 60000),
    ledState: [],
    ledLevel: [],
    oscServer: null,
    oscClient: null,
    ad: null,
    eventEmitter: new events.EventEmitter()
  };

  // start osc server and create mdns advertisement
  device.start = function() {
    device.startOSCServer();
    device.createMDNSAdvertisement();
  };

  // start osc server and send all messages to device.oscIn(msg)
  device.startOSCServer = function() {
    device.oscServer = new osc.Server(device.serialoscPort, device.serialoscHost);
    device.oscServer.on('message', function(msg, rinfo) {
      device.oscIn(msg);
    });
  };

  // create mdns advertisement for this device
  device.createMDNSAdvertisement = function() {
    device.ad = mdns.createAdvertisement(mdns.udp('monome-osc'), device.serialoscPort, {
      name: device.name,
      host: device.serialoscHost,
      port: device.serialoscPort
    });
    device.ad.start();
  };

  device.stop = function() {
    // TODO: get myles to implement stopping of osc servers in node-osc
    // device.stopServer();
    device.destroyMDNSAdvertisement();
  };

  device.destroyMDNSAdvertisement = function() {
    if (device.ad) {
      device.ad.stop();
    }
  };

  // available events:
  //   stateChange -> (data): data.x: x coord, data.y: y coord, data.s: on/off
  //   levelChange -> (data): data.x: x coord, data.y: y coord, data.s: level
  //   any osc message, ex: '/monome/grid/led/set' -> (msg)
  device.on = function(event, callback) {
    device.eventEmitter.on(event, callback);
  };

  // handles a message as if it were serialosc
  device.oscIn = function(msg) {
    var addr = msg.shift();
    device.eventEmitter.emit(addr, msg);
    var x,y;
    switch(addr) {

      // handle /sys/port from an app/client
      // set the port we send to them on
      case '/sys/port':
        device.listenPort = msg[0];
        // echo back the port message with our new setting
        device.oscOut('/sys/port', device.listenPort);
        // restart socket / mdns advertisement
        device.startOSCServer();
        break;

      // send back information about this device
      // 1st and 2nd args can actually set a new port/host
      case '/sys/info':
        if (msg.length > 0) {
          if (msg.length == 1) {
            device.listenPort = msg[0];
          }
          if (msg.length == 2) {
            device.listenHost = msg[0];
            device.listenPort = msg[1];
          }
        }
        device.oscOut('/sys/id', device.serialoscId);
        device.oscOut('/sys/size', device.sizeX, device.sizeY);
        device.oscOut('/sys/host', device.listenHost);
        device.oscOut('/sys/port', device.listenPort);
        device.oscOut('/sys/prefix', device.prefix);
        device.oscOut('/sys/rotation', device.rotation);
        break;

      // set prefix and/or send back prefix
      case '/sys/prefix':
        if (msg.length > 0) {
          device.prefix = msg[0];
        }
        device.oscOut('/sys/prefix', device.prefix);
        break;



      // set one led
      case device.prefix + '/grid/led/set':
        device.setLedState(msg[0], msg[1], msg[2]);
        break;

      // length of message determines how many leds we set
      // each additional argument is +8 leds
      // bitwise "and" on appropriate argument of msg (based on x) to check if bit is on
      // 2 ^ (x % 8) because x will go over 8 when there are multiple arguments
      case device.prefix + '/grid/led/row':
        for (x = msg[0]; x < ((msg.length - 2) * 8) + msg[0]; x++) {
          device.setLedState(x, msg[1], msg[2 + Math.floor((x - msg[0]) / 8)] & Math.pow(2, (x - msg[0]) % 8) ? 1 : 0);
        }
        break;

      // inverse of row logic
      case device.prefix + '/grid/led/col':
        for (y = msg[1]; y < ((msg.length - 2) * 8) + msg[1]; y++) {
          device.setLedState(msg[0], y, msg[2 + Math.floor((y - msg[1]) / 8)] & Math.pow(2, (y - msg[1]) % 8) ? 1 : 0);
        }
        break;

      // row logic on drugs
      case device.prefix + '/grid/led/map':
        for (x = msg[0]; x < 8 + msg[0]; x++) {
          for (y = msg[1]; y < 8 + msg[1]; y++) {
            device.setLedState(x, y, msg[2 + (y - msg[1])] & Math.pow(2, (x - msg[0])) ? 1 : 0);
          }
        }
        break;

      // set all leds, straightforward
      case device.prefix + '/grid/led/all':
        for (x = 0; x < device.sizeX; x++) {
          for (y = 0; y < device.sizeY; y++) {
            device.setLedState(x, y, msg[0]);
          }
        }
        break;

      // set one level
      case device.prefix + '/grid/led/level/set':
        device.setGridLedLevel(msg[0], msg[1], msg[2]);
        break;

      // set a row of levels
      case device.prefix + '/grid/led/level/row':
        for (x = msg[0]; x < msg.length + msg[0] - 2; x++) {
          device.setGridLedLevel(x, msg[1], msg[2 + x - msg[0]]);
        }
        break;

      // set a column of levels
      case device.prefix + '/grid/led/level/col':
        for (y = msg[1]; y < msg.length + msg[1] - 2; y++) {
          device.setGridLedLevel(msg[0], y, msg[2 + y - msg[1]]);
        }
        break;

      // set 64 levels
      case device.prefix + '/grid/led/level/map':
        for (x = msg[0]; x < 8 + msg[0]; x++) {
          for (y = msg[1]; y < 8 + msg[1]; y++) {
            device.setGridLedLevel(x, y, msg[2 + (((y - msg[1]) * 8) + (x - msg[0]))]);
          }
        }
        break;

      // set all the levels
      case device.prefix + '/grid/led/level/all':
        for (x = 0; x < device.sizeX; x++) {
          for (y = 0; y < device.sizeY; y++) {
            device.setGridLedLevel(x, y, msg[0]);
          }
        }
        break;

      case device.prefix + '/ring/set':
        device.setArcLedLevel(msg[0], msg[1], msg[2]);
        break;

      case device.prefix + '/ring/all':
        for (x = 0; x < 64; x++) {
          device.setArcLedLevel(msg[0], x, msg[1]);
        }
        break;

      case device.prefix + '/ring/map':
        for (x = 0; x < 64; x++) {
          device.setArcLedLevel(msg[0], x, msg[x+1]);
        }
        break;

      case device.prefix + '/ring/range':
        for (x = msg[1]; x < msg[2]; x++) {
          var x1 = x;
          while (x1 < 0) x1 += 64;
          x1 = x1 % 64;
          device.setArcLedLevel(msg[0], x1, msg[3]);
        }
        break;
    }
  };

  // send osc message to client application (ie /grid/key)
  device.oscOut = function() {
    if (!device.oscClient || device.oscClient.port != device.listenPort || device.oscClient.host != device.listenHost) {
      device.oscClient = new osc.Client(device.listenHost, device.listenPort);
    }
    // automatically prepend prefix if not /sys message
    if (!arguments[0].match(/^\/sys/)) {
      arguments[0] = device.prefix + arguments[0];
    }
    device.oscClient.send.apply(device.oscClient, arguments);
  };

  // store led state as 2d array
  // emit stateChange event when state is actually changed
  // acts as a cache against messages that don't actually change the state
  // only used by grid, arc uses ledLevel exclusively
  device.setLedState = function(x, y, s) {
      if (device.ledState.length != device.sizeY ||
          !device.ledState[0] ||
          (device.ledState[0] && device.ledState[0].length != device.sizeX)) {
        device.ledState = device.init2DArray(device.sizeY, device.sizeX, 0);
      }
    if (device.ledState[y][x] != s) {
      device.ledState[y][x] = s;
      device.eventEmitter.emit('stateChange', { x: x, y: y, s: s });
    }
  };

  // store led level state as 2d array
  // emit levelChange event when level is actually changed
  // acts as a cache against messages that don't actually change the state
  device.setGridLedLevel = function(x, y, s) {
    if (device.ledLevel.length != device.sizeY ||
        !device.ledState[0] ||
        (device.ledLevel[0] && device.ledLevel[0].length != device.sizeX)) {
      device.ledLevel = device.init2DArray(device.sizeY, device.sizeX, 15);
    }
    if (device.ledLevel[y][x] != s) {
      device.ledLevel[y][x] = s;
      device.eventEmitter.emit('levelChange', { x: x, y: y, s: s });
    }
  };

  // store led level state as 2d array
  // emit levelChange event when level is actually changed
  // acts as a cache against messages that don't actually change the state
  device.setArcLedLevel = function(n, x, l) {
    if (device.ledLevel.length != device.encoders ||
        !device.ledLevel[0] ||
        (device.ledLevel[0] && device.ledLevel[0].length != 64)) {
      device.ledLevel = device.init2DArray(device.encoders, 64, 0);
    }
    if (device.ledLevel[n][x] != l) {
      device.ledLevel[n][x] = l;
      device.eventEmitter.emit('levelChange', { n: n, x: x, l: l });
    }
  };

  // create a 2d array and initialize all values to val
  device.init2DArray = function(sizeX, sizeY, val) {
    var arr = [];
    for (var x = 0; x < sizeX; x++) {
      arr[x] = [];
      for (var y = 0; y < sizeY; y++) {
        arr[x][y] = val;
      }
    }
    return arr;
  };

  // parse options, skip functions
  options = options || {};
  for (var key in options) {
    if (typeof device[key] == "function") continue;
    device[key] = options[key];
  }

  // init led state and level caches
  device.ledState = device.init2DArray(device.sizeX, device.sizeY, 0);
  device.ledLevel = device.init2DArray(device.sizeX, device.sizeY, 15);

  nextId++;

  return device;
}
exports.createDevice = createDevice;