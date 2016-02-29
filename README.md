# offline-first-seed
Minimalistic JavaScript offline first application seed using PouchDB and ServiceWorker

Uses Express/Node for server. Runs PouchDB both on server and client to allow working offline and sync when online
Uses ServiceWorker to allow running page/app while offline

# Usage

Install dependencies, under windows may require node-gyp
```bash
npm install
```

To start server
```bash
npm start
```

Now you can go to http://localhost:3000/

- Allows adding and removing messages
- Shows if in sync or disconnected
- Shows log of events/errors from PouchDB



