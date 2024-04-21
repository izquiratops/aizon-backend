// Really useful source about mocking from the AWS blog
// https://aws.amazon.com/es/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { lambdaHandler as getWidget } from '../src/api/widget/get-widget';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Widgets', () => {
  // After every test execution, you need to reset the history and behavior of the mock.
  // Otherwise, the tests could interfere with each other.
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('🔸GET Widget by Id', () => {
    test('✅ should return 200 with the widget stringified on the body', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { id: '0', name: 'Wilburn', type: 'PL' },
      });

      const result: APIGatewayProxyResult = await getWidget({
        pathParameters: {
          widgetId: '0',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ id: '0', name: 'Wilburn', type: 'PL' }),
      });
    });

    test("✅ should return 204 if there's no widget found", async () => {
      ddbMock.on(GetCommand).resolves({
        Item: undefined,
      });

      const result: APIGatewayProxyResult = await getWidget({
        pathParameters: {
          widgetId: '0',
        },
      } as any);

      expect(result.statusCode).toEqual(204);
    });

    test('⛔ should return 400 on missing Id', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { id: '0', name: 'Wilburn', type: 'PL' },
      });

      const result: APIGatewayProxyResult = await getWidget({
        pathParameters: {
          widgetId: undefined,
        },
      } as any);

      expect(result.statusCode).toEqual(400);
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(GetCommand).rejects();

      const result: APIGatewayProxyResult = await getWidget({
        pathParameters: {
          widgetId: '0',
        },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });

  describe.skip('🔸PUT Widget', () => {
    // TODO
  });

  describe.skip('🔸DELETE Widget', () => {
    // TODO
  });

  describe.skip('🔸GET Widgets', () => {
    // TODO
  });
});
