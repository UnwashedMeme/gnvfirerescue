function GnvCF(a){"use strict";function b(a){return[a.key,a.value]}console.log("Creating crossfilter of length ",a.length),this.cf=crossfilter(a);var c=this.typekeys=[];this.dims={type:this.cf.dimension(function(a){var b=a.problem,d=_.indexOf(c,b);return 0>d&&(d=c.length,c.push(b)),d}),date:this.cf.dimension(_.property("response_date")),hour:this.cf.dimension(function(a){var b=a.response_date;return b.getHours()}),day:this.cf.dimension(function(a){var b=a.response_date;return b.getDay()})},this.getTypeData=function(){return _.map(this.dims.type.group().reduceCount().all(),b)},this.getResponseByDate=function(){for(var a=this.dims.date.bottom(1)[0].response_date,c=this.dims.date.top(1)[0].response_date,d=864e5;(c-a)/d>1e3;)d=2*d;var e=this.dims.date.group(function(a){return new Date(_.round(a/d)*d)}).reduceCount().all();return _.map(e,b)},this.getHourlyData=function(){return _.map(this.dims.hour.group().reduceCount().all(),b)},this.getDailyData=function(){return _.map(this.dims.day.group().reduceCount().all(),b)},this.setFilter=function(a,b,c){console.log("Adding filter on ",a,b,c),this.dims[a].filterRange([b,c])},this.clearFilter=function(a){this.dims[a].filterAll()}}function GnvData(){"use strict";function a(a,b){return function(d){var e=c.plots[a]&&c.plots[a].getSelection(),f=b(d);c.plots[a]=f,e&&f.setSelection(e,!0)}}function b(b,d,e,f){c.renderers[b]=a(b,d),e=e||function(a,d){c.getCrossFilter().then(function(a){console.log("plotselected: ",b,d);var e=d.xaxis.from=d.xaxis.from.toFixed(),f=d.xaxis.to=d.xaxis.to.toFixed();a.setFilter(b,e,f),c.plots[b].setSelection(d,!0),c.renderAll(a,b)})},f=f||function(){c.getCrossFilter().then(function(a){console.log("plotunselected: ",b),a.clearFilter(b),c.renderAll(a,b)})},$("#chart-"+b).bind("plotselected",e).bind("plotunselected",f)}console.log("Instantiating GnvData");var c=this;this.dataUrl="scripts/gnv-data.json",this.plots={},this.renderers={},this.kickstart=function(){console.log("Kickstarting");c.getCrossFilter().then(c.renderAll)},this.fetchJson=function(a){return console.log("Fetching ",a),Q($.getJSON(a))},this.fetchAndParse=function(){return this.fetchJson(this.dataUrl).then(this.parseData)},this.parseData=function(a){if(console.log("In parseData with "),!(_.isObject(a)&&_.isObject(a.meta)&&_.isObject(a.meta.view)&&_.isArray(a.data)))throw new Error("Unexpected response format.");var b=a.meta,c=a.data,d=_.pluck(b.view.columns,"fieldName");return _.map(c,function(a){var b=_.zipObject(d,a);return b.response_date=new Date(b.response_date),b})},this._crossfilter=null,this.getCrossFilter=function(){return c._crossfilter||(c._crossfilter=c.fetchAndParse().then(function(a){return new GnvCF(a)})),c._crossfilter},this.renderAll=function(a,b){_.forEach(c.renderers,function(c,d){d!==b&&window.setTimeout(_.partial(c,a))})},b("date",function(a){var b=a.getResponseByDate(),c={xaxis:{mode:"time"},yaxis:{min:0},tooltip:{show:!0,content:"%x: %y"},grid:{hoverable:!0},selection:{mode:"x"}};return $.plot("#chart-date",[b],c)}),b("type",function(a){var b=a.getTypeData(),c={series:{bars:{show:!0}},grid:{hoverable:!0},selection:{mode:"x"},tooltip:{show:!0,content:"%y"},xaxis:{ticks:_.map(a.typekeys,function(a,b){return[b,a]})},yaxis:{min:0}};return $.plot("#chart-type",[b],c)}),b("day",function(a){var b=a.getDailyData(),c={series:{bars:{show:!0}},grid:{hoverable:!0},selection:{mode:"x"},tooltip:{show:!0,content:"%y"},xaxis:{ticks:[[0,"Sunday"],[1,"Monday"],[2,"Tuesday"],[3,"Wednesday"],[4,"Thursday"],[5,"Friday"],[6,"Saturday"]]},yaxis:{min:0}};return $.plot("#chart-day",[b],c)}),b("hour",function(a){var b=a.getHourlyData(),c={series:{bars:{show:!0}},grid:{hoverable:!0},selection:{mode:"x"},tooltip:{show:!0,content:"%y"},xaxis:{tickDecimals:0},yaxis:{min:0}};return $.plot("#chart-hour",[b],c)})}