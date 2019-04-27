const DllLinkPlugin = require('dll-link-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const util = require('./util');

// 初始化 thread-loader 的配置
util.cache.init();

// 由于 dll 打包，这两个插件要写在 base 里，所以根据环境来判断
const alternativePlugin = () => (
  util.IS_PROD
    ? [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: 'index.html',
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        },
      }),
    ]
    : [
      new HtmlWebpackPlugin({
        template: 'index.html',
      }),
    ]
);

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
        test: /\.js$/,
        use: [
          ...util.cache.getLoaders('cache-babel'), // cache-loader 与 thread-loader
          'babel-loader?cacheDirectory',
        ],
        include: util.resolve('src'),
      },
      {
        test: /\.vue$/,
        use: [
          ...util.cache.getLoaders('cache-vue'), // cache-loader 与 thread-loader
          {
            loader: 'vue-loader',
            options: {
              cacheBusting: true,
              transformToRequire: {
                video: ['src', 'poster'],
                source: 'src',
                img: 'src',
                image: 'xlink:href',
              },
            },
          },
        ],
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
    ...alternativePlugin(),
    new DllLinkPlugin({
      htmlMode: true,
      config: require('./webpack.dll.conf.js'),
    }),
    new VueLoaderPlugin(),
  ],
  stats: {
    children: false, // 避免过多子信息
  },
};
