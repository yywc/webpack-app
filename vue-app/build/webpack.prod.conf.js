const path = require('path');
const merge = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const baseWebpackConfig = require('./webpack.base.conf');

module.exports = merge(baseWebpackConfig, {
  mode: 'production',
  devtool: 'cheap-module-source-map', // 代码追踪
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
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new OptimizeCSSAssetsPlugin(),
  ]
});
