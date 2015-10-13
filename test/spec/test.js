(function () {
  'use strict';
  describe('chai-as-promised', function () {
    it('should fail', function() {
      var q = Q.defer();
      q.reject(null);
      return expect(q.promise.catch(function (e) {
        throw e;
      })).to.be.rejected;
    });
  });

  describe('GnvData', function () {
    var gnv;
    beforeEach(function () {
      gnv = new GnvData();
      gnv.dataUrl = "../js/gnv-data.json";
    });

    describe('parseData', function () {
      it('should fail on bad response', function () {
        assert.ok(gnv);
        assert.ok(gnv.parseData);
        var err;
        var p = Q(null)
              .then(gnv.parseData).catch(function (e) {
                assert.typeOf(e, "Error", "parseData returned unexpected");
                assert.equal(e.message, "Unexpected response format.");
              });
        return p;
      });

      it('should return an array of objects', function () {
        return Q({}).then(gnv.parseData).then(function (data) {
          assert.isArray(data);
        });
      });
    });
  });
})();
