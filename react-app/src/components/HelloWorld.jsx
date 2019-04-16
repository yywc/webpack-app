import React, { Component, Fragment } from 'react';
import './hello-word.styl';
import icon from '@/assets/images/icon.jpg';
import bg from '@/assets/images/bg.jpg';

let count = 1;

class HelloWorld extends Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
      msg2: '222',
    };
  }

  componentWillMount() {
    this.getMsg();
  }

  getMsg() {
    const a = setInterval(() => {
      this.setState({
        msg: count += 1,
      });
      if (count > 5) {
        clearInterval(a);
      }
    }, 1000);
  }

  render() {
    const { msg, msg2 } = this.state;
    return (
      <Fragment>
        <p>{msg}</p>
        <p>{msg2}</p>
        <img
          src={icon}
          alt="icon"
          style={{ width: '64px' }} />
        <i className="iconfont icon-spades" />
        <img
          src="/static/avatar.jpg"
          alt="icon"
          style={{ display: 'block', width: '128px' }} />
        <img src={bg} alt="bg" />
      </Fragment>
    );
  }
}

export default HelloWorld;
