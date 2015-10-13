function GnvCF(rows) {
  'use strict';
  console.log("Creating crossfilter of length ", rows.length);
  this.cf = crossfilter(rows);
  this.typeDim = this.cf.dimension(_.property('problem'));
  this.dateDim = this.cf.dimension(_.property('response_date'));

  this.hourDim = this.cf.dimension(function (row) {
    var date = row.response_date;
    return date.getHours();
  });

  this.dayDim = this.cf.dimension(function (row) {
    var date = row.response_date;
    return date.getDay();
  });



  this.getTypeData = function () {
    return _.map(
      this.typeDim.group().reduceCount().all(),
      function (i) {
        return {label: i.key, data: i.value};
      }
    );
  };

  function m2tuple(arg) {
    return [arg.key, arg.value];
  }

  this.getResponseByDate = function () {
    var min = this.dateDim.bottom(1)[0].response_date,
        max = this.dateDim.top(1)[0].response_date;
    //var roundto = Math.round((max - min) / 250);  // have 250 data points across the row
    var roundto = 24 * 60 * 60 * 1000; // 1 day
    while((max - min) / roundto > 1000) {
      roundto = roundto * 2;
    }
    var data = this.dateDim
          .group(function (i) {
            return new Date(_.round(i / roundto) * roundto);
          })
          .reduceCount()
          .all();

    return _.map(data, m2tuple);
  };

  this.getHourlyData = function () {
    return _.map(this.hourDim.group().reduceCount().all(), m2tuple);
  };

  this.getDailyData = function () {
    return _.map(this.dayDim.group().reduceCount().all(), m2tuple);
  };
}

function GnvData() {
  'use strict';
  console.log("Instantiating GnvData");
  var self = this;

  this.dataUrl = 'scripts/gnv-data.json';


  this.kickstart = function () {
    var cfp = self.getCrossFilter();
    cfp.then(self.renderPieChart);
    cfp.then(self.renderResponsesbyDate);
    cfp.then(self.renderDay);
    cfp.then(self.renderHour);
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

  this.renderResponsesbyDate = function (gnvcf) {
    var data = gnvcf.getResponseByDate();
    var options = {
      xaxis: { mode: "time" },
      yaxis: {  min: 0 },
      tooltip: {
        show: true,
        content: '%x: %y'
      },
      // selection: {
      //   mode: 'x'
      // },
      grid: {
        hoverable: true
      }
    };
    $.plot('#chart-responsesByDate', [data], options);
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

  this.renderDay = function (gnvcf) {
    var data = gnvcf.getDailyData();
    var options = {
      series: {
        bars: {
          show: true
        }
      },
      grid: {
        hoverable: true
      },
      tooltip: {
        show: true,
        content: "%y"
      },
      xaxis: {
        ticks: [[0, "Sunday"], [1, "Monday"], [2, "Tuesday"], [3, "Wednesday"],
                [4, "Thursday"], [5, "Friday"], [6, "Saturday"]],
      }
    };
    $.plot('#chart-day', [data], options);
  };

  this.renderHour = function  (gnvcf) {
    var data = gnvcf.getHourlyData();
    var options = {
      series: {
        bars: {
          show: true
        }
      },
      grid: {
        hoverable: true
      },
      tooltip: {
        show: true,
        content: "%y"
      },
      xaxis: {
        tickDecimals: 0,
      }
    };
    $.plot('#chart-hour', [data], options);
  };
}
