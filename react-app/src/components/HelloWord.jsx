import React, { Component } from 'react';
import './hello-word.styl';
import icon from '@/assets/images/icon.jpg';
import bg from '@/assets/images/bg.jpg';

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
    setTimeout(() => {
      this.setState({
        msg: 'Hello World!',
      });
    }, 17);
  }

  render() {
    return (
      <Fragment>
        <p>{{ msg }}</p>
        <img src={{ icon }} alt="icon" style="width: 64px;" />
        <i class="iconfont icon-spades"></i>
        <img src="/static/avatar.jpg" alt="icon" style="display: block;width: 128px;" />
        <img src={{ bg }} alt="bg" />
      </Fragment>
    );
  }
}

export default HelloWorld;
