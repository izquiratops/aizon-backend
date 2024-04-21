import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Widget } from '../model/widget';

export class WidgetStore {
  private static tableName = process.env.WIDGET_TABLE_NAME;
  private static client = new DynamoDBClient({});
  private static ddbDocClient = DynamoDBDocumentClient.from(WidgetStore.client);

  public async getWidgetById(id: string): Promise<Widget | undefined> {
    const params = new GetCommand({
      TableName: WidgetStore.tableName,
      Key: {
        id,
      },
    });

    const result = await WidgetStore.ddbDocClient.send(params);
    return result.Item as Widget;
  }

  public async getWidgetsByIds(
    ids: Array<string>
  ): Promise<Array<Widget> | undefined> {
    const widgets: Array<Widget> = [];

    // ! This function should use BatchGetItemCommand, but I'm having issues with
    // unauthorized errors even after granting read access to the table Widgets.
    for (const id of ids) {
      const params = new GetCommand({
        TableName: WidgetStore.tableName,
        Key: {
          id,
        },
      });

      const result = await WidgetStore.ddbDocClient.send(params);

      if (result.Item) {
        widgets.push(result.Item as Widget);
      }
    }

    return widgets;
  }

  public async putWidget(widget: Widget): Promise<void> {
    const params = new PutCommand({
      TableName: WidgetStore.tableName,
      Item: {
        id: widget.id,
        name: widget.name,
        type: widget.type,
        data: widget.data,
        configuration: widget.configuration,
      },
    });

    await WidgetStore.ddbDocClient.send(params);
  }

  public async deleteWidgetById(id: string): Promise<void> {
    const params = new DeleteCommand({
      TableName: WidgetStore.tableName,
      Key: {
        id,
      },
    });

    await WidgetStore.ddbDocClient.send(params);
  }

  public async getWidgets(): Promise<Array<Widget> | undefined> {
    const params = new ScanCommand({
      TableName: WidgetStore.tableName,
      Limit: 30,
    });

    const result = await WidgetStore.ddbDocClient.send(params);
    return result.Items as Array<Widget>;
  }
}
