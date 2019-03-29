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
    <img :src="bg"
         alt="bg">
  </div>
</template>

<script>
import icon from '@/assets/images/icon.jpg';
import bg from '@/assets/images/bg.jpg';

export default {
  name: 'HelloWorld',
  data() {
    return {
      icon,
      bg,
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
  transition: all
</style>
