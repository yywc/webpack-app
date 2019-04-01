const path = require('path');
const merge = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const baseWebpackConfig = require('./webpack.base.conf');

module.exports = merge(baseWebpackConfig, {
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'js/[name].[chunkhash].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html', // 本地模板的位置
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
    }),
    new CopyPlugin([
      { from: 'static', to: 'static' },
    ]),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new OptimizeCSSAssetsPlugin(),
    new BundleAnalyzerPlugin(),
    new CompressionPlugin({
      test: new RegExp('\\.(js|css)$'),
      threshold: 10240,
    })
  ],
});
