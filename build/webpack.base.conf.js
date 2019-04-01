const threadLoader = require('thread-loader');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const config = require('./config');
const { cssLoaders } = require('./utils');

threadLoader.warmup({
  // pool options, like passed to loader options
  // must match loader options to boot the correct pool
}, [
    // modules to load
    // can be any module, i. e.
    'babel-loader',
    'vue-loader',
  ]);

module.exports = {
  entry: {
    app: './src/main.js'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'], // 引入 js vue json 文件时可以不用写后缀名
    alias: {
      '@': config.resolve('src'), // 配置 @ 指向 src
    },
  },
  mode: process.env.NODE_ENV,
  devtool: config.devtool,
  module: {
    rules: [
      ...config.eslint,
      ...cssLoaders(),
      {
        test: /\.vue$/,
        use: [
          'thread-loader',
          {
            loader: 'vue-loader',
            options: {
              cacheBusting: true,
              transformToRequire: {
                video: ['src', 'poster'],
                source: 'src',
                img: 'src',
                image: 'xlink:href'
              }
            },
          }],
        include: [config.resolve('src')],
      },
      {
        test: /\.js$/,
        use: ['thread-loader', 'babel-loader?cacheDirectory=true'],
        include: [config.resolve('src')],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'images/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'images/[name].[hash:7].[ext]',
        }
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
}
