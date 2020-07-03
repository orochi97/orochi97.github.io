---
title: 关于缓存的几个关键词
date: 2020-07-02 23:32:38
categories:
- 开发
- 前端
---

缓存可以看成浏览器开辟了一个区域来放缓存的东西。有些放在内存有些放在硬盘。
从缓存返回的状态码为304。缓存分两种

#### 强缓存：
设定一个期限，期限的重复访问都会去缓存获取，有两个字符来表示这个期限：
__http1__的是__Expires__，Expires: Wed, 22 Oct 2018 08:41:00 GMT表示资源会在 Wed, 22 Oct 2018 08:41:00 GMT 后过期，需要再次请求。
__http1.1__的是__Cache-Control__，当Cache-Control:max-age=300，表示5分钟缓存时间。还有其他几个值。直接看另外一个比较有影响的：no-cache。这个看做就是不强缓存，继续去判断协商缓存。

Cache-Control优先级高于Expires，现在基本都是http1.1，Expires也就是兼容用。

#### 协商缓存：
首次访问资源，响应头会返回标识符（__Last-Modified/ETag__），下次访问请求头会带上标识符（__If-Modified-Since/If-None-Match__），去服务器查询是否启用缓存。也就是请求还是要发，但是至少东西是省发了。

响应头和请求头的缓存标识符字段名不一样，但值一样。

Last-Modified和If-Modified-Since，就是资源最后修改时间，发送到服务器去判断有没有更新，无则返回304。
缺点就很明显，如果文件有被打开或者别的什么改动了时间，那缓存失效。同时最低也是精确到秒，一秒内的改动判断不出来。

ETag和If-None-Match
Etag可以看成根据文件算出的哈希，唯一的，文件一改肯定就改。
缺点就是要消耗资源去计算。

当然ETag明显精度高于Last-Modified，所以优先级也是ETag高。

#### 应用中的策略
设定一个期限很大的强缓存，如 max-age=31536000 (一年)。文件通过打包工具生成出来都带上哈希。只要文件内容不改哈希就不改，请求的地址就不改，命中强缓存。改了内容自然连请求地址都改了，就会返回新文件。

#### 代码的角度，
看到的资料几乎都是服务端的，比如node的express可以在请求资源的返回里设置请求头
```js
app.get('/foo.js', function (req, res) {
  res.set({
    'Content-Type': 'text/javascript',
    'Cache-Control': 'no-cache',
    'ETag': '12345'
  })
  res.sendFile('foo.js')
})

```
当然每个都这样搞未免太麻烦了，在静态资源那里可以统一设置
```js
const options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}

app.use(express.static('public', options))

```
上面是默认设置，自己也可以修改。

至于前端的设置，似乎只有
```xml
<meta http-equiv="expires" content="Wed, 20 Jun 2007 22:33:00 GMT">
<meta http-equiv="cache-control" content="no-cache">
```
尝试设置为强缓存好像没生效。而且这还是只是针对该份html，其他的资源似乎无能为力，可能也是了解不够。

#### 其他
上面提到的利用打包工具来做这个哈希名字的事，首先想到的当然是webpack
```js
module.exports = {
  output:{
    path:path.join(__dirname, '/dist/js'),
    filename: '[name].[chunkhash].js',
  }
}
```
都知道输出文件名字可配置成带哈希字符的，也就是上面的 [chunkhash] 部分，这里有三个值可以写：
**hash、chunkhash、contenthash**

__hash：__利用整个工程内容来计算，所以改一点点全部都改。
__chunkhash：__计算的单独chunk（这个是webpack的概念，相当于每个要输出的文件，一个entry对应一个chunk）的哈希。
__contenthash：__在使用抽离的css插件的时候，抽离的css文件会与引用它的js共用一份chunkhash，那js一改css也得改。当然反过来也是。此时用contenthash就只针对该份文件内容做哈希，就不会互相影响到了。