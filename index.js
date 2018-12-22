"use strict";
const _ = require("lodash");
const path = require("path");
const createServer = require("@conduitvc/appsync-emulator-serverless/server");

class ServerlessAppSyncPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.servicePath = serverless.config.servicePath;
    this.serverlessLog = serverless.cli.log.bind(serverless.cli);
    this.options = options;

    this.commands = {
      "appsync-offline": {
        usage: "Simulates local AppSync",
        commands: {
          start: {
            lifecycleEvents: ["startHandler"],
            usage: "Simulates local AppSync",
            options: {
              port: {
                shortcut: "p",
                usage:
                  "The port number that appsync will use to provide the graphql access point. If you do not specify this option, the default port is dynamic"
              },
              dynamoDbPort: {
                shortcut: "d",
                usage:
                  "The port number that DynamoDB will use to communicate with your application. If you do not specify this option, the default port is dynamic"
              },
              inMemory: {
                shortcut: "i",
                usage:
                  "DynamoDB; will run in memory, instead of using a database file. When you stop DynamoDB;, none of the data will be saved. Note that you cannot specify both -dbPath and -inMemory at once."
              },
              dbPath: {
                shortcut: "b",
                usage:
                  "The directory where DynamoDB will write its database file. If you do not specify this option, the file will be written to the current directory. Note that you cannot specify both -dbPath and -inMemory at once. For the path, current working directory is <projectroot>/node_modules/serverless-dynamodb-local/dynamob. For example to create <projectroot>/node_modules/serverless-dynamodb-local/dynamob/<mypath> you should specify -d <mypath>/ or --dbPath <mypath>/ with a forwardslash at the end."
              },
              sharedDb: {
                shortcut: "h",
                usage:
                  "DynamoDB will use a single database file, instead of using separate files for each credential and region. If you specify -sharedDb, all DynamoDB clients will interact with the same set of tables regardless of their region and credential configuration."
              },
              delayTransientStatuses: {
                shortcut: "t",
                usage:
                  "Causes DynamoDB to introduce delays for certain operations. DynamoDB can perform some tasks almost instantaneously, such as create/update/delete operations on tables and indexes; however, the actual DynamoDB service requires more time for these tasks. Setting this parameter helps DynamoDB simulate the behavior of the Amazon DynamoDB web service more closely. (Currently, this parameter introduces delays only for global secondary indexes that are in either CREATING or DELETING status."
              },
              optimizeDbBeforeStartup: {
                shortcut: "o",
                usage:
                  "Optimizes the underlying database tables before starting up DynamoDB on your computer. You must also specify -dbPath when you use this parameter."
              }
            }
          }
        }
      }
    };

    this.hooks = {
      "appsync-offline:start:startHandler": this.startHandler.bind(this),
      "before:offline:start:init": this.startHandler.bind(this),
      "before:offline:start:end": this.endHandler.bind(this)
    };
  }

  get port() {
    const config = (this.service.custom && this.service.custom.dynamodb) || {};
    const port = _.get(config, "start.port", null);
    return port;
  }

  async startHandler() {
    this._setOptions();
    let dynamodb = null;

    try {

      if (this.options.dynamodb.client.endpoint) {
        const { DynamoDB } = require("aws-sdk");
        dynamodb = new DynamoDB(this.options.dynamodb.client);
      } else {
        // start the dynamodb emulator
        const dynamoEmulator = require("@conduitvc/dynamodb-emulator");
        this.emulator = await dynamoEmulator.launch(
          this.options.dynamodb.server
        );
        dynamodb = dynamoEmulator.getClient(
          this.emulator,
          this.options.dynamodb.client
        );
        this.serverlessLog("dynamoDB started: " + dynamodb.endpoint.href);
        //this.serverlessLog(JSON.stringify( dynamodb))
      }

      const serverless = path.join(
        this.servicePath,
        "serverless.yml"
      );
      const port = this.options.port;
      // from "custom.appSync.schema" for custom graphQL schema file location
      const schemaPath = this.options.schema;
      const server = await createServer({ serverless, schemaPath, port, dynamodb });
      this.serverlessLog("AppSync started: " + server.url);

      this._listenSIGINT();
    } catch (err) {
      this.serverlessLog("ERROR: " + err);
    }
  }
  endHandler() {
    this.serverlessLog("AppSync offline - stopping graphql and dynamoDB");
    this.emulator.terminate().then(() => {
      process.exit(0);
    });
  }

  _setOptions() {
    // Merge the different sources of values for this.options
    // Precedence is: command line options, YAML options, defaults.
    //this.serverlessLog(JSON.stringify(this.options));
    const defaultOpts = {
      port: null,
      dynamodb: {
        client: {
          region: "localhost",
          accessKeyId: "MOCK_ACCESS_KEY_ID",
          secretAccessKey: "MOCK_SECRET_ACCESS_KEY",
        },
        server: {
          port: null,
          dbPath: path.join(this.serverless.config.servicePath, ".dynamodb"),
          inMemory: false
        }
      }
    };
    this.options = _.merge(
      {},
      defaultOpts,
      (this.serverless.service.custom || {})["appsync-offline"],
      {
        port: this.options.port,
        dynamodb: {
          server: {
            port: this.options.dynamoDbPort,
            dbPath: this.options.dbPath,
            inMemory: this.options.inMemory,
            sharedDb: this.options.sharedDb,
            delayTransientStatuses: this.options.delayTransientStatuses,
            optimizeDbBeforeStartup: this.options.optimizeDbBeforeStartup
          }
        }
      }
    );
  }

  _listenSIGINT(){
    process.on('SIGINT', () => {
      // _ensure_ we do not leave java processes lying around.
      this.endHandler();
    });
  }
}

module.exports = ServerlessAppSyncPlugin;
