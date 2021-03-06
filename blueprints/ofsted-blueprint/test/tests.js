/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
const path = require('path')
const tymly = require('tymly')

describe('Ofsted tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const STATE_MACHINE_NAME = 'ofsted_refreshFromCsvFile_1_0'

  let tymlyService
  let statebox
  let client

  it('should startup tymly', function (done) {
    tymly.boot(
      {
        pluginPaths: [
          require.resolve('tymly-pg-plugin')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './../')
        ],
        config: {}
      },
      function (err, tymlyServices) {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        client = tymlyServices.storage.client
        done()
      }
    )
  })

  it('should execute importingCsvFiles', function (done) {
    statebox.startExecution(
      {
        sourceDir: path.resolve(__dirname, './fixtures/input')
      },
      STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      function (err, executionDescription) {
        expect(err).to.eql(null)
        expect(executionDescription.status).to.eql('SUCCEEDED')
        expect(executionDescription.currentStateName).to.equal('ImportingCsvFiles')
        done()
      }
    )
  })

  it('Should be the correct data in the database', function (done) {
    client.query(
      'select urn, school_name, ofsted_phase, region, local_authority, postcode, TO_CHAR(inspection_date, \'DD/MM/YYYY\') AS inspection_date, overall_effectiveness, effectiveness_of_leadership from ofsted.ofsted order by urn;',
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql(
            [
              {
                urn: '100000',
                school_name: 'Bordesley Green East Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B33 8QB',
                inspection_date: '22/01/2015',
                overall_effectiveness: 2,
                effectiveness_of_leadership: 2
              },
              {
                urn: '100001',
                school_name: 'Brearley Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B19 3XJ',
                inspection_date: '05/12/2014',
                overall_effectiveness: 1,
                effectiveness_of_leadership: 1
              },
              {
                urn: '100002',
                school_name: 'Garretts Green Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B26 2JL',
                inspection_date: '02/11/2012',
                overall_effectiveness: 2,
                effectiveness_of_leadership: 2
              },
              {
                urn: '100003',
                school_name: 'Perry Beeches Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B42 2PX',
                inspection_date: '27/09/2012',
                overall_effectiveness: 2,
                effectiveness_of_leadership: 2
              },
              {
                urn: '100004',
                school_name: 'St Thomas Centre Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B15 2AF',
                inspection_date: '12/12/2013',
                overall_effectiveness: 1,
                effectiveness_of_leadership: 1
              },
              {
                urn: '100005',
                school_name: 'Highfield Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B8 3QU',
                inspection_date: '27/02/2014',
                overall_effectiveness: 2,
                effectiveness_of_leadership: 2
              },
              {
                urn: '100006',
                school_name: 'Marsh Hill Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B23 7HG',
                inspection_date: '13/12/2013',
                overall_effectiveness: 1,
                effectiveness_of_leadership: 1
              },
              {
                urn: '100007',
                school_name: 'West Heath Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B31 3HB',
                inspection_date: '04/10/2013',
                overall_effectiveness: 2,
                effectiveness_of_leadership: 2
              },
              {
                urn: '100008',
                school_name: 'Goodway Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B44 8RL',
                inspection_date: '12/09/2014',
                overall_effectiveness: 2,
                effectiveness_of_leadership: 2
              },
              {
                urn: '100009',
                school_name: 'Kings Norton Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B38 8SY',
                inspection_date: '31/01/2013',
                overall_effectiveness: 1,
                effectiveness_of_leadership: 1
              },
              {
                urn: '100010',
                school_name: 'Rubery Nursery School',
                ofsted_phase: 'Nursery',
                region: 'West Midlands',
                local_authority: 'Birmingham',
                postcode: 'B45 9PB',
                inspection_date: null,
                overall_effectiveness: null,
                effectiveness_of_leadership: null
              }
            ]
          )
          done()
        }
      }
    )
  })
  it('Should remove the data in the database', function (done) {
    client.query(
      `delete from ofsted.ofsted where urn::text like '1000%';`,
      function (err, result) {
        expect(err).to.equal(null)
        if (err) {
          done(err)
        } else {
          expect(result.rows).to.eql([])
          done()
        }
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
