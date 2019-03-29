const CssExtractLoader = require("mini-css-extract-plugin").loader;
const config = require('./config');

const getCssLoaders = () => {
  const vueStyleLoader = {
    loader: 'vue-style-loader',
  };
  const generateLoaders = (loaderName) => {
    const baseLoaders = ['css-loader', 'postcss-loader'];
    if (loaderName) {
      baseLoaders.push({
        loader: `${loaderName}-loader`
      });
    }
    if (config.prod) {
      baseLoaders.unshift(CssExtractLoader);
    }
    return [vueStyleLoader, ...baseLoaders];
  };
  return {
    css: generateLoaders(),
    'styl(us)?': generateLoaders('stylus'),
  }
};

const loaderArray = [];

const loaders = getCssLoaders();

for (const loaderName in loaders) {
  const loader = loaders[loaderName];
  loaderArray.push({
    test: new RegExp(`\\.${loaderName}$`),
    use: loader,
  });
}

module.exports = loaderArray;
