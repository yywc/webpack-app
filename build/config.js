const path = require('path');

const prod = process.env.NODE_ENV === 'production';

const resolve = function (dir) {
  return path.join(__dirname, '..', dir);
}

// eslint 校验
const eslintRule = {
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: true,
  }
}

const devtool = prod ? 'cheap-module-eval-source-map' : 'source-map';

module.exports = {
  prod,
  devtool,
  resolve,
  eslint: prod ? [eslintRule] : [],
};
