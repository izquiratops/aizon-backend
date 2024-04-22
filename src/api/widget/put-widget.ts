import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WidgetStore } from '../../store/widget';

const store = new WidgetStore();

// ! About typing Body: https://github.com/middyjs/middy/issues/316
// Not doing it because I don't have enough time
export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Extract the ID parameter from the path parameters
  const id = event.pathParameters!.widgetId;

  // Some checkings to make sure all the required data is there
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

  // Parse the body filled with the Widget object
  const widget = event.body as any;
  if (typeof widget !== 'object') {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Failed to parse from request body: Widget is not an object',
      }),
    };
  }

  if (!widget.name || !widget.type) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message:
          'Failed to parse from request body: Widget lacks of required fields',
      }),
    };
  }

  // Make sure the route matches with the Widget Id
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
    // Edit the widget or add a new one if it's not found
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

const handler = middy(lambdaHandler).use(jsonBodyParser()).use(cors());

export { handler };
