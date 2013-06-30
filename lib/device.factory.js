var prime = require('prime');
var events = require('events');
var array = require('prime/shell/array');
var async = require('async');
var osc = require('node-osc');
var mdns = require('mdns');
var nextId = 1;

module.exports = prime({
  _ports: false,
  _emitter: false,
  constructor: function() {
    this._ports = [];
  },
  createDevice: function(options, callback) {
    var device = new (require(__dirname+'/device.prototype.js'))(this._getAttributes(options));
console.log('new device')
    async.series([
      this._attachEventEmitter.bind(this, device),
      this._startOSCServer.bind(this, device),
      this._createMDNSAdvertisement.bind(this, device),
      this._attachOSCClient.bind(this, device)
    ], function(err, res) {
      if (err) if (callback) callback(err); else throw Error(err);
      if (callback) callback (null, device)
    });
  },
  _getAttributes: function(options) {
    options = options || {};
    defaults = require(__dirname+'/device.attributes.js');

   // parse options
    for (var key in options)
        defaults[key] = options[key];

    defaults.id = nextId;
    nextId++;
    if (!defaults.listenPort) defaults.listenPort = this._getRandomPort(defaults);
    if (!defaults.serialoscPort) defaults.serialoscPort = this._getRandomPort(defaults);

    return defaults;
  },
  _getRandomPort: function(options) {
    var p = options.portRandMin + Math.floor(Math.random() * options.portRandMax);
    if (this._ports.indexOf(p) != -1) return this._getRandomPort();
    this._ports.push(p);
    return p;
  },
  _attachEventEmitter: function(device, callback) {
    // device._emitter = this._emitter;
    device._emitter = new events.EventEmitter();
    device._emitter.on('respawn', this._respawn.bind(this, device));
    callback(null, device);
  },
  _attachOSCClient: function(device, callback) {
    device._attributes.listenHost = device._oscServer.host;
    device._attributes.serialoscHost = device._oscServer.host;
    this._oscClient = new osc.Client(device._attributes.listenHost, device._attributes.listenPort);
    callback(null, device);
  },
  // start osc server and send all messages to device.oscIn(msg)
  _startOSCServer: function(device, callback) {
    device._oscServer = new osc.Server(device._attributes.serialoscPort, device._attributes.serialoscHost);
    // this._attributes.listenHost = this._oscServer.host;
    // this._attributes.serialoscHost = this._oscServer.host;
    device._oscServer.on('message', function onMessage(msg, rinfo) {
      device.oscIn(msg);
    }.bind(device));
    callback(null, device);
  },
  _stopOSCServer: function(device, callback) {
    callback(null, device);
  },
  // create mdns advertisement for this device
  _createMDNSAdvertisement: function(device, callback) {

    device._ad = mdns.createAdvertisement(mdns.udp('monome-osc'), device._attributes.serialoscPort, {
      name: device._attributes.name,
      host: device._attributes.serialoscHost,
      port: device._attributes.serialoscPort
    });
    device._ad.start();
    callback(null, device);
  },
  _destroyMDNSAdvertisement: function(device, callback) {
    if (device._attributes.ad) {
      device._attributes.ad.stop();
    }
    callback(null, device);
  },
  _respawn: function(device, callback) {
    async.series([
      this._startOSCServer.bind(this, device),
      this._destroyMDNSAdvertisement.bind(this, device),
      this._createMDNSAdvertisement.bind(this, device),
      this._attachOSCClient.bind(this, device)
    ], function(err, res) {
      if (err) throw Error(err);
      // ok
      if (callback) callback(null, device);
    });
  }
});