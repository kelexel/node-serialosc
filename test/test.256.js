var assert = require('assert');
var should = require('should');
// var _ = require('underscore');
var serialosc = new(require('../lib/serialosc'));


describe('256 device', function() {
  serialosc.createDevice({
    type: 'grid',
    serialoscId: 'test device',
    name: 'test monome 256 (t0000001)',
    prefix: '/test2',
    sizeX: 16,
    sizeY: 16,
    encoders: 0,
    rotation: 0,
    serialoscHost: '127.0.0.1',
    listenHost: '127.0.0.1'
  }, function(err, device) {
    if (err) throw Error(err);
    it('has correct overridden properties', function() {
      // device._attributes.should.have.property('id', 1);
      device._attributes.should.have.property('type', 'grid');
      device._attributes.should.have.property('name', 'test monome 256 (t0000001)');
      device._attributes.should.have.property('prefix', '/test2');
      device._attributes.should.have.property('sizeX', 16);
      device._attributes.should.have.property('sizeY', 16);
      device._attributes.should.have.property('encoders', 0);
      device._attributes.should.have.property('rotation', 0);
    });
  
    it('responds to /sys/port', function(done) {
      device.oscOut = function(msg, port) {
        msg.should.equal('/sys/port');
        port.should.equal(1337);
        done();
      };
      device.oscIn(['/sys/port', 1337]);
      device._attributes.listenPort.should.equal(1337);
    });
  
    it('responds to /sys/info', function(done) {
      var msgs = {
        '/sys/id': false,
        '/sys/size': false,
        '/sys/host': false,
        '/sys/port': false,
        '/sys/prefix': false,
        '/sys/rotation': false
      };
      device.oscOut = function(msg, arg1, arg2) {
        msgs[msg] = true;
        if (msg === '/sys/id') {
          arg1.should.equal(device._attributes.serialoscId);
        }
        else if (msg == '/sys/size') {
          arg1.should.equal(device._attributes.sizeX);
          arg2.should.equal(device._attributes.sizeY);
        }
        else if (msg === '/sys/host') {
          arg1.should.equal(device._attributes.listenHost);
        }
        else if (msg === '/sys/port') {
          arg1.should.equal(device._attributes.listenPort);
        }
        else if (msg === '/sys/prefix') {
          arg1.should.equal(device._attributes.prefix);
        }
        else if (msg === '/sys/rotation') {
          arg1.should.equal(device._attributes.rotation);
        }
        // check if all messages have been received
        for (var key in msgs) {
          if (!msgs[key]) {
            return;
          }
        }
        // if so mark test as done
        done();
      };
      device.oscIn(['/sys/info']);
    });
    it('responds to /sys/prefix', function(done) {
      device.oscOut = function(msg, port) {
        msg.should.equal('/sys/prefix');
        port.should.equal('/test');
        done();
      };
      device.oscIn(['/sys/prefix', '/test']);
      device._attributes.prefix.should.equal('/test');
    });
  
    it('responds to /grid/led/set with state = 1', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        data.x.should.equal(14);
        data.y.should.equal(14);
        data.s.should.equal(1);
        device._attributes.ledState.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      });
      device.oscIn([device._attributes.prefix + '/grid/led/set', 14, 14, 1]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/set with state = 0', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        data.x.should.equal(14);
        data.y.should.equal(14);
        data.s.should.equal(0);
        device._attributes.ledState.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      });
      device.oscIn([device._attributes.prefix + '/grid/led/set', 14, 14, 0]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/row with x offset', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last column
        if (data.x === device._attributes.sizeX - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/row', 8, 3, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/row with 2 byte row', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last column
        if (data.x === device._attributes.sizeX - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/row', 0, 2, 255, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/col with y offset', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last column
        if (data.y === device._attributes.sizeY - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/col', 3, 8, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/col with 2 byte col', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last column
        if (data.y === device._attributes.sizeY - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/col', 2, 0, 255, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/map with x and y offsets', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last led
        if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/map', 8, 8,
        255, 255, 255, 255, 255, 255, 255, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/map with x offset', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last led
        if (data.x == device._attributes.sizeX - 1 && data.y == 7) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/map', 8, 0,
        255, 255, 255, 255, 255, 255, 255, 255]);
       device._emitter.removeAllListeners('ledStateChange');
   });
  
    it('responds to /grid/led/map with y offset', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last led
        if (data.x == 7 && data.y == device._attributes.sizeY - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/map', 0, 8,
        255, 255, 255, 255, 255, 255, 255, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/all', function(done) {
      device._emitter.on('ledStateChange', function(data) {
        // last led
        if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
          device._attributes.ledState.should.eql([
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/all', 0]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/level/set with state = 7', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        data.x.should.equal(14);
        data.y.should.equal(14);
        data.s.should.equal(7);
        device._attributes.ledLevel.should.eql([
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15, 7,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15]
        ]);
        done();
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/set', 14, 14, 7]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/set with state = 15', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        data.x.should.equal(14);
        data.y.should.equal(14);
        data.s.should.equal(15);
        device._attributes.ledLevel.should.eql([
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15]
        ]);
        done();
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/set', 14, 14, 15]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/row with x offset', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last column
        if (data.x === device._attributes.sizeX - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/row', 8, 3,
        0, 0, 0, 0, 0, 0, 0, 0]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/row with 2 byte row', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last column
        if (data.x === device._attributes.sizeX - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15,15,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/row', 0, 2,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/col with y offset', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last column
        if (data.y === device._attributes.sizeY - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15,15,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/col', 3, 8,
        0, 0, 0, 0, 0, 0, 0, 0]);
      device._emitter.removeAllListeners('ledLevelChange');
    });

    it('responds to /grid/led/level/col with 2 byte col', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last column
        if (data.y === device._attributes.sizeY - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15,15,15,15,15,15,15,15,15]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/col', 2, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/map with x and y offsets', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last led
        if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/map', 8, 8,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
      ]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/map with x offset', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last led
        if (data.x == device._attributes.sizeX - 1 && data.y == 7) {
          device._attributes.ledLevel.should.eql([
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0, 0,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/map', 8, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
      ]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/map with y offset', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last led
        if (data.x == 7 && data.y == device._attributes.sizeY - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [15,15, 0,15,15,15,15,15, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/map', 0, 8,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
      ]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/all', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
        // last led
        if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
          device._attributes.ledLevel.should.eql([
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],
            [15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15]
          ]);
          done();
        }
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/all', 15]);
      device._emitter.removeAllListeners('ledLevelChange');
   });
    it('should be dead', function(done) {
      var id = device._attributes.id;
      serialosc.killDevice(id);
      serialosc.getDevice(id).should.eql(false);
      done();
    });

  });
});
