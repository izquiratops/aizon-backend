import middy from '@middy/core';
import { WidgetDynamoDb } from '../../store/widget';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Widget } from '../../model/widget';

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

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Empty request body' }),
    };
  }

  let widget: Widget;
  try {
    widget = JSON.parse(event.body) as Widget;

    if (typeof widget !== 'object') {
      throw Error('Parsed product is not an object');
    }
  } catch {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Failed to parse product from request body',
      }),
    };
  }

  if (id !== widget.id) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `Requested Id (${id}) does not match the Widget Id from body (${widget.id})`,
      }),
    };
  }

  try {
    await store.putWidget(widget);

    return {
      statusCode: 201,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Widget created',
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
