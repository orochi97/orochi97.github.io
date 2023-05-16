---
title: 文件切片上传（断点续传）
date: 2023-05-13 22:25:47
updated: 2023-05-15 21:19:18
categories:
- 开发
- 前端
---

上传文件体积一大，要等很久。如果只是水管小，等一会也就算了。但是如果网络差，上传到 99% 突然断网了又重新开始，就比较难受了。所以又有了文件切片进行断点上传的方法。

上传的文件对象是一个 [File](https://developer.mozilla.org/zh-CN/docs/Web/API/File) 对象，然后它是 [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) 对象的一个子类。再然后它有一个 [slice](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob/slice) 方法，用这个方法就可以对文件进行切片，就和数组的这个方法一样。用法如示例。

话不多说直接上代码（里面代码是问了 chatgpt 然后改的，哈哈）。把下面两份代码分别保存为 `index.html` 和 `server.js`，安装好依赖，然后启动执行 `node server.js`，访问 `http://localhost:3000`。

前端也大概美化了一下上传组件，支持点击选择文件或者拖拽文件上传。原生的 `<input type="file" ></input>` 组件的样式应该没人用吧，那么丑...。其中的 loading 效果出自网上大佬的《[纯css实现117个Loading效果](https://juejin.cn/post/7037036742985121800)》，里面挺多效果不错的。

<!-- more -->

#### 前端代码

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>upload</title>
<style>
.upload {
  padding: 10px;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: gray;
  font-size: 24px;
}
#upload-target {
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
#alert {
  display: none;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
}
#loading-frame {
  width: 100%;
  height: 100%;
  background-color: #ccc;
  opacity: 0.7;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
#text {
  position: absolute;
  text-align: center;
  bottom: 10px;
  width: 100%;
  color: black;
  font-size: 16px;
}
#progress {
  position: absolute;
  bottom: 10px;
  font-size: 22px;
}
.loading,
.loading > div {
  position: relative;
  box-sizing: border-box;
}

.loading {
  display: block;
  font-size: 0;
  color: #000;
}

.loading.la-dark {
  color: #333;
}

.loading > div {
  display: inline-block;
  float: none;
  background-color: currentColor;
  border: 0 solid currentColor;
}

.loading {
  width: 64px;
  height: 64px;
}

.loading > div {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin-top: -4px;
  margin-left: -4px;
  border-radius: 100%;
  animation: ball-spin-clockwise 1s infinite ease-in-out;
}

.loading > div:nth-child(1) {
  top: 5%;
  left: 50%;
  animation-delay: -0.875s;
}

.loading > div:nth-child(2) {
  top: 18.1801948466%;
  left: 81.8198051534%;
  animation-delay: -0.75s;
}

.loading > div:nth-child(3) {
  top: 50%;
  left: 95%;
  animation-delay: -0.625s;
}

.loading > div:nth-child(4) {
  top: 81.8198051534%;
  left: 81.8198051534%;
  animation-delay: -0.5s;
}

.loading > div:nth-child(5) {
  top: 94.9999999966%;
  left: 50.0000000005%;
  animation-delay: -0.375s;
}

.loading > div:nth-child(6) {
  top: 81.8198046966%;
  left: 18.1801949248%;
  animation-delay: -0.25s;
}

.loading > div:nth-child(7) {
  top: 49.9999750815%;
  left: 5.0000051215%;
  animation-delay: -0.125s;
}

.loading > div:nth-child(8) {
  top: 18.179464974%;
  left: 18.1803700518%;
  animation-delay: 0s;
}

.loading.la-sm {
  width: 16px;
  height: 16px;
}

.loading.la-sm > div {
  width: 4px;
  height: 4px;
  margin-top: -2px;
  margin-left: -2px;
}

.loading.la-2x {
  width: 64px;
  height: 64px;
}

.loading.la-2x > div {
  width: 16px;
  height: 16px;
  margin-top: -8px;
  margin-left: -8px;
}

.loading.la-3x {
  width: 96px;
  height: 96px;
}

.loading.la-3x > div {
  width: 24px;
  height: 24px;
  margin-top: -12px;
  margin-left: -12px;
}

@keyframes ball-spin-clockwise {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  20% {
    opacity: 1;
  }

  80% {
    opacity: 0;
    transform: scale(0);
  }
}
</style>
</head>
<body>
  <div class="upload" id="upload">
    click or drop file here
    <div id="upload-target"></div>
    <div id="alert">
      <div id="loading-frame">
        <div class="loading">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      <p id="text"></p>
      <progress id="progress" max="100"></progress>
    </div>
  </div>
  <script>
    // 这个方法可以在页面没有上传元素场景下，自行触发上传事件，也就是文件选择框，然后返回值就是上传的文件流
    function fileUpload() {
      return new Promise((resolve, reject) => {
        const $file = document.createElement('input');
        $file.type = 'file';
        $file.addEventListener('change', (e) => {
          resolve(e.target.files[0]);
        });
        $file.click();
      });
    }
    // 将上传文件根据设定的大小切片
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
    // 递归，把切片一个个按顺序上传
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

    const $alert = document.getElementById('alert');
    const $progress = document.getElementById('progress');
    const $text = document.getElementById('text');
    const $upload = document.getElementById('upload-target');

    const handUpload = async (file) => {
      $alert.style.display = 'block';
      $text.innerText = `${0}%`;
      try {
        console.time('uploadTask');
        await uploadFileChunks(file, chunkSize, '/api/slice/upload', (currentChunk, totalChunks) => {
          const value = Math.round(currentChunk / totalChunks * 100);
          $progress.value = value;
          $text.innerText = `${value}%`;
        });
        console.timeEnd('uploadTask');
        // 这个延迟只是为了能有显示到 100% 的效果
        setTimeout(() => {
          $alert.style.display = 'none';
        }, 1000);
      } catch(_) {}
    };

    $upload.onclick = async function(e) {
      const file = await fileUpload();
      handUpload(file);
    };
    // 一定要加这个 ondragover 事件，然后 preventDefault，不然文件拖到浏览器就变成下载了
    $upload.ondragover = async function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
    $upload.ondrop = async function(e) {
      e.preventDefault();
      const file = e.dataTransfer.items
        ? e.dataTransfer.items[0].getAsFile()
        : e.dataTransfer.files[0];
      handUpload(file);
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
    if (!uploadHash[filename]) uploadHash[filename] = { total, list: [] };
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