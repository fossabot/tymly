/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
// const debug = require('debug')('tymly-solr-plugin')

const sqlScriptRunner = require('./fixtures/sql-script-runner.js')

const studentsModels = require('./fixtures/school-blueprint/models/students.json')
const studentsSearchDocs = require('./fixtures/school-blueprint/search-docs/students.json')

// note that state-machines usually inherit their namespace from the blueprint.json file.
// the studentsAndStaffModels json files have explicitly defined the namespaces as
// they are used by tests as-is, and so tymly will automatically "inherit" it
const studentsAndStaffModels = require('./fixtures/test-resources/students-and-staff-models.json')
const studentsAndStaffSearchDocs = require('./fixtures/test-resources/students-and-staff-search-docs.json')

describe('tymly-solr-plugin tests', function () {
  let solrService
  let client

  it('should create some basic tymly services', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib'),
          path.resolve(__dirname, './../../tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/school-blueprint')
        ],
        config: {
          solrSchemaFields: [
            'id',
            'actorName',
            'characterName'
          ]
        }
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)

        client = tymlyServices.storage.client
        expect(client).to.not.eql(null)
        solrService = tymlyServices.solr
        expect(solrService).to.not.eql(null)

        done()
      }
    )
  })

  it('should default to local solr instance if not set', () => {
    expect(solrService.solrUrl).to.be.a('string')
    expect(solrService.solrUrl).to.eql('http://localhost:8983/solr')
  })

  it('should generate a SQL SELECT statement', () => {
    const select = solrService.buildSelectStatement(studentsModels, studentsSearchDocs)

    expect(select).to.be.a('string')
    expect(select).to.eql('SELECT \'student#\' || student_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_name AS character_name FROM fbot_test.students')
  })

  it('should generate a SQL CREATE VIEW statement', () => {
    const sqlString = solrService.buildCreateViewStatement(
      studentsAndStaffModels, studentsAndStaffSearchDocs)

    expect(sqlString).to.be.a('string')
    expect(sqlString).to.eql('CREATE OR REPLACE VIEW fbot.solr_data AS \n' +
      'SELECT \'student#\' || student_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_name AS character_name FROM fbot_test.students\n' +
      'UNION\n' +
      'SELECT \'staff#\' || staff_no AS id, first_name || \' \' || last_name AS actor_name, ' +
      'character_first_name || \' \' || character_last_name AS character_name FROM fbot_test.staff;')
  })

  it('should have generated a SQL CREATE VIEW statement on tymly boot', () => {
    expect(solrService.createViewSQL).to.be.a('string')
  })

  it('should create test resources', function (done) {
    sqlScriptRunner(
      './db-scripts/setup.sql',
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should create a database view using the test resources', (done) => {
    const createViewStatement = solrService.buildCreateViewStatement(
      studentsAndStaffModels, studentsAndStaffSearchDocs)

    client.query(createViewStatement, [], function (err) {
      expect(err).to.eql(null)
      done()
    })
  })

  it('should return 19 rows when selecting from the view', (done) => {
    client.query(`SELECT * FROM fbot.solr_data ORDER BY character_name ASC;`, [],
      function (err, result) {
        expect(err).to.eql(null)
        expect(result.rowCount).to.eql(19)
        expect(result.rows[0].id).to.eql('staff#1')
        expect(result.rows[18].id).to.eql('staff#3')
        done()
      }
    )
  })

  // it('should instruct apache solr to index data from the view', (done) => {
  //   solrService.executeSolrFullReindex('addressbase', (err, solrResponse) => {
  //     expect(err).to.eql(null)
  //     if (err) {
  //       debug(err)
  //     } else {
  //       debug('total number of database rows indexed: ', solrResponse.statusMessages['Total Rows Fetched'])
  //     }
  //     done()
  //   })
  // })

  it('should cleanup test resources', (done) => {
    sqlScriptRunner(
      './db-scripts/cleanup.sql',
      client,
      function (err) {
        expect(err).to.equal(null)
        done()
      }
    )
  })
})