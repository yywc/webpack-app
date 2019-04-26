const path = require('path');
const CssExtractLoader = require('mini-css-extract-plugin').loader;

// 路径处理函数
const resolve = dir => path.resolve(__dirname, '../', dir);

// 环境判断
const IS_PROD = process.env.NODE_ENV === 'production';

// eslint 配置
const getEslintRules = () => {
  let eslint = [];
  if (!IS_PROD) {
    eslint = [{
      test: /\.(js|vue)$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      include: resolve('src'),
      options: {
        formatter: require('eslint-friendly-formatter'),
        emitWarning: true,
      },
    }];
  }
  return eslint;
};

// css loader 配置
const cssLoaders = () => {
  const generateCssLoaders = (loaderName) => {
    const baseLoader = IS_PROD
      ? ['css-loader', 'postcss-loader']
      : ['css-loader'];
    if (loaderName) {
      baseLoader.push(`${loaderName}-loader`);
    }
    if (IS_PROD) {
      baseLoader.unshift(CssExtractLoader);
    }
    return ['style-loader', ...baseLoader];
  };
  const loaderObj = {
    css: generateCssLoaders(),
    'styl(us)?': generateCssLoaders('stylus'),
  };
  const loaders = [];
  for (const name in loaderObj) {
    loaders.push({
      test: new RegExp(`\\.${name}$`),
      use: loaderObj[name],
    });
  }
  return loaders;
};

module.exports = {
  IS_PROD,
  resolve,
  eslint: getEslintRules(),
  cssLoaders: cssLoaders(),
};
