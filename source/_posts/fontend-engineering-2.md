---
title: 从零搭建前端工程（下）
date: 2023-04-21 01:19:20
categories:
- 开发
- 前端
tags:
- 工程化
---

***文章内容太多，分为上下两部分，这里是下半部分。上半部分在《[从零搭建前端工程（上）](/2023/03/06/fontend-engineering/)》，此篇的内容有：***
***4. 使用 eslint + prettier 让代码健壮和优雅***
***5. 使用 husky + lint-staged 强制增量各类检查***
***6. 使用 @commitlint/cli 规范提交信息***
***7. 使用 埋点（性能 + 错误） 让项目运行更好***

* * *
*****

## 四、使用 eslint + prettier 让代码健壮和优雅

到 eslint 了，是不是让人又爱又恨。刚接的时候应该很不爽吧，动辄就来个错，这也错那也错。满屏尽是红 error。其实都是没有配好，也有处理好。eslint 是非常必要的，可以尽早发现一些错误及不合理，也可以统一一些写法，减少冲突等。比如，vue template 的属性顺序，import 的顺序等等。

循例先上代码示例，在项目根目录创建一份 `.eslintrc.js`，记得前面有个点的，上书代码：
```js
module.exports = {
  env: {
    // 关键字指定你想启用的环境
    browser: true,
    es2021: true,
  },
  extends: [
    // 一个配置文件可以被基础配置中的已启用的规则继承
    'plugin:vue/essential',
    'plugin:vue/recommended',
    'standard',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    // 允许你指定你想要支持的 JavaScript 语言选项
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    // 支持使用第三方插件，检查自定义的语法
    'vue', // 省略了 eslint-plugin- 前缀，插件全称为 eslint-plugin-vue
    'prettier',
  ],
  rules: {
    // 直接声明的 eslint 规则
    semi: ['error', 'always'], // 规则为：需要结束分号，优先级为 error，即抛错
    // 当最后一个元素或属性与闭括号 ] 或 } 在 不同的行时，要求使用拖尾逗号
    // 当在 同一行时，禁止使用拖尾逗号。https://eslint.bootcss.com/docs/rules/comma-dangle
    'comma-dangle': ['error', 'always-multiline'],
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    'no-unused-vars': ['error', { args: 'after-used' }],
    // "plugin1/rule1": "error" 配置定义在插件中的一个规则的时候，必须使用 插件名/规则ID 的形式
    'prettier/prettier': 'error',
  },
  globals: {
    var1: 'writable', // 对 var1 这个全局变量允许重写
    var2: 'readonly', // 对 var2 这个全局变量只允许读取
    var3: 'off', // 不支持 var3 这个全局变量
  },
};
```
说一下可能配置较多的。

<!-- more -->

#### 1、extends

基础一些封装好的规则库，就会引入配置好的规则。比如示例里的 vue 规则，standard 规则。

#### 2、plugins

封装好的规则还不够，对于项目还有特定检测的，自己写插件去拓展，通过对传递来的 ast 对象处理，自己想要什么检测就写什么，灵活又强大。

#### 3、rules

自己的规则只有一两条和引用的规则库不太一样，直接这里配置就行了。有点像 extends 是 class，这个是写行内 style 覆盖样式。

#### 4、globals

前面提到我们会注入一些全局的环境变量。但是这个语法检测不知道啊，所以得告诉它，这是全局对象，合理的。

详细配置可看[官网配置](https://eslint.bootcss.com/docs/user-guide/configuring)。详细规则可看[官网规则](https://eslint.bootcss.com/docs/rules/)。

#### 5、eslint cli 命令

```bash
# 问答式新增配置文件
eslint --init

# 检测文件
eslint file1.js file2.js

# 检测文件夹
eslint lib/**

# 检测文件夹里的后缀匹配的文件
eslint --ext .jsx,.js lib/

# 加上会自动修复，一些简单的语法问题。比如单双引号，结尾分号
--fix 
```

**另外，可以建一份 .eslintignore 文件来声明不需要检查 lint 的文件。** 如果检测命令与 .eslintignore 上的文件有交集，此时会提醒加多个 `--no-ignore` 参数:  File ignored because of a matching ignore pattern. Use "--no-ignore" to override。

#### 6、加上 prettier

prettier 其实是单独的工具，也是对代码美化处理，难免和 eslint 有些重叠。官网的说法是：[Prettier vs. Linters](https://www.prettier.cn/docs/comparison.html)。
我的理解吧，就是：**eslint 为了代码合理，prettier 为了代码好看**。
官网也介绍了如何[给 eslint 加上 prettier 的配置](https://github.com/prettier/eslint-config-prettier)。就是给 eslint 配置继承 prettier 的规则库，用上 prettier 的插件，也挺简单。

当然 prettier 也有自己的配置文件，循例项目根目录创建一份 `.prettierrc.js`：
```js
module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
};
```

#### 7、prettier cli 命令

```bash
# 格式化文件夹
npx prettier --write src

# 只检查不格式化
npx prettier --check src
```

## 五、使用 husky + lint-staged 强制增量各类检查

在实际开发中，我们肯定是希望上面说的各种检查是自动，不用每次提醒自己要执行一下，以免不小心提交到仓库。那么，就在提交代码前给它默认做一次检查，而且是增量的，因为对于没有改动到的文件，就没必要再检查了。

#### 1、用 husky 给 git 加上 commit 触发事件

安装并初始化 [husky](https://typicode.github.io/husky/#/)：

```bash
npm install --save-dev husky
```

在 package.json 里添加脚 scripts，`"postinstall": "husky install"`。 这样可以在安装完依赖之后，初始化一下 husky。
当然在本项目刚用上 husky 的时候，要主动初始化一下：
```bash
npx husky install
```
然后执行
```bash
npx husky add .husky/pre-commit "npm test"
```
这样就会在项目根目录创建一个 `.husky` 的文件夹，里面有一份 `pre-commit` 文件，里面运行着 `npm test` 的命令。也就是接着把 npm test 改为 lint 操作就行。但是一般我们没有直接这样做。

#### 2、用 lint-staged 对改动文件做检测

我们知道 eslint 或者 prettier 其实是可以指定哪些文件做处理的。用 [lint-staged](https://github.com/okonet/lint-staged) 就可以帮我们做到只针对 git add 的文件进行检查，不需要全量检查。

```bash
npm install --save-dev lint-staged
```

在 package.json 里加上这么个字段：

```bash
{
  "lint-staged": {
    "*.{js,vue}": [
      "prettier --write",
      "eslint"
    ]
  }
}
```

然后就有这个功能，执行：`git add file1.ext file2.ext`，
就会接着执行： `your-cmd（prettier或eslint） file1.ext file2.ext`
这样就可以只检测新增的文件，不需要每次都全量。

## 六、使用 @commitlint/cli 规范提交信息

提交信息也是个技术活，和代码风格一样，最好也是有统一格式，这里使用 [@commitlint/cli](https://commitlint.js.org/#/guides-local-setup) 来约束。

```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli
```
生成配置，指定规则：
```bash
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
```
接着还是搭配 husky：
```bash
npx husky add .husky/commit-msg "npx --no -- commitlint --edit ${1}"
```

这样就会在项目根目录创建一个 `.husky` 的文件夹，里面有一份 `commit-msg` 文件，里面运行着 `npx --no -- commitlint --edit ${1}` 的命令。根据实际需要，可以自行添加[命令行参数](https://commitlint.js.org/#/reference-cli)。

这里记录下基础的提交类型（网上抄的）：

* **feat：** 修改/增加新功能
* **fix：** 修改 bug 的变更
* **docs：** 文档相关变更
* **style：** 不影响代码含义的变更（空白、格式、缺少符号等）
* **refactor：** 代码重构变更
* **perf：** 改进性能的变更
* **test：** 添加/修改现有的测试
* **chore：** Build, .gitignore 或辅助工具、库（如文档生成）等变更

## 七、使用 埋点（性能 + 错误） 让项目运行更好

要想一个项目长治就好，需要我们长期去治理。要让我们的服务问题少，体验好。我们就必须要迅速主动地解决问题，等用户反馈再去修改修复就太慢了，可能人家直接弃坑了。
所以我们需要做一些埋点数据，一般用途有：

#### 1、错误监控

可以在 `window.onerror` 监听全局错误。或者再觉得可能会出错的地方 `try catch` 一下，然后上报错误。当然一般这种我们都知道可能会有问题主动去 catch 了，一般也是用来优化流程。减少可能的 catch 事件。这里简单提一下，不展开说了。

#### 2、性能监控

然后就是老生常谈的性能问题啦，收集页面的各项性能数据，然后分析优化，等等。具体指标可以看看这篇文章《[前端性能监控](/2021/01/09/performance-api/)》。当然根据实际需求，还会有各式各样的指标，这里就不展开说了。

#### 3、业务监控

然后就是 pv/pu 啊，日活多少啊这种。或者一些场景分析，比如进入一个页面停留多久啊，完成一个功能事项点了多少下啊。这些比较针对性的，一般都是核心场景，定向地分析了模块功能才埋的点。

至于埋点工具，公司如果有封装的话，就用公司的。如果没有的话，错误监控可以看看 [Sentry](https://sentry.io/welcome/)。业务分析可以看看 [Google Analytics](https://developers.google.cn/analytics?hl=zh-cn)。一般这种都是成套，要搭配有可配置的可视化界面 [Grafana](https://grafana.com/)、[kibana](https://www.elastic.co/cn/what-is/kibana) 之类的，是个大工程，一般都有专人负责这块事项。我们只需要埋好点，然后懂得分析数据进而改进系统就行。


到此大致列了一个项目从无到运行所需要的一些工程化工作。每个点再细化其实还是有不少东西可挖。这些就是具体应用场景再去配置啦。这里记录一下整体框架的活，方便日后再使用。

* * *
*****

***以下内容请移步《[从零搭建前端工程（上）](/2023/03/06/fontend-engineering/)》阅读***
***1. 使用 webpack 打包（编译）vue***
***2. 使用 babel 处理 js***
***3. 使用 webpack-dev-sever 做热调试开发***