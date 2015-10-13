function GnvData() {
  'use strict';
  console.log("Instantiating GnvData");
  var self = this;

  this.dataUrl = 'js/gnv-data.json';

  this.fetchData = function () {
    return Q($.getJSON(dataUrl).then(self.parseData));
  };

  this.parseData = function(resp) {
    console.log("In parseData with ");
    if(!_.isObject(resp) || !_.isObject(resp.meta) ||
       !_.isObject(resp.meta.view) || !_.isArray(resp.data)) {
      throw new Error("Unexpected response format.");
    }
    var meta = resp.meta, data = resp.data;
    return true;
  };
}
// $(document).ready(function () {
//   'use strict';
//   window.gnv = new GnvData();
//   window.gnv.start();
// });
