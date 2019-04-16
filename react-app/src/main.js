import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '@/assets/stylus/index.styl';

ReactDOM.render(
  <App />,
  document.getElementById('app'),
);

module.hot.accept();
