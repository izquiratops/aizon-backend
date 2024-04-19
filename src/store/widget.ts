import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Widget } from '../model/widget';

export class DynamoDbWidget {
  private static tableName = process.env.WIDGET_TABLE_NAME;
  private static client = new DynamoDBClient({});
  private static ddbDocClient = DynamoDBDocumentClient.from(
    DynamoDbWidget.client
  );

  public async getWidget(id: string): Promise<Widget | undefined> {
    const params = new GetCommand({
      TableName: DynamoDbWidget.tableName,
      Key: {
        id,
      },
    });

    const result = await DynamoDbWidget.ddbDocClient.send(params);
    return result.Item as Widget;
  }
}
