const webpack = require('webpack');
const { dependencies } = require('../package');
const { resolve } = require('./util');

const vendors = Object.keys(dependencies);
const excludeVendors = ['@babel/polyfill']; // 不打包进 vendor 的依赖

excludeVendors.forEach((dep) => {
  const index = vendors.indexOf(dep);
  if (index > -1) {
    vendors.splice(index, 1);
  }
});

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    vendor: vendors,
  },
  output: {
    path: resolve('dist'),
    filename: 'js/[name].[hash].js',
    library: '[name]',
  },
  plugins: [
    new webpack.DllPlugin({
      path: resolve('dist/[name]-manifest'),
      name: '[name]',
    }),
  ],
};
