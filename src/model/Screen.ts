import { Widget } from './widget';

export interface Screen {
  id: string;
  name: string;
  widgetIds?: Array<string>;
  widgets?: Array<Widget>;
}
