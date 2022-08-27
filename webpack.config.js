const path = require('path');

module.exports = {
    mode: "production",
    entry: './build/graphics.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
};