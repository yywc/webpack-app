# 前言

经过前两次分别对开发环境以及生产环境的配置，我们也能看出来有很多部分都是相同的，除了一些环境配置，这篇主要是进行一些合并操作。

## git merge

切换分支到 master，然后 git merge production，冲突都保留。然后一个个来进行调整。

### package.json

既然需要合并，那么一些配置肯定也是会公用，通过在 package.json 中设置 node 的环境变量来区分打包环境。安装 cross-env 依赖，这个可以解决 *nix 和 windows 下设置的差异。
设置 engines 来说明 node 和 npm 的版本，设置 browserslist 来给一些插件提供浏览器环境信息。
总体修改内容如下。

```json
+ "scripts": {
+   "+": "echo \"Error: no test specified\" && exit 1",
+   "dev": "cross-env NODE_ENV=development + webpack-dev-server --progress --config build/+ webpack.dev.conf.js",
+   "build": "cross-env NODE_ENV=production webpack + --progress --config build/webpack.prod.conf.js",
+   "start": "node ./server.js"
+ },
+ "engines": {
+     "node": ">= 8.0.0",
+     "npm": ">= 5.0.0"
+   },
+ "browserslist": [
+   "> 1%",
+   "last 2 versions",
+   "not ie <= 8"
+ ]
```

start 是用来启动生产环境打包后的静态资源。

### webpack 公用部分

从之前的两次配置中也能看出来，在 webpack.base.conf.js 文件中主要是 css 相关的 loader 和 eslint 校验需要通过环境来区分。

eslint 校验可以直接提取出来通过 process.env.NODE_ENV 来判断是否要采用。而 css 相关的 loader 直接模仿 vue-cli 新建一个 utils.js 以及 config 文件来做一些公用的但受限于环境的操作。

#### config.js

```js
const path = require('path');

// 当前打包环境
const prod = process.env.NODE_ENV === 'production';

// 路径处理
const resolve = function (dir) {
  return path.join(__dirname, '..', dir);
}

// eslint 校验
const eslintRule = {
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: true,
  }
}

// 代码追踪
const devtool = prod ? 'cheap-module-eval-source-map' : 'source-map';

module.exports = {
  prod,
  devtool,
  resolve,
  eslint: prod ? [eslintRule] : [],
};
```

#### utils.js

```js
// 引入抽取 css 的 loader
const CssExtractLoader = require("mini-css-extract-plugin").loader;
// 引入配置
const config = require('./config');

// 获取 css 相关 loader 名称对象的函数
const getCssLoaders = () => {
  const vueStyleLoader = {
    loader: 'vue-style-loader',
  };
  // 传入 loader 名称，根据环境变量来获得不同环境下的 loader 数组
  const generateLoaders = (loadName) => {
    const baseLoaders = ['css-loader', 'postcss-loader']; // postcss-loader 可以帮助我们做很多事情，这里主要会用到 autoprefixer 来帮我们添加浏览器前缀。
    // 如果有名称则创建一个该名称的 loader 来解析，例如 scss、less、stylus
    if (loadName) {
      baseLoaders.push({
        loader: `${loaderName}-loader`
      });
    }
    // 如果是生产环境，则需要 CssExtractLoader 来提取 css，注意 loader 的加载顺序，这里要放置在前面
    if (config.prod) {
      baseLoaders.unshift(CssExtractLoader);
    }
    // 返回一个 loader 数组，将 vue-style-loader 插入到数组最前面来解析
    return [vueStyleLoader, ...baseLoaders];
  }
  // 返回我们需要的 loader 对象
  return {
    css: generateLoaders(), // 基础的 vue-style-loader、css-loader、postcss-loader 就可以了，不用传 loader 名。
    // 在基础上要多加一个 stylus-loader，至于对象名为什么要这么写
    // 是因为在后面生成 webpack 的 rules 时，可以帮我们方便的创建 test 的正则表达式规则。
    'styl(us)?': generateLoaders('stylus'),
  };
};

const loaderArray = []; // 存放所有 loader 的数组
const loaders = getCssLoaders(); // 获取所有的 loader 名称的对象
for (const loaderName in loaders) {
  const loader = loaders[loaderName];
  // 生成完整的 loader 并存入数组
  loaderArray.push({
    test: new RegExp(`\\.${loaderName}$`), // 例如 /\.sty(us)?$/
    use: loader,
  });
}

module.exports = loaderArray;
```

这里有两个点需要补充一下。

+ postcss-loader + autoprefixer 帮助我们给 css 属性添加浏览器前缀。`npm i -D postcss-loader autoprefixer`，然后在项目根目录添加 postcss.config.js 文件，内容如下：

  ```js
  module.exports = {
    plugins: [
      require('autoprefixer')
    ]
  }
  ```

+ css 相关 loader 的作用以及顺序:

  loader 的执行顺序是从下往上，从右往左的。所以 loader 的顺序依次是 postcss-loader 进行最开始的处理，通过 autoprefixer 添加了浏览器前缀，(然后通过 stylus-loader 进行预处理成 css)，css-loader 解析 css 文件，最后通过 vue-style-loader/style-loader 挂载到 html 文件的头部。

#### webpack.base.conf.js

将 resolve 函数修改为 config.resolve，将一些需要根据环境的部分代码删除，然后添加我们新增的部分。

```js
+ const cssLoaders = require('./utils');
+ const config = require('./config');

module.exports = {
+  devtool: config.devtool,
+  mode: process.env.NODE_ENV, // 将 mode 移入到 base 文件，通过启动 webpack 时的环境变量自动设置
  module: {
    rules: [
+      ...config.eslint, // 用数组解构，当为生产环境时不会有副作用
+      ...cssLoaders, // css 相关的所有 loader
    ],
  },
};
```
