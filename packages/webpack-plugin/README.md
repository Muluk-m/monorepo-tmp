# @muluk/upload-sourcemap-plugin

用于在生产环境构建时自动上传 source-map 文件，并删除

# example

```js
import { UploadSourcemapMapPlugin } from '@muluk/upload-sourcemap-plugin';

new UploadSourcemapMapPlugin({
  project: 'platform', // 用于标识前端项目
  uploadUrl: 'https//127.0.0.1/tools/upload' // 上传地址
  version: 'v1' // sourcemap 对应的版本号，不传默认为 HEAD commit-hash
})
```
