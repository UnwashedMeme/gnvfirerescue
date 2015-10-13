function GnvCF(rows) {
  'use strict';
  console.log("Creating crossfilter of length ", rows.length);
  this.cf = crossfilter(rows);
  this.typeDim = this.cf.dimension(_.property('problem'));
  this.dateDim = this.cf.dimension(_.property('response_date'));


  this.getTypeData = function () {
    return _.map(
      this.typeDim.group().reduceCount().all(),
      function (i) {
        return {label: i.key, data: i.value};
      }
    );
  };
}

function GnvData() {
  'use strict';
  console.log("Instantiating GnvData");
  var self = this;

  this.dataUrl = 'scripts/gnv-data.json';


  this.kickstart = function () {
    self.getCrossFilter().then(function (cf) {
      self.renderPieChart(cf);
    });
  };

  this.fetchJson = function (url) {
    console.log("Fetching ", url);
    return Q($.getJSON(url));
  };

  this.fetchAndParse = function () {
    return this.fetchJson(this.dataUrl).then(this.parseData);
  };

  this.parseData = function(resp) {
    console.log("In parseData with ");
    if(!_.isObject(resp) || !_.isObject(resp.meta) ||
       !_.isObject(resp.meta.view) || !_.isArray(resp.data)) {
      throw new Error("Unexpected response format.");
    }
    var meta = resp.meta, data = resp.data;
    var fieldNames = _.pluck(meta.view.columns, "fieldName");
    return _.map(data, function (row) {
      var o = _.zipObject(fieldNames, row);
      o.response_date = new Date(o.response_date); // parse iso8601
      return o;
    });
  };


  this._crossfilter=null;
  this.getCrossFilter = function () {
    if(!self._crossfilter) {
      self._crossfilter = self.fetchAndParse()
        .then(function (rows) { return new GnvCF(rows); });
    }
    return self._crossfilter;
  };

  this.renderPieChart = function (gnvcf) {
    var data = gnvcf.getTypeData();
    var options = {
      series: {
        pie: {
          innerRadius: 0.25,
          show: true,
          radius: 1,
          label: {
            radius: 3/4,
            show: true,
            threshold: 0.05,
            formatter: function (label, series) {
              return "<div style='font-size:8pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
            }
          }
        }
      },
      grid: {
        hoverable: true
      },
      tooltip: {
        show: true,
        content: "%s: %p.2"
      },
      legend: {
        show: false
      }
    };
    $.plot('#chart-type', data, options);
  };
}
