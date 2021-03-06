/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('watched-boards tymly-users-plugin tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let tymlyService, statebox, client, animalModel, humanModel
  const GET_SINGLE_BOARD_STATE_MACHINE = 'test_getSingleBoard_1_0'
  const GET_MULTIPLE_BOARDS_STATE_MACHINE = 'test_getMultipleBoards_1_0'

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        blueprintPaths: [
          path.resolve(__dirname, './../test/fixtures/test-blueprint')
        ],
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin')
        ]
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        console.log(tymlyServices.storage.models)
        animalModel = tymlyServices.storage.models['test_animal']
        humanModel = tymlyServices.storage.models['test_human']
        done()
      }
    )
  })

  it('insert some \'human\' test data', (done) => {
    humanModel.create({
      name: 'Alfred',
      age: '57'
    })
      .then(() => done())
      .catch(err => done(err))
  })

  it('insert some \'animal\' test data', (done) => {
    animalModel.create({
      name: 'Alfred',
      age: '2',
      type: 'dog'
    })
      .then(() => done())
      .catch(err => done(err))
  })

  it('run state machine to get board data from one table', function (done) {
    statebox.startExecution(
      {
        boardKeys: {
          name: 'Alfred'
        }
      },
      GET_SINGLE_BOARD_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      (err, executionDescription) => {
        console.log(executionDescription.ctx.data)
        expect(executionDescription.ctx.data.name).to.eql('Alfred')
        expect(executionDescription.ctx.data.age).to.eql('57')
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('run state machine to get board data from two tables', function (done) {
    statebox.startExecution(
      {
        boardKeys: {
          name: 'Alfred'
        }
      },
      GET_MULTIPLE_BOARDS_STATE_MACHINE,
      {
        sendResponse: 'COMPLETE',
        userId: 'test-user'
      },
      (err, executionDescription) => {
        console.log(executionDescription.ctx.data)
        expect(executionDescription.ctx.data.human.age).to.eql('57')
        expect(executionDescription.ctx.data.animal.type).to.eql('dog')
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./db-scripts/cleanup.sql', client)
  })

  it('should shut down Tymly', async () => {
    await tymlyService.shutdown()
  })
})
