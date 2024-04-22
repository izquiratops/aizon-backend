import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ScreenStore } from '../../store/screen';
import { Screen } from '../../model/screen';

const store = new ScreenStore();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Extract the ID parameter from the path parameters
  const id = event.pathParameters!.screenId;

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

  // ! event.body is typed to string, but it's actually an object
  let screen: Screen = event.body as any;
  if (typeof screen !== 'object') {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Failed to parse the request body: Screen must be an object',
      }),
    };
  }

  if (!screen.name) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message:
          'Failed to parse the request body: Screen lacks of required fields',
      }),
    };
  }

  // Make sure the route matches with the Screen Id
  if (id !== screen.id) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `Requested Id (${id}) does not match the Screen Id from body (${screen.id})`,
      }),
    };
  }

  try {
    // Edit the screen or add a new one if it's not found
    await store.putScreen(screen);

    return {
      statusCode: 201,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Screen created',
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
