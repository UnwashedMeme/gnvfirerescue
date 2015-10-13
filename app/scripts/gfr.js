function GnvCF(rows) {
  'use strict';
  console.log("Creating crossfilter of length ", rows.length);
  this.cf = crossfilter(rows);
  var typekeys = this.typekeys = [];
  this.dims = {
    'type': this.cf.dimension(function (row) {
      var type = row.problem,
          idx = _.indexOf(typekeys, type);
      if(idx < 0) {
        idx = typekeys.length;
        typekeys.push(type);
      }
      return idx;
    }),
    'date': this.cf.dimension(_.property('response_date')),
    'hour': this.cf.dimension(function (row) {
      var date = row.response_date;
      return date.getHours();
    }),
    'day': this.cf.dimension(function (row) {
      var date = row.response_date;
      return date.getDay();
    })
  };

  this.getTypeData = function () {
    return _.map(this.dims.type.group().reduceCount().all(), m2tuple);
  };

  function m2tuple(arg) { return [arg.key, arg.value]; }

  this.getResponseByDate = function () {
    var min = this.dims.date.bottom(1)[0].response_date,
        max = this.dims.date.top(1)[0].response_date;
    //var roundto = Math.round((max - min) / 250);  // have 250 data points across the row
    var roundto = 24 * 60 * 60 * 1000; // 1 day
    while((max - min) / roundto > 1000) {
      roundto = roundto * 2;
    }
    var data = this.dims.date
          .group(function (i) {
            return new Date(_.round(i / roundto) * roundto);
          })
          .reduceCount()
          .all();
    return _.map(data, m2tuple);
  };

  this.getHourlyData = function () {
    return _.map(this.dims.hour.group().reduceCount().all(), m2tuple);
  };

  this.getDailyData = function () {
    return _.map(this.dims.day.group().reduceCount().all(), m2tuple);
  };

  this.setFilter = function (dim, min, max) {
    console.log("Adding filter on ", dim, min, max);
    this.dims[dim].filterRange([min, max]);
  };

  this.clearFilter = function (dim) {
    this.dims[dim].filterAll();
  };
}

function GnvData() {
  'use strict';
  console.log("Instantiating GnvData");
  var self = this;
  this.dataUrl = 'scripts/gnv-data.json.gz';
  this.plots = {};
  this.renderers = {};

  this.kickstart = function () {
    console.log("Kickstarting");
    var cfp = self.getCrossFilter().then(self.renderAll);

  };


  this.fetchJson = function (url) {
    console.log("Fetching ", url);
    return Q($.getJSON(url));
  };

  this.fetchAndParse = function () {
    return this.fetchJson(this.dataUrl).then(this.parseData);
  };

  this.parseData = function (resp) {
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

  this.renderAll = function (gnvcf, except) {
    _.forEach(self.renderers, function (fn, dim) {
      if(dim !== except) {
        window.setTimeout(_.partial(fn, gnvcf));
      }
    });
  };

  function maintainSelection(dim, fn) {
    return function (gnvcf) {
      var ranges = self.plots[dim] && self.plots[dim].getSelection();
      var plot = fn(gnvcf);
      self.plots[dim] = plot;
      if(ranges) {
        plot.setSelection(ranges, true);
      }
    };
  }

  function makeRenderFunction(dim, fn, plotSelectFn, plotUnselectFn) {
    self.renderers[dim] = maintainSelection(dim, fn);

    plotSelectFn = plotSelectFn || function (event, ranges) {
      self.getCrossFilter().then(function (gnvcf) {
        console.log("plotselected: ", dim, ranges);
        var min = ranges.xaxis.from = ranges.xaxis.from.toFixed();
        var max = ranges.xaxis.to = ranges.xaxis.to.toFixed();
        gnvcf.setFilter(dim, min, max);
        self.plots[dim].setSelection(ranges, true);
        self.renderAll(gnvcf, dim);
      });
    };
    plotUnselectFn = plotUnselectFn || function (event) {
      self.getCrossFilter().then(function (gnvcf) {
        console.log("plotunselected: ", dim);
        gnvcf.clearFilter(dim);
        self.renderAll(gnvcf, dim);
      });
    };
    $('#chart-' + dim)
      .bind('plotselected', plotSelectFn)
      .bind('plotunselected', plotUnselectFn);
  };

  makeRenderFunction('date', function(gnvcf) {
    var data = gnvcf.getResponseByDate();
    var options = {
      xaxis: { mode: "time" },
      yaxis: {  min: 0 },
      tooltip: {
        show: true,
        content: '%x: %y'
      },
      grid: { hoverable: true },
      selection: { mode: "x" }
    };
    return $.plot('#chart-date', [data], options);
  });


  makeRenderFunction('type', function(gnvcf) {

    var data = gnvcf.getTypeData();
    var options = {
      series: {
        bars: { show: true }
      },
      grid: { hoverable: true },
      selection: { mode: "x" },
      tooltip: {
        show: true,
        content: '%y'
      },
      xaxis: { ticks: _.map(gnvcf.typekeys, function (k, idx) { return [idx, k]; })},
      yaxis: {  min: 0 }
    };
    return $.plot('#chart-type', [data], options);
  });

  makeRenderFunction('day', function(gnvcf) {
    var data = gnvcf.getDailyData();
    var options = {
      series: {
        bars: { show: true }
      },
      grid: { hoverable: true },
      selection: { mode: "x" },
      tooltip: {
        show: true,
        content: "%y"
      },
      xaxis: {
        ticks: [[0, "Sunday"], [1, "Monday"], [2, "Tuesday"], [3, "Wednesday"],
                [4, "Thursday"], [5, "Friday"], [6, "Saturday"]]
      },
      yaxis: {  min: 0 }
    };
    return $.plot('#chart-day', [data], options);
  });

  makeRenderFunction('hour', function(gnvcf) {
    var data = gnvcf.getHourlyData();
    var options = {
      series: {
        bars: { show: true }
      },
      grid: { hoverable: true },
      selection: { mode: "x" },
      tooltip: {
        show: true,
        content: "%y"
      },
      xaxis: { tickDecimals: 0 },
      yaxis: {  min: 0 }
    };
    return $.plot('#chart-hour', [data], options);
  });
}
