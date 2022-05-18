# nw-extract

Library and tool to extract assets from New World game folder

## Requirements
- [Python](https://www.python.org/downloads/)
  - to automatically create Oodle DLL bindings. ([ffi-napi](https://www.npmjs.com/package/ffi-napi) and [node-gyp](https://github.com/nodejs/node-gyp) are used under the hodd)
- oo2core_8_win64.dll (Oodle compression)
  - This repository does not ship the oodle compression DLL. You have to own that dll (or search the web, but be careful, dont trust blindly any download website)
- [texconv.exe](https://github.com/microsoft/DirectXTex/releases)
  - should be available in your PATH, if you choose to convert DDS texture to any other format

## Installation (binary)

Install globally

```sh
npm install giniedp/nw-extract#main -g
```

Then to extract data from game intall dir

```sh
nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World"
```

The tool accept sfollowing arguments and options
```
Arguments:
  input-dir              New World game folder

Options:
  -o,--output            Output folder (default: "./nw-extract-output")
  -u,--update            force update (default: false)
  -f,--filter <type>     type of assets to extract
  --lib <path>           path to directory where oo2core_8_win64.dll is located (default: "")
  -h, --help             display help for command

Examples:
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World"
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World" -f "datasheet:json,icon:png"
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World" -f "datasheet:json,icon:png,image:png,locale"
```

## Installation (dependency)

Add dependency to your project

```sh
npm install giniedp/nw-extract#main -D
```

ES6 import

```js
import { extract, createFilter, createConverter } from 'nw-extract'
```

Execute aus you need

```js
extract({
  update: false,
  inputDir: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World",
  outputDir: path.join(process.cwd(), './output'),
  libDir: process.cwd(),
  filter: createFilter("datasheet"),
  converterFactory: createConverter("datasheet:json"),
  onProgress: (p) => {
    // track progress
  }
}).then(() => {
  // done
})
```
