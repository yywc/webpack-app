# 前言

webpack 的打包的过程会随着项目的增大以及对库的不正确引用导致编译速度过慢，打包体积过大的问题，这篇主要是针对 webpack4 的一些优化说明，当然也会夹杂一些 webpack3 的优化措施。

## 1. webpack4

大致的优化思路在思维导图中也已经举出了，这里就实战一下优化的步骤。最简单的当然是设置 mode 为对应的环境，webpack4 就会自动帮助我们做很多的优化措施了，下面是一些可以手动调整的部分。

### 1.1 thread-loader

官方的介绍是

> Runs the following loaders in a worker pool.

简单来说就说多开子进程（child_process）来帮助 loader 进行处理，来看看粗暴型一步配置。

注意此 loader 应该只用于耗时较大的 loader 处理，例如 babel-loader、vue-loader，同时运行在进程池中的 loader 是会有限制的，有三点要注意：

+ loader 无法生成文件。这条在后面的 cache-loader 时会提到
+ loader 不能使用 loader API
+ loader 不能获取 webpack 的 options

符合以上三点的 loader 要写在 thread-loader 的前面。

> npm install thread-loader --save-dev

```js
const os = require('os);
const threadLoader = require('thread-loader');

threadLoader.warmup(
  {
    workers: os.cpus().length - 1, // 进程数， 默认值
    workerParallelJobs: 50, // 子进程处理的最大事件数
    workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
    poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
    poolTimeout: 500, // 响应时间，过期杀死进程，默认值
    poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
  },
  ['babel-loader'], // 预加载耗时较大的 loader
);

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'thread-loader',
          'babel-loader' // babel-loader 会运行在进程池中
        ],
      },
    ],
  },
};
```

### 1.2 cache-loader

官方解释：

> The cache-loader allow to Caches the result of following loaders on disk (default) or in the database.

也就是能够缓存 loader 处理结果到磁盘或者数据库，我们简单从磁盘缓存来进行粗暴型一步设置。

在上面 `thread-loader` 代码里，我们修改一下：

```js
+ const path = require('path);

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
+          {
+            loader: 'cache-loader',
+            options: {
+              cacheDirectory: path.resolve(`.cache`), // 在当前目录下生成 .cache 目录，存放缓存记录
+            },
+          },
          'thread-loader',
+          // 注意这里就不能写在 thread-loader 后面，因为 cache-loader 需要生成 cache 文件，运行在 thread-loader 中无法生成文件
+          // {
+          //   loader: 'cache-loader',
+          //   options: {
+          //     cacheDirectory: path.resolve(`.cache`),
+          //   },
+          // },
          'babel-loader?cacheDirectory' // babel-loader 会运行在进程池中，babel-loader 本身也是支持缓存的
        ],
      },
    ],
  },
};
```

### 1.3 SplitChunksPlugin

SplitChunksPlugin 的前身是 CommonsChunkPlugin，是为了分割代码而存在的一个插件，可以根据我们的配置项，将代码分割成几个 chunk，从而减少首屏压力以及按需加载的 bundle 等问题。

wrting...

## 2. webpack3

上面针对的是 webpack4 的一些新特性以及仅 webpack4 支持的一些优化打包措施了，这里是 webpack3 的一些东西。

## 2.1 happypack

happypack 有点像 webpack4 里的 thread-loader，也是并行处理，达到构建更快的目的。

下面是简单使用，以 babel-loader 为例。

`npm install --save-dev happypack`

```js
const os = require('os);
const HappyPack = require('happypack');

const threadPool = HappyPack.ThreadPool({ size: os.cpus().length -1 });

module.exports = {
  module: {
    rules: [
      {
        test: /.js$/,
        use: 'happypack/loader?id=js',
      },
    ],
  },
  plugins: [
    new HappyPack(
      {
        loaders: [
          {
            id: 'js', // id，配置多个 loader 时区分
            threadPool, // 进程池
            loaders: ['babel-loader?cacheDirectory'] // 要使用的 loader
          },
        ],
      },
    ),
  ],
};
```

## 2.2 webpack-parallel-uglify-plugin

压缩 js 时通过多进程加速多入口项目的构建速度，在上面基础上进行修改

`npm install --save-dev webpack-parallel-uglify-plugin`

```js
const path = require('path);
+ const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

module.exports = {
  plugins: [
+    new ParallelUglifyPlugin({
+      cacheDir: path.resolve(__dirname, '.cache'), // 当前目录下生成 .cache 文件记录缓存
+      uglifyJS: {
+        output: {
+          beautify: false, // 不格式化
+          comments: false, // 不保留注释
+        },
+      },
+    }),
  ]
};
```

### 2.3 CommonsChunkPlugin

wrting...

## 3. 神奇的 DllPlugin

在初接触 webpack 的时候，随便打个包出来就是好几 MB 的，当时只会觉得有点大，但没想到这么~~~~大！，那么 DllPlugin 就可以帮助我们进行代码分割，将业务代码和库代码分离开，第一是可以减少 js 文件的体积，第二则可以提升用户体验，毕竟库代码不经常更新，可以长效缓存。

DllPlugin 要怎么使用呢？还需要配个一个 DllReferencePlugin 使用，这两个插件都是 webpack 自带，但是我们使用一个第三方库 dll-link-webpack-plugin 帮助我们更友好地使用。

`npm install --save-dev dll-link-webpack-plugin`

我们新建一个 webpack.dll.conf.js 文件：

```js
const path = require('path);
const webpack = require('webpack');
const { dependencies } = require('../package');

const vendors = Object.keys(dependencies); // 从 package.json 里获取所有的开发环境依赖名
const excludeVendors = ['@babel/polyfill']; // 不打包进 vendor 的依赖，例如一些在某些模块里按需加载的

// 排除掉不打包进 vendor 的依赖
excludeVendors.forEach((dep) => {
  const index = vendors.indexOf(dep);
  if (index > -1) {
    vendors.splice(index, 1);
  }
});

module.exports = {
  mode: process.env.NODE_ENV, // 启动时请配置 NODE_ENV 参数
  entry: {
    vendor: vendors, // 要打包的 vendor
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[hash].js',
    library: '[name]', // 这里是在 script 引入时使用到的，具体请看思维导图
  },
  plugins: [
    // 调用 DllPlugin
    new webpack.DllPlugin({
      path: resolve('dist/[name]-manifest'), // manifest 文件
      name: '[name]',
    }),
  ],
};
```

在 webpack.base.conf.js 文件中引用就可以了

```js
const DllLinkPlugin = require('dll-link-webpack-plugin');

module.exports = {
  plugins: [
    new DllLinkPlugin({
      htmlMode: true, // 当使用 html-webpack-plugin 时设置 true，会自动注入
      config: require('./webpack.dll.conf.js'),
    }),
  ],
};
```
