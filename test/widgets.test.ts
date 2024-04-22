// Really useful source about mocking from the AWS blog
// https://aws.amazon.com/es/blogs/developer/mocking-modular-aws-sdk-for-javascript-v3-in-unit-tests/
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { lambdaHandler as getWidget } from '../src/api/widget/get-widget';
import { lambdaHandler as putWidget } from '../src/api/widget/put-widget';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Widgets', () => {
  // After every test execution, you need to reset the history and behavior of the mock.
  // Otherwise, the tests could interfere with each other.
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('🔸GET Widget by Id', () => {
    test('✅ should return 200 with the widget found on the body', async () => {
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

  describe('🔸PUT Widget', () => {
    test('✅ should return 201 on successful save', async () => {
      ddbMock.on(PutCommand).resolves({});

      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: '0',
        },
        body: {
          id: '0',
          name: 'Sales',
          type: 'PieChart',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 201,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Widget created',
        }),
      });
    });

    test('⛔ should return 400 on missing Id', async () => {
      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: undefined, // ! Id missing on the URL
        },
        body: {
          id: '0',
          name: 'Sales',
          type: 'PieChart',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: "Missing 'id' parameter in path" }),
      });
    });

    test('⛔ should return 400 on missing Body', async () => {
      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: '0',
        },
        body: undefined,
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Empty request body' }),
      });
    });

    test('⛔ should return 400 on parse error', async () => {
      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: '0',
        },
        body: 'Not what lambda expects',
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Failed to parse from request body: Widget is not an object',
        }),
      });
    });

    test('⛔ should return 400 on missing required fields', async () => {
      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: '0',
        },
        body: 'Not what lambda expects',
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Failed to parse from request body: Widget is not an object',
        }),
      });
    });

    test('⛔ should return 400 on missmatching Ids', async () => {
      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: '22',
        },
        body: {
          id: '94',
          name: 'Sales',
          type: 'PieChart',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message:
            'Requested Id (22) does not match the Widget Id from body (94)',
        }),
      });
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(PutCommand).rejects();

      const result: APIGatewayProxyResult = await putWidget({
        pathParameters: {
          widgetId: '0',
        },
        body: {
          id: '0',
          name: 'Sales',
          type: 'PieChart',
        },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });

  describe.skip('🔸DELETE Widget', () => {
    // TODO
  });

  describe.skip('🔸GET Widgets', () => {
    // TODO
  });
});
