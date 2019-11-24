(function() {
  //   Official On-Prem Meta REST API client and helper library
  //   https://on-premises.com

  //   Copyright (c) 2019 Alex Williams, Unscramble <license@unscramble.jp>
  //   MIT Licensed
  var createHash, createHmac, formData, needle, options, settings;

  createHash = require('crypto').createHash;

  createHmac = require('crypto').createHmac;

  needle = require('needle');

  formData = require('form-data');

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

  needle.defaults({
    user_agent: 'nodeclient-on-prem-meta/1.0.5',
    response_timeout: 10000 // 10 seconds
  });

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

}).call(this);
