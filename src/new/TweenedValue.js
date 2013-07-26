function copyProperties(dst, src) {
  for (var k in src) {
    if (!src.hasOwnProperty(k)) {
      continue;
    }
    dst[k] = src[k];
  }
  return dst;
}

function invariant(cond, message) {
  if (!cond) {
    throw new Error(message);
  }
}

function Ease(js, css) {
  this.js = js;
  this.css = css;
}

// Basically a keyframe
function TweenStep(time, value, ease) {
  this.time = time; // time since previous TweenStep
  this.value = value;
  this.ease = ease;
}

// NO CALLBACKS
function TweenedValue(initialValue, steps, forceNoCSS) {
  invariant(this.steps.length > 0, 'You must provide at least 1 step');
  this.initialValue = initialValue;
  this.steps = steps;
  this.forceNoCSS = forceNoCSS;
  this.usedRawValue = false;
}

copyProperties(TweenedValue.prototype, {
  getRawValue: function(time) {
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
  }
});
