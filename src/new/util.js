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

module.exports = {
  copyProperties: copyProperties,
  invariant: invariant
};