import middy from '@middy/core';

export const lambdaHandler = async (event: any = {}): Promise<any> => {
  console.log(event);

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: 'こんにちは！',
    }),
  };
};

const handler = middy(lambdaHandler);

export { handler };
