const path = require('path');
const webpack = require("webpack")

module.exports = {
    mode: "production",
    entry: './build/graphics.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
          // test: /\.xxx$/, // may apply this only for some modules
          options: {
            keepNames:true
          }
        })
      ]
};