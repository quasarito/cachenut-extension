# Cache Nut

Cache Nut is a browser extension for Firefox and Chromium-based browsers that
allows copy-pasting between different types of browsers across computers.
The copied data can be page content, tab locations, and image or link URLs.

## Build

Edit the source file `Config.ts` and set the URL of the Cache Nut server:
```
  baseUrl: 'http://localhost:3000/api',
```

Install dependencies:
```bash
$ yarn install
```

Build extension for Chrome, Firefox, Opera:
```bash
$ yarn build
```
Build artifacts will be created in `extension` folder.

## License

MIT