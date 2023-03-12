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
npm install nw-extract
```

### Extract files
Then to extract data from game intall dir

```sh
nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World"
```

The tool accept sfollowing arguments and options
```
Arguments:
  input-dir             New World game folder

Options:
  -o,--output <path>    Output folder (default: "./nw-extract-out")
  -f,--filter <filter>  Filter glob pattern (default: [])
  --lib <path>          Directory where oo2core_8_win64.dll is located
  -h, --help            display help for command

Example:
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World"
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World" -f **/*.datasheet
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World" -f **/*.datasheet,**/*.loc.xml
  nw-extract "C:\Program Files (x86)\Steam\steamapps\common\New World" -f **/*.datasheet -f **/*.loc.xml
```

### Convert Files
To convert extracted files to another format

```sh
nw-convert "./nw-extract-out" -o OUT_DIR -c CONVERSION
```

The tool accepts following arguments and options
```
Arguments:
  input-dir               Location of extracted New World folder

Options:
  -o,--output <path>      Output forlder for converted files (default: "./nw-convert-out")
  -u,--update             Overrides previously converted files (default: false)
  -c,--convert <convert>  Conversion directives (default: [])
  -h, --help              display help for command

Example:
  nw-convert ./nw-extract-out -o ./nw-convert-out -c "json:**/*.datasheet"
  nw-convert ./nw-extract-out -o ./nw-convert-out -c "json:**/*.loc.xml"
  nw-convert ./nw-extract-out -o ./nw-convert-out -c "png:**/*.dds"
```
