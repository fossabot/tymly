# supercopy
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/supercopy/LICENSE)




> Takes a specifically-named directory structure of CSV files and conjures bulk insert, update and delete statements and applies them to a PostgreSQL database. 

## <a name="install"></a>Install
```bash
$ npm install supercopy --save
```

## <a name="usage"></a>Usage

```javascript
const pg = require('pg')
const supercopy = require('supercopy')

// Make a new Postgres client
const client = new pg.Client('postgres://postgres:postgres@localhost:5432/my_test_db')

supercopy(
  {
    sourceDir: '/dir/that/holds/deletes/inserts/updates/and/upserts/dirs',
    headerColumnNamePkPrefix: '.',
    topDownTableOrder: ['departments', 'employees'],
    client: client,
    schemaName: 'my_schema',
    truncateTables: true,
    debug: true
    multicopy: false
  },
  function (err) {
    // Done!
  }
)

```

## supercopy(`options`, `callback`)

### Options

| Property              | Type       | Notes |
| --------              | ----       | ------ |
| `sourceDir`           | `function` | An absolute path pointing to a directory containing action folders. See the [File Structure](#structure) section for more details.
| `headerColumnNamePkPrefix` | `string` | When conjuring an `update` statement, Supercopy will need to know which columns in the CSV file constitute a primary key. It does this by expecting the first line of each file to be a header containing `,` delimited column names. However, column names prefixed with this value should be deemed a primary-key column. Only use in update CSV-file headers.|
| `topDownTableOrder`   | `[string]` | An array of strings, where each string is a table name. Table inserts will occur in this order and deletes in reverse - use to avoid integrity-constraint errors. If no schema prefix is supplied to a table name, then it's inferred from `schemaName`. 
| `client`              | `client`   | Either a [pg](https://www.npmjs.com/package/pg) client or pool (something with a `query()` method) that's already connected to a PostgreSQL database.
| `schemaName`          | `string`   | Identifies a PostgreSQL schema where the tables that are to be affected by this copy be found.
| `truncateTables`      | `boolean`  | A flag to indicate whether or not to truncate tables before supercopying into them
| `debug`               | `boolean`  | Show debugging information on the console
| `multicopy`               | `boolean`  | Enables 'sourceDir' to house many typical Supercopy 'sourceDir' shaped directories. Defaults to false.

### <a name="structure"></a>File structure

The directory identified by the `sourceDir` option should be structured in the following way:

```
/someDir
  /inserts
    table1.csv
    table2.csv
  /updates
    table1.csv
    table2.csv
  /upserts
    table1.csv
    table2.csv  
  /deletes
    table1.csv
    
OR IF USING MULTICOPY

/manyDirs
 /someDir
  /inserts
    table1.csv
    table2.csv
 /someDir
  /inserts
    table1.csv
    table2.csv   

```

#### Notes

* The sub-directories here refer to the type of action that should be performed using CSV data files contained in it. Supported directory names are `insert`, `update`, `upsert` (try to update, failing that insert) and `delete`.
* The filename of each file should refer to a table name in the schema identified by the `schemaName` option. 
* The expected format of the .csv files is:
  * One line per record
  * The first line to be a comma delimited list of column names (i.e. a header record)
  * For update and upsert files, ensure columns-names in the header record that are part of the primary key are identified with a `headerColumnNamePkPrefix` character.
  * All records to be comma delimited, and any text columns containing a `,` should be quoted with a `"`. The [csv-string](https://www.npmjs.com/package/csv-string#stringifyinput--object-separator--string--string) package might help.
* Note that only primary key values should be provided in a 'delete' file.

## <a name="test"></a>Testing

Before running these tests, you'll need a test PostgreSQL database available and set a `PG_CONNECTION_STRING` environment variable to point to it, for example:

```PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db```


```bash
$ npm test
```


## <a name="license"></a>License
[MIT](https://github.com/wmfs/supercopy/blob/master/LICENSE)
