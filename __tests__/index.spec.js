import ServerlessAppSyncPlugin from '../index';

import { DynamoDB } from 'aws-sdk';
jest.mock('aws-sdk');

import createServer from '@conduitvc/appsync-emulator-serverless/server';
jest.mock('@conduitvc/appsync-emulator-serverless/server');

describe('ServerlessAppSyncPlugin', () => {
  let mocks,
  config,
    appSyncPlugin;

  beforeEach(async () => {
    config = {
      config: {
        servicePath: 'mock-service-path',
      },
      cli: {
        log: () => console.log,
      },
    }
    mocks = {
      serverless: config,
      options: {
        port: 1234,
        schemaPath: undefined,
        dynamodb: {
          client: {
            endpoint: 'mock-dynamodb-endpoint',
          },
        },
      },
    };
  });

  afterEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('startHandler()', () => {
    beforeEach(async () => {
      mocks.createServer = createServer.mockImplementation(() => {
        return jest.fn();
      });

      mocks.dynamodb = jest.fn();
      DynamoDB.mockImplementation(() => {
        return mocks.dynamodb;
      });

      ServerlessAppSyncPlugin.prototype._setOptions = jest.fn();
      ServerlessAppSyncPlugin.prototype._listenSIGINT = jest.fn();

      appSyncPlugin = new ServerlessAppSyncPlugin(
        mocks.serverless,
        mocks.options
      );
    });

    it('starts handler', async () => {
      await appSyncPlugin.startHandler();

      expect(mocks.createServer).toBeCalledWith({
        serverless: config,
        port: mocks.options.port,
        dynamodb: mocks.dynamodb,
      });
    });
  });
});
