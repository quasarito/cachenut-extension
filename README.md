# Cache Nut

Cache Nut is a browser extension for Firefox and Chromium-based browsers that
allows copy-pasting between different types of browsers across computers.
The copied data can be page content, tab locations, and image or link URLs.

## Build

Edit the source file `Config.ts` and set the URL of the Cache Nut server:
```
  baseUrl: 'http://localhost:3000/api',
```
Pre-requisites:
- nodejs v18
- yarn 4
```bash
# install nvm for nodejs
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
# after installation is complete, open a new terminal so nvm is available...
$ nvm install 18
$ nvm use 18
# install yarn
$ npm install -g yarn
```

Required by third-party library `node-sass` for build:
- python3
- make
```bash
# on Debian-based systems
$ sudo apt install python3 build-essential
```

Clone cachenut project:
```bash
$ git clone https://github.com/quasarito/cachenut-extension.git
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