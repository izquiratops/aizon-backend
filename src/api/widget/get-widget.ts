import middy from '@middy/core';
import { WidgetDynamoDb } from '../../store/widget';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const store = new WidgetDynamoDb();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters!.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: "Missing 'id' parameter in path" }),
    };
  }

  try {
    const result = await store.getWidget(id);

    if (!result) {
      return {
        statusCode: 204,
        body: 'Widget not found',
      };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result),
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
