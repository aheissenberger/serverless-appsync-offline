"use strict";
const _ = require("lodash");
const dynamoEmulator = require("@conduitvc/dynamodb-emulator");
const createServer = require("@conduitvc/appsync-emulator-serverless/server");

class ServerlessAppSyncPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.serverlessLog = serverless.cli.log.bind(serverless.cli);
    this.options = _.merge(
      {
        localPath: path.join(serverless.config.servicePath, ".dynamodb")
      },
      options
    );

    this.commands = {
      "appsync-offline": {
        commands: {
          start: {
            lifecycleEvents: ["startHandler"],
            usage: "Starts local DynamoDB",
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

  startHandler() {
    (async function() {
      // start the dynamodb emulator
      this.serverlessLog('start dynamodb');
      this.emulator = await dynamoEmulator.launch({
        dbPath: this.options.localPath,
        port: 8000
      });

      const dynamodb = dynamoEmulator.getClient(emulator);

      const serverless = path.join(
        serverless.config.servicePath,
        "serverless.yml"
      );
      const port = 62222;
      const server = await createServer({ serverless, port, dynamodb });
      this.serverlessLog('appsync started: ' + server.url);
    })().then(
      _ => this.serverlessLog('OK'),
      err => this.serverlessLog("ERROR: " + err)
    );
  }
  endHandler() {
    this.serverlessLog("AppSync offline - stopping graphql and local database");
    this.emulator.terminate().then(() => {
      process.exit(0);
    });
  }
}

module.exports = ServerlessAppSyncPlugin;
