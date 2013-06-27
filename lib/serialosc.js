var prime = require('prime');
var type = require('prime/type');


var _instance;
var Serialosc = prime({
  _devices: false,
  _factory: false,
  constructor: function() {
    this._devices = {};
    console.log('construct')
    this._factory = new (require(__dirname+'/device.factory.js'));
    _instance  = this;
  },
  createDevice: function(options, callback) {
    if (!callback || type(callback) != 'function') callback = function(err) { if (err) throw Error(err); };


    this._factory.createDevice(options, function(err, device) {
      if (err) callback(err);
      callback(null, device);
    }.bind(this));
  },
  killDevice: function(deviceId, callback) {

  },
  getDevice: function(id) {
    return this._devices[id] ? this._devices[id] : false;
  }
});
module.exports = function(options) {
  return (!_instance) ? new Serialosc(options) : _instance;
}