const ref = require('ref')
const ffi = require('ffi')
const path = require('path')
const {
  ClientDestroyedError,
  NotInitialized
} = require('./Errors')

const tdClientPtr = ref.refType('void')
const recievePtr = ref.refType('void')

const sendPtr = ref.refType('char')
const executePtr = ref.refType('char')

const tdlib = ffi.Library(path.join(__dirname, '..', 'bin', 'libtdjson'), {
  'td_json_client_create': [tdClientPtr, []],
  'td_json_client_send': ['void', [tdClientPtr, sendPtr]],
  'td_json_client_receive': [recievePtr, [tdClientPtr, 'double']],
  'td_json_client_execute': [executePtr, [tdClientPtr, executePtr]],
  'td_json_client_destroy': ['void', [tdClientPtr]]
})

class TD {
  /**
   * Create an object of TD class
   * @constructor
   */
  constructor () {
    this._subscribers = []
    this._isDestroyed = false
  }

  /**
   * Returns is a client destroyed
   * @returns {Boolean}
   */
  get isDestroyed () {
    return this._isDestroyed
  }

  set isDestroyed (state) {
    this._isDestroyed = state
  }

  /**
   * @returns {Buffer} Returns a pointer to the instance of TD
   */
  get client () {
    return this._client
  }

  /**
   * Creates a new instance of TDLib.
   * @param {Number} [timeout=10] Maximum number of seconds allowed for this function to wait for new data.
   * @returns {Promise<Buffer>} Returns a pointer to the instance of TDLib.
   */
  create (timeout = 10) {
    if (this.isDestroyed) throw new ClientDestroyedError()

    return new Promise((resolve, reject) => {
      tdlib.td_json_client_create.async((err, client) => {
        if (err) reject(err)

        this._client = client

        this._getResponses(timeout)
        resolve(client)
      })
    })
  }

  _getResponses (seconds) {
    tdlib.td_json_client_receive.async(this.client, seconds, (err, response) => {
      if (err) throw err

      this._subscribers.map(subscriber => {
        subscriber(response)
      })

      this._getResponses(seconds)
    })
  }

  /**
   * Subscribe to TD events
   * @param {Function} callback
   */
  subscribe (callback) {
    if (!callback) throw new Error('Callback must be provieded')
    if (this.isDestroyed) throw new ClientDestroyedError()

    this._subscribers.push(callback)
  }

  /**
   * Synchronously executes TDLib request. May be called from any thread. Only a few requests can be executed synchronously.
   * @param {Object} query
   * @returns {(Object|null)} JSON-serialized null-terminated request response. May be NULL if the request can't be parsed.
   */
  execute (query) {
    if (this.isDestroyed) throw new ClientDestroyedError()
    if (!this.client) throw new NotInitialized()

    let buffer = Buffer.from(JSON.stringify(query) + '\0', 'utf-8')
    buffer.type = ref.types.char

    let result = tdlib.td_json_client_execute(this.client, buffer)

    return result.toString()
  }

  /**
   * Sends request to the TDLib client. May be called from any thread.
   * @param {Object} query
   * @returns {Promise<Object>} JSON-serialized null-terminated request response. May be NULL if the request can't be parsed.
   */
  send (query) {
    if (this.isDestroyed) throw new ClientDestroyedError()
    if (!this.client) throw new NotInitialized()

    return new Promise((resolve, reject) => {
      let buffer = Buffer.from(JSON.stringify(query) + '\0', 'utf-8')
      buffer.type = ref.types.char
      tdlib.td_json_client_send.async(this.client, buffer, (err, response) => {
        if (err) return reject(err)

        if (response) {
          resolve(response.toString())
        } else {
          resolve(null)
        }
      })
    })
  }

  /**
   * Destroys the TDLib client instance. After this is called the client instance shouldn't be used anymore.
   */
  destroy () {
    if (!this.client) throw new NotInitialized()

    this.isDestroyed = true
    this.client.td_json_client_destroy(this.client)
  }
}

module.exports = TD
