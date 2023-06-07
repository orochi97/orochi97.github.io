---
title: 记录下 nginx 使用配置
date: 2022-03-26 11:44:19
categories:
- 开发
- 服务
tags:
- nginx
---

> [nginx](http://nginx.org/en/download.html)是一个高性能的HTTP和反向代理web服务器，同时也提供了IMAP/POP3/SMTP服务。

### 起因

上面是百度百科上的名词定义，就是个服务器容器。之前就听说很好用，配置也很简单，一直没弄过，这次刚好想把申请的域名拆二级子域名，可以做多个服务入口。

我这里是想把其中一个作为静态资源的域名。就是主服务和资源服务器是不同server启动的，意味要不同端口，一个80，另外一个就得是别的。不用代理的话，就会是一个是 “https：//xyz.com”，一个是 “https：//xyz:8080.com”，也没什么，就是比较难看。这还不是什么问题，主要是 https 端口就一个443，协议不同，https网站还不能请求http的资源。

那就只能统一入口了，然后做网络分发，一开始想的是做不同路径映射 “https：//xyz.com/main”，“https：//xyz.com/file”，这样子，返回不同服务，这样子也容易配置。后面觉得这样不够好看，这样需要改动服务的base入口，因为一开始就以根路径为入口。
而且“一个域名同时请求的资源有限，chrome是六个，文件请求可以配置成不一样的域名，不要带cookie等请求头，有助于性能优化”。当然在我这有点扯淡，远远不到要用这个性能优化的手段。不过配置成 “https：//www。xyz.com”，“https：//file.xyz.com”，这样就好看多了。就是要在阿里云申请多一个子域名的解析，不过也很简单，配置多一个“A”解析就行了。

### 配置

接着就是 nginx 怎么配了，一开始我还是不知道可不可以，直接看配置

<!--more-->

```yaml
user  root; # 一开始这里好像是 nobody，静态资源访问不行，要配置成 root
worker_processes  1;

events {
  worker_connections  1024;
}


http {
  include       mime.types;
  default_type  application/octet-stream;

  sendfile        on;

  keepalive_timeout  65;

  server {
   	listen       443 ssl; # nginx 监听443端口
   	server_name  www.cchealthier.com; # 该端口的服务名

   	ssl_certificate       ${cert.pem}; # 这里是 https 证书的绝对地址
   	ssl_certificate_key   ${server.key};

   	ssl_session_cache    shared:SSL:1m;
   	ssl_session_timeout  5m;

   	ssl_ciphers  HIGH:!aNULL:!MD5;
   	ssl_prefer_server_ciphers  on;

    location / { # 匹配访问的路径
      proxy_pass http://www.cchealthier.com:3333; # 导向真正想要访问的服务
    }
  }
  server {
   	listen       443 ssl;
   	server_name  file.cchealthier.com;

   	ssl_certificate       ${cert.pem}; # 这里是 https 证书的绝对地址
   	ssl_certificate_key   ${server.key};

   	ssl_session_cache    shared:SSL:1m;
   	ssl_session_timeout  5m;

   	ssl_ciphers  HIGH:!aNULL:!MD5;
   	ssl_prefer_server_ciphers  on;

   	location /file {
      alias ${cert.pem}; # 文件存放的绝对地址，这里就是纯粹当成服务静态资源访问
      autoindex on;
   	}

    location /another {
      proxy_pass http://file.cchealthier.com:4000;
      proxy_redirect off;
      proxy_set_header  Host    $host;
      proxy_set_header  X-Real-IP $remote_addr;
      proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header  X-Forwarded-Proto $scheme;

      client_max_body_size 0; # disable upload limit
    }
  }

}
```

### 总结

https只有443一个入口，所以这个肯定是留给 nginx 本身的。然后写两份 `server` 配置监听 `443` 端口。这个是我没想到可以这样做的，我以为监听同个端口会冲撞。
而且可以配置 `server_name` 判断是来自哪个域名的。这样就**达到同个端口不同域名导向不同服务**。

同时 “file.cchealthier.com” 还使用了不同路径导向，“/file” 访问的是图片等资源。“/another” 是搭的简易文件服务管理系统，因为需要操作上传等需要鉴权。所以这里用路径区分了不同系统。单纯的资源映射也算服务系统。

其中静态资源映射要能访问需要把最上面的 `user  root;` 配置成 `root`。

nginx 配置基本使用确实挺简单，当然我这里也只是使用了一点点皮毛应用，真正的生产运维肯定复杂得多。还有没想到的就是通过 https 网络分发，原来启动的 http 服务，也变成 https 了。
