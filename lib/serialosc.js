var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('osc-min');
var udp = require('dgram');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.browser = null;
serialosc.devices = {};
serialosc.eventTable = {};

serialosc.on = function(event, callback) {
  serialosc.eventTable[event] = callback;
}

serialosc.discoverDevice = function(service) {
  var that = {};
  that.socket = null;
  that.listenPort = 0;
  that.service = service;
  that.type = 'unknown';
  that.encoders = 0;
  that.sizeX = 0;
  that.sizeY = 0;
  that.id = 'unknown';
  that.prefix = '/monome';
  that.rotation = 0;
  that.eventTable = {};

  that.on = function(event, callback) {
    that.eventTable[event] = callback;
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

    if (that.eventTable['recvMsg']) {
      var args = [];
      for (var i = 0; i < msg.arguments.length; i++) {
        args.push(msg.arguments[0].value);
      }
      that.eventTable['recvMsg'](msg.address, args);
    }
  };

  that.sendMsg = function(addr, args) {
    var msg = osc.toBuffer({ address: addr, args: args });
    that.socket.send(msg, 0, msg.length, that.service.port, that.service.addresses[0]);
  }

  that.init = function() {
    var matches = that.service.name.match(/arc (\d+)/);
    if (matches) {
      console.log(matches);
      that.type = "arc";
      that.encoders = parseInt(matches[1]);
    } else {
      that.type = "grid";
    }
    that.listenPort = 1024 + Math.floor(Math.random() * 60000);
    that.socket = udp.createSocket("udp4", function(msg, rinfo) {
      try {
        that.recvMsg(osc.fromBuffer(msg));
      } catch(error) {
        console.log(error);
      }
    });
    that.socket.bind(that.listenPort);
    that.sendMsg('/sys/port', [that.listenPort]);
    that.sendMsg('/sys/info');
  };

  that.init();
  serialosc.addDevice(that);
  if (serialosc.eventTable['discover']) {
    serialosc.eventTable['discover'](that);
  }
};

serialosc.hasDevice = function(device) {
  if (serialosc.devices[device.service.name] != undefined) {
    return true;
  }
  return false;
}

serialosc.addDevice = function(device) {
  if (serialosc.hasDevice(device)) {
    console.log("replaced existing service:", device.service.name);
    serialosc.removeDevice(device);
  }
  serialosc.devices[device.service.name] = device;
}

serialosc.removeDevice = function(device) {
  if (serialosc.hasDevice(device)) {
    serialosc.getDevice(device.service).socket.close();
    delete serialosc.devices[device.service.name];
  }
}

serialosc.getDevice = function(service) {
  return serialosc.devices[service.name];
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