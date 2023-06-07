---
title: Hexo结合Github Page注意点
date: 2020-05-03 17:30:27
categories:
- 开发
- 前端
tags: 
 - hexo
comments: true
---

新手记录一些使用 hexo 和 Github Page 搭建个人空间遇到的。
其实不难，只是为了找个地方记录下来，方便后面可能的再次搭建。

## 一、Github Page

### 1、使用 username.github.io

如果想通过 username.github.io 就访问到相应的静态页面，那么必须有一个 username.github.io 名字的项目。
username 指的是个人或者组织的名字。如下图第一个红框是用户的名字，则第二个红框处必须一模一样。
{% asset_img img1.png github_page %}

### 2、使用 username.github.io/projectName

主的 username.github.io 域名只对应一个项目，其他项目就通过 username.github.io/项目名 来访问。

### 3、使用自定义域名

由于是直接在阿里云买的域名，所以对应的阿里云的操作，其他平台不确定。

- 首先购买一个域名，进入域名服务
{% asset_img img2.png 阿里云域名 %}

- 添加下图两道记录，1的ip是 ping 2 的域名出来
{% asset_img img3.png 阿里云域名2 %}

- 进入 github 项目，右上方的 setting，到下图的地方设置相应域名。这个博客域名是买的域名的二级域名。
{% asset_img img4.png custom_domain %}

## 二、Hexo

### 1、设置_config.yml

- 打开 hexo 项目下的 _config.yml，进行下图设置，git的地址就是使用的工程地址。
{% asset_img img5.png _config.yml %}

### 2、CNAME

- 上面的工程 setting 部分，实际上就是在工程根目录创建了一份CNAME名字的文件，没有后缀的文件类型。里面的内容为设置的那个二级域名，也就是原来是访问 username.github.io 地址的，就会跳到自定义的域名。

- 为了防止每次部署都会清除掉该文件，从而要重复设置，可以将 CNAME 文件防止到 source 文件里，到时会依样拷贝过去。

----

相关传送门：
[Hexo](https://hexo.io/zh-cn/)
[Github Page](https://pages.github.com/)
