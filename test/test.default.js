var assert = require('assert');
var should = require('should');
// var _ = require('underscore');

describe('default device', function() {
  var device;
    var serialosc = new(require('../lib/serialosc'));
  before(function(done){
    serialosc.createDevice({
      serialoscHost: '127.0.0.1',
      listenHost: '127.0.0.1'
    }, function(err, obj) {
      if (err) throw Error(err);
      device = obj;
      done();
    });
  }); 
    it('has correct default properties', function(done) {
      // device._attributes.should.have.property('id', 1);
      device._attributes.should.have.property('type', 'grid');
      device._attributes.should.have.property('name', 'monome 64 (v0000001)');
      device._attributes.should.have.property('prefix', '/monome');
      device._attributes.should.have.property('sizeX', 8);
      device._attributes.should.have.property('sizeY', 8);
      device._attributes.should.have.property('encoders', 0);
      device._attributes.should.have.property('rotation', 0);
      done();
    });
  after(function(done) {
        var id = device._attributes.id;
        serialosc.killDevice(id);
        // serialosc.getDevice(id).should.eql(false);
        done();
  
  })   
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
    device._emitter.on('ledStateChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/set', 3, 2, 1]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/set with state = 0', function(done) {
    device._emitter.on('ledStateChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/set', 3, 2, 0]);
      device._emitter.removeAllListeners('ledStateChange');
   });

    it('responds to /grid/led/row', function(done) {
      device._emitter.on('ledStateChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/row', 0, 0, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/col', function(done) {
      device._emitter.on('ledStateChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/col', 0, 0, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/map', function(done) {
      device._emitter.on('ledStateChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/map', 0, 0, 255, 255, 255, 255, 255, 255, 255, 255]);
      device._emitter.removeAllListeners('ledStateChange');
    });
  
    it('responds to /grid/led/all', function(done) {
      device._emitter.on('ledStateChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/all', 0]);
      device._emitter.removeAllListeners('ledStateChange');
  });
  
    it('responds to /grid/led/level/set with state = 7', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/set', 3, 2, 7]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/set with state = 15', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/set', 3, 2, 15]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/row', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/row', 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0]);
      device._emitter.removeAllListeners('ledLevelChange');
  });
  
    it('responds to /grid/led/level/col', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/col', 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/map', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
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
      });
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
      device._emitter.removeAllListeners('ledLevelChange');
    });
  
    it('responds to /grid/led/level/all', function(done) {
      device._emitter.on('ledLevelChange', function(data) {
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
      });
      device.oscIn([device._attributes.prefix + '/grid/led/level/all', 15]);
      device._emitter.removeAllListeners('ledLevelChange');
    });
    
after(function(done) {
      var id = device._attributes.id;
      serialosc.killDevice(id);
      // serialosc.getDevice(id).should.eql(false);
      done();
  
})
    // it('should be dead', function(done) {
    //   var id = device._attributes.id;
    //   serialosc.killDevice(id);
    //   serialosc.getDevice(id).should.eql(false);
    //   done();
    // });
  // });
});
