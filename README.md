# 前言

自从有了 vue-cli 就没有动手配置过 webpack 的一些配置，除了添加一些 loader 外。一键生成确实很方便，但同时我们也要知道 vue-cli 的作者在背后帮助我们做了哪些事情，这篇文章就是从零开始搭建一个 vue 的开发环境。

# 准备工作

webpack 配置前的一些准备工作，先想想我们需要哪些包，采用 stylus 预处理器。

+ vue、vue-router
+ webpack、webpack-dev-server、css-loader、stylus-loader、stylus

```
> npm init // 初始化 npm 项目
> npm i -D webpack webpack-dev-server css-loader stylus-loader stylus // 安装开发环境依赖
> npm i vue vue-router --save // 安装生产环境依赖
```

依照下面目录结构创建文件夹及相关文件

```
|-- build
    |-- webpack.base.conf.js
    |-- webpack.dev.conf.js
|-- src
    |-- assets
    |   |-- fonts // 下载一套 iconfont 到此处
    |   |-- images
    |   |   |-- icon.jpg // 随便什么图片，做演示
    |   |-- stylus
    |   |   |-- icon.styl // 将 icon
    |   |   |-- index.styl
    |-- components
    |   |-- HelloWorld.vue
    |-- router
    |   |-- index.js
    |-- App.vue
    |-- main.js
|-- static
    |--avatar.jpg // 随便什么图片，做演示
|-- index.html
```

# Vue 相关文件编写

## index.html

首先从最简单的 index.html 开始，通过 vscode 打开，输入 ! + tab，自动生成一个 html 模板，只需要在里面添加一个 id 为 app 的 div 元素即可。

```
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible"
        content="ie=edge">
  <title>Webpack Demo</title>
</head>

<body>
  <div id="app">Hello Vue!</div>
</body>

</html>
```

## src 目录下文件编写

这部分也很简单，有过 vue 开发经验的同学都知道，所以就直接列出来好了。

### App.vue 文件
```
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {};
  },
};
</script>
```

### main.js 文件
```
import Vue from 'vue';
import App from './App';
import router from './router';
import '@/assets/stylus/index.styl'; // 要在 webpack 里配置 @ 符号的，先这样写

Vue.config.productionTip = false;

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  render: h => h(App), // 这里用 Runtime Only 版本的 vue
});
```
### components/HelloWorld.vue 文件
```
<template>
  <div>
    <p>{{ msg }}</p>
    <img :src="icon"
         alt="icon"
         style="width: 64px;">
    <i class="iconfont icon-spades" />
    <img src="/static/avatar.jpg"
         alt="icon"
         style="display: block;width: 128px;">
  </div>
</template>

<script>
import icon from '@/assets/images/icon.jpg';

export default {
  name: 'HelloWorld',
  data() {
    return {
      icon,
      msg: '',
    };
  },
  created() {
    this.getMsg();
  },
  methods: {
    getMsg() {
      setTimeout(() => {
        this.msg = 'Hello World!';
      }, 17);
    },
  },
};
</script>

<style lang="stylus" scoped>
p
  color: red
</style>
```
### router/index.js 文件
```
import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

// 异步加载模块
const HelloWorld = async (resolve) => {
  const module = await import('@/components/HelloWorld')
    // eslint-disable-next-line no-console
    .catch(e => console.error(`模块加载错误: ${e}`));
  resolve(module);
};

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld,
    },
  ],
});
```
### assets/index.styl 文件

这是一个入口文件，需要引入其他的 stylus 文件给 main.js 统一引入。内容可以随便写，这里只是用来做一个效果展示。

```
@import "./icon.styl";

*
  margin: 0
  padding: 0
  background: #f5f5f5

.hello
  padding: 10px
  font-size: 24px
  border: 1px solid;

```

这样一来 vue 相关的文件已经写好了，如果是 vue-cli 脚手架生成的话，直接 npm run dev 就可以跑起来看到效果了。我们要自己启动还需要一些 webpack 部分的编写。

# Webpack 部分

在此之前呢，我们先试试启动一下 webpack-dev-server。

在 package.json 文件 的 scripts 中，添加一个命令。

    "dev": "webpack-dev-server"

然后 npm run dev 试试，发现控制台报错，需要安装 webpack-cli，那么我们安装一下。

    > npm i -D webpack-cli

紧接着再 npm run dev 一下，发现控制台还是会有红色报出，但是打开浏览器已经可以通过 localhost:8080 看到我们之前写的 index.html 页面了。但是问题来了，我们怎么把 vue 相关的显示到这里来呢？，那么就需要 webpack 配置文件上场了。

## webpack.base.conf.js

这里是 webpack 基础配置的文件， webpack.dev.conf.js、webpack.prod.conf.js 来针对开发环境、生产环境做相应的配置，这里我们先只做开发环境的，但还是先这样区分开来。

在编写之前，我们先完善一下 package.json 中的命令，之前我们写了一个 "dev": "webpack-dev-server"，现在改为如下：

```
"scripts": {
  ... // 其他的命令
-  "dev": "webpack-dev-server",
    // --progress 是表示显示打包进度， --config 是指定配置文件
+  "dev": "webpack-dev-server --progress --config build/webpack.dev.conf.js",
}
```

那么现在开始编写 webpack.base.conf.js 文件。在 base 文件中，我们只需要配置 webpack 的入口，解析以及模块就够了。像插件以及其他一些配置项根据环境不同，配置也就不同，所以就不用再 base 文件中体现了。

webpack.base.conf.js 文件
```
const path = require('path');

// 路径处理函数
const resolve = dir => path.join(__dirname, '..', dir);

module.exports = {
  entry: {
    app: './src/main.js'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'], // 引入 js vue json 文件时可以不用写后缀名
    alias: {
      '@': resolve('src'), // 配置 @ 指向 src
    },
  },
  module: {
    /**
    * 我们在 vue 项目中需要 loader 来处理的有
    * vue 文件、js 文件、css/stylus 文件、图片/字体
    * 所以 rules 的编写就是如下所示
    */
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: [resolve('src')],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
      {
        test: /\.styl(us)?$/,
        use: ['vue-style-loader', 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'url-loader',
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
      },
    ],
  },
}
```

写完之后，我们也要一个个来安装依赖。安装 babel-loader 的时候需要注意控制台，会提示安装一个 @babel/core 依赖。

    > npm i -D vue-loader babel-loader vue-style-loader url-loader
    // 控制台会报出 babel-loader@8.0.5 requires a peer of @babel/core@^7.0.0，再安装一下
    > npm i -D @babel/core

## webpack.dev.conf.js

这里是主要启动 webpack-der-server 的一些配置项了，首先需要从 base 里引入，我们需要一个 webpack-merge 来 merge 一下配置项。

    // 安装
    > npm i -D webpack-merge

webpack.dev.conf.js 文件

```
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.conf');

module.exports = merge(baseConfig, {
  mode: 'development',
  plugins: []
});
```

现在已经大概写出了个雏形，我们可以试试看 npm run dev 会发生哪些错误，再一步步解决。

首先第一个报出的错误是缺少 vue-template-compiler 包，第二个错误是 vue-loader 没有使用相应的插件，第三个是我们在 router 里异步加载组件时使用了 import 方法动态加载。

    > npm i -D vue-template-compiler // 注意 vue-template-compiler 的版本号要与 vue 一致
    > npm i -D @babel/plugin-syntax-dynamic-import // 解决动态 import 的错误

vue-loader 使用的时候，需要在 plugin 中添加一个插件。

webpack.dev.conf.js 文件修改
```
const VueLoaderPlugin = require('vue-loader/lib/plugin');

plugins: [
   new VueLoaderPlugin(),
],
```

同时在项目根目录下新建 .babelrc，内容如下：

    {
      "plugins": ["@babel/plugin-syntax-dynamic-import"]
    }

到此为止，我们再 npm run dev，嗯，没有报错了，打开 localhost:8080，页面上却没有我们想要的效果，原因是此时打开的仍然是项目根目录下的 index.html 文件，没有将我们的 vue 项目挂载到 id 为 app 的 div 元素上。我们还需要一个插件——html-webpack-plugin，这个插件的作用是帮助我们生成 html 文件，并将外部资源挂载到该文件上。

    > npm i -D html-webpack-plugin

在 webpack.dev.conf.js 文件中将该插件注入。

```
const HtmlWebpackPlugin = require('html-webpack-plugin');

plugins: [
  ..., // 其他插件
  new HtmlWebpackPlugin({
    template: 'index.html', // 本地模板的位置
  }),
],
```

写到这，通过 npm run dev，我们的 vue 开发环境已经搭建起来了。

# 补充配置

虽然通过之前的配置，环境已经可以跑起来了，但是这样的开发体验并不是很好，下面我们就来进行一些优化。

## 配置热更新

第一步就是配置热更新，不然我们每次修改代码都得重新 npm run dev，实在是太麻烦了。

打开 webpack.dev.conf.js 文件，新增属性，devServer。

```
const webpack = require('webpack');

module.exports = {
  ..., // 其他属性
  devServer: {
    hot: true,
    clientLogLevel: 'warning', // 把控制台多余的打印消息去掉
  },
  plugins: [
    ..., // 其他插件
    new webpack.HotModuleReplacementPlugin(),
  ],
};
```

保存文件，再次启动 dev，现在就可以热更新 vue 文件的改动了。

## 配置 eslint

代码规范是个很重要的事情，通过 eslint 来规范我们的代码结构可以避免很多潜在的错误，我们使用 airbnb 的风格。

首先需要安装相关的依赖，我们能想到的依赖有哪些就先装哪些，eslint 肯定是需要的，风格类型依赖 eslint-config-airbnb-base，babel-eslint 是需要来解析 eslint。然后安装过程 eslint-config-airbnb-base 还需要一个 eslint-plugin-import 的依赖，也安装一下。

在对 vue 模板进行 eslint 校验时，需要 eslint-plugin-vue 依赖，于是总的命令如下：

    > npm i -D eslint babel-eslint eslint-config-airbnb-base eslint-plugin-import eslint-plugin-vue

在根目录新建 .eslintrc.js 文件，打开。

```
module.exports = {
  root: true, // 设置为根目录，不会再向上寻找 eslint 配置文件
  parserOptions: {
    parser: 'babel-eslint', // 使用 babel-eslint 来解析
    sourceType: 'module' // 代码是 module 模块则设置为 module
  },
  env: {
    browser: true, // 设置浏览器环境
  },
  extends: [
    'plugin:vue/essential', // vue 基本规则
    'airbnb-base' // airbnb eslint 规则
  ],
  // vue 文件校验
  plugins: ['vue'],
  // 个性化规则
  rules: {}
};
```

但是现在我们去文件中，并没有发现 eslint 生效，原因是还缺少一个关键依赖：eslint-loader，有了这个才能在 vue、js 文件中启动 eslint 的校验。

    > npm i -D eslint-loader

打开 webpack.base.conf.js 文件，在 rules 中添加 eslint 的 loader。

webpack.base.conf.js
```
// rules 里添加
{
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src')],
},
```

再打开相关文件就可以看到 eslint 的报错了。

这里还有两个小问题，webpack 相关文件不需要 eslint 校验，可以通过 .eslintignore 文件忽略；另一个就是使用 @ 符号指向 src 引入组件时 eslint 会报 Unable to resolve path to module，就这两个问题我们来解决一下。

```
// 1. 项目根目录新建 .eslintignore 文件，里面内容如下
// 忽略 eslint 对根目录 build 下的所有文件以及根目录下的 js 文件的校验
/build/
/*.js

// 2. 安装 eslint-import-resolver-webpack 依赖，在 .eslintrc.js 文件中添加 setting
settings: {
  'import/resolver': {
    webpack: {
      config: 'build/webpack.base.conf.js', // 指向 webpack 中 resolve 配置所在的文件
    },
  },
},
```

到这里 eslint 的配置就完成了，如果有个性化的设置，在 .eslintrc.js 文件的 rules 中添加就行。

## 配置报错信息

不知道各位对每次 npm run dev 时控制台那么长一串作何感想，反正我觉得很冗杂。vue-cli 中提供了一个 friendly-errors-webpack-plugin 插件，这个插件会对报错信息更为直观友好地提示出来。我们也进行一下配置。

    > npm i -D friendly-errors-webpack-plugin

使用方式很简单，就在 webpack.dev.conf.js 文件中引入，在 plugins 中加入即可。

```
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

devServer: {
  ..., // 其他设置
  quiet: true, // 关闭 webpack-dev-server 的提示
},

plugins: [
  ..., // 其他插件
  new FriendlyErrorsPlugin();
],
```

再次跑一下项目，发现控制台是不是精简了很多呢。
