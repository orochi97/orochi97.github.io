---
title: nginx 的基础用法 & linux（centos）下支持 https 和 http2 
date: 2023-04-21 21:33:48
updated: 2023-06-07 00:05:36
categories:
- 开发
- 服务
tags:
- nginx
---

其实之前写过一篇相关的《[记录下 nginx 使用配置](/2022/03/26/nginx/)》，关于 nginx 的一些稍微复杂的场景。然后发现日常的基础用法，反而记不住。这里就记录一下。

安装，mac 可以用 brew 下载。windows 的也很简单，去[官网](http://nginx.org/en/download.html)下载个压缩包就行了。至于 linux 的，就网上搜搜啦，我记得也很简单。

```bash
# 安装
brew install nginx

#查看
brew info nginx
```

查看信息，可以看到配置文件在 `/opt/homebrew/etc/nginx/nginx.conf`。

命令
```bash
# 启动
nginx

# 刷新，改了 nginx.conf 文件，要重新生效
nginx -s reload

# 关闭
nginx -s stop
```

默认端口是 8080。所以直接访问本地地址 `http://localhost:8080/`，看到有显示 **Welcome to nginx!** 字样就是启动成功了。

其实 nginx.conf 已经写了例子和注释，这里只是稍微补充点。

root：资源文件夹
index： 默认的 index 文件
```yaml
location / {
  root   /电脑地址/nginx;
  index  index.html index.htm;
}
```

如果要配置不同路由访问不同的文件，`root` 要改成 `alias`，比如访问 `http://localhost:8080/page`
```yaml
location /page {
  alias /电脑地址/nginx;
  index page.html;
}
```

当然最好是写个兜底返回。在 vue 或者 react 使用 router 时，兜底返回默认 index.html。不然每增加一个路由就要写多一个配置很麻烦。
```yaml
location ~* ^/* {
  root   /电脑地址/nginx;
  try_files $uri $uri/ /index.html;
}
```

**注意**
root 与 alias
两者区别在于 nginx 如何解释 location 后面的 url

**root:**
语法：root path
默认值：root html
配置段：http、server、location、if
处理结果：root 路径＋ location 路径

**alias:**
语法：alias path
配置段：location
处理结果：使用 alias 路径替换 location 路径

**所以用正则匹配写路径的要注意写好 root 或 alias，不然找不到资源就会出现 403！**

可以写多个server，启动多个服务
```yaml
server {
  listen       3000;
  server_name  0.0.0.0;

  location / {
    root   /电脑地址/nginx;
    index  3000.html 3000.htm;
  }
}
```

代理 ~ 为区分大小写，~*为不区分大小写，其他符号则请查询官网啦。
```yaml
location ~ /api/* {
  proxy_pass   http://localhost:3000;
}
```

https服务，声明好证书即可。这里只是把其中证书配置列出来，实际上 nginx.conf 的例子还有挺多配置，一般我们不是运维，应该默认就够了。作为调试用，可能都不需要启动到 https server。
```yaml
server {
  ssl_certificate      /电脑地址/nginx/cert/cert.pem;
  ssl_certificate_key  /电脑地址/nginx/cert/server.key;
}
```

开启文本压缩
```yaml
http {
  gzip on;
  # 压缩比例，比例越大，压缩时间越长。默认是1
  gzip_comp_level 6;
  # 哪些文件可以被压缩
  gzip_types text/xml text/plain text/css application/javascript application/x-javascript application/rss+xml;
}
```

linux 下支持 https 和 http2，也是网上搜集的，实操了可以，这里记录一下。

```bash
# 安装依赖
yum -y install gcc zlib zlib-devel pcre-devel openssl openssl-devel
# 解压缩
tar -zxvf nginx-1.23.4.tar.gz
cd nginx-1.23.4
# 执行配置
./configure --with-http_ssl_module --with-http_v2_module
# 编译安装
make
make install
```

```bash
# 默认安装在
/usr/local/nginx
# 启动
/usr/local/nginx/sbin/nginx
# 刷新配置启动
/usr/local/nginx/sbin/nginx -s reload
# 关闭
/usr/local/nginx/sbin/nginx -s stop
# 修改配置
vim  /usr/local/nginx/conf/nginx.conf
```
