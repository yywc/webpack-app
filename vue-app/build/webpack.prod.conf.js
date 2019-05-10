const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { resolve } = require('./util');
const config = require('./webpack.base.conf');

const prodConfig = {
  bail: true, // 出现错误立即停止打包
  devtool: 'cheap-module-source-map', // 代码追踪
  plugins: [
    new CopyWebpackPlugin([
      {
        from: resolve('static'),
        to: resolve('dist/static'),
      },
    ]),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new OptimizeCSSAssetsPlugin(),
  ],
};

let webpackConfig = merge(config, prodConfig); // 默认 build 时的 config

// 用来在本地打包时分析，webpack-cli 启动时添加 --report 参数
// 不用该形式 webpack 会报错，该参数只用来此处判断，并无 webpack 相关作用
if (process.argv[process.argv.length - 1] === '--report') {
  const SpeedMeasurePlugin = require('speed-measure-webpack-plugin'); // 打包速度分析
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer'); // 打包体积分析
  const smp = new SpeedMeasurePlugin();
  prodConfig.plugins.push(new BundleAnalyzerPlugin()); // 会对 prodConfig 操作，不能提取出去
  webpackConfig = smp.wrap(merge(config, prodConfig));
}

module.exports = webpackConfig;
