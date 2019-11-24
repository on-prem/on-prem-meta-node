# Official On-Prem Meta REST API client and helper library

[![GitHub release](https://img.shields.io/github/release/on-prem/on-prem-meta-node.svg)](https://github.com/on-prem/on-prem-meta-node) ![Build status](https://github.com/on-prem/on-prem-meta-node/workflows/Node%20CI/badge.svg?branch=master) ![Downloads](http://img.shields.io/npm/dm/on-prem-meta.svg "On-Prem Meta")

  1. [Requirements](#requirements)
  2. [Installation](#installation)
  3. [Environment](#environment)
  4. [Usage](#usage)
  5. [Testing](#testing)
  6. [License](#license)

# Requirements

  * NodeJS `v12.x` (tested)
  * This library requires the `needle` and `form-data` node modules

# Installation

```
npm install @on-prem/on-prem-meta
```

or

```
git clone https://github.com/on-prem/on-prem-meta-node
cd on-prem-meta-node
npm install
```

# Environment

**Required** environment variables:

* `export ON_PREM_META_HOST=meta.yourdomain.com:443`
* `export ON_PREM_META_APITOKEN=yourtoken`

**Optional** environment variables:

If you're using a self-signed certificate:

* `export ON_PREM_META_INSECURE=true`

To manage the _Admin API_ instead of the _Meta API_:

* `export ON_PREM_META_PREFIX=admin`

To obtain an _On-Prem Meta_ OVA, please visit [https://on-premises.com](https://on-premises.com)

# Usage

1. [CoffeeScript](#coffeescript)
2. [NodeJS](#nodejs)

## CoffeeScript

1. Require the library as you would any other node module:

```coffee
meta = require 'on-prem-meta'
```

or

```coffee
meta = require './src/on-prem-meta'
```

2. Define your request parameters

```coffee
apiParams =
  method: 'GET'
  endpoint: 'settings/license'
```

3. Build an API request and make an API call

```coffee
meta.buildRequest apiParams, (error, result) =>
  unless error
    meta.apiCall result, (err, res, data) ->
      console.log "ERROR:", err
      console.log "RESULT:", res
      console.log "DATA:", data
```

### Examples

Make a `GET` request with query parameters (ex: `&time=day`)

```coffee
apiParams =
  method: 'GET'
  endpoint: 'audit'
  query:
    time: 'day'
meta.buildRequest apiParams, (error, result) =>
  unless error
    meta.apiCall result, (err, res, data) ->
      console.log data
```

Make a `POST` request with a file upload and query parameters

```coffee
apiParams =
  method: 'POST'
  endpoint: 'settings/license'
  files:
    settings:
      filename: 'license.asc'
      data: fs.readFileSync('./path/to/license.asc')
  query:
    id: 1
meta.buildRequest apiParams, (error, result) =>
  unless error
    meta.apiCall result, (err, res, data) ->
      console.log data
```

Change a NodeJS `http.request()` option (example: `family` (for IPv6))

```coffee
meta.options.agent = new http.Agent { family: 6 }
meta.buildRequest undefined, (error, result) =>
  unless error
    meta.apiCall result, (err, res, data) ->
      console.log data
```

## NodeJS

```js
meta = require('on-prem-meta');
```

or

```js
meta = require('./lib/on-prem-meta');
```

2. Define your request parameters

```js
var apiParams = { method: 'GET', endpoint: 'settings/license' };
```

3. Build an API request and make an API call

```js
meta.buildRequest(apiParams, (error, result) => {
  if (!error) {
    return meta.apiCall(result, function(err, res, data) {
      console.log("ERROR:", err);
      console.log("RESULT:", res);
      return console.log("DATA:", data);
    });
  }
});
```

### Examples

Make a `GET` request with query parameters (ex: `&time=day`)

```js
apiParams = {
  method: 'GET',
  endpoint: 'audit',
  query: {
    time: 'day'
  }
};

meta.buildRequest(apiParams, (error, result) => {
  if (!error) {
    return meta.apiCall(result, function(err, res, data) {
      return console.log(data);
    });
  }
});
```

Make a `POST` request with a file upload and query parameters

```js
apiParams = {
  method: 'POST',
  endpoint: 'settings/license',
  files: {
    settings: {
      filename: 'license.asc',
      data: fs.readFileSync('./path/to/license.asc')
    }
  },
  query: { id: 1 }
};
meta.buildRequest(apiParams, (error, result) => {
  if (!error) {
    return meta.apiCall(result, function(err, res, data) {
      return console.log(data);
    });
  }
});
```

Change a NodeJS `http.request()` option (example: `family` (for IPv6))

```js
meta.options.agent = new http.Agent({ family: 6 });
meta.buildRequest(void 0, (error, result) => {
  if (!error) {
    return meta.apiCall(result, function(err, res, data) {
      return console.log(data);
    });
  }
});
```

# Testing

To run the tests, type:

```
npm test
```

# License

[MIT License](LICENSE)

Copyright (c) 2019 Alexander Williams, Unscramble <license@unscramble.jp>
