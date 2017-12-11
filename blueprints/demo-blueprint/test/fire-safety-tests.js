/* eslint-env mocha */

'use strict'

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

describe('Demo state machine tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  const FILL_FIRE_SAFETY_SHORT_AUDIT_STATE_MACHINE = 'tymly_fillFireSafetyShortAudit_1_0'
  const todoId = 'cdc33a5c-d438-11e7-a2f3-5bb79decfe33'
  let statebox, client, fillFireSafetyShortAuditExecutionName, fireSafetyShortAudit, todos

  const formData = {
    ignitionSources: 'Good',
    ignitionSourcesComment: 'Ignition Sources are managed very well.',
    adequateMeasures: 'Tolerable',
    adequateMeasuresComment: 'Limited measures to control the speed of the fire.',
    personsEvacuate: 'Poor',
    personsEvacuateComment: 'People can not evacuate safely at times of emergency.',
    escapeRoutes: 'Poor',
    escapeRoutesComment: 'Escape routes very poorly managed.',
    adequateEquipment: 'Tolerable',
    adequateEquipmentComment: 'Reasonable equipment available.',
    adequateArrangements: 'Tolerable',
    adequateArrangementsComment: 'Fire detection systems work well.',
    adequateInstructions: 'Poor',
    adequateInstructionsComment: 'No information or guidance.',
    adequateManagement: 'Tolerable',
    adequateManagementComment: 'More safety checks suggested.',
    sufficientPrecautions: 'Yes'
  }

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin'),
          require.resolve('tymly-solr-plugin'),
          require.resolve('tymly-users-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        fireSafetyShortAudit = tymlyServices.storage.models['tymly_fireSafetyShortAudit']
        todos = tymlyServices.storage.models['tymly_todos']
        done(err)
      }
    )
  })

  it('should create a todo task which would start this form', function (done) {
    todos.upsert({
      userId: 'auth0|5a157ade1932044615a1c502',
      teamName: null,
      state_machine_title: 'tymly_fillFireSafetyShortAudit_1_0',
      state_machine_category: 'fireSafety',
      description: '',
      todo_title: 'Fill Fire Safety Short Audit',
      id: todoId
    }, {}, (err) => {
      done(err)
    })
  })

  it('should start execution to fill in a fire safety short audit form, stops at AwaitingHumanInput', function (done) {
    statebox.startExecution(
      {
        todoId: todoId
      },
      FILL_FIRE_SAFETY_SHORT_AUDIT_STATE_MACHINE,
      {
        sendResponse: 'AFTER_RESOURCE_CALLBACK.TYPE:awaitingHumanInput'
      },
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.currentStateName).to.eql('AwaitingHumanInput')
        expect(executionDescription.status).to.eql('RUNNING')
        fillFireSafetyShortAuditExecutionName = executionDescription.executionName
        done(err)
      }
    )
  })

  it('should allow user to enter form data', function (done) {
    statebox.sendTaskSuccess(
      fillFireSafetyShortAuditExecutionName,
      formData,
      {},
      (err, executionDescription) => {
        expect(err).to.eql(null)
        done(err)
      }
    )
  })

  it('should on form \'complete\' send form data to Upserting', function (done) {
    statebox.waitUntilStoppedRunning(
      fillFireSafetyShortAuditExecutionName,
      (err, executionDescription) => {
        expect(err).to.eql(null)
        expect(executionDescription.ctx.formData).to.eql(formData)
        expect(executionDescription.currentStateName).to.eql('DeltaReindex')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done(err)
      }
    )
  })

  it('should check the data is in the fire Safety Audit table', function (done) {
    fireSafetyShortAudit.find({}, (err, doc) => {
      expect(doc.length).to.eql(1)
      expect(doc[0].ignitionSources).to.eql('Good')
      expect(doc[0].ignitionSourcesComment).to.eql('Ignition Sources are managed very well.')
      expect(doc[0].adequateMeasures).to.eql('Tolerable')
      expect(doc[0].adequateMeasuresComment).to.eql('Limited measures to control the speed of the fire.')
      expect(doc[0].personsEvacuate).to.eql('Poor')
      expect(doc[0].personsEvacuateComment).to.eql('People can not evacuate safely at times of emergency.')
      expect(doc[0].escapeRoutes).to.eql('Poor')
      expect(doc[0].escapeRoutesComment).to.eql('Escape routes very poorly managed.')
      expect(doc[0].adequateEquipment).to.eql('Tolerable')
      expect(doc[0].adequateEquipmentComment).to.eql('Reasonable equipment available.')
      expect(doc[0].adequateArrangements).to.eql('Tolerable')
      expect(doc[0].adequateArrangementsComment).to.eql('Fire detection systems work well.')
      expect(doc[0].adequateInstructions).to.eql('Poor')
      expect(doc[0].adequateInstructionsComment).to.eql('No information or guidance.')
      expect(doc[0].adequateManagement).to.eql('Tolerable')
      expect(doc[0].adequateManagementComment).to.eql('More safety checks suggested.')
      expect(doc[0].sufficientPrecautions).to.eql('Yes')
      done(err)
    })
  })

  it('should check this todo task has been removed after form completion', function (done) {
    todos.find({where: {userId: {equals: 'auth0|5a157ade1932044615a1c502'}}},
      (err, docs) => {
        expect(docs.length).to.eql(0)
        done(err)
      }
    )
  })

  it('should tear down the test resources', function () {
    return sqlScriptRunner('./scripts/cleanup.sql', client)
  })
})