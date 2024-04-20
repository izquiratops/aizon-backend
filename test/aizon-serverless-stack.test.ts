const getWidget = require('../src/api/widget/get-widget');
const AWS = require('aws-sdk');

describe('GET Widget', () => {
  beforeEach(() => {
    AWS.mock(
      'DynamoDB.DocumentClient',
      'get',
      (params: any, callback: Function) => {
        // Simulate DynamoDB response
        if (params.TableName === 'Widget' && params.Key.widgetId === '0') {
          callback(null, {
            Item: {
              id: '0',
              name: 'TestObject',
              type: 'BarChart',
            },
          });
        } else {
          callback('Invalid parameters', null);
        }
      }
    );
  });

  test('should return the widget with the specified id', async () => {
    const result = await getWidget('0');

    expect(result).toEqual({
      id: '0',
      name: 'TestObject',
      type: 'BarChart',
    });
  });
});
