---
title: nginx 的基础用法
date: 2023-04-21 21:33:48
categories:
- 开发
- 服务
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

如果要配置不同路由访问不同的文件，root 要改成 alias，比如访问 `http://localhost:8080/page`
```yaml
location /page {
    alias /电脑地址/nginx;
    index page.html;
}
```

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
