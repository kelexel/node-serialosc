var fluid = require("infusion");
var jqUnit = require("jqUnit");
var serialosc = require("../lib/serialosc.js");

jqUnit.module("SerialOSC Tests");

var colors = fluid.registerNamespace("colors");

jqUnit.test("Grid Device", function() {
  var service = {};
  service.name = "test monome";
  service.port = "1234";
  service.addresses = ['127.0.0.1'];
  serialosc.discoverDevice(service);
  jqUnit.assert(serialosc.devices[service.name]);
});