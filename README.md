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
- nodejs v20
- yarn 4

Install nvm for nodejs:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
``````

After installation is complete, **open a new terminal** so nvm is available.
```bash
nvm install 20
```
```bash
nvm use 20
```

Enable `yarn`:
```bash
corepack enable
```

Clone cachenut project:
```bash
git clone https://github.com/quasarito/cachenut-extension.git
```

Checkout build version branch. Use `main` branch for the latest development build.
```bash
git checkout v1
```

Install dependencies:
```bash
yarn install
```

Build extension for Chrome, Firefox, Opera:
```bash
yarn build
```
Build artifacts will be created in `extension` folder.

## License

MIT