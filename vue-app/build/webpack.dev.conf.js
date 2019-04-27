const webpack = require('webpack');
const merge = require('webpack-merge');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const config = require('./webpack.base.conf');

module.exports = merge(config, {
  devtool: 'cheap-module-eval-source-map', // 代码追踪
  devServer: {
    hot: true, // 热更新
    port: 8080,
    open: true,
    quiet: true, // 关闭 webpack-dev-server 的提示，用 friendly-error-plugin
    overlay: true,
    host: 'localhost',
    clientLogLevel: 'warning', // 控制台提示信息级别是 warning 以上
  },
  plugins: [
    new FriendlyErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
});
