var fluid = require('infusion');
var mdns = require('mdns');
var osc = require('osc-min');
var udp = require('dgram');

var serialosc = fluid.registerNamespace('serialosc');

serialosc.browser = null;
serialosc.devices = {};

serialosc.discoverDevice = function(service) {
  console.log(service.name + " discovered");
  var that = {};
  that.socket = null;
  that.listenPort = 0;
  that.service = service;

  that.recvMsg = function(msg) {
    console.log(msg);
  };

  that.sendMsg = function(addr, args) {
    var msg = osc.toBuffer({ address: addr, args: args });
    that.socket.send(msg, 0, msg.length, that.service.port, that.service.addresses[0]);
  }

  that.init = function() {
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