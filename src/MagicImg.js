/** @jsx React.DOM */

var loader = new ImageLoader();

var MagicImg = React.createClass({
  getInitialState: function() {
    return {loaded: false};
  },
  render: function() {
    var loader = null;
    if (!this.state.loaded) {
      loader = this.props.children;
    }
    return this.transferPropsTo(<div ref="root" style={{width: '100%', height: '100%', position: 'relative'}}><canvas ref="canvas" />{loader}</div>);
  },
  loadImage: function() {
    loader.loadImage(
      this.props.src,
      this.refs.canvas.getDOMNode().width,
      this.refs.canvas.getDOMNode().height,
      this.handleDecoded
    );
  },
  handleDecoded: function(data, numComponents, width, height) {
    if (!this.isMounted()) {
      return;
    }
    var canvas = this.refs.canvas.getDOMNode();
    var context = canvas.getContext('2d');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    new CopyImageDataTask(data, numComponents, imageData, this.handleReady.bind(this, imageData));
  },
  handleReady: function(imageData) {
    if (!this.isMounted()) {
      return;
    }
    var canvas = this.refs.canvas.getDOMNode();
    var context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    if (this.props.onReady) {
      this.props.onReady();
    }
    this.setState({loaded: true});
  },
  componentDidMount: function() {
    this.refs.canvas.getDOMNode().width = this.refs.root.getDOMNode().clientWidth;
    this.refs.canvas.getDOMNode().height = this.refs.root.getDOMNode().clientHeight;
    this.loadImage();
  },
  componentDidUpdate: function(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.loadImage();
    }
  }
});

window.MagicImg = MagicImg;