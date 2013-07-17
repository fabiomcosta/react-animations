/** @jsx React.DOM */

var loader = new ImageLoader();

var MagicImg = React.createClass({
  render: function() {
    return this.transferPropsTo(<canvas />);
  },
  loadImage: function() {
    loader.loadImage(
      this.props.src,
      this.getDOMNode().width,
      this.getDOMNode().height,
      this.handleDecoded
    );
  },
  handleDecoded: function(data, numComponents, width, height) {
    if (!this.isMounted()) {
      return;
    }
    var canvas = this.getDOMNode();
    var context = canvas.getContext('2d');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    new CopyImageDataTask(data, numComponents, imageData, this.handleReady.bind(this, imageData));
  },
  handleReady: function(imageData) {
    if (!this.isMounted()) {
      return;
    }
    var canvas = this.getDOMNode();
    var context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    if (this.props.onReady) {
      this.props.onReady();
    }
  },
  componentDidMount: function() {
    this.loadImage();
  },
  componentDidUpdate: function(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.loadImage();
    }
  }
});

window.MagicImg = MagicImg;