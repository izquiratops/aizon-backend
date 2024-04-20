import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Screen } from '../model/screen';

export class ScreenDynamoDb {
  private static tableName = process.env.SCREEN_TABLE_NAME;
  private static client = new DynamoDBClient({});
  private static ddbDocClient = DynamoDBDocumentClient.from(
    ScreenDynamoDb.client
  );

  public async getScreen(id: string): Promise<Screen | undefined> {
    const params = new GetCommand({
      TableName: ScreenDynamoDb.tableName,
      Key: {
        id,
      },
    });

    const result = await ScreenDynamoDb.ddbDocClient.send(params);
    return result.Item as Screen;
  }

  public async putScreen(screen: Screen): Promise<void> {
    const params = new PutCommand({
      TableName: ScreenDynamoDb.tableName,
      Item: {
        id: screen.id,
        name: screen.name,
        widgets: screen.widgets,
      },
    });

    await ScreenDynamoDb.ddbDocClient.send(params);
  }

  public async deleteScreen(id: string): Promise<void> {
    const params = new DeleteCommand({
      TableName: ScreenDynamoDb.tableName,
      Key: {
        id,
      },
    });

    await ScreenDynamoDb.ddbDocClient.send(params);
  }

  public async getScreens(): Promise<Array<Screen> | undefined> {
    const params = new ScanCommand({
      TableName: ScreenDynamoDb.tableName,
      Limit: 30,
    });

    const result = await ScreenDynamoDb.ddbDocClient.send(params);
    return result.Items as Array<Screen>;
  }
}
