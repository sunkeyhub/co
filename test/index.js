
var co = require('..');
var assert = require('assert');

function get(val, err, error) {
  return function(done){
    if (error) throw error;
    setTimeout(function(){
      done(err, val);
    }, 10);
  }
}

describe('co(fn)', function(){
  describe('with no yields', function(){
    it('should work', function(done){
      co(function *(){
        done();
      });
    })
  })

  describe('with one yield', function(){
    it('should work', function(done){
      co(function *(){
        var a = yield get(1);
        a.should.equal(1);
        done();
      });
    })
  })

  describe('with several yields', function(){
    it('should work', function(done){
      co(function *(){
        var a = yield get(1);
        var b = yield get(2);
        var c = yield get(3);

        [a,b,c].should.eql([1,2,3]);

        done();
      });
    })
  })

  describe('when the function throws', function(){
    it('should be caught', function(done){
      co(function *(){
        try {
          var a = yield get(1, null, new Error('boom'));
        } catch (err) {
          err.message.should.equal('boom');
          done();
        }
      });
    })
  })

  describe('when an error is passed', function(){
    it('should throw and resume', function(done){
      var error;

      co(function *(){
        try {
          yield get(1, new Error('boom'));
        } catch (err) {
          error = err;
        }

        assert('boom' == error.message);
        var ret = yield get(1);
        assert(1 == ret);
        done();
      });
    })
  })

  describe('with nested co()s', function(){
    it('should work', function(done){
      var hit = [];

      co(function *(){
        var a = yield get(1);
        var b = yield get(2);
        var c = yield get(3);
        hit.push('one');

        [a,b,c].should.eql([1,2,3]);

        yield co(function *(){
          hit.push('two');
          var a = yield get(1);
          var b = yield get(2);
          var c = yield get(3);

          [a,b,c].should.eql([1,2,3]);

          yield co(function *(){
            hit.push('three');
            var a = yield get(1);
            var b = yield get(2);
            var c = yield get(3);

            [a,b,c].should.eql([1,2,3]);
          });
        });

        yield co(function *(){
          hit.push('four');
          var a = yield get(1);
          var b = yield get(2);
          var c = yield get(3);

          [a,b,c].should.eql([1,2,3]);
        });

        hit.should.eql(['one', 'two', 'three', 'four']);
        done();
      });
    })
  })

  describe('return values', function(){
    describe('with a callback', function(){
      it('should be passed', function(done){
        var fn = co(function *(){
          return [
            yield get(1),
            yield get(2),
            yield get(3)
          ];
        });

        fn(function(err, res){
          if (err) return done(err);
          res.should.eql([1,2,3]);
          done();
        });
      })
    })

    describe('when nested', function(){
      it('should return the value', function(done){
        var fn = co(function *(){
          var other = yield co(function *(){
            return [
              yield get(4),
              yield get(5),
              yield get(6)
            ]
          });

          return [
            yield get(1),
            yield get(2),
            yield get(3)
          ].concat(other);
        });

        fn(function(err, res){
          if (err) return done(err);
          res.should.eql([1,2,3,4,5,6]);
          done();
        });
      })
    })
  })

  describe('with errors', function(){
    describe('and no callback', function(){
      it('should throw', function(done){
        co(function *(){
          try {
            var a = yield get(1, new Error('fail'));
          } catch (err) {
            err.message.should.equal('fail');
            done();
          }
        });
      })
    })

    describe('and a callback', function(){
      it('should pass the error', function(done){
        var cb = co(function *(){
          yield get(1);
          yield get(1, new Error('fail'));
          throw new Error('should not reach here');
        });

        cb(function(err){
          err.message.should.equal('fail');
          done();
        });
      })
    })
  })
})
