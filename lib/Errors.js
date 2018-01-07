/**
 * Throws when method called when Client was destroed
 * @extends Error
 */
class ClientDestroyedError extends Error {
  constructor (...args) {
    super(...args)
    this.message = "You can't access Client methods when it's been destroyed"
  }
}

class NotInitialized extends Error {
  constructor (...args) {
    super(...args)
    this.message = "TDLib client doesn't initialized yet"
  }
}

module.exports = {
  ClientDestroyedError,
  NotInitialized
}
