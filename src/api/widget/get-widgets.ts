import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyResult } from 'aws-lambda';
import { WidgetStore } from '../../store/widget';

const store = new WidgetStore();

export const lambdaHandler = async (): Promise<APIGatewayProxyResult> => {
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

const handler = middy(lambdaHandler).use(cors());

export { handler };
