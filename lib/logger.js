'use strict'

/**
 * Code imported from `pino-http`
 * Repo: https://github.com/pinojs/pino-http
 * License: MIT (https://raw.githubusercontent.com/pinojs/pino-http/master/LICENSE)
 */

const pino = require('pino')

const startTime = Symbol('startTime')

function createLogger (opts, stream) {
  stream = stream || opts.stream
  delete opts.stream

  var prevLogger = opts.logger
  var prevGenReqId = opts.genReqId
  var logger = null

  if (prevLogger) {
    opts.logger = undefined
    opts.genReqId = undefined
    logger = prevLogger.child(opts)
    opts.logger = prevLogger
    opts.genReqId = prevGenReqId
  } else {
    logger = pino(opts, stream)
  }

  return logger
}

function reqIdGenFactory (func) {
  if (typeof func === 'function') return func
  var maxInt = 2147483647
  var nextReqId = 0
  return function genReqId (req) {
    return req.id || (nextReqId = (nextReqId + 1) & maxInt)
  }
}

const serializers = {
  req: function asReqValue (req) {
    return {
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort
    }
  },

  res: function asResValue (res) {
    return {
      statusCode: res.statusCode
    }
  }
}

function OnResponseState (err, res) {
  this.err = err
  this.res = res
}

function onResponseIterator (fn, cb) {
  fn(this.res, cb)
}

function onResponseCallback (err) {
  var responseTime = Date.now() - this.res[startTime]
  err = this.err || err

  if (err) {
    this.res.log.error({
      res: this.res,
      err: err,
      responseTime: responseTime
    }, 'request errored')
    return
  }

  this.res.log.info({
    res: this.res,
    responseTime: responseTime
  }, 'request completed')
}

module.exports = {
  createLogger,
  reqIdGenFactory,
  startTime,
  serializers,
  OnResponseState,
  onResponseIterator,
  onResponseCallback
}