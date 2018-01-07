class Authorization {
  constructor (instance) {
    this._instance = instance
  }

  get instance () {
    return this._instance
  }
}

module.exports = Authorization
