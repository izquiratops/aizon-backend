import middy from '@middy/core';

export const lambdaHandler = async (event: any = {}): Promise<any> => {
  console.log(event);

  return { statusCode: 201, body: 'こんにちは！' };
};

const handler = middy(lambdaHandler);

export { handler };
