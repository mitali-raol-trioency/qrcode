'use strict'

const path = require('path')
const webpack = require('webpack')
const env = process.env.NODE_ENV

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  devtool: env === 'production' ? '#source-map' : false,
  entry: path.join(__dirname, 'src/index.js'),
  output: {
    path: resolve('dist'),
    filename: 'bundle.js',
    library: 'urlGenerator',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    })
  ],
  resolve: {
    extensions: ['.js', '.json'],
    modules: [
      resolve('src'),
      resolve('node_modules')
    ],
    alias: {
      'src': resolve('src')
    }
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          resolve('src'),
          resolve('test')
        ]
      }
    ]
  }
}
