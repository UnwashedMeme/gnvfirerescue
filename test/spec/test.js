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

  describe('GnvCF', function () {
    function sampleRow() {
      return {
        response_date: new Date(),
        problem: _.sample(['EMS', 'HAZ', 'ALM', 'FIRE'])
      };
    }
    var sampleData = _.times(10, sampleRow);

    it('should construct', function () {
      var gnvcf = new GnvCF(sampleData);
      assert.ok(gnvcf);
      assert.ok(gnvcf.cf);
    });

    it('should getTypeData in a good format', function () {
      var gnvcf = new GnvCF(sampleData);
      var td = gnvcf.getTypeData();
      assert.ok(td);
      assert.isAbove(td.length, 0);
      var row = td[0];
      assert.property(row, 'label');
      assert.property(row, 'data');
    });



  });

  describe('GnvData', function () {
    var gnv;
    beforeEach(function () {
      gnv = new GnvData();
      gnv.dataUrl = "scripts/gnv-data.json";
    });


    function getSampleData() {
      return gnv.fetchJson(gnv.dataUrl);
    }

    describe('fetchJson', function () {
      it('should get the sample data file', function () {
        return getSampleData().then(function (response) {
          console.log("Got sample data file");
          assert.ok(response);
        });
      });
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
        return getSampleData().then(gnv.parseData).then(function (data) {
          assert.isArray(data);
          expect(data).to.have.length.above(1000);
        });
      });
    });
  });
})();
