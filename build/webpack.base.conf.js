const cssLoaders = require('./utils');
const config = require('./config');

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
      ...cssLoaders,
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: [config.resolve('src')],
        options: {
          cacheBusting: true,
          transformToRequire: {
            video: ['src', 'poster'],
            source: 'src',
            img: 'src',
            image: 'xlink:href'
          }
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [config.resolve('src')],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'images/[name].[hash:7].[ext]',
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'fonts/[name].[hash:7].[ext]',
        }
      },
    ],
  },
}
