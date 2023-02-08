---
title: 懒加载-虚拟列表-下拉菜单选择器
date: 2023-02-07 21:17:59
categories:
- 开发
- 前端
---

最近，遇到 `select` 表单下拉选项过多的问题。由于业务场景需要，选项是由接口请求回来，数量取决于线上数据的多少。

借此，顺便记录下目前遇到 `select` 组件有哪些优化选择。附上一些例子，使用 vue 写的。当然用 react 也是类似的做法，这个和用什么框架关系不大。

**为了文章内容不要太长，例子里的共同样式放在了最后。**

### 一、懒加载

懒加载这个词各位应该也很熟悉。在一个古老的例子，瀑布流显示图片就有这个词语了。就是第一屏只显示几条，用户有兴趣往下拉，再继续加载（或请求）新的数据。
以前的话应该是监听 `scroll` 事件，判断是否要见底了，来补充新数据。后面出了一个厉害的 [IntersectionObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver) 方法。具体怎么用就不赘述了，总之就是能监听一个 dom 的显隐，来触发回调。

例子可看代码，支持前端自己分批数据或者每次下拉由后端处理分批

```html
<template>
  <div ref="lazy-load-select" class="lazy-load-select" :class="{ active: active }">
    <a class="display-label" href="javascript:;" @click="active = !active">{{
      displayLabel
    }}</a>
    <div class="list" v-show="active">
      <input
        type="text"
        class="select-input"
        @input="search"
        v-model="searchText"
      />
      <ul class="select-ul" ref="select-ul">
        <li
          v-for="item in displayData"
          ref="select-li"
          :class="{ 'select-li': true, selected: item.value === currentValue }"
          :key="item.value"
          @click="select(item.value)"
        >
          {{ item.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
function genData({ pageno, count, keyword }) {
  return new Array(count).fill('1').map((_, index) => {
    const value = (pageno - 1) * count + index + 1 + '';
    return {
      value,
      label: 'LazyLoad-' + value + (keyword || ''),
    };
  });
}

const originData = genData({ pageno: 1, count: 100 });

// 调试用的声明，true：使用全部数据返回，由前端分批，false：分批从后端获取数据
const defaultProps = false ? {
  originData: () => originData,
  getData: undefined,
} : {
  originData: () => [],
  getData: ({ pageno, count, keyword }) => {
    return Promise.resolve(genData({ pageno, count, keyword }));
  },
};

// 上面是调试示例用的代码

const ONE_LOAD = 10; // 每次加载10条

const LAZY_LOAD_COMP = 2; // 倒数第几个开始新的加载

export default {
  name: 'LazyLoadSelect', // 懒加载下拉菜单，支持前端分批处理或后端分批处理
  props: {
    originData: {
      type: Array,
      default: defaultProps.originData,
    },
    getData: {
      type: Function,
      default: defaultProps.getData,
    },
  },
  data() {
    return {
      currentValue: 0,
      active: false,
      searchText: '',
      displayData: [],
      filterData: [],
      intersectionObserver: null,
    };
  },
  computed: {
    displayLabel() {
      const selectd = this.originData.find(
        item => item.value === this.currentValue
      );
      return selectd ? selectd.label : '请选择';
    },
    useRemoteData() {
      return typeof this.getData === 'function';
    },
    count() {
      return ONE_LOAD;
    },
    pageno() {
      return this.displayData.length / this.count || 1;
    },
  },
  methods: {
    async initFilterData(keyword) {
      this.displayData = [];
      if (this.useRemoteData) {
        // 如果有外部方法，初始化则不需要过滤，直接更新接口来的数据即可
        const data = await this.loadRemoteData();
        this.displayData = data;
      } else {
        // 如果没有外部方法，初始化则先根据搜索词过滤得出过滤数据，然后再对过滤数据分批
        this.filterData = this.originData.filter(item => {
          return keyword ? item.label.indexOf(keyword) !== -1 : true;
        });
        this.displayData = this.filterData.slice(0, 0 + ONE_LOAD);
      }
      this.$selectUl && (this.$selectUl.scrollTop = 0);
      this.updateObserveLayzload();
    },
    search(event) {
      // 应防抖
      this.initFilterData(this.searchText);
    },
    select(value) {
      this.currentValue = value;
      this.active = false;
      this.$emit('change', value);
    },
    updateObserveLayzload() {
      this.$nextTick(() => {
        if (this.displayData.length >= this.filterData.length && !this.useRemoteData) {
          this.$lazyLoadLi &&
            this.intersectionObserver.unobserve(this.$lazyLoadLi);
          return;
        }
        const $liArr = this.$refs['select-li'];

        this.$lazyLoadLi &&
          this.intersectionObserver.unobserve(this.$lazyLoadLi);
        this.$lazyLoadLi = $liArr[$liArr.length - 1 - LAZY_LOAD_COMP];
        this.intersectionObserver.observe(this.$lazyLoadLi);
      });
    },
    async loadRemoteData() { // 从外部方法获取数据
      try {
        const data = await this.getData(
        	{ pageno: this.pageno, count: this.count, keyword: this.searchText }
        );
        return data;
      } catch(error) {
        console.error('get data error:', error);
      }
      return [];
    },
    async getNewBatchData() {
      if (this.useRemoteData) {
        // 数据（包括筛选）完全由后端处理
        const addData = await this.loadRemoteData();
        return addData;
      }
      // 由前端对数据分批
      const addData = this.filterData.slice(
        this.displayData.length,
        this.displayData.length + ONE_LOAD,
      );
      return addData;
    },
    async updateData() {
      const addData = await this.getNewBatchData();
      this.displayData.push(...addData);
      this.updateObserveLayzload();
    },
  },
  created() {
    this.initFilterData('');
  },
  mounted() {
    this.$selectUl = this.$refs['select-ul'];
    this.intersectionObserver = new IntersectionObserver(entries => {
      if (entries[0].intersectionRatio) {
        this.updateData();
      }
    });

    const $main = this.$refs['lazy-load-select'];
    window.addEventListener(
      'click',
      (ev) => {
        // 判断是否点击在 select 组件上
        const isSelectComp = ev.composedPath().find(dom => $main === dom);
        if (!isSelectComp) {
          this.active = false;
        }
      }
    );
  }
};
</script>
```

<!--more-->

### 二、虚拟滚动条

懒加载是为了性能优化出现，确实也有一定作用。但是没有解决根本问题，那就是选项过多导致的下拉菜单的 dom 过多。如果持之以恒地往下拉，还是会有很多 dom。

这时候虚拟滚动条方案就出现了：每次都是固定展示 n 条。然后借由不断的替换这一批下拉选项数据，达到各个选项可选择的功能。

首先算出实际的下拉菜单的高度，用一个一样高的容器包裹着真实渲染的下拉菜单选项，然后监听 `scroll` 事件，每次得出滚动距离 `scrollTop`，用容器 padding 或者 绝对定位什么都行。就是让下拉菜单选项距离顶部有 scrollTop 的距离。这一步是达到滚动体验和真的有那么多个的效果一样。
然后根据 scrollTop 来算出滚动了多少条的选项，用以更新这一批真实渲染的下拉菜单选项。比如滚动的距离有 10 条的高度，那么新的一批就从第 11 条开始。

例子可看代码，理论上还是可以用 IntersectionObserver，但简单实现还是用了监听 scroll 事件。

```html
<template>
  <div ref="virtual-scroll-relect" class="virtual-scroll-relect" :class="{ active: active }">
    <a class="display-label" href="javascript:;" @click="active = !active">{{
      displayLabel
    }}</a>
    <div class="list" v-show="active">
      <input
        type="text"
        class="select-input"
        @input="search"
        v-model="searchText"
      />
      <div class="view-container" ref="view-container" @scroll="handleScroll">
        <div class="item-container" ref="item-container"
        	:style="{ height: containerHeight+'px', paddingTop: containerPaddingTop+'px' }">
          <div
            v-for="item in displayData"
            class="item"
            :class="{ selected: item.value === currentValue }"
            :key="item.value"
            @click="select(item.value)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
function genData(length) {
  return new Array(length).fill('1').map((_, index) => {
    const idx = index + 1;
    return {
      value: idx,
      label: 'VirtualScroll-' + idx
    };
  });
}

const originData = genData(1000);

// 上面是调试示例用的代码

const BATCH_NUM = 10; // 每一批替换的条数

const ITEM_HEIGHT = 24; // 单个选项的高度

export default {
  name: 'VirtualScrollSelect', // 虚拟滚动列表下拉菜单
  props: {
    originData: {
      type: Array,
      default: () => originData, // 原始的所有数据
    },
  },
  data() {
    return {
      filterData: [], // 原始数据经过过滤后的数据
      displayData: [], // 真正用于渲染的数据
      currentValue: 0,
      active: false,
      searchText: '',
      containerHeight: 0,
      containerPaddingTop: 0,
      itemHeight: ITEM_HEIGHT,
    };
  },
  computed: {
    displayLabel() {
      const selectd = this.originData.find(
        item => item.value === this.currentValue
      );
      return selectd ? selectd.label : '请选择';
    }
  },
  watch: {
    active(val) {
      if (val) {
        this.init();
      }
    },
  },
  methods: {
    init() {
      if (this.containerHeight) return;
      this.updateFilterData();
    },
    updateFilterData(keyword) {
      this.filterData = this.originData.filter(item => {
        return keyword ? item.label.indexOf(keyword) !== -1 : true;
      });
      this.displayData = this.filterData.slice(0, BATCH_NUM);
      this.$nextTick(() => {
        this.containerHeight = this.itemHeight * this.filterData.length;
      });
    },
    search(event) {
      // 应防抖
      this.containerPaddingTop = 0;
      this.$viewContainer.scrollTop = 0;
      this.updateFilterData(this.searchText);
    },
    select(value) {
      this.currentValue = value;
      this.active = false;
      this.$emit('change', value);
    },
    handleScroll() {
      this.containerPaddingTop = this.$viewContainer.scrollTop;
      const position = Math.ceil(this.containerPaddingTop / this.itemHeight);
      this.displayData = this.filterData.slice(position, position + BATCH_NUM);
    },
  },
  created() {
  },
  mounted() {
    this.$viewContainer = this.$refs['view-container'];
  }
};
</script>
```

### 三、两者混合

现实情况还是有很多是 懒加载 + 虚拟滚动列表 的组合。拿上面的虚拟列表例子加上了懒加载功能。偷懒实现就把所有数据都改成接口（外部方法）返回。由调用方（或是前端自己分批或是后端分页处理）自己对数据分批处理然后返回回来。

这个要注意的就是，**每次加上新的一批的数据，要更新虚拟列表的高度，已达到视觉上真的好像多了很多选项的感觉**。

```html
<template>
  <div ref="multi-relect" class="multi-relect" :class="{ active: active }">
    <a class="display-label" href="javascript:;" @click="active = !active">{{
      displayLabel
    }}</a>
    <div class="list" v-show="active">
      <input
        type="text"
        class="select-input"
        @input="search"
        v-model="searchText"
      />
      <div class="view-container" ref="view-container" @scroll="handleScroll">
        <div class="item-container" ref="item-container"
        	:style="{ height: containerHeight+'px', paddingTop: containerPaddingTop+'px' }">
          <div
            v-for="item in displayData"
            ref="item"
            class="item"
            :class="{ selected: item.value === currentValue }"
            :key="item.value"
            @click="select(item.value)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
function genData({ pageno, count, keyword }) {
  return new Array(count).fill('1').map((_, index) => {
    const value = (pageno - 1) * count + index + 1 + '';
    return {
      value,
      label: 'MultiSelect-' + value + (keyword || ''),
    };
  });
}

const ONE_LOAD = 10; // 每次加载10条，作用于懒加载

const BATCH_NUM = 10; // 每一批替换的条数

const ITEM_HEIGHT = 24;

export default {
  name: 'AllSelect', // 虚拟滚动列表 + 懒加载下拉菜单
  props: {
    getData: {
      type: Function,
      default: ({ pageno, count, keyword }) => {
        return Promise.resolve(genData({ pageno, count, keyword }));
      },
      require: true,
    },
  },
  data() {
    return {
      originData: [],
      displayData: [], // 真正用于渲染的数据
      currentValue: 0,
      active: false,
      searchText: '',
      viewContainerHeight: 200,
      containerHeight: 0,
      containerPaddingTop: 0,
      itemHeight: ITEM_HEIGHT,
    };
  },
  computed: {
    displayLabel() {
      const selectd = this.originData.find(
        item => item.value === this.currentValue
      );
      return selectd ? selectd.label : '请选择';
    },
    count() {
      return ONE_LOAD;
    },
    pageno() {
      return (this.originData.length / this.count) + 1;
    },
  },
  watch: {
    active(val) {
      if (val) {
        this.init();
      }
    },
  },
  methods: {
    init() {
      if (this.containerHeight) return;
      this.initData();
    },
    search(event) {
      // 应防抖
      this.containerPaddingTop = 0;
      this.$viewContainer.scrollTop = 0;
      this.initData();
    },
    select(value) {
      this.currentValue = value;
      this.active = false;
      this.$emit('change', value);
    },
    async initData() {
      this.originData = [];
      this.originData = await this.loadRemoteData();;
      this.displayData = this.originData.slice(0, BATCH_NUM);
      this.containerHeight = this.itemHeight * this.originData.length;
    },
    async loadRemoteData() { // 从外部方法获取数据
      if (typeof this.getData !== 'function') return [];
      try {
        const data = await this.getData(
        	{ pageno: this.pageno, count: this.count, keyword: this.searchText }
        );
        return data;
      } catch(error) {
        console.error('get data error:', error);
      }
      return [];
    },
    async updateData() {
      const addData = await this.loadRemoteData();
      this.displayData.push(...addData);
      this.handleScroll();
    },
    async handleScroll() {
      this.containerPaddingTop = this.$viewContainer.scrollTop;

      // 要见底，则加载新数据
      if ((this.containerHeight - this.containerPaddingTop) <= this.viewContainerHeight) {
        const data = await this.loadRemoteData();
        this.originData.push(...data);
      }

      const position = Math.ceil(this.containerPaddingTop / this.itemHeight);
      this.displayData = this.originData.slice(position, position + BATCH_NUM);
      this.containerHeight = this.itemHeight * this.originData.length;
    },
  },
  mounted() {
    this.$viewContainer = this.$refs['view-container'];
  }
};
</script>

```

样式部分：


```html
<style>
* {
  box-sizing: border-box;
}
ul,
li {
  padding: 0;
  margin: 0;
  list-style: none;
}

.lazy-load-select {
  width: 200px;
  height: 30px;
  border: 1px solid #d7dde4;
  border-radius: 5px;
  position: relative;
}
.active {
  border: 1px solid #3399ff;
  box-shadow: 0px 0px 2px #abcdef, 0px 0px 2px #abcdef, 0px 0px 2px #abcdef,
    0px 0px 2px #abcdef;
}

.display-label {
  display: inline-block;
  width: 200px;
  height: 100%;
  text-decoration: none;
  line-height: 30px;
  color: #657180;
  position: relative;
  padding-right: 20px;
}
.display-label::after {
  content: "";
  height: 0;
  width: 0;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-20%);
  border: 6px solid;
  border-color: #657180 transparent transparent;
}
.active .display-label::after {
  transform: translateY(-80%);
  border-color: transparent transparent #657180;
}

.list {
  position: absolute;
  width: 200px;
  top: 35px;
  left: 0;
  padding: 5px;
  box-shadow: 2px 2px 4px #ccc, -2px 2px 4px #ccc, 2px -2px 4px #ccc,
    -2px -2px 4px #ccc;
}
.select-input {
  border: 1px solid #d7dde4;
  width: 100%;
  color: #657180;
}
.select-input:focus {
  outline: 1px solid #abcdef;
}

.select-ul {
  height: 200px;
  overflow: auto;
  margin-top: 5px;
}
.select-li {
  cursor: pointer;
  padding: 3px;
  color: #657180;
}
.select-li:hover {
  background-color: #ccc;
}
.selected {
  background-color: #abcdef;
}
</style>
```