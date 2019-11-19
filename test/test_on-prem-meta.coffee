# Tests the helpers

assert  = require 'should'
meta    = require '../src/on-prem-meta'
fs      = require 'fs'

meta.settings.host = 'test.local:8443'
meta.settings.tokenhash = meta.makeSHA256 'yourtoken'

describe 'On-Prem Meta API client', ->
  describe '#Security', ->
    it 'should generate an SHA256 string', (done) ->
      result = meta.settings.tokenhash
      result.should.have.length 64
      result.should.be.a.String
      result.should.equal '13e2ff941bbc8692cad141c8d293dda2c4f1c1a3c51b93d54f1a1693e1206107'
      done()

    it 'should generate a 64-char HMAC', (done) ->
      result = meta.makeHMAC 'test string', meta.settings.tokenhash
      result.should.have.length 64
      result.should.be.a.String
      result.should.equal '0555b409d92aee525683c50787b7c41d74c5e56eade8ef20108c87adc30ea915'
      done()

  describe '#API Calls', ->
    it 'should fail to make an API call using an invalid request method', (done) ->
      meta.buildRequest {method: 'INVALID'}, (error, result, data) ->
        error.should.Error
        error.should.be.a.Error
        error.message.should.equal 'Invalid request method'
        done()

    it 'should generate the default GET request', (done) ->
      meta.buildRequest undefined, (error, result) ->
        result.method.should.equal 'GET'
        result.uri.should.equal 'https://test.local:8443/api/v1/meta/version'
        result.data.should.be.a.Object
        result.data.should.have.properties 'hash'
        result.data.hash.should.equal '5967791e7222c06a56d074b38a124ae6eb8b97528afa91f99188a8da77c50466'
        done()

    it 'should generate a simple GET request', (done) ->
      postParams =
        method: 'GET'
        endpoint: 'builds/status'
        query:
          buildname: 'butterfly-squirrel'
      meta.buildRequest postParams, (error, result) ->
        result.method.should.equal 'GET'
        result.uri.should.equal 'https://test.local:8443/api/v1/meta/builds/status'
        result.data.should.be.a.Object
        result.data.should.have.properties 'hash'
        result.data.should.have.properties 'buildname'
        result.data.hash.should.equal 'b297cbb7dce7e0cb30de5c0c64a2e09e1b7f20b71d43582ec38cb20c948232f4'
        result.data.buildname.should.equal 'butterfly-squirrel'
        done()

    it 'should generate a simple POST request with a file', (done) ->
      postParams =
        method: 'POST'
        endpoint: 'settings/integrations'
        files:
          settings:
            filename: 'settings.json'
            data: fs.readFileSync('./test/settings_payload.json')
        query:
          id: 1
      meta.buildRequest postParams, (error, result) ->
        result.method.should.equal 'POST'
        result.uri.should.equal 'https://test.local:8443/api/v1/meta/settings/integrations'
        result.data.should.be.a.Object
        result.data.readable.should.exactly true
        result.options.should.have.properties 'headers'
        result.data._overheadLength.should.equal 369
        done()
