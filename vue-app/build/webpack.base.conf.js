const VueLoaderPlugin = require('vue-loader/lib/plugin');
const util = require('./util');

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    app: './src/main.js',
  },
  output: {
    path: util.resolve('dist'),
    filename: 'js/[name].[hash].js',
    chunkFilename: 'js/[id].[chunkhash].js',
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'], // 引入 js vue json 文件时可以不用写后缀名
    alias: {
      vue$: 'vue/dist/vue.runtime.esm.js',
      '@': util.resolve('src'), // 配置 @ 指向 src
    },
  },
  module: {
    rules: [
      ...util.eslint, // eslint 配置
      ...util.cssLoaders, // css loader 配置
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          cacheBusting: true,
          transformToRequire: { // 将 template 里所有资源 url 转换为 webpack 模块请求
            video: ['src', 'poster'],
            source: 'src',
            img: 'src',
            image: 'xlink:href',
          },
        },
        include: util.resolve('src'),
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: util.resolve('src'),
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'images/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'media/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: 'fonts/[name].[hash:7].[ext]',
        },
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
  stats: {
    children: false, // 避免过多子信息
  },
};
