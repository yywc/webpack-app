const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const prod = process.env.NODE_ENV === 'production';

const getCssLoaders = () => {

  const vueStyleLoader = {
    loader: 'vue-style-loader',
  };

  const generateLoaders = (loaderName) => {
    const loaders = ['css-loader', 'postcss-loader'];

    if (loaderName) {
      loaders.push({
        loader: `${loaderName}-loader`
      });
    }
    if (prod) {
      loaders.unshift(MiniCssExtractPlugin.loader);
    }
    return [vueStyleLoader, ...loaders];
  };
  return {
    css: generateLoaders(),
    'styl(us)?': generateLoaders('stylus'),
  }
};

exports.cssLoaders = () => {
  const loaderArray = [];
  const loaders = getCssLoaders();
  for (const loaderName in loaders) {
    const loader = loaders[loaderName];
    loaderArray.push({
      test: new RegExp(`\\.${loaderName}$`),
      use: loader,
    });
  }
  return loaderArray;
};

exports.prod = prod;
