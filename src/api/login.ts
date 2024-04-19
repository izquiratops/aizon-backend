import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({
  region: process.env.API_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.ACCESS_KEY_SECRET!,
  },
});

export const lambdaHandler = async (event: any = {}): Promise<any> => {
  try {
    const command = new AdminInitiateAuthCommand({
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      ClientId: process.env.COGNITO_APP_CLIENT_ID!,
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      AuthParameters: {
        USERNAME: event.body.username,
        PASSWORD: event.body.password,
      },
    });

    const response = await cognito.send(command);

    // Authentication result is not available, indicating bad credentials
    if (!response.AuthenticationResult) {
      return {
        statusCode: 422,
        headers: { 'content-type': 'application/json' },
        body: {
          message:
            'Invalid username or password. Please check your credentials and try again.',
        },
      };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: {
        token: response.AuthenticationResult?.IdToken,
      },
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: {
        message: error.message,
      },
    };
  }
};

const handler = middy(lambdaHandler).use(jsonBodyParser());

export { handler };
