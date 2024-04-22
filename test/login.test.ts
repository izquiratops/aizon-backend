import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyResult } from 'aws-lambda';
import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { lambdaHandler as postLogin } from '../src/api/login';

const ddbMock = mockClient(CognitoIdentityProviderClient);

describe('Login', () => {
  // After every test execution, you need to reset the history and behavior of the mock.
  // Otherwise, the tests could interfere with each other.
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('🔸POST Login', () => {
    test('✅ should return 200 with the widget stringified on the body', async () => {
      ddbMock.on(AdminInitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: 'ValidToken',
        },
      });

      const result: APIGatewayProxyResult = await postLogin({
        body: {
          username: 'ValidUsername',
          password: 'ValidPassword',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: 'ValidToken',
        }),
      });
    });

    test('⛔ should return 422 on missing credentials', async () => {
      // Resolving with an empty object means unsuccessful authentication
      ddbMock.on(AdminInitiateAuthCommand).rejects({
        name: 'NotAuthorizedException',
      });

      const result: APIGatewayProxyResult = await postLogin({
        body: {
          username: 'BadUsername',
          password: 'BadPassword',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 422,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message:
            'Invalid username or password. Please check your credentials and try again.',
        }),
      });
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(AdminInitiateAuthCommand).rejects();

      const result: APIGatewayProxyResult = await postLogin({
        body: {
          username: 'Username',
          password: 'Password',
        },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });
});
