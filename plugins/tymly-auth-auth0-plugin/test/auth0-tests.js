/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')

describe('tymly-auth-auth0-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService
  let authService

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
        ],
        config: {
        }
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        authService = tymlyServices.auth0
        done()
      }
    )
  })

  it('should convert a user id into an email address (and cache the relationship between the user id and the auth0 returned email address)', function (done) {
    authService.getEmailFromUserId('auth0|5a157ade1932044615a1c502', function (err, email) {
      if (err) {
        done(err)
      } else {
        expect(email).to.eql('tymly@xyz.com')
        done()
      }
    })
  })

  it('attempt to convert a non existent user id (\'auth0|ffffffffffffffffffffffff\') into an email (which should return a 404)', function (done) {
    authService.getEmailFromUserId('auth0|ffffffffffffffffffffffff', function (err, email) {
      console.log(err)
      expect(err.statusCode).to.equal(404)
      done()
    })
  })

  it('should convert an email address into a user id (which should return instantly via the cache)', function (done) {
    authService.getUserIdFromEmail('tymly@xyz.com', function (err, email) {
      if (err) {
        done(err)
      } else {
        expect(email).to.eql('auth0|5a157ade1932044615a1c502')
        done()
      }
    })
  })

  it('attempt to convert a non existent email (\'doesNotExist@xyz.com\') into a user id (which should return a 404)', function (done) {
    authService.getUserIdFromEmail('doesNotExist@xyz.com', function (err, userId) {
      console.log(err)
      expect(err.output.statusCode).to.equal(404)
      done()
    })
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
