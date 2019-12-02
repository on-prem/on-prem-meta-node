(function() {
  //   Official On-Prem Meta REST API client and helper library
  //   https://on-premises.com

  //   Copyright (c) 2019 Alex Williams, Unscramble <license@unscramble.jp>
  //   MIT Licensed
  var createHash, createHmac, formData, fs, needle, options, settings;

  createHash = require('crypto').createHash;

  createHmac = require('crypto').createHmac;

  needle = require('needle');

  formData = require('form-data');

  fs = require('fs');

  needle.defaults({
    user_agent: 'nodeclient-on-prem-meta/1.5.0',
    response_timeout: 10000 // 10 seconds
  });

  exports.makeSHA256 = function(string) {
    return createHash('sha256').update(string).digest('hex');
  };

  exports.makeHMAC = function(string, key) {
    return createHmac('sha256', key).update(string).digest('hex');
  };

  // Global variables
  settings = {
    prefix: process.env.ON_PREM_META_PREFIX || "meta", // example: admin
    host: process.env.ON_PREM_META_HOST || (function() {
      throw "Environment variable 'ON_PREM_META_HOST' required"; // example: meta.yourdomain.com:443
    })(),
    insecure: process.env.ON_PREM_META_INSECURE === "true" ? false : true,
    tokenhash: this.makeSHA256(process.env.ON_PREM_META_APITOKEN || (function() {
      throw "Environment variable 'ON_PREM_META_APITOKEN' required"; // example: yourtoken
    })())
  };

  options = {
    rejectUnauthorized: settings.insecure
  };

  exports.settings = settings;

  exports.options = options;

  exports.buildRequest = function(params = {
      method: 'GET',
      endpoint: 'version'
    }, callback) {
    var data, endpoint, file, name, ref, ref1, ref2, val;
    endpoint = `/api/v1/${settings.prefix}/${params.endpoint}`;
    switch (params.method.toUpperCase()) {
      case 'GET':
        data = (ref = params.query) != null ? ref : {};
        data.hash = this.makeHMAC(`${params.method.toUpperCase()}${endpoint}`, settings.tokenhash);
        return callback(null, {
          method: params.method.toUpperCase(),
          uri: `https://${settings.host}${endpoint}`,
          data: data,
          options: options
        });
      case 'POST':
        data = new formData();
        data.append('hash', this.makeHMAC(`${params.method.toUpperCase()}${endpoint}`, settings.tokenhash));
        ref1 = params.query;
        // append params
        for (name in ref1) {
          val = ref1[name];
          data.append(name, val);
        }
        ref2 = params.files;
        // append files
        for (file in ref2) {
          val = ref2[file];
          data.append(file, val.data, val.filename);
        }
        options.headers = data.getHeaders();
        return callback(null, {
          method: params.method.toUpperCase(),
          uri: `https://${settings.host}${endpoint}`,
          data: data,
          options: options
        });
      default:
        return callback(new Error('Invalid request method'));
    }
  };

  exports.apiCall = function(params, callback) {
    var req;
    return req = needle.request(params.method, params.uri, params.data, params.options, function(err, res, data) {
      return callback(err, res, data);
    });
  };

  // returns a callback with the version of the API
  exports.getVersion = (callback) => {
    return this.buildRequest(void 0, (error, result) => {
      if (!error) {
        return this.apiCall(result, (err, res, data) => {
          if (!err) {
            return callback(data.version);
          }
        });
      }
    });
  };

  // returns a callback with an error in arg1, or the builddate in arg2
  // the error is an Error object if non-HTTP related
  // the error is the request result if 404 or other HTTP error code (4xx or 5xx)
  exports.buildOVA = (application, parameters, callback) => {
    return this.getVersion((version) => {
      var apiParams;
      apiParams = {
        method: 'POST',
        endpoint: 'builds',
        files: {
          app: {
            filename: 'app.tcz',
            data: fs.readFileSync(application)
          }
        },
        query: parameters
      };
      return this.buildRequest(apiParams, (error, result) => {
        if (error) {
          callback(error);
        }
        return this.apiCall(result, function(err, res, data) {
          if (err) {
            return callback(new Error(err));
          } else if (res.statusCode === 202 && res.statusMessage === 'Accepted') {
            if (version >= '1.13.1') {
              return callback(null, data.builddate); // builddate added in v1.13.1
            } else {
              return callback(null, data.Location.split("=")[1]);
            }
          } else {
            return callback(data);
          }
        });
      });
    });
  };

  exports.getStatus = (build, callback) => {
    return this.getVersion((version) => {
      var apiParams;
      apiParams = {
        method: 'GET',
        endpoint: 'builds/status',
        query: {
          builddate: build,
          log: version >= '1.13.1' ? 0 : void 0 // log parameter added in v1.13.1
        }
      };
      return this.buildRequest(apiParams, (error, result) => {
        if (error) {
          callback(error);
        }
        return this.apiCall(result, function(err, res, data) {
          if (err) {
            return callback(new Error(err));
          } else if (res.statusCode === 202 && res.statusMessage === 'Accepted') {
            return callback(null, {
              status: 'queued'
            });
          } else if (res.statusCode === 200 && data) {
            return callback(null, data);
          } else {
            return callback(data);
          }
        });
      });
    });
  };

  // returns a callback with and error in arg1, or the status in arg2
  // the error is an Error object if non-HTTP related
  // the error is the request result if 404 or other HTTP error code (4xx or 5xx)
  exports.pollStatus = (build, status = {}, callback) => {
    switch (status.status) {
      case 'success':
      case 'failed':
        return status.status;
      default:
        return this.getStatus(build, (err, res) => {
          var run;
          if (err) {
            return callback(err);
          } else {
            if (res.status === 'success') {
              return callback(null, this.pollStatus(build, res));
            } else if (res.status === 'failed') {
              return callback(null, this.pollStatus(build, res));
            } else {
              run = () => {
                return this.pollStatus(build, res, function(error, result) {
                  if (error) {
                    callback(error);
                  }
                  return callback(null, result);
                });
              };
              // wait 5 seconds between each request
              return setTimeout(run, 5000);
            }
          }
        });
    }
  };

  // returns a callback with an error in arg1, or the list of downloads in arg2
  // the error is an Error object if non-HTTP related
  // the error is the request result if 404 or other HTTP error code (4xx or 5xx)
  exports.getDownloads = (build, callback) => {
    var apiParams;
    apiParams = {
      method: 'GET',
      endpoint: 'downloads',
      query: {
        builddate: build
      }
    };
    return this.buildRequest(apiParams, (error, result) => {
      if (error) {
        callback(error);
      }
      return this.apiCall(result, function(err, res, data) {
        var downloads, i, url;
        if (err) {
          return callback(new Error(err));
        } else if (res.statusCode === 200 && res.statusMessage === 'OK') {
          downloads = (function() {
            var j, len, ref, results;
            ref = data.downloads;
            results = [];
            for (url = j = 0, len = ref.length; j < len; url = ++j) {
              i = ref[url];
              results.push(`https://${settings.host}${i.url}`);
            }
            return results;
          })();
          return callback(null, downloads.join('\n'));
        } else {
          return callback(data);
        }
      });
    });
  };

  // returns a callback with an error in arg1, or 'OK' in arg2
  // the error is an Error object if non-HTTP related
  // the error is the request result if 404 or other HTTP error code (4xx or 5xx)
  exports.cancelBuild = (build, callback) => {
    var apiParams;
    apiParams = {
      method: 'POST',
      endpoint: 'builds/cancel',
      query: {
        builddate: build
      }
    };
    return this.buildRequest(apiParams, (error, result) => {
      if (error) {
        callback(error);
      }
      return this.apiCall(result, function(err, res, data) {
        if (err) {
          return callback(new Error(err));
        } else if (res.statusCode === 200 && res.statusMessage === 'OK') {
          return callback(null, res.statusMessage);
        } else {
          return callback(data);
        }
      });
    });
  };

}).call(this);
