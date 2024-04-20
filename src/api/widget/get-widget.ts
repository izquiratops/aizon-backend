import middy from '@middy/core';
import { DynamoDbWidget } from '../../store/widget';

const store = new DynamoDbWidget();

export const lambdaHandler = async (event: any = {}): Promise<any> => {
  try {
    // '/prod/widget/230' will search for Widget with 230 as id value
    const result = await store.getWidget(event.pathParameters.id);

    if (!result) {
      return {
        statusCode: 204,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Widget not found',
        }),
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
