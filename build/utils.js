const CssExtractLoader = require("mini-css-extract-plugin").loader;
const config = require('./config');

exports.getCssLoaders = () => {
  const generateLoaders = (loaderName) => {
    const baseLoaders = ['css-loader', 'postcss-loader'];
    if (loaderName) {
      baseLoaders.push(`${loaderName}-loader`);
    }
    if (config.prod) {
      baseLoaders.unshift(CssExtractLoader);
    }
    return ['vue-style-loader', ...baseLoaders];
  };
  return {
    css: generateLoaders(),
    'styl(us)?': generateLoaders('stylus'),
  }
};

exports.cssLoaders = () => {
  const loaderArray = [];
  const loaders = exports.getCssLoaders();
  for (const loaderName in loaders) {
    loaderArray.push({
      test: new RegExp(`\\.${loaderName}$`),
      use: loaders[loaderName],
    });
  }
  return loaderArray;
};
