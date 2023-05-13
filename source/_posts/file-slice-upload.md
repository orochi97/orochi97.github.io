---
title: 文件切片上传（断点续传）
date: 2023-05-13 22:25:47
categories:
- 开发
- 前端
---

上传文件体积一大，要等很久。如果只是水管小，等一会也就算了。但是如果网络差，上传到 99% 突然断网了又重新开始，就比较难受了。所以又有了文件切片进行断点上传的方法。

上传的文件对象是一个 [File](https://developer.mozilla.org/zh-CN/docs/Web/API/File) 对象，然后它是 [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) 对象的一个子类。再然后它有一个 [slice](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob/slice) 方法，用这个方法就可以对文件进行切片，就和数组的这个方法一样。用法如示例。

话不多说直接上代码（里面代码是问了 chatgpt 然后改的，哈哈）。把下面两份代码分别保存为 `index.html` 和 `server.js`，安装好依赖，然后启动执行 `node server.js`，访问 `http://localhost:3000`。

<!-- more -->

#### 前端代码

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>upload</title>
</head>
<body>
  <input id="file" type="file"></input>
  <script>
    function sliceFile(file, chunkSize) {
      const fileSize = file.size;
      let offset = 0;
      const chunks = [];

      while (offset < fileSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        chunks.push(chunk);
        offset += chunkSize;
      }

      return chunks;
    }

    function uploadFileChunks(file, chunkSize, uploadUrl) {
      const chunks = sliceFile(file, chunkSize);
      const totalChunks = chunks.length;
      let currentChunk = 0;

      function uploadNextChunk() {
        const chunk = chunks[currentChunk];
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('index', currentChunk);
        formData.append('total', totalChunks);
        formData.append('filename', file.name);

        fetch(uploadUrl, {
          method: 'POST',
          body: formData
        })
        .then(response => {
          if (response.ok) {
            currentChunk++;
            if (currentChunk < totalChunks) {
              uploadNextChunk();
            } else {
              console.log('File upload complete!');
            }
          } else {
            console.error('Error uploading file chunk:', response.statusText);
          }
        })
        .catch(error => {
          console.error('Error uploading file chunk:', error);
        });
      }

      uploadNextChunk();
    }

    const chunkSize = 1 * 1024 * 1024; // 以 1MB 为单位切片

    document.getElementById('file').onchange = function(e) {
      uploadFileChunks(e.target.files[0], chunkSize, '/api/slice/upload');
    }
  </script>
</body>
</html>
```

#### 后端代码

这里用了 node，我也只会node。用了 express 和 fs-extra，先安装一下。

```bash
npm i express fs-extra
```

```js
const path = require('path');
const fse = require('fs-extra');
const express = require('express');
const multer  = require('multer');

const app = express();
const uploadFileDir = path.resolve(process.cwd(), 'uploadfile');
const uploadMulter = multer({ dest: uploadFileDir });

// 合并切片文件
function mergeChunks(chunksDir, destFilePath) {
  let resolve, reject;
  const chunkFiles = fse.readdirSync(chunksDir).sort((a, b) => a - b);
  const destStream = fse.createWriteStream(destFilePath);

  destStream.on('error', (error) => {
    reject && reject(error);
  });

  const writeNext = () => {
    if (!chunkFiles.length) {
      resolve && resolve();
      return destStream.end();
    }
    const chunkFile = chunkFiles.shift();
    const readStream = fse.createReadStream(path.join(chunksDir, chunkFile));
    readStream.on('end', () => {
      writeNext();
    });
    readStream.on('error', (error) => {
      reject && reject(error);
    });
    readStream.pipe(destStream, { end: false });
    // end是pipe方法的可选参数，用于指定在写入完所有数据后，是否自动关闭写入流。
    // 如果end为true，则在写入完所有数据后，写入流会自动关闭。
    // 如果end为false，则写入流不会自动关闭，需要手动调用end方法来关闭写入流。
    // 在上面的代码中，end被设置为false，这是因为我们要在所有切片文件都被写入到目标文件后，手动调用end方法来关闭写入流。
    // 如果end被设置为true，则在写入完第一个切片文件后，写入流就会自动关闭，导致后续的切片文件无法写入目标文件。
    // 因此，当我们需要手动控制写入流何时关闭时，需要将end设置为false。
  };
  writeNext();

  return new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject
  });
}

const uploadHash = {};
app.post('/api/slice/upload', uploadMulter.any(), (req, res) => {
  let { filename, total, index } = req.body;
  total = parseInt(total);
  index = parseInt(index);
  ext = path.parse(filename).ext;
  filename = path.parse(filename).name;

  if (uploadHash[filename] && uploadHash[filename].list.includes(index)) {
    return res.send('成功已上传');
  }

  const newName = path.join(uploadFileDir, filename, `${index}`);
  fse.move(req.files[0].path, newName, { overwrite: true }, (err) => {
    if(err) return res.send('上传失败');

    // 把已上传成功的文件记录起来
    if (!uploadHash[filename]) uploadHash[filename] = { total, list: [index] };
    uploadHash[filename].list.push(index);

    // 接受的文件合集已完整，合并切片文件
    if (uploadHash[filename].list.length === total) {
      return mergeChunks(
        path.join(uploadFileDir, filename),
        path.join(uploadFileDir, filename + ext),
      )
        .then(() => {
          // 注释掉下面删除语句，页面刷新再次请求可看到直接返回成功
          delete uploadHash[filename];
          res.send('成功合并');
        })
        .catch((error) => {
          res.send('上传失败');
        });
    }
    return res.send('成功');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(3000, () => {

  const host = server.address().address;
  const port = server.address().port;
 
  console.info('应用实例，访问地址为 http://%s:%s', host, port);
});
```

其实感觉前端能做的也就是切片然后分多次上传。重点在于后端需要保存后，记录已上传的片段。这里只是简单地记录在内存，而且也只是简单地用序号做 hash 标识，生产使用的话应该是用文件内容生成 md5 来做唯一标识。

同时也有很多意外情况需要处理，过期文件，反复上传什么的都要考虑。

网上有个 [resumable.js](https://github.com/23/resumable.js) 是专门做这个工作的，稍微看了一下，示例还挺齐全，前后端用法都有。记录一下，后面真有用到再看看。