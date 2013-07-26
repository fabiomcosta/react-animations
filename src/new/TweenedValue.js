var copyProperties = require('./util').copyProperties;
var invariant = require('./util').invariant;

var cubicBeizer = require('./cubicBeizer');

function getCubicBeizerEpsilon(duration) {
  return (1000 / 60 / duration) / 4;
}

function Ease(js, css) {
  this.js = js;
  this.css = css;
}

function cubicBeizerEase(a, b, c, d) {
  return function(duration) {
    return new Ease(
      cubicBeizer(a, b, c, d, getCubicBeizerEpsilon(duration)),
      'cubic-bezier(' + a + ', ' + b + ', ' + c + ', ' + d + ')'
    );
  };
}

var EasingFunctions = {
  ease: cubicBeizerEase(0.25, 0.1, 0.25, 1.0),
  linear: cubicBeizerEase(0.0, 0.0, 1.0, 1.0),
  easeIn: cubicBeizerEase(0.42, 0, 1.0, 1.0),
  easeOut: cubicBeizerEase(0, 0, 0.58, 1.0),
  easeInOut: cubicBeizerEase(0.42, 0, 0.58, 1.0)
};

// Basically a keyframe
function TweenStep(time, value, ease) {
  this.time = time; // time since previous TweenStep
  this.value = value;
  this.ease = ease(time);
}

copyProperties(TweenStep.prototype, {
  getCSSKeyframeProperties: function(property) {
    var keyframe = {
      animationTimingFunction: this.ease.css
    };
    keyframe[property] = this.value;
    return keyframe;
  }
});

// NO CALLBACKS
function TweenedValue(initialValue, steps, forceNoCSS) {
  invariant(steps.length > 0, 'You must provide at least 1 step');
  this.initialValue = initialValue;
  this.steps = steps;
  this.forceNoCSS = forceNoCSS;
  this.usedRawValue = false;
}

copyProperties(TweenedValue.prototype, {
  getRawValue: function(time) {
    // TODO: make this work with call() and wait() (not hard)

    this.usedRawValue = true;

    var currentTimeInLoop = 0;
    for (var i = 0; i < this.steps.length; i++) {
      var step = this.steps[i];
      currentTimeInLoop += step.time;
      if (time <= currentTimeInLoop) {
        var lastValue = i > 0 ? this.steps[i - 1].value : this.initialValue;
        var elapsedTimeInCurrentStep = time - (currentTimeInLoop - step.time);
        return lastValue + (step.value - lastValue) * step.ease.js(elapsedTimeInCurrentStep / step.time);
      }
    }
  },
  canUseCSS: function() {
    if (this.forceNoCSS || this.usedRawValue) {
      return false;
    }

    for (var i = 0; i < this.steps.length; i++) {
      var cssEase = this.steps[i].ease.css;
      if (!cssEase) {
        // Using JS easing, can't use CSS.
        return false;
      }
    }

    return true;
  },
  getCSS: function(property) {
    // TODO: make this work with call() and wait() (not hard)
    invariant(this.canUseCSS(), 'Cannot getCSS() if you cannot use CSS');

    var keyframes = {};
    var i;
    var totalTime = 0;
    for (i = 0; i < this.steps.length; i++) {
      totalTime += this.steps[i].time;
    }
    var currentTime = 0;
    for (i = 0; i < this.steps.length; i++) {
      var step = this.steps[i];
      currentTime += step.time;
      var pct = currentTime / totalTime;
      keyframes[(pct * 100) + '%'] = step.getCSSKeyframeProperties(property);
    }
    return {
      duration: (totalTime / 1000) + 's',
      keyframes: keyframes
    };
  }
});


var tv = new TweenedValue(
  0,
  [
    new TweenStep(10, 100, EasingFunctions.ease)
  ]
);

console.log(tv.getCSS('left'));
console.log(tv.getRawValue(0));
console.log(tv.getRawValue(5));
console.log(tv.getRawValue(10));