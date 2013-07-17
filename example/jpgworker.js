importScripts('./jpg.js');

self.onmessage = function(event) {
  var j = new JpegImage();
  var id = event.data.id;
  var url = event.data.url;
  var width = event.data.width;
  var height = event.data.height;
  j.onload = function() {
    var data = j.getData(width, height);
    self.postMessage({
      metadata: true,
      id: id,
      numComponents: j.components.length,
      width: j.width,
      height: j.height
    });
    self.postMessage(data.buffer, [data.buffer]);
  };
  j.load(url);
};