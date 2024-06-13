# Current Thing Weather

Detects the Current Thing before it becomes the Current Thing.

## Install

First, you will need to **[install Sqlite](sqlite.md)**

Then, in your Node project, install the following package:

```bash
# npm
npm i -S @psysecgroup/current-thing-weather

#yarn
yarn add @psysecgroup/current-thing-weather
```

Finally, perform the following inside of your Node project:

```bash
echo 'GDELT_PATH=data' >> .env
echo 'GDELT_SQLITE_PATH=data/sqlite' >> .env
./update.sh
````

## Updating

To keep your news archive in sync, run the following command periodically:

```bash
./update.sh
````

## Development

### CLI

* `npm start`: Runs the standalone Current Thing Detector.
* `npm run dev`: Runs the source code and recompiles on code changes.
* `npm run lint`: Checks if your code is throwing syntax errors.
* `npm run test`: Runs tests on your code to make sure it's working.
* `npm run build`: Builds your TypeScript to a single JavaScript distribution.
* `npm run compile`: Lints, tests, and builds your JavaScript distribution.

### Questions

* Do we throw all generated Sqlite files into one singular mega file?
* Do we need a `threaded-sqlite-read`?
* How can we test data veracity after the sqlite files are generated?
* `threaded-sqlite-write`'s `startWriters`' doesn't appear to enjoy being concurrently called
* `threaded-sqlite-write` needs to be able to access it's `dist/insert.js` without having to bring it to the project's `dist`
* `threaded-sqlite-write` errors need to be surfaced better than `{ code: 'SQLITE_ERROR' }`