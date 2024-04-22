import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WidgetStore } from '../../store/widget';

const store = new WidgetStore();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Extract the ID parameter from the path parameters
  // Example: domain.com/prod/widget/1 will get the Widget with Id value 1
  const id = event.pathParameters!.widgetId;

  if (!id) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: "Missing 'id' parameter in path" }),
    };
  }

  try {
    // Retrieve the widget from the DynamoDB table using the Id
    const result = await store.getWidgetById(id);

    if (!result) {
      return {
        statusCode: 204,
        body: JSON.stringify({ message: 'Widget not found' }),
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

const handler = middy(lambdaHandler).use(cors());

export { handler };
