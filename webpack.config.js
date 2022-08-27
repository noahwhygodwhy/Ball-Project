const path = require('path');

module.exports = {
  entry: './build/graphics.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};