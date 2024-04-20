import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Widget } from '../model/widget';

export class WidgetDynamoDb {
  private static tableName = process.env.WIDGET_TABLE_NAME;
  private static client = new DynamoDBClient({});
  private static ddbDocClient = DynamoDBDocumentClient.from(
    WidgetDynamoDb.client
  );

  public async getWidget(id: string): Promise<Widget | undefined> {
    const params = new GetCommand({
      TableName: WidgetDynamoDb.tableName,
      Key: {
        id,
      },
    });

    const result = await WidgetDynamoDb.ddbDocClient.send(params);
    return result.Item as Widget;
  }

  public async putWidget(widget: Widget): Promise<void> {
    const params = new PutCommand({
      TableName: WidgetDynamoDb.tableName,
      Item: {
        id: widget.id,
        name: widget.name,
        type: widget.type,
        data: widget.data,
        configuration: widget.configuration,
      },
    });

    await WidgetDynamoDb.ddbDocClient.send(params);
  }

  public async deleteWidget(id: string): Promise<void> {
    const params = new DeleteCommand({
      TableName: WidgetDynamoDb.tableName,
      Key: {
        id,
      },
    });

    await WidgetDynamoDb.ddbDocClient.send(params);
  }

  public async getWidgets(): Promise<Array<Widget> | undefined> {
    const params = new ScanCommand({
      TableName: WidgetDynamoDb.tableName,
      Limit: 30,
    });

    const result = await WidgetDynamoDb.ddbDocClient.send(params);
    return result.Items as Array<Widget>;
  }
}
