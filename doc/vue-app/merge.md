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
将 VueLoaderPlugin 提取到此处，然后从 dev、prod 文件中删掉对应的部分。

```js
+ const util = require('./util');
+ const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
+  mode: process.env.NODE_ENV, // 将 mode 移入到 base 文件，通过启动 webpack 时的环境变量自动设置
  module: {
    rules: [
+      ...util.eslint, // eslint 配置
+      ...util.cssLoaders, // css loader 配置
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

#### 1.2.3 webpack.base.prod.js

添加 `bail: true` 到配置文件，出现错误立即停止打包。
