const Koa = require('koa');
const serve = require('koa-static');

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
};

const app = new Koa();

app.use(serve('./dist', { extensions: ['html'] }));

app.listen(3030, (err) => {
  if (!err) {
    console.log('server listen 3030');
    setTimeout(() => {
      openDefaultBrowser('http://localhost:3030');
    }, 1000);
  } else {
    console.error(err);
  }
});
