var assert = require('assert');
var should = require('should');
var _ = require('underscore');

describe('default device', function() {
  var device = createTestDevice();
  it('has correct default properties', function() {
    device._attributes.should.have.property('id', 1);
    device._attributes.should.have.property('type', 'grid');
    device._attributes.should.have.property('name', 'monome 64 (v0000001)');
    device._attributes.should.have.property('prefix', '/monome');
    device._attributes.should.have.property('sizeX', 8);
    device._attributes.should.have.property('sizeY', 8);
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
    device.oscOut = function(msg, prefix) {
      msg.should.equal('/sys/prefix');
      prefix.should.equal('/test');
      done();
    };
    device.oscIn(['/sys/prefix', '/test']);
    device._attributes.prefix.should.equal('/test');
  });

  it('responds to /grid/led/set with state = 1', function(done) {
    device.stateChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(1);
      device._attributes.ledState.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/set', 3, 2, 1]);
  });

  it('responds to /grid/led/set with state = 0', function(done) {
    device.stateChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(0);
      device._attributes.ledState.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/set', 3, 2, 0]);
  });

  it('responds to /grid/led/row', function(done) {
    device.stateChangeCB = function(data) {
      // last column
      if (data.x === device._attributes.sizeX - 1) {
        device._attributes.ledState.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/row', 0, 0, 255]);
  });

  it('responds to /grid/led/col', function(done) {
    device.stateChangeCB = function(data) {
      // last row
      if (data.y === device._attributes.sizeY - 1) {
        device._attributes.ledState.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/col', 0, 0, 255]);
  });

  it('responds to /grid/led/map', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
        device._attributes.ledState.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/map', 0, 0, 255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/all', function(done) {
    device.stateChangeCB = function(data) {
      // last led
      if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
        device._attributes.ledState.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/all', 0]);
  });

  it('responds to /grid/led/level/set with state = 7', function(done) {
    device.levelChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(7);
      device._attributes.ledLevel.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/level/set', 3, 2, 7]);
  });

  it('responds to /grid/led/level/set with state = 15', function(done) {
    device.levelChangeCB = function(data) {
      data.x.should.equal(3);
      data.y.should.equal(2);
      data.s.should.equal(15);
      device._attributes.ledLevel.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/level/set', 3, 2, 15]);
  });

  it('responds to /grid/led/level/row', function(done) {
    device.levelChangeCB = function(data) {
      // last column
      if (data.x === device._attributes.sizeX - 1) {
        device._attributes.ledLevel.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/level/row', 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/col', function(done) {
    device.levelChangeCB = function(data) {
      // last row
      if (data.y === device._attributes.sizeY - 1) {
        device._attributes.ledLevel.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/level/col', 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/map', function(done) {
    device.levelChangeCB = function(data) {
      // last led
      if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
        device._attributes.ledLevel.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/level/map', 0, 0,
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
      if (data.x == device._attributes.sizeX - 1 && data.y == device._attributes.sizeY - 1) {
        device._attributes.ledLevel.should.eql([
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
    device.oscIn([device._attributes.prefix + '/grid/led/level/all', 15]);
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
    device._attributes.should.have.property('id', 2);
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
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/set', 14, 14, 1]);
  });

  it('responds to /grid/led/set with state = 0', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/set', 14, 14, 0]);
  });

  it('responds to /grid/led/row with x offset', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/row', 8, 3, 255]);
  });

  it('responds to /grid/led/row with 2 byte row', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/row', 0, 2, 255, 255]);
  });

  it('responds to /grid/led/col with y offset', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/col', 3, 8, 255]);
  });

  it('responds to /grid/led/col with 2 byte col', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/col', 2, 0, 255, 255]);
  });

  it('responds to /grid/led/map with x and y offsets', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/map', 8, 8,
      255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/map with x offset', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/map', 8, 0,
      255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/map with y offset', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/map', 0, 8,
      255, 255, 255, 255, 255, 255, 255, 255]);
  });

  it('responds to /grid/led/all', function(done) {
    device.stateChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/all', 0]);
  });

  it('responds to /grid/led/level/set with state = 7', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/set', 14, 14, 7]);
  });

  it('responds to /grid/led/level/set with state = 15', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/set', 14, 14, 15]);
  });

  it('responds to /grid/led/level/row with x offset', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/row', 8, 3,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/row with 2 byte row', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/row', 0, 2,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/col with y offset', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/col', 3, 8,
      0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/col with 2 byte col', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/col', 2, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('responds to /grid/led/level/map with x and y offsets', function(done) {
    device.levelChangeCB = function(data) {
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
    };
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
  });

  it('responds to /grid/led/level/map with x offset', function(done) {
    device.levelChangeCB = function(data) {
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
    };
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
  });

  it('responds to /grid/led/level/map with y offset', function(done) {
    device.levelChangeCB = function(data) {
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
    };
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
  });

  it('responds to /grid/led/level/all', function(done) {
    device.levelChangeCB = function(data) {
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
    };
    device.oscIn([device._attributes.prefix + '/grid/led/level/all', 15]);
  });
});

describe('arc device', function() {
  var device = createTestDevice({
    type: 'arc',
    serialoscId: 'testarc',
    name: 'monome arc 4 (t0000003)',
    prefix: '/testarc',
    sizeX: 0,
    sizeY: 0,
    encoders: 4
  });

  it('has correct default properties', function() {
    device._attributes.should.have.property('id', 3);
    device._attributes.should.have.property('type', 'arc');
    device._attributes.should.have.property('name', 'monome arc 4 (t0000003)');
    device._attributes.should.have.property('prefix', '/testarc');
    device._attributes.should.have.property('sizeX', 0);
    device._attributes.should.have.property('sizeY', 0);
    device._attributes.should.have.property('encoders', 4);
    device._attributes.should.have.property('rotation', 0);
  });

  it('responds to /ring/set n = 1, x = 14, l = 5', function(done) {
    device.levelChangeCB = function(data) {
      data.n.should.equal(1);
      data.x.should.equal(14);
      data.l.should.equal(5);
      device._attributes.ledLevel.should.eql([
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 5, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0]
      ]);
      done();
    };
    device.oscIn([device._attributes.prefix + '/ring/set', 1, 14, 5]);
  });

  it('responds to /ring/set n = 1, x = 14, l = 0', function(done) {
    device.levelChangeCB = function(data) {
      data.n.should.equal(1);
      data.x.should.equal(14);
      data.l.should.equal(0);
      device._attributes.ledLevel.should.eql([
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0],
        [ 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0]
      ]);
      done();
    };
    device.oscIn([device._attributes.prefix + '/ring/set', 1, 14, 0]);
  });

  it('responds to /ring/all n = 2, l = 15', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 63) {
        data.n.should.equal(2);
        data.l.should.equal(15);
        device._attributes.ledLevel.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/all', 2, 15]);
  });

  it('responds to /ring/all n = 2, l = 0', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 63) {
        data.n.should.equal(2);
        data.l.should.equal(0);
        device._attributes.ledLevel.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/all', 2, 0]);
  });

  it('responds to /ring/map -- set encoder 0', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 63) {
        device._attributes.ledLevel.should.eql([
          [15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           10,10,10,10,10,10,10,10,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15,
           15,15,15,15,15,15,15,15],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/map', 0,
      15,15,15,15,15,15,15,15,
      15,15,15,15,15,15,15,15,
      10,10,10,10,10,10,10,10,
      15,15,15,15,15,15,15,15,
      15,15,15,15,15,15,15,15,
      15,15,15,15,15,15,15,15,
      15,15,15,15,15,15,15,15,
      15,15,15,15,15,15,15,15
    ]);
  });

  it('responds to /ring/map -- clear encoder 0', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 63) {
        device._attributes.ledLevel.should.eql([
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/map', 0,
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

  it('responds to /ring/range -- basic', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 7) {
        device._attributes.ledLevel.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/range', 0, 0, 8, 1]);
  });

  it('responds to /ring/range -- negative x1', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 7) {
        device._attributes.ledLevel.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/range', 1, -8, 8, 1]);
  });

  it('responds to /ring/range -- negative x1 and x2', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 59) {
        device._attributes.ledLevel.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 0, 0, 0, 0],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/range', 2, -8, -4, 1]);
  });

  it('responds to /ring/range -- really big x2', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 7) {
        device._attributes.ledLevel.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 0, 0, 0, 0],
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/range', 3, 56, 72, 1]);
  });

  it('responds to /ring/range -- really big x1 and x2', function(done) {
    device.levelChangeCB = function(data) {
      // last led on the encoder
      if (data.x == 23) {
        device._attributes.ledLevel.should.eql([
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1],
          [ 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 0, 0, 0, 0],
          [ 1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1]
        ]);
        done();
      }
    };
    device.oscIn([device._attributes.prefix + '/ring/range', 3, 80, 88, 1]);
  });


});


function createTestDevice(options) {
  options = options || {};
  // var device = new serialosc(options);
  var device = new(require('../lib/serialosc'))(options);

  device.on('stateChange', function(data) {
    device.stateChangeCB(data);
  });
  device.on('levelChange', function(data) {
    device.levelChangeCB(data);
  });
  return device;
}