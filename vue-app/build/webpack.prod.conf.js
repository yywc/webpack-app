const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { resolve } = require('./util');
const config = require('./webpack.base.conf');

// 用来在本地打包时分析，webpack-cli 启动时添加 --report 参数
// 不用该形式 webpack 会报错，该参数只用来此处判断，并无 webpack 相关作用
const getAnalyzerPlugin = () => {
  if (process.argv[process.argv.length - 1] === '--report') {
    return [new BundleAnalyzerPlugin()];
  }
  return [];
};

module.exports = merge(config, {
  bail: true, // 出现错误立即停止打包
  devtool: 'cheap-module-source-map', // 代码追踪
  plugins: [
    new CopyWebpackPlugin([
      {
        from: resolve('static'),
        to: resolve('dist/static'),
        ignore: ['.*'],
      },
    ]),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new OptimizeCSSAssetsPlugin(),
    ...getAnalyzerPlugin(),
  ],
});
