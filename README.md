# 前言

从上一篇开发环境的配置，大概也对这个配置过程有了一定的了解了，这一篇主要就是针对生产环境的一个配置，可以直接从开发环境的基础上进行一些改变。

# 准备工作

首先我们删除那么在开发环境需要用到的包，主要是以下：

+ babel-eslint
+ eslint
+ eslint-config-airbnb-base
+ eslint-import-resolver-webpack
+ eslint-loader
+ eslint-plugin-import
+ eslint-plugin-vue
+ friendly-errors-webpack-plugin
+ webpack-dev-server

删除 build 下的 webpack.dev.conf.js，同时新建 webpack.prod.conf.js，修改 package.json 中 scripts 的 dev 命令为：

> "build": "webpack --progress --config build/webpack.prod.conf.js"

# webpack.base.conf.js

针对开发环境，我们就不需要 eslint 来校验了，于是可以删除掉对 js、vue 文件的校验。

```
- {
-   test: /\.(js|vue)$/,
-   loader: 'eslint-loader',
-   enforce: 'pre',
-   include: [resolve('src')],
- },
```

同时对图片字体等文件的解析也做一个限制，超过 10KB 则使用 file-loader。

```
{
  test: /\.(png|svg|jpg|gif)$/,
  loader: 'url-loader',
  options: {
-     limit: 102400,
+     limit: 10240,
+     name: 'images/[name].[hash:7].[ext]', // (原始文件名.hash.原始后缀名)
  }
},

{
  test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
    loader: 'url-loader',
+     options: {
+       limit: 10240,
+       name: 'fonts/[name].[hash:7].[ext]',
+     }
},
```

于是最终文件内容如下：

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
```

# webpack.prod.conf.js

与开发环境差不多，我们依旧需要 merge 基本配置，html-webpack-plugin 与 vue-loader 的 plugin，同时指定一下输出目录。

```
// 引入基本的配置与插件
const path = require('path');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const baseWebpackConfig = require('./webpack.base.conf');

module.exports = merge(baseWebpackConfig, {
  mode: 'production', // 设置为开发环境模式，会自动帮我们启用一些打包优化。比如 js 的压缩
  output: {
    path: path.join(__dirname, '../dist'), // 输出到根目录下的 dist 文件
    filename: 'js/[name].[chunkhash].js', // 文件在 dist/js 目录下，文件名为：原文件名.chunkhash值.js
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html', // 本地模板的位置
      minify: { // 压缩 html
        removeComments: true, // 移除注释
        collapseWhitespace: true, // 移除空格
        removeAttributeQuotes: true // 移除属性引号
      },
    }),
    new VueLoaderPlugin(),
  ]
});

```

此时我们运行命令 `npm run build`，就可以看到根目录下多出一个 dist 文件，打包后的文件都在里面。这个 index.html 是需要服务才能启动的，我们利用 koa 起一个简单的服务器来看看打包后的效果。

# server.js

在文件根目录创建 server.js，然后安装 koa、koa-static 依赖，`npm i -D koa koa-static`。

```
const Koa = require('koa');
const static = require('koa-static');

const app = new Koa();

app.use(static('./dist', { extensions: ['html'] })); // 使用 dist 目录下的 index.html

// 这个属于锦上添花，打开默认浏览器
const openDefaultBrowser = function (url) {
  const { exec } = require('child_process');
  let type = '';
  switch (process.platform) {
    case 'darwin':
      type = `open ${url}`;
      break;
    case 'win32':
      type = `start ${url}`;
      break;
    default:
      type = `xdg-open ${[url]}`;
  }
  exec(type);
}

// 监听 3030 端口，1秒后打开默认浏览器
app.listen(3030, (err) => {
  if (!err) {
    console.log(`server listen 3030`);
    setTimeout(() => {
      openDefaultBrowser('http://localhost:3030');
    }, 1000);
  } else {
    console.error(err);
  }
});

```

在控制台启动服务 `node server.js`，1秒后浏览器打开，发现缺少了一张图片，是我们在打包的时候没有将 /static 下的资源拷贝过来。找到原因后我们就通过 copy-webpack-plugin 来拷贝，`npm i -Dcopy-webpack-plugin`。

每次执行 `npm run build` 的时候我们需要手动去整理 /dist/ 目录，也不方便，安装一个 clean-webpack-plugin，让 webpack 帮我们来做这件事——`npm i -D clean-webpack-plugin`

webpack.prod.conf.js

```
+ const CopyPlugin = require('copy-webpack-plugin');
+ const CleanWebpackPlugin = require('clean-webpack-plugin'); // 会帮我们删除 dist 目录下所有文件，打包重新生成

plugin: [
+ new CopyPlugin([
+   { from: 'static', to: 'static' }, // 从 /static 目录复制到 /dist/static 目录
+ ]),
+ new CleanWebpackPlugin(),
]
```

再执行打包命令，之后启动服务，我们缺失的图片回来了！而且整个项目也正常的跑起来了。

# css 提取与压缩

上面的操作并没有涉及到 css 部分，如果我们需要将 css 代码提取出来，那么就需要用到 mini-css-extract-plugin (webpack4以下使用 extract-text-webpack-plugin) 与 optimize-css-assets-webpack-plugin 了。

还是先安装这两个插件 `npm i -D mini-css-extract-plugin optimize-css-assets-webpack-plugin`，在 **webpack.prod.conf.js** 文件中注册插件。

```
+ const MiniCssExtractPlugin = require("mini-css-extract-plugin");
+ const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

+ new MiniCssExtractPlugin({
+   filename: 'css/[name].[contenthash].css',
+ }),

+ new OptimizeCSSAssetsPlugin(),
```

**webpack.base.conf.js** 文件也需要修改一下，在 css stylus loader 里添加 MiniCssExtractPlugin.loader

```
+ const MiniCssExtractPlugin = require("mini-css-extract-plugin");

{
  test: /\.css$/,
- use: ['vue-style-loader', 'css-loader'],
+ use: [
+   'vue-style-loader',
+   {
+     loader: MiniCssExtractPlugin.loader,
+   },
+   'css-loader',
+ ],
},

{
  test: /\.styl(us)?$/,
- use: ['vue-style-loader', 'css-loader', 'stylus-loader'],
+ use: [
+   'vue-style-loader',
+     {
+       loader: MiniCssExtractPlugin.loader,
+     },
+   'css-loader',
+   'stylus-loader',
+ ],
},
```

如此一来，我们 css 的部分也就解决了，当然，这里只是 webpack 打包很少的一部分。还有很多东西都值得我们去探索：webpack 工作原理，打包速度优化与体积优化等等等等，但是目前来说我们已经成功的搭建了简易 vue 的开发环境与生产环境了。
