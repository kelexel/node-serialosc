var assert = require('assert');
var should = require('should');
var serialosc = require('../lib/serialosc');
var _ = require('underscore');

describe('default device', function() {
  var device = createTestDevice();
  it('has correct default properties', function() {
    device.should.have.property('id', 1);
    device.should.have.property('type', 'grid');
    device.should.have.property('name', 'monome 64 (v0000001)');
    device.should.have.property('prefix', '/monome');
    device.should.have.property('sizeX', 8);
    device.should.have.property('sizeY', 8);
    device.should.have.property('encoders', 0);
    device.should.have.property('rotation', 0);
  });

  it('responds to /sys/port', function(done) {
    device.oscOut = function(msg, port) {
      msg.should.equal('/sys/port');
      port.should.equal(1337);
      done();
    };
    device.oscIn(['/sys/port', 1337]);
    device.listenPort.should.equal(1337);
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
        arg1.should.equal(device.serialoscId);
      }
      else if (msg == '/sys/size') {
        arg1.should.equal(device.sizeX);
        arg2.should.equal(device.sizeY);
      }
      else if (msg === '/sys/host') {
        arg1.should.equal(device.listenHost);
      }
      else if (msg === '/sys/port') {
        arg1.should.equal(device.listenPort);
      }
      else if (msg === '/sys/prefix') {
        arg1.should.equal(device.prefix);
      }
      else if (msg === '/sys/rotation') {
        arg1.should.equal(device.rotation);
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
    device.oscOut = function(msg, prefix) {
      msg.should.equal('/sys/prefix');
      prefix.should.equal('/test');
      done();
    };
    device.oscIn(['/sys/prefix', '/test']);
    device.prefix.should.equal('/test');
  });

  it('responds to /grid/led/set with state = 1', function(done) {
    device.stateChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(1);
      device.ledState.should.eql([
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 1, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0]
      ]);
      done();
    };
    device.oscIn([device.prefix + '/grid/led/set', 3, 2, 1]);
  });

  it('responds to /grid/led/set with state = 0', function(done) {
    device.stateChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(0);
      device.ledState.should.eql([
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0]
      ]);
      done();
    };
    device.oscIn([device.prefix + '/grid/led/set', 3, 2, 0]);
  });

  it('responds to /grid/led/row', function(done) {
    device.stateChangeCB = function(data) {
      // last column
      if (data.x === device.sizeX - 1) {
        device.ledState.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/row', 0, 0, 255]);
  });

  it('responds to /grid/led/col', function(done) {
    device.stateChangeCB = function(data) {
      // last row
      if (data.y === device.sizeY - 1) {
        device.ledState.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/col', 0, 0, 255]);
  });

  it('responds to /grid/led/map', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledState.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1],
          [ 1, 1, 1, 1, 1, 1, 1, 1]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/map', 0, 0, 255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/all', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledState.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/all', 0]);
  });

  it('responds to /grid/led/level/set with state = 7', function(done) {
    device.levelChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(7);
      device.ledLevel.should.eql([
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15, 7,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15]
      ]);
      done();
    };
    device.oscIn([device.prefix + '/grid/led/level/set', 3, 2, 7]);
  });

  it('responds to /grid/led/level/set with state = 15', function(done) {
    device.levelChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(15);
      device.ledLevel.should.eql([
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15],
        [15,15,15,15,15,15,15,15]
      ]);
      done();
    };
    device.oscIn([device.prefix + '/grid/led/level/set', 3, 2, 15]);
  });

  it('responds to /grid/led/level/row', function(done) {
    device.levelChangeCB = function(data) {
      // last column
      if (data.x === device.sizeX - 1) {
        device.ledLevel.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/level/row', 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/col', function(done) {
    device.levelChangeCB = function(data) {
      // last row
      if (data.y === device.sizeY - 1) {
        device.ledLevel.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0],
          [ 0,15,15,15,15,15,15,15],
          [ 0,15,15,15,15,15,15,15],
          [ 0,15,15,15,15,15,15,15],
          [ 0,15,15,15,15,15,15,15],
          [ 0,15,15,15,15,15,15,15],
          [ 0,15,15,15,15,15,15,15],
          [ 0,15,15,15,15,15,15,15]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/level/col', 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/map', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledLevel.should.eql([
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/level/map', 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ]);
  });

  it('responds to /grid/led/level/all', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledLevel.should.eql([
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15],
          [15,15,15,15,15,15,15,15]
        ]);
        done();
      }
    };
    device.oscIn([device.prefix + '/grid/led/level/all', 15]);
  });
});

describe('256 device', function() {
  var device = createTestDevice({
    type: 'grid',
    serialoscId: 'test device',
    name: 'test monome 256 (t0000001)',
    prefix: '/test2',
    sizeX: 16,
    sizeY: 16,
    encoders: 0,
    rotation: 0
  });
  it('has correct overridden properties', function() {
    device.should.have.property('id', 2);
    device.should.have.property('type', 'grid');
    device.should.have.property('name', 'test monome 256 (t0000001)');
    device.should.have.property('prefix', '/test2');
    device.should.have.property('sizeX', 16);
    device.should.have.property('sizeY', 16);
    device.should.have.property('encoders', 0);
    device.should.have.property('rotation', 0);
  });

  it('responds to /sys/port', function(done) {
    device.oscOut = function(msg, port) {
      msg.should.equal('/sys/port');
      port.should.equal(1337);
      done();
    };
    device.oscIn(['/sys/port', 1337]);
    device.listenPort.should.equal(1337);
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
        arg1.should.equal(device.serialoscId);
      }
      else if (msg == '/sys/size') {
        arg1.should.equal(device.sizeX);
        arg2.should.equal(device.sizeY);
      }
      else if (msg === '/sys/host') {
        arg1.should.equal(device.listenHost);
      }
      else if (msg === '/sys/port') {
        arg1.should.equal(device.listenPort);
      }
      else if (msg === '/sys/prefix') {
        arg1.should.equal(device.prefix);
      }
      else if (msg === '/sys/rotation') {
        arg1.should.equal(device.rotation);
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
    device.prefix.should.equal('/test');
  });

  it('responds to /grid/led/set with state = 1', function(done) {
    device.stateChangeCB = function(data) {
      data.x.should.equal(14);
      data.y.should.equal(14);
      data.s.should.equal(1);
      device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/set', 14, 14, 1]);
  });

  it('responds to /grid/led/set with state = 0', function(done) {
    device.stateChangeCB = function(data) {
      data.x.should.equal(14);
      data.y.should.equal(14);
      data.s.should.equal(0);
      device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/set', 14, 14, 0]);
  });

  it('responds to /grid/led/row with x offset', function(done) {
    device.stateChangeCB = function(data) {
      // last column
      if (data.x === device.sizeX - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/row', 8, 3, 255]);
  });

  it('responds to /grid/led/row with 2 byte row', function(done) {
    device.stateChangeCB = function(data) {
      // last column
      if (data.x === device.sizeX - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/row', 0, 2, 255, 255]);
  });

  it('responds to /grid/led/col with y offset', function(done) {
    device.stateChangeCB = function(data) {
      // last column
      if (data.y === device.sizeY - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/col', 3, 8, 255]);
  });

  it('responds to /grid/led/col with 2 byte col', function(done) {
    device.stateChangeCB = function(data) {
      // last column
      if (data.y === device.sizeY - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/col', 2, 0, 255, 255]);
  });

  it('responds to /grid/led/map with x and y offsets', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/map', 8, 8,
      255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/map with x offset', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == 7) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/map', 8, 0,
      255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/map with y offset', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == 7 && data.y == device.sizeY - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/map', 0, 8,
      255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/all', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledState.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/all', 0]);
  });

  it('responds to /grid/led/level/set with state = 7', function(done) {
    device.levelChangeCB = function(data) {
      data.x.should.equal(14);
      data.y.should.equal(14);
      data.s.should.equal(7);
      device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/set', 14, 14, 7]);
  });

  it('responds to /grid/led/level/set with state = 15', function(done) {
    device.levelChangeCB = function(data) {
      data.x.should.equal(14);
      data.y.should.equal(14);
      data.s.should.equal(15);
      device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/set', 14, 14, 15]);
  });

  it('responds to /grid/led/level/row with x offset', function(done) {
    device.levelChangeCB = function(data) {
      // last column
      if (data.x === device.sizeX - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/row', 8, 3,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/row with 2 byte row', function(done) {
    device.levelChangeCB = function(data) {
      // last column
      if (data.x === device.sizeX - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/row', 0, 2,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/col with y offset', function(done) {
    device.levelChangeCB = function(data) {
      // last column
      if (data.y === device.sizeY - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/col', 3, 8,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/col with 2 byte col', function(done) {
    device.levelChangeCB = function(data) {
      // last column
      if (data.y === device.sizeY - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/col', 2, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/map with x and y offsets', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/map', 8, 8,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ]);
  });

  it('responds to /grid/led/level/map with x offset', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == 7) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/map', 8, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ]);
  });

  it('responds to /grid/led/level/map with y offset', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == 7 && data.y == device.sizeY - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/map', 0, 8,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ]);
  });

  it('responds to /grid/led/level/all', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == device.sizeX - 1 && data.y == device.sizeY - 1) {
        device.ledLevel.should.eql([
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
    };
    device.oscIn([device.prefix + '/grid/led/level/all', 15]);
  });
});

function createTestDevice(options) {
  options = options || {};
  var device = serialosc.createDevice(options);
  device.on('stateChange', function(data) {
    device.stateChangeCB(data);
  });
  device.on('levelChange', function(data) {
    device.levelChangeCB(data);
  });
  return device;
}