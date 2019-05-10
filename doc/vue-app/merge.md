# 前言

经过前两次分别对开发环境以及生产环境的配置，我们也能看出来有很多部分都是相同的，除了一些环境配置，这篇主要是进行一些合并操作。

## 1. git merge

切换分支到 master，然后 git merge production，冲突都保留。然后一个个来进行调整。

### 1.1 package.json

既然需要合并，那么一些配置肯定也是会公用，通过在 package.json 中设置 node 的环境变量来区分打包环境。安装 cross-env 依赖，这个可以解决 *nix 和 windows 下设置的差异。
修改内容如下。

```json
+ "scripts": {
+   "+": "echo \"Error: no test specified\" && exit 1",
+   "dev": "cross-env NODE_ENV=development + webpack-dev-server --progress --config build/+ webpack.dev.conf.js",
+   "build": "cross-env NODE_ENV=production webpack + --progress --config build/webpack.prod.conf.js",
+   "start": "node ./server.js"
+ }
```

start 是用来启动生产环境打包后的静态资源。

### 1.2 webpack 公用部分

从之前的两次配置中也能看出来，在 webpack.base.conf.js 文件中主要是 css 相关的 loader 和 eslint 校验需要通过环境来区分。

eslint 校验可以直接提取出来通过 process.env.NODE_ENV 来判断是否要采用。而 css 相关的 loader 直接模仿 vue-cli 新建一个 util.js 做一些公用的但受限于环境的操作。

#### 1.2.1 util.js

```js
const path = require('path');
// 引入抽取 css 的 loader
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
        formatter: require('eslint-friendly-formatter'), // eslint 友好提示
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
      ? ['css-loader', 'postcss-loader'] // 生产环境使用 postcss-loader 进行后处理
      : ['css-loader'];
    // 如果有名称则创建一个该名称的 loader 来解析，例如 scss、less、stylus
    if (loaderName) {
      baseLoader.push(`${loaderName}-loader`);
    }
    // 如果是生产环境就引入提取 css 的 loader
    if (IS_PROD) {
      baseLoader.unshift(CssExtractLoader);
    }
    // style-loader 在最前，插入到 html 里
    return ['style-loader', ...baseLoader];
  };
  const loaderObj = {
    css: generateCssLoaders(), // 开发环境生成 ['style-loader', 'css-loader']
    'styl(us)?': generateCssLoaders('stylus'), // 开发环境生成 ['style-loader', 'css-loader', 'stylus-loader']
  };
  const loaders = [];
  // 生成带 test 的完整 rule
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
```

css 相关 loader 的作用以及顺序:

  loader 的执行顺序是从下往上，从右往左的。所以 loader 的顺序依次是 postcss-loader 进行最开始的处理，通过 autoprefixer 添加了浏览器前缀，(然后通过 stylus-loader 进行预处理成 css)，css-loader 解析 css 文件，最后通过 style-loader 挂载到 html 文件的头部。

#### 1.2.2 webpack.base.conf.js

将 resolve 函数修改为 util.resolve，将一些需要根据环境的部分代码删除，添加我们新增的部分。
将 VueLoaderPlugin、mode 等提取到此处，然后从 dev、prod 文件中删掉对应的部分。

```js
- const path = require('path');
- const MiniCssExtractPlugin = require("mini-css-extract-plugin");
+ const util = require('./util');
+ const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
+  mode: process.env.NODE_ENV, // 将 mode 移入到 base 文件，通过启动 webpack 时的环境变量自动设置
+  output: {
+    path: util.resolve('dist'),
+    filename: 'js/[name].[hash].js',
+    chunkFilename: 'js/[id].[chunkhash].js',
+  },
  module: {
    rules: [
+      ...util.eslint, // eslint 配置
+      ...util.cssLoaders, // css loader 配置
-      {
-        test: /\.css$/,
-        use: [
-          'style-loader',
-          {
-            loader: MiniCssExtractPlugin.loader,
-          },
-          'css-loader',
-          'postcss-loader',
-        ],
-      },
-      {
-        test: /\.styl(us)?$/,
-        use: [
-          'style-loader',
-          {
-            loader: MiniCssExtractPlugin.loader,
-          },
-          'css-loader',
-          'postcss-loader',
-          'stylus-loader',
-        ],
-      },
+      {
+        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
+        loader: 'url-loader',
+        options: {
+          limit: 10240,
+          name: 'media/[name].[hash:7].[ext]',
+        },
+      }, // 多媒体文件处理
    ],
  },
+  plugins: [
+    new VueLoaderPlugin(),
+  ],
+  stats: {
+    children: false, // 避免过多子信息
+  },
};
```

### 1.2.3 webpack.dev.conf.js

移除 mode 以及 plugin 里的一些东西

```js
- const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = merge(config, {
-  mode: 'development',
  plugins: [
-    new VueLoaderPlugin(),
  ],
});
```

#### 1.2.4 webpack.prod.conf.js

添加 `bail: true` 到配置文件，出现错误立即停止打包。

然后修改一下 CopyWebpackPlugin 的复制路径：

```js
- const VueLoaderPlugin = require('vue-loader/lib/plugin');
- const path = require('path');
+ const { resolve } = require('./util');

module.exports = merge(config, {
+   bail: true,
-   mode: 'production',
-   output: {
-     path: path.join(__dirname, '../dist'),
-     filename: 'js/[name].[chunkhash].js',
-   },
    new CopyWebpackPlugin([
-     { from: 'static', to: 'static' },
+     {
+       from: resolve('static'),
+       to: resolve('dist/static'),
+    },
    ]),
-   new VueLoaderPlugin(),
};
```

## 2. 优化

在合并代码，解决冲突后，我们可以利用上 thread-loader、cache-loader 等优化工具了，这里要注意的是，loader 本身也会消耗性能，在实际项目中要根据项目大小以及实际打包结果来使用，切忌无脑上 loader 和 plugin 等操作。这里主要是做说明，所以都会使用到。

### 2.1 thread-loader

首先安装 thead-loader，`npm install --save-dev thread-loader`，然后打开 webpack.base.conf.js 文件，新增修改如下代码：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              name: 'cache-babel', // 池(pool)的名称，可以修改name设置其他选项都一样的池
              workers: require('os').cpus().length - 1, // 进程数， 默认值
              workerParallelJobs: 50, // 子进程处理的最大事件数
              workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
              poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
              poolTimeout: 500, // 响应时间，过期杀死进程，默认值
              poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
            },
          }, // thread-loader
          'babel-loader?cacheDirectory',
        ],
        include: util.resolve('src'),
      },
      {
        test: /\.vue$/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              name: 'cache-vue', // 池(pool)的名称，可以修改name设置其他选项都一样的池
              workers: require('os').cpus().length - 1, // 进程数， 默认值
              workerParallelJobs: 50, // 子进程处理的最大事件数
              workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
              poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
              poolTimeout: 500, // 响应时间，过期杀死进程，默认值
              poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
            },
          }, // thread-loader
          {
            loader: 'vue-loader',
            // vue-loader 的一些配置，将模板里 url 资源都当成模块来打包
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
    ],
  },
};
```

### 2.2 cache-loader

cache-loader 主要的作用是将我们 loader 的处理缓存下来，帮助提升构建速度，使用也很简单，先 `npm install -save-dev cache-loader`。

打开 webpack.base.conf.js，在上面 thread-loader 的基础上，我们再修改一些即可：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
+          {
+            loader: 'cache-loader',
+            options: {
+              cacheDirectory: resolve(`.cache/cache-babel`), // 缓存文件目录，由于会生成文件，所以要在 thread-loader 后执行
+            },
+          }, // cache-loader
          {
            loader: 'thread-loader',
            options: {
              name: 'cache-babel', // 池(pool)的名称，可以修改name设置其他选项都一样的池
              workers: require('os').cpus().length - 1, // 进程数， 默认值
              workerParallelJobs: 50, // 子进程处理的最大事件数
              workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
              poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
              poolTimeout: 500, // 响应时间，过期杀死进程，默认值
              poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
            },
          }, // thread-loader
          'babel-loader?cacheDirectory',
        ],
        include: util.resolve('src'),
      },
      {
        test: /\.vue$/,
        use: [
+          {
+            loader: 'cache-loader',
+            options: {
+              cacheDirectory: resolve(`.cache/cache-vue`), // 缓存文件目录，由于会生成文件，所以要在 thread-loader 后执行
+            },
+          }, // cache-loader
          {
            loader: 'thread-loader',
            options: {
              name: 'cache-vue', // 池(pool)的名称，可以修改name设置其他选项都一样的池
              workers: require('os').cpus().length - 1, // 进程数， 默认值
              workerParallelJobs: 50, // 子进程处理的最大事件数
              workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
              poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
              poolTimeout: 500, // 响应时间，过期杀死进程，默认值
              poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
            },
          }, // thread-loader
          {
            loader: 'vue-loader',
            // vue-loader 的一些配置，将模板里 url 资源都当成模块来打包
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
    ],
  },
};
```

### 2.3 DllPlugin 打包第三方库

普通打包下来，业务代码和第三方库打包在一起不仅导致 js 文件巨大，同时也让每次发版都会让用户更新不常更新的库代码，降低了缓存的利用率。所以通过 DllPlugin 来单独打包第三方的库，帮助我们在浏览器中长效缓存下来。

新建 webpack.dll.conf.js，内容如下：

```js
const webpack = require('webpack');
const { dependencies } = require('../package');
const { resolve } = require('./util');

const vendors = Object.keys(dependencies); // 从 package.json 里获取开发环境的依赖包
const excludeVendors = ['@babel/polyfill']; // 不打包进 vendor 的依赖

excludeVendors.forEach((dep) => {
  const index = vendors.indexOf(dep);
  if (index > -1) {
    vendors.splice(index, 1); // 逐个移除不需要打包的依赖
  }
});

module.exports = {
  mode: process.env.NODE_ENV, // 根据 mode 进行打包
  entry: {
    vendor: vendors, // 需要打包的依赖和打包后名称
  },
  output: {
    path: resolve('dist'),
    filename: 'js/[name].[hash].js',
    library: '[name]', // 通过 script 标签引用时需要
  },
  plugins: [
    new webpack.DllPlugin({ // 调用 DllPlugin
      path: resolve('dist/[name]-manifest'),
      name: '[name]',
    }),
  ],
};
```

然后在 webpack.base.conf.js 文件中引用，同时我们需要一个 DllLinkWebpackPlugin 来辅助，`npm install --save-dev dll-link-webpack-plugin`

```js
+ const DllLinkPlugin = require('dll-link-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    // ...
+    new DllLinkPlugin({
+      htmlMode: true,
+      config: require('./webpack.dll.conf.js'),
+    }),
  ],
};
```

由于我们在 base 里先生成了 dll 第三方库，在 prod 里执行 CleanWebpackPlugin 的时候会删除 dist 目录，所以我们要把 CleanWebpackPlugin 移到 base 里来，同时还有 HtmlWebpackPlugin，之后再修改 webpack.prod.conf.js。

webpack.base.conf.js 新增内容如下：

```js
+ const HtmlWebpackPlugin = require('html-webpack-plugin');
+ const CleanWebpackPlugin = require('clean-webpack-plugin');

// 由于 dll 打包，这两个插件要写在 base 里，所以根据环境来判断
+ const alternativePlugin = () => (
+   util.IS_PROD
+     ? [
+       new CleanWebpackPlugin(),
+       new HtmlWebpackPlugin({
+         template: 'index.html',
+         minify: {
+           removeComments: true,
+           collapseWhitespace: true,
+           removeAttributeQuotes: true,
+         },
+       }),
+     ]
+     : [
+       new HtmlWebpackPlugin({
+         template: 'index.html',
+       }),
+     ]
+ );

module.exports = {
  // ...
  plugins: [
+    ...alternativePlugin(),
    // ...
  ],
};
```

补充：这里我们添加 `speed-measure-webpack-plugin` 和 `webpack-bundle-analyzer` 包，通过 `npm run build-report` 命令启动分析型打包，build 则只打包，不进行相关分析，先在 `package.json` 中添加 build-report 命令：

> "build-report": "npm run build -- --progress --color --report", // 这里的 report 只是我们定义的一个变量，与 webpack 无关

webpack.prod.conf.js 修改成以下内容

```js
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { resolve } = require('./util');
const config = require('./webpack.base.conf');

const prodConfig = {
  bail: true, // 出现错误立即停止打包
  devtool: 'cheap-module-source-map', // 代码追踪
  plugins: [
    new CopyWebpackPlugin([
      {
        from: resolve('static'),
        to: resolve('dist/static'),
      },
    ]),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new OptimizeCSSAssetsPlugin(),
  ],
};

let webpackConfig = merge(config, prodConfig); // 默认 build 时的 config

// 用来在本地打包时分析，webpack-cli 启动时添加 --report 参数
// 不用该形式 webpack 会报错，该参数只用来此处判断，并无 webpack 相关作用
if (process.argv[process.argv.length - 1] === '--report') {
  const SpeedMeasurePlugin = require('speed-measure-webpack-plugin'); // 打包速度分析
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer'); // 打包体积分析
  const smp = new SpeedMeasurePlugin();
  prodConfig.plugins.push(new BundleAnalyzerPlugin()); // 会对 prodConfig 操作，不能提取出去
  webpackConfig = smp.wrap(merge(config, prodConfig));
}

module.exports = webpackConfig;
```

顺便也把 loader 部分也提取出来一下，主要是 cache-loader 和 thread-loader。

util.js 文件中新增一个 optimizeLoaders 变量，然后导出：

```js
// 缓存配置，优化打包速度
const optimizeLoaders = dir => [
  {
    loader: 'cache-loader',
    options: {
      cacheDirectory: resolve(`.cache/${dir}`),
    },
  },
  {
    loader: 'thread-loader',
    options: {
      name: dir,
      workers: require('os').cpus().length - 1,
      workerParallelJobs: 50,
      workerNodeArgs: ['--max-old-space-size=1024'],
      poolRespawn: !!IS_PROD,
      poolTimeout: 2000,
      poolParallelJobs: 50,
    },
  },
];

module.exports = {
  //...
  optimizeLoaders,
};
```

然后在 webpack.base.conf.js 中替换原来的部分：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
+          {
+            loader: 'cache-loader',
+            options: {
+              cacheDirectory: resolve(`.cache/cache-babel`), // 缓存文件目录，由于会生成文件，所以要在 thread-loader 后执行
+            },
+          },
-          {
-            loader: 'thread-loader',
-            options: {
-              name: 'cache-babel', // 池(pool)的名称，可以修改name设置其他选项都一样的池
-              workers: require('os').cpus().length - 1, // 进程数， 默认值
-              workerParallelJobs: 50, // 子进程处理的最大事件数
-              workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
-              poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
-              poolTimeout: 500, // 响应时间，过期杀死进程，默认值
-              poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
-            },
-          },
+          ...util.optimizeLoaders('cache-babel'), // cache-loader 与 thread-loader
          'babel-loader?cacheDirectory',
        ],
        include: util.resolve('src'),
      },
      {
        test: /\.vue$/,
        use: [
+          {
+            loader: 'cache-loader',
+            options: {
+              cacheDirectory: resolve(`.cache/cache-vue`), // 缓存文件目录，由于会生成文件，所以要在 thread-loader 后执行
+            },
+          },
-          {
-            loader: 'thread-loader',
-            options: {
-              name: 'cache-vue', // 池(pool)的名称，可以修改name设置其他选项都一样的池
-              workers: require('os').cpus().length - 1, // 进程数， 默认值
-              workerParallelJobs: 50, // 子进程处理的最大事件数
-              workerNodeArgs: ['--max-old-space-size=1024'], // 传递给 node.js 的参数，默认值
-              poolRespawn: false, // 重启挂了的进程，默认值，生产环境可设置 true
-              poolTimeout: 500, // 响应时间，过期杀死进程，默认值
-              poolParallelJobs: 200, // 分配给子进程的最大事件数，值越小越低效，但是分配更均匀
-            },
-          },
+          ...util.optimizeLoaders('cache-vue'), // cache-loader 与 thread-loader
          {
            loader: 'vue-loader',
            // vue-loader 的一些配置，将模板里 url 资源都当成模块来打包
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
    ],
  },
};
```

最后这样就完成了一个 vue 项目从无到有的开发配置了，以后有更多的内容会继续补充。
