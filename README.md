serverless-appsync-offline
=================================

[![npm version](https://badge.fury.io/js/serverless-appsync-offline.svg)](https://badge.fury.io/js/serverless-appsync-offline)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a wrapper for the excellent [AppSync Emulator](https://github.com/ConduitVC/aws-utils/tree/appsync/packages/appsync-emulator-serverless).

## This Plugin Requires
* serverless@v1-rc.1

## Features
* Emulate Appsync with [AppSync Emulator](https://github.com/ConduitVC/aws-utils/tree/appsync/packages/appsync-emulator-serverless) and depends on [Serverless-AppSync-Plugin](https://github.com/sid88in/serverless-appsync-plugin)
* Connect to any DynamoDB or install DynamoDB Local
* Start DynamoDB Local with all the parameters supported (e.g port, inMemory, sharedDb)
* Table Creation for DynamoDB Local

This plugin is updated by its users, I just do maintenance and ensure that PRs are relevant to the community. In other words, if you [find a bug or want a new feature](https://github.com/aheissenberger/serverless-appsync-offline/issues), please help us by becoming one of the contributors.

## 

## Install Plugin
`npm install --save serverless-appsync-offline`

Then in `serverless.yml` add following entry to the plugins array: `serverless-appsync-offline`
```yml
plugins:
  - serverless-appsync-offline
```

## Using the Plugin


1) Add Appsync Resource definitions to your Serverless configuration, as defined here: https://github.com/sid88in/serverless-appsync-plugin#configuring-the-plugin




## Start appsync-offline

`sls appsync-offline start`

All CLI options are optional:

```
--port  		  -p  Port to provide the graphgl api. Default: dynamic
--dynamoDbPort            -d  Port to access the dynamoDB. Default: dynamic
--inMemory                -i  DynamoDB; will run in memory, instead of using a database file. When you stop DynamoDB;, none of the data will be saved. Note that you cannot specify both -dbPath and -inMemory at once.
--dbPath                  -b  The directory where DynamoDB will write its database file. If you do not specify this option, the file will be written to the current directory. Note that you cannot specify both -dbPath and -inMemory at once. For the path, current working directory is <projectroot>/node_modules/serverless-appsync-offline/dynamob. For example to create <projectroot>/node_modules/serverless-appsync-offline/dynamob/<mypath> you should specify -d <mypath>/ or --dbPath <mypath>/ with a forwardslash at the end.
--sharedDb                -h  DynamoDB will use a single database file, instead of using separate files for each credential and region. If you specify -sharedDb, all DynamoDB clients will interact with the same set of tables regardless of their region and credential configuration.
--delayTransientStatuses  -t  Causes DynamoDB to introduce delays for certain operations. DynamoDB can perform some tasks almost instantaneously, such as create/update/delete operations on tables and indexes; however, the actual DynamoDB service requires more time for these tasks. Setting this parameter helps DynamoDB simulate the behavior of the Amazon DynamoDB web service more closely. (Currently, this parameter introduces delays only for global secondary indexes that are in either CREATING or DELETING status.)
--optimizeDbBeforeStartup -o  Optimizes the underlying database tables before starting up DynamoDB on your computer. You must also specify -dbPath when you use this parameter.
```

All the above options can be added to serverless.yml to set default configuration: e.g.

**Minimum Options:**
```yml
custom:
  appsync-offline:
    port: 62222
    dynamodb:
      server:
        port: 8000
```
**All Options:**
```yml
custom:
  appsync-offline:
    port: 62222
    dynamodb:
      client:
        # if endpoint is provided, no local database server is started and and appsync connects to the endpoint - e.g. serverless-dynamodb-local
        endpoint: "http://localhost:8000"
        region: localhost
        accessKeyId: a
        secretAccessKey: a
      server:
        port: 8000
        dbPath: "./.dynamodb"
        inMemory: false,
        sharedDb: false,
        delayTransientStatuses: false,
        optimizeDbBeforeStartup: false,
```

**How to Query:**
```sh
curl -X POST \
  http://localhost:62222/graphql \
  -H 'Content-Type: application/json' \
  -d '{
	"query": "{ hello { world } }"
}'
```

_**Note**: If you're using `API_KEY` as your authenticationType, then a `x-api-key` header has to be present in the request. The value of the key doesn't really matter._

## Using DynamoDB Local in your code
You need to add the following parameters to the AWS NODE SDK dynamodb constructor

e.g. for dynamodb document client sdk
```
var AWS = require('aws-sdk');
```
```
new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
})
```
e.g. for dynamodb document client sdk
```
new AWS.DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
})
```

### Using with serverless-offline plugin
When using this plugin with serverless-offline, it is difficult to use above syntax since the code should use DynamoDB Local for development, and use DynamoDB Online after provisioning in AWS. Therefore we suggest you to use [serverless-dynamodb-client](https://github.com/99xt/serverless-dynamodb-client) plugin in your code.

The `serverless appsync-offline start` command can be triggered automatically when using `serverless-offline` plugin.


Add both plugins to your `serverless.yml` file:
```yaml
plugins:
  - serverless-appsync-offline
  - serverless-offline
```

Make sure that `serverless-appsync-offline` is above `serverless-offline` so it will be loaded earlier.

Now your local Appsync and the DynamoDB database will be automatically started before running `serverless offline`.

### Debugging

`SLS_DEBUG=* NODE_DEBUG=appsync-* yarn offline`

or

`SLS_DEBUG=* NODE_DEBUG=appsync-* yarn sls appsync-offline start`


### Using with serverless-offline and serverless-webpack plugin
Run `serverless offline start`. In comparison with `serverless offline`, the `start` command will fire an `init` and a `end` lifecycle hook which is needed for serverless-offline and serverless-appsync-offline to switch off both resources.

Add plugins to your `serverless.yml` file:
```yaml
plugins:
  - serverless-webpack
  - serverless-appsync-offline
  - serverless-offline #serverless-offline needs to be last in the list

custom:
  appsync-emulator:
    # when using serverless-webpack it (by default) outputs all the build assets to `<projectRoot>/.webpack/service`
    # this will let appsync-offline know where to find those compiled files
    buildPrefix: .webpack/service
```

## Notes

The [AppSync Emulator](https://github.com/ConduitVC/aws-utils/tree/appsync/packages/appsync-emulator-serverless) does not support CloudFormation syntax (e.g. `tableName: { Ref: UsersTable }`) in `dataSources`. 

## License
  [MIT](LICENSE)