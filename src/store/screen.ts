import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { WidgetStore } from './widget';
import { Screen } from '../model/screen';

export class ScreenStore {
  private static tableName = process.env.SCREEN_TABLE_NAME;
  private static client = new DynamoDBClient({});
  private static ddbDocClient = DynamoDBDocumentClient.from(ScreenStore.client);

  private static widgetStore = new WidgetStore();

  public async getScreenById(
    id: string,
    includeWidgets: boolean
  ): Promise<Screen | undefined> {
    // Getting the Screen object
    const params = new GetCommand({
      TableName: ScreenStore.tableName,
      Key: {
        id,
      },
    });

    const result = await ScreenStore.ddbDocClient.send(params);
    const screen = result.Item as Screen;

    // Early return if nothing were found.
    if (!screen) {
      return undefined;
    }

    // Relate widgets data if the client asks about it.
    if (includeWidgets && screen.widgetIds) {
      screen.widgets = await ScreenStore.widgetStore.getWidgetsByIds(
        screen.widgetIds
      );
    }

    // Delete the list of widget Ids as it may yield a list of widget objects too.
    delete screen.widgetIds;

    return screen;
  }

  public async putScreen(screen: Screen): Promise<void> {
    // TODO: Explain default values on widget lists. You want to add an [] if doesn't exists
    // (it's a not required field too) and you don't want to define widgets either.
    const params = new PutCommand({
      TableName: ScreenStore.tableName,
      Item: {
        id: screen.id,
        name: screen.name,
        widgetIds: screen.widgetIds ?? [],
      },
    });

    await ScreenStore.ddbDocClient.send(params);
  }

  public async deleteScreenById(id: string): Promise<void> {
    const params = new DeleteCommand({
      TableName: ScreenStore.tableName,
      Key: {
        id,
      },
    });

    await ScreenStore.ddbDocClient.send(params);
  }

  public async getScreens(
    includeWidgets: boolean
  ): Promise<Array<Screen> | undefined> {
    const params = new ScanCommand({
      TableName: ScreenStore.tableName,
      Limit: 30,
    });

    const result = await ScreenStore.ddbDocClient.send(params);
    const screens = result.Items as Array<Screen>;

    for (let screen of screens) {
      // Relate widgets data if the client asks about it.
      if (includeWidgets) {
        screen.widgets = await ScreenStore.widgetStore.getWidgetsByIds(
          screen.widgetIds!
        );
      }

      // Delete the list of widget Ids as it may yield a list of widget objects too.
      delete screen.widgetIds;
    }

    return screens;
  }
}
