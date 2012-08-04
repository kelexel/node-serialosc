var jqUnit = require("jqUnit");
var serialosc = require("../lib/serialosc.js");

jqUnit.module("SerialOSC Tests");

jqUnit.test("Detect Devices", function() {

  // grid tests
  var service = {};
  service.name = "test monome";
  service.port = "1234";
  service.addresses = ['127.0.0.1'];
  var device = serialosc.discoverDevice(service);

  device.oscIn(['/sys/size', 8, 8]);
  jqUnit.assert(device);
  jqUnit.assertValue(device.type, 'grid');
  jqUnit.assertValue(device.encoders, 0);
  jqUnit.assertValue(device.sizeX, 8);
  jqUnit.assertValue(device.sizeY, 8);

  // arc tests
  service = {};
  service.name = "test arc 2";
  service.port = "1234";
  service.addresses = ['127.0.0.1'];
  var device = serialosc.createDevice(service);
  jqUnit.assert(device);
  jqUnit.assertValue(device.type, 'arc');
  jqUnit.assertValue(device.encoders, 2);
  jqUnit.assertValue(device.sizeX, 0);
  jqUnit.assertValue(device.sizeY, 0);
});
