const webpack = require('webpack');
const merge = require('webpack-merge');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const baseConfig = require('./webpack.base.conf');

module.exports = merge(baseConfig, {
  mode: 'development',
  devServer: {
    hot: true, // 热更新
    quiet: true, // 关闭 webpack-dev-server 的提示，用 friendly-error-plugin
    clientLogLevel: 'warning', // 控制台提示信息级别是 warning 以上
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html', // 本地模板的位置
    }),
    new VueLoaderPlugin(),
    new FriendlyErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
});
