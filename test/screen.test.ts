import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyResult } from 'aws-lambda';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { lambdaHandler as getScreen } from '../src/api/screen/get-screen';
import { lambdaHandler as putScreen } from '../src/api/screen/put-screen';
import { lambdaHandler as deleteScreen } from '../src/api/screen/delete-screen';
import { lambdaHandler as getScreens } from '../src/api/screen/get-screens';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Screens', () => {
  // After every test execution, you need to reset the history and behavior of the mock.
  // Otherwise, the tests could interfere with each other.
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('🔸GET Screen by Id', () => {
    test('✅ should return 200 with the screen found on the body', async () => {
      // Get from Screen table
      ddbMock
        .on(GetCommand)
        .resolvesOnce({
          Item: { id: '0', name: 'Screen', widgetIds: ['0'] },
        })
        .resolvesOnce({
          Item: { id: '0', name: 'Widget', type: 'PieChart' },
        });

      const result: APIGatewayProxyResult = await getScreen({
        pathParameters: {
          screenId: '0',
        },
        queryStringParameters: {
          includeWidgets: 'true',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: '0',
          name: 'Screen',
          widgets: [
            {
              id: '0',
              name: 'Widget',
              type: 'PieChart',
            },
          ],
        }),
      });
    });

    test("✅ should return 204 if there's no widget found", async () => {
      ddbMock.on(GetCommand).resolves({
        Item: undefined,
      });

      const result: APIGatewayProxyResult = await getScreen({
        pathParameters: {
          screenId: '0',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 204,
        body: JSON.stringify({ message: 'Screen not found' }),
      });
    });

    test('⛔ should return 400 on missing Id', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { id: '0', name: 'Screen', widgetIds: ['0'] },
      });

      const result: APIGatewayProxyResult = await getScreen({
        pathParameters: {
          widgetId: undefined,
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: "Missing 'id' parameter in path" }),
      });
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(GetCommand).rejects();

      const result: APIGatewayProxyResult = await getScreen({
        pathParameters: {
          screenId: '0',
        },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });

  describe('🔸PUT Screen', () => {
    test('✅ should return 201 on successful save', async () => {
      ddbMock.on(PutCommand).resolves({});

      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: '0',
        },
        body: {
          id: '0',
          name: 'Example Screen',
          widgetIds: ['2', '5'],
        },
      } as any);

      expect(result).toEqual({
        statusCode: 201,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Screen created',
        }),
      });
    });

    test('⛔ should return 400 on missing Id', async () => {
      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: undefined,
        },
        body: {
          id: '0',
          name: 'Example Screen',
          widgetIds: ['2', '5'],
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: "Missing 'id' parameter in path" }),
      });
    });

    test('⛔ should return 400 on missing Body', async () => {
      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: '0',
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
      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: '0',
        },
        body: 'Not what lambda expects',
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Failed to parse the request body: Screen must be an object',
        }),
      });
    });

    test('⛔ should return 400 on missing required fields', async () => {
      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: '0',
        },
        body: {
          id: '0',
          // name: 'Missing name',
          widgetIds: ['2', '5'],
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message:
            'Failed to parse the request body: Screen lacks of required fields',
        }),
      });
    });

    test('⛔ should return 400 on missmatching Ids', async () => {
      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: '22',
        },
        body: {
          id: '94',
          name: 'Example Screen',
          widgetIds: ['2', '5'],
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message:
            'Requested Id (22) does not match the Screen Id from body (94)',
        }),
      });
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(PutCommand).rejects();

      const result: APIGatewayProxyResult = await putScreen({
        pathParameters: {
          screenId: '0',
        },
        body: {
          id: '0',
          name: 'Example Screen',
          widgetIds: ['2', '5'],
        },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });

  describe('🔸DELETE Screen', () => {
    test('✅ should return 201 on successful delete', async () => {
      ddbMock.on(DeleteCommand).resolves({});

      const result: APIGatewayProxyResult = await deleteScreen({
        pathParameters: {
          screenId: '0',
        },
      } as any);

      expect(result).toEqual({
        statusCode: 201,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Screen deleted',
        }),
      });
    });

    test('⛔ should return 400 on missing Id', async () => {
      const result: APIGatewayProxyResult = await deleteScreen({
        pathParameters: {
          screenId: undefined, // ! Id missing on the URL
        },
      } as any);

      expect(result).toEqual({
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: "Missing 'id' parameter in path" }),
      });
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(DeleteCommand).rejects();

      const result: APIGatewayProxyResult = await deleteScreen({
        pathParameters: {
          screenId: '0',
        },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });

  describe('🔸GET Screens', () => {
    test('✅ should return 200 with all the widgets found', async () => {
      ddbMock.on(ScanCommand).resolves({
        Items: [
          {
            id: '0',
            name: 'First Screen',
            widgetIds: ['0', '1'],
          },
          {
            id: '1',
            name: 'Second Screen',
            widgetIds: ['2'],
          },
        ],
      });

      ddbMock
        .on(GetCommand)
        .resolvesOnce({
          Item: { id: '0', name: 'First Widget', type: 'ChartPie' },
        })
        .resolvesOnce({
          Item: { id: '1', name: 'Second Widget', type: 'BarChart' },
        })
        .resolvesOnce({
          Item: { id: '2', name: 'Third Widget', type: 'LineChart' },
        });

      const result: APIGatewayProxyResult = await getScreens({
        queryStringParameters: { includeWidgets: 'true' },
      } as any);

      expect(result).toEqual({
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          screens: [
            {
              id: '0',
              name: 'First Screen',
              widgets: [
                { id: '0', name: 'First Widget', type: 'ChartPie' },
                { id: '1', name: 'Second Widget', type: 'BarChart' },
              ],
            },
            {
              id: '1',
              name: 'Second Screen',
              widgets: [{ id: '2', name: 'Third Widget', type: 'LineChart' }],
            },
          ],
        }),
      });
    });

    test('⛔ should return 500 on database throwing an Error', async () => {
      ddbMock.on(GetCommand).rejects();

      const result: APIGatewayProxyResult = await getScreens({
        queryStringParameters: { includeWidgets: 'true' },
      } as any);

      expect(result.statusCode).toEqual(500);
    });
  });
});
