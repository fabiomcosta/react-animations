/**
 * @jsx React.DOM
 */

// Some basic math we need to ensure the viewport is
// positioned correctly
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

// Used to round with a variable midpoint, i.e. we favor
// opening the menu
function round(n, min, max, pct) {
  pct = pct || .5;
  if (n > min + (max - min) * pct) {
    return max;
  } else {
    return min;
  }
}

var Spinner = React.createClass({
  render: function() {
    return <img class="Spinner" src="./ajax-loader.gif" />;
  }
});

// give the gpu 2 seconds to decode.
var DECODE = 2000;

var Img = React.createClass({
  getInitialState: function() {
    return {loaded: false, hdLoaded: false, hdDecoded: false};
  },
  handleLoaded: function() {
    if (!this.isMounted()) {
      return;
    }
    // TODO: it's possible that this will execute during an animation and skip a frame.
    this.setState({loaded: true});

    this.loadHD();
  },
  componentWillMount: function() {
    this.timeout = null;
    this.loadingHD = false;
    this.img = new Image();
    this.img.onload = this.handleLoaded;
    this.img.src = this.props.src;
  },
  handleHDLoaded: function() {
    if (!this.isMounted()) {
      return;
    }
    // TODO: it's possible that this will execute during an animation and skip a frame.
    this.setState({hdLoaded: true});
    this.timeout = setTimeout(this.handleHDDecoded, DECODE_TIME);
  },
  handleHDDecoded: function() {
    if (!this.isMounted()) {
      return;
    }
    this.setState({hdDecoded: true});
    this.timeout = null;
  },
  componentWillUnmount: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },
  loadHD: function() {
    if (this.loadingHD) {
      return;
    }
    this.loadingHD = true;
    this.img = new Image();
    this.img.onload = this.handleHDLoaded;
    this.img.src = this.props.hdsrc;
  },
  handleLoaded: function() {
    if (!this.isMounted()) {
      return;
    }
    // TODO: it's possible that this will execute during an animation and skip a frame.
    this.setState({loaded: true});

    this.loadHD();
  },
  render: function() {
    if (!this.state.loaded) {
      return (
        <div
            class="Img"
            style={{
              width: this.props.width,
              height: this.props.height}}>
          <Spinner />
        </div>
      );
    }
    var hd = null;
    if (this.props.hdsrc) {
      hd = <div class="ImgHD" style={{background: 'url(' + this.props.hdsrc + ')'}} />;
    }
    return (
      <div
          class={'Img ' + (this.state.hdDecoded ? 'ImgHDDecoded' : '')}
          style={{
            width: this.props.width,
            height: this.props.height,
            background: 'url(' + this.props.src + ')',
            backgroundPosition: '0 0',
            backgroundSize: '100% 100%'}}>
        {hd}
      </div>
    );
  }
});

var PhotoContainer = React.createClass({
  render: function() {
    return (
      <div class="Photo" style={{width: this.props.width, height: this.props.height}}>
        {this.props.children}
      </div>
    );
  }
});

var Photo = React.createClass({
  render: function() {
    return (
      <PhotoContainer width={this.props.width} height={this.props.height}>
        <Img src={this.props.src} width="100%" height="100%" />
        <div class="PhotoInfo">
          <div class="PhotoText">
            <div class="PhotoCaption">{this.props.caption}</div>
            <div class="PhotoDomain">{this.props.domain}</div>
          </div>
          <div class="PhotoDimensions">
            {this.props.width}x{this.props.height}
          </div>
        </div>
      </PhotoContainer>
    );
  }
});

var TWEEN_TIME = 350;

var Gallery = React.createClass({
  mixins: [TweenMixin], // gives us this.tweenState()
  clampPos: function(desiredPos) {
    var min = -1 * this.props.width;
    var max = this.props.width;
    if (this.state.index === 0) {
      max = 0;
    }
    if (this.state.index === this.props.children.length - 1) {
      min = 0;
    }
    return clamp(desiredPos, min, max);
  },
  roundPos: function(desiredPos) {
    // round to nearest multiple of SAMPLE_WIDTH
    if (desiredPos < 0) {
      return round(desiredPos, -1 * this.props.width, 0, .75);
    } else {
      return round(desiredPos, 0, this.props.width, .25);
    }
    return Math.round(desiredPos / this.props.width) * this.props.width;
  },
  getInitialState: function() {
    return {dragPos: 0, index: 0, animating: false};
  },
  handleStartGesturing: function() {
    // This is fired onTouchStart. We want the browser
    // focused solely on animation during this time, so
    // set our animating state flag.
    this.setState({animating: true});
  },
  handleStopGesturing: function(swiping) {
    // This is fired onTouchEnd. If the user has not moved
    // at least 2px, then we don't consider it a swipe. If
    // the user *has* swiped then the tween will reset
    // animating; if not swiping we reset it here.
    if (!swiping) {
      this.setState({animating: false}, this.snap);
    }
  },
  handleSwiping: function(data) {
    this.setState({
      dragPos: this.clampPos(this.state.dragPos + data.offset.x)
    });
  },
  handleSwiped: function(data) {
    this.tweenPos(this.roundPos(this.state.dragPos));
  },
  snap: function() {
    if (this.state.dragPos > 0 && this.state.index > 0) {
      this.setState({index: this.state.index - 1, dragPos: 0});
    } else if (this.state.dragPos < 0 && this.state.index < this.props.children.length - 1) {
      this.setState({index: this.state.index + 1, dragPos: 0});
    } else {
      this.setState({dragPos: 0});
    }
  },
  tweenPos: function(desiredPos) {
    // A simple wrapper around our tweening behavior. We
    // want to do a few things: set the animating flag
    // if it has not been set yet, tween to the right
    // place in 200ms, and always clear the animating
    // flag.
    var tween = this.tweenState({override: true});
    if (!this.state.animating) {
      tween.to({animating: true}, 0);
    }
    tween
      .to({dragPos: desiredPos}, TWEEN_TIME, EasingFunctions.easeOutBack)
      .to({animating: false}, 0)
      .call(window.setTimeout.bind(window, this.snap, 0)); // TODO: this is a hack
  },
  renderPhotos: function() {
    // TODO: we could pool this, right?
    var photos = {};
    for (var i = Math.max(0, this.state.index - this.props.bufsize); i <= Math.min(this.state.index + this.props.bufsize, this.props.children.length - 1); i++) {
      var offset = (this.state.index - i) * -1 * this.props.width;
      // TODO: could just have 3 IDs maybe to reuse DOM nodes?
      photos['photo' + i] = (
        <Sprite x={offset + this.state.dragPos} class="PhotoSprite" force3d={true}>
          <StaticSprite animating={this.state.animating}>
            {this.props.children[i]}
          </StaticSprite>
        </Sprite>
      );
    }
    return photos;
  },
  render: function() {
    // Build some simple DOM -- see photos.css for how
    // it fits together.
    return (
      <SwipeTarget
          class="Viewport"
          onStartGesturing={this.handleStartGesturing}
          onStopGesturing={this.handleStopGesturing}
          onSwiping={this.handleSwiping}
          onSwiped={this.handleSwiped}>
        {this.renderPhotos()}
      </SwipeTarget>
    );
  }
});

var SAMPLE_WIDTH = document.documentElement.clientWidth;
var SAMPLE_HEIGHT = document.documentElement.clientHeight;
var NUM_PHOTOS = 10;
var BUFSIZE = 2;

var photos = [];
for (var i = 0; i < NUM_PHOTOS; i++) {
  photos.push(
    <Photo
      width={SAMPLE_WIDTH}
      height={SAMPLE_HEIGHT}
      src={'http://lorempixel.com/' + SAMPLE_WIDTH + '/' + SAMPLE_HEIGHT + '/nature/' + (i + 1) + '/'}
      caption={'Lorempixel placeholder image ' + (i + 1)}
      domain={'lorempixel.com'}
    />
  )
}

React.renderComponent(<Gallery bufsize={BUFSIZE} width={SAMPLE_WIDTH}>{photos}</Gallery>, document.body);