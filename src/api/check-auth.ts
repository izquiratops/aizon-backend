import middy from '@middy/core';

export const lambdaHandler = async (event: any = {}): Promise<any> => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: 'Auth works',
    }),
  };
};

const handler = middy(lambdaHandler);

export { handler };
