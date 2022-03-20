---
title: vite server运行时替换请求路径
date: 2022-03-19 15:32:20
categories:
- 开发
- 前端
---

[介绍](https://vitejs.cn/guide/)
[仓库](https://github.com/vitejs/vite)（当前[commit](https://github.com/vitejs/vite/tree/12be4d22405c85235e0842e5ebbc7ca6b1356a22)）


**核心吸引力：
使用浏览器原生ES模块功能，不做耗时的打包，达到极速的启动速度。同时达到真正的按需加载。**

问题一：
第三方不是Esmodule的依赖库要预先处理成ES输出，暂存起来。使用预构建，将处理结果打包输出到node_modules/.vite。记录在 `_metadata.json` 文件上，这里了称为“优化依赖元数据”。


问题二：
依赖资源的请求。我们代码里写的都是分散地对ES module的引用，但实际请求的确实只有一份打包合并的文件。所以必然在运行时挟持了请求路径。这里借助一下 [modern.js](https://modernjs.dev/docs/guides/usages/debug/unbundled#%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86%E5%92%8C%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9) 官网的文字给予解释。vite server也是这么处理的。

{% asset_img vite1.jpg vite1 %}


<!--more-->

[点击这里打开单独pdf页面](https://file.cchealthier.com/file/blog/vite-server-import/vite.pdf)

<!-- <object data="/2022/03/19/vite-server-import/vite-server-import.pdf" type="application/pdf" width="100%" height="1000px"> -->
{% pdf https://file.cchealthier.com/file/blog/vite-server-import/vite.pdf %}

</br>
</br>
</br>
