import middy from '@middy/core';
import { DynamoDbWidget } from '../../store/widget';

const store = new DynamoDbWidget();

export const lambdaHandler = async (event: any = {}): Promise<any> => {
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
