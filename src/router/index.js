import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

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
