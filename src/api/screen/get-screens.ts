import middy from '@middy/core';
import { APIGatewayProxyResult } from 'aws-lambda';
import { ScreenStore } from '../../store/screen';

const store = new ScreenStore();

export const lambdaHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await store.getScreens();

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        screens: result,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(error),
    };
  }
};

const handler = middy(lambdaHandler);

export { handler };
