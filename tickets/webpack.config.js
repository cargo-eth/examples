const { CheckerPlugin } = require('awesome-typescript-loader');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const path = require('path');

module.exports = {
  mode: 'development',
  devServer: {
    contentBase: path.join(__dirname, './start/build'),
    compress: true,
    port: 3333,
  },
  entry: path.resolve(__dirname, './start/app.tsx'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './start/build'),
  },

  // Currently we need to add '.ts' to the resolve.extensions array.
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },

  devtool: 'inline-source-map',

  // Add the loader for .ts files.
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
      },
    ],
  },
  plugins: [
    new CheckerPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Building a ticketing platform with Cargo',
    }),
  ],
};
