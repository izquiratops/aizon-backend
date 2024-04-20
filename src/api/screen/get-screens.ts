import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ScreenStore } from '../../store/screen';

const store = new ScreenStore();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const result = await store.getScreens(
      event.queryStringParameters?.includeWidgets === 'true'
    );

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
