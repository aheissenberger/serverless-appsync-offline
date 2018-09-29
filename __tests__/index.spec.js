import ServerlessAppSyncPlugin from '../index';

import { DynamoDB } from 'aws-sdk';
jest.mock('aws-sdk');

import createServer from '@conduitvc/appsync-emulator-serverless/server';
jest.mock('@conduitvc/appsync-emulator-serverless/server');

describe('ServerlessAppSyncPlugin', () => {
  let mocks,
    appSyncPlugin;

  beforeEach(async () => {
    mocks = {
      serverless: {
        config: {
          servicePath: 'mock-service-path',
        },
        cli: {
          log: () => console.log,
        },
      },
      options: {
        port: 1234,
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
        serverless: `${mocks.serverless.config.servicePath}/serverless.yml`,
        port: mocks.options.port,
        dynamodb: mocks.dynamodb,
      });
    });
  });
});
