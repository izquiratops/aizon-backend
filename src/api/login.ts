import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const command = new AdminInitiateAuthCommand({
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      ClientId: process.env.COGNITO_APP_CLIENT_ID!,
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      AuthParameters: {
        USERNAME: (event.body as any).username,
        PASSWORD: (event.body as any).password,
      },
    });

    const response = await cognito.send(command);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: response.AuthenticationResult?.IdToken,
      }),
    };
  } catch (error: any) {
    if (error.name === 'NotAuthorizedException') {
      return {
        statusCode: 422,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message:
            'Invalid username or password. Please check your credentials and try again.',
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(error),
    };
  }
};

const handler = middy(lambdaHandler).use(jsonBodyParser()).use(cors());

export { handler };
