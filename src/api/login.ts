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

    if (!response.AuthenticationResult) {
      throw new Error('Authorization failed');
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: response.AuthenticationResult?.IdToken,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 401,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
};

const handler = middy(lambdaHandler).use(jsonBodyParser());

export { handler };
