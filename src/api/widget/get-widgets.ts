import middy from '@middy/core';
import { WidgetDynamoDb } from '../../store/widget';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const store = new WidgetDynamoDb();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const result = await store.getWidgets();

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        widgets: result,
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
