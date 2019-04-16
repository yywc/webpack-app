import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '@/assets/stylus/index.styl';

// if (module.hot) {
//   module.hot.accept(() => {
//     ReactDOM.render(
//       <App />,
//       document.getElementById('app'),
//     );
//   });
// }

ReactDOM.render(
  <App />,
  document.getElementById('app'),
);
