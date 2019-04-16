import React, { Component, Fragment } from 'react';
import './hello-word.styl';
import icon from '@/assets/images/icon.jpg';
import bg from '@/assets/images/bg.jpg';

let count = 1;
const text = 'text';

class HelloWorld extends Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
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
    const { msg } = this.state;
    return (
      <Fragment>
        <p>{msg}</p>
        <p>{text}</p>
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
