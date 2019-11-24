#   Official On-Prem Meta REST API client and helper library
#   https://on-premises.com
#
#   Copyright (c) 2019 Alex Williams, Unscramble <license@unscramble.jp>
#   MIT Licensed

createHash = require('crypto').createHash
createHmac = require('crypto').createHmac
needle     = require 'needle'
formData   = require 'form-data'

exports.makeSHA256 = (string) ->
  createHash('sha256')
    .update(string)
    .digest 'hex'

exports.makeHMAC = (string, key) ->
  createHmac('sha256', key)
    .update(string)
    .digest 'hex'

# Global variables
settings =
  prefix: process.env.ON_PREM_META_PREFIX || "meta" # example: admin
  host:     process.env.ON_PREM_META_HOST || throw "Environment variable 'ON_PREM_META_HOST' required" # example: meta.yourdomain.com:443
  insecure: if process.env.ON_PREM_META_INSECURE is "true" then false else true
  tokenhash: this.makeSHA256 process.env.ON_PREM_META_APITOKEN || throw "Environment variable 'ON_PREM_META_APITOKEN' required" # example: yourtoken

options =
  rejectUnauthorized: settings.insecure

exports.settings = settings
exports.options  = options

needle.defaults
  user_agent: 'nodeclient-on-prem-meta/1.0.1'
  response_timeout: 10000 # 10 seconds

exports.buildRequest = (params = {method: 'GET', endpoint: 'version'}, callback) ->
  endpoint = "/api/v1/#{settings.prefix}/#{params.endpoint}"

  switch params.method.toUpperCase()
    when 'GET'
      data = params.query ? {}
      data.hash = this.makeHMAC("#{params.method.toUpperCase()}#{endpoint}", settings.tokenhash)

      return callback null,
        method: params.method.toUpperCase()
        uri: "https://#{settings.host}#{endpoint}"
        data: data
        options: options

    when 'POST'
      data = new formData()
      data.append 'hash', this.makeHMAC("#{params.method.toUpperCase()}#{endpoint}", settings.tokenhash)
      data.append name, val for name, val of params.query                     # append params
      data.append file, val.data, val.filename for file, val of params.files  # append files
      options.headers = data.getHeaders()

      return callback null,
        method: params.method.toUpperCase()
        uri: "https://#{settings.host}#{endpoint}"
        data: data
        options: options

    else
      return callback new Error 'Invalid request method'

exports.apiCall = (params, callback) ->
  req = needle.request params.method,
    params.uri
    params.data
    params.options
    (err, res, data) ->
      return callback err, res, data
