---
title: react 基础工程（react-redux & react-router）
date: 2023-05-31 17:06:08
categories:
- 开发
- 前端
---

vue 已经很熟悉。react 虽然也用过，但是对于整体的搭建还不是很熟。这次就使用 [react-redux(^8.0.5)](https://react-redux.js.org/introduction/getting-started) 和 [react-router(^6.11.2)](https://reactrouter.com/en/main/start/tutorial#tutorial)，
结合上次的《[从零搭建前端工程](/2023/03/06/fontend-engineering/)》，搭建一个基础的 react 项目。加上一点注释，后面有用到也可以代码直接拷。

**代码仓库：[github](https://github.com/orochi97/react-app)。**

## 一、Router

当前最新版本为 v6，据说有些大改动，旧版本请参考《[升级指南](https://reactrouter.com/en/main/upgrading/v5)》。

路由文件声明：
```js
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from '@/views/Home';
import NotFound from '@/views/NotFound';

const router = createBrowserRouter([
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/game',
    // element: <CardGame />,
    async lazy() { // 路由页面懒加载，也就是真的访问到再下载，打包也是独立的 js
      const comp = await import('@/views/CardGame');
      // 这里的 default 是 webpack 的处理，会把 export default 挂在 default 属性上
      return { Component: comp.default };
    },
  },
  {
    path: '/demo/:id',
    // element: <Demo />,
    async lazy() {
      // 注意：这里要 loader 结果返回，才会渲染组件。也就是会阻塞页面。
      const comp = await import('@/views/Demo');
      return { Component: comp.default, loader: comp.loader };
    },
  },
  {
    path: '/', // v6 的重定向改为 Navigate 组件
    element: <Navigate to={'/home'}/>,
  },
  {
    path: '*', // 404页面兜底，我觉得改成和上面的一样的重定向处理应该也可以
    element: <NotFound />,
  },
]);

export default router;
```

然后路由声明对象的使用：

```js
import { RouterProvider } from 'react-router-dom';
import router from '@/router';

function App() {
  return (
    <RouterProvider router={router} />
  );
}
export default App;
```

<!-- more -->

## 二、Redux

redux 使用就比较繁琐一点。先安装相关依赖：
```bash
npm i react-redux redux @reduxjs/toolkit
```

需要知道的是， redux 是一个公共的第三方库，和框架并没有关系。react-redux 才是为了 react 能更好地使用 redux 而推出的工具库，至于 [@reduxjs/toolkit](https://redux-toolkit.js.org/introduction/getting-started)，也是为了可以更更好地使用 redux 和 react-redux。
一开始看都是 re***，我还以为 redux 就是 react 官方推的，囧。

代码都在 `src/store` 里：

```js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducer';

export * from './reducer';

// 创建一个 store，把所有声明好的 reducer 传进去
const store = configureStore({
  reducer: rootReducer,
});
export default store;
```

reducer 代码以 `src/store/reducer/number.js` 为例：

```js
import { cloneDeep } from 'lodash';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ADD_NUMBER, MINUS_NUMBER } from '../type';

// 把每个 action 声明然后导出去
export const addNumberAction = payload => ({
  type: ADD_NUMBER,
  payload: payload,
});

export const minusNumberAction = payload => ({
  type: MINUS_NUMBER,
  payload: payload,
});

// 声明一个异步操作，这里把它叫做 thunk
// 第一个参数是 type，第二个参数是处理方法
// 处理完成后会 dispatch 一个 type 为 `${type}/fulfilled`
// 这也是为什么下面会有一个 addNumberThunk.fulfilled.toString() 的 case
export const addNumberThunk = createAsyncThunk(
  ADD_NUMBER,
  async (number) => {
    return new Promise((resolve) => setTimeout(() => resolve(number), 2000));
  },
);

// 初始的 store 值，当然它的对象归属取决于在最上层做聚合时候它的 key 值叫啥
const defaultState = {
  a: 10000,
};

export default function numberReducer(state = defaultState, action) {
  const { type, payload } = action;
  // 这里必须深拷贝，因为原数据是不允许改动的，只能传递新的数据出去
  state = cloneDeep(state);
  switch (type) {
    case ADD_NUMBER:
      state.a += payload;
      return state;
    case MINUS_NUMBER:
      state.a -= payload;
      return state;
    // addNumberThunk.fulfilled.toString() => 'ADD_NUMBER/fulfilled'
    case addNumberThunk.fulfilled.toString():
      state.a += payload;
      return state;
    default:
      return state;
  }
};
```

### 1、副作用与 createAsyncThunk

redux 讲究的是纯函数，输入输出恒定，所以每个 action 做的事情是稳定的。然后把一些需要依赖外部的环境叫做副作用，用一些中间件来处理。比如 [react-thunk](https://github.com/troch/react-thunk) 和 [react-saga](https://github.com/barbuza/react-saga)，用法这里就不赘述。

其实就是在正式 store.dispatch 之前，把所有数据处理完，无论同步异步，然后再 dispatch。如果用过 vuex 的话，其实也是这样，异步的用 store.dispatch（vuex 的语法），然后再请求完数据或者别的什么都行，到真正要改变 state 数据了才用 store.commit。

也就是说，不用中间件也行。触发了事件自己怎么异步处理好数据，然后提交 dispatch。

`@reduxjs/toolkit` 也提供一个方法 `createAsyncThunk`，大同小异吧，思路都是一样的。我们只需要声明好相应的 `asyncThunk.fulfilled.toString()` case 处理事件就好。当然同时也有 `asyncThunk.pending.toString()` 和 `asyncThunk.rejected.toString()`，酌情声明。

### 2、createSlice

这个库还提供了一个切片方法用来快速声明 reducer（个人理解）：`createSlice`。代码在 `src/store/reducer/counter.js` 里。这个方法里的 reducer 是可以直接改 state 的值，据说是用了 [immutable.js](https://github.com/immutable-js/immutable-js) 来确保 state 不变。具体用法可看[官网介绍](https://redux-toolkit.js.org/api/createSlice)。

### 3、reducer 组合 combineReducers

`@reduxjs/toolkit` 提供一个方法 `combineReducers`，用来组合 reducer。
```js
import { combineReducers } from '@reduxjs/toolkit';
import number from './number';
import string from './string';

const reducer = combineReducers({
  number,
  string,
});
export default reducer;
```
这个 reducer 挂载在顶层 state 的 `data` 字段下，那么它的获取方式就是 `store.getState().data.number/string`。
具体可看 `src/store/reducer/data/index.js` 代码。

各类参数使用和事件的触发在 `src/views/demo/index.js` 里。

react 使用 store 注入：
```js
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from '@/store';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

## 三、其他工程化

和 vue 后来的版本一样，把 webpack 的配置藏起来，但是 react 没有暴露扩展方法，需要执行 `npm run eject` 把配置文件弹出来，但这一步是不可逆的，弹出来就收不回去了。也没关系，自己配置一下 webpack.config.js 就可以了。主要是不支持 alias 声明比较不方便。也不支持 less sass 好像。
需要注意的是 `devServer` 的配置要加上 `historyApiFallback` 字段的配置，不然 router 路径没法生效。简单理解就是匹配不到路径会有个默认返回，也就是无论访问什么路径，都返回默认的 index.html 内容。
```js
devServer: {
  historyApiFallback: { disableDotRule: true, index: '/' },
},
```
