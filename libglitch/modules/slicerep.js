const defaults = require('../lib/defaults');
const randint = require('../lib/rand').randint;
const p = require('../param');

function runSliceRep(imageData, startY, sliceHeight, repeats) {
  let writeOffset;
  let rep;
  const width = imageData.width;
  const offsetStart = startY * width * 4;
  const sliceLength = sliceHeight * width * 4;
  const sourceSlice = new Uint8ClampedArray(imageData.data.buffer, offsetStart, sliceLength);
  writeOffset = offsetStart;
  for (rep = 1; rep < repeats; ++rep) {
    writeOffset = offsetStart + sliceLength * rep;
    if (writeOffset + sliceLength < imageData.data.length) {
      imageData.data.set(sourceSlice, writeOffset);
    }
  }
}

function slicerep(glitchContext, options) {
  options = defaults(options, slicerep.paramDefaults);
  const n = randint(options.nMin, options.nMax);
  if (n <= 0) return;
  const data = glitchContext.getImageData();
  for (let x = 0; x < n; ++x) {
    const height = randint(options.heightMin * data.height, options.heightMax * data.height);
    const repeats = randint(options.repeatsMin, options.repeatsMax);
    const y0 = randint(0, data.height - height);
    runSliceRep(data, y0, height, repeats);
  }
  glitchContext.setImageData(data);
}

slicerep.paramDefaults = {
  nMin: 0,
  nMax: 5,
  heightMin: 0,
  heightMax: 0.01,
  repeatsMin: 0,
  repeatsMax: 50,
};

slicerep.params = [
  p.int('nMin', {description: ''}),
  p.int('nMax', {description: ''}),
  p.num('heightMin', {description: 'Slice height minimum (%)'}),
  p.num('heightMax', {description: 'Slice height maximum (%)'}),
  p.int('repeatsMin', {description: ''}),
  p.int('repeatsMax', {description: ''}),
];

module.exports = slicerep;
