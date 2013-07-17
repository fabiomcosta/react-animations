// vendor prefix requestAnimationFrame
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame;

if (!window.requestAnimationFrame) {
  throw new Error('sorry, you need a browser with requestAnimationFrame');
}

if (!window.Worker) {
  throw new Error('sorry, you need a browser with web workers');
}

function clampTo8bit(a) {
  return a < 0 ? 0 : a > 255 ? 255 : a;
}

var TIMEOUT = 15;

function CopyImageDataTask(srcJpegData, numComponents, destImageData, finish) {
  this.data = srcJpegData;
  this.imageData = destImageData;
  this.width = this.imageData.width;
  this.height = this.imageData.height;
  this.imageDataArray = this.imageData.data;
  this.i = 0;
  this.j = 0;
  this.x = 0;
  this.y = 0;
  this.callback = CALLBACKS[numComponents];
  this.finish = finish;
  this.runIteration = this.beginIterate.bind(this);
  requestAnimationFrame(this.runIteration);
};

CopyImageDataTask.prototype.beginIterate = function() {
  this.iterate(Date.now());
};

CopyImageDataTask.prototype.iterate = function(startTime) {
  while (true) {
    if (this.x === this.width) {
      this.x = 0;
      this.y++;
    }
    if (this.y >= this.height) {
      requestAnimationFrame(this.finish);
      break;
    }
    this.callback();
    this.x++;

    if (Date.now() - startTime > TIMEOUT) {
      requestAnimationFrame(this.runIteration);
      break;
    }
  }
};

var CALLBACKS = {
  1: function() {
    var Y = this.data[this.i++];

    this.imageDataArray[this.j++] = Y;
    this.imageDataArray[this.j++] = Y;
    this.imageDataArray[this.j++] = Y;
    this.imageDataArray[this.j++] = 255;
  },
  3: function() {
    var R = this.data[this.i++];
    var G = this.data[this.i++];
    var B = this.data[this.i++];

    this.imageDataArray[this.j++] = R;
    this.imageDataArray[this.j++] = G;
    this.imageDataArray[this.j++] = B;
    this.imageDataArray[this.j++] = 255;
  },
  4: function() {
    var C = this.data[this.i++];
    var M = this.data[this.i++];
    var Y = this.data[this.i++];
    var K = this.data[this.i++];

    var R = 255 - clampTo8bit(C * (1 - K / 255) + K);
    var G = 255 - clampTo8bit(M * (1 - K / 255) + K);
    var B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

    this.imageDataArray[this.j++] = R;
    this.imageDataArray[this.j++] = G;
    this.imageDataArray[this.j++] = B;
    this.imageDataArray[this.j++] = 255;
  }
};

function ImageLoader() {
  this.images = {};
  this.nextDataImageID = null;
  this.ids = 0;
  this.worker = new Worker('./jpgworker.js');
  this.worker.onmessage = this.handleMessage.bind(this);
  this.worker.onerror = function(event) {
    console.error('jpgworker error:', event);
  };
}

ImageLoader.prototype.handleMessage = function(event) {
  var imageMetadata;
  if (event.data.metadata) {
    this.nextDataImageID = event.data.id;
    imageMetadata = this.images[this.nextDataImageID];
    imageMetadata.numComponents = event.data.numComponents;
    imageMetadata.width = event.data.width;
    imageMetadata.height = event.data.height;
  } else {
    imageMetadata = this.images[this.nextDataImageID];
    this.images[this.nextDataImageID] = null;
    imageMetadata.cb(
      new Uint8Array(event.data),
      imageMetadata.numComponents,
      imageMetadata.width,
      imageMetadata.height
    );
  }
};

ImageLoader.prototype.loadImage = function(url, width, height, cb) {
  var id = 'img' + (this.ids++);
  this.images[id] = {
    numComponents: -1,
    width: -1,
    height: -1,
    cb: cb
  };
  this.worker.postMessage({
    id: id,
    url: url,
    width: width,
    height: height
  });
};