import { Widget } from './widget';

export interface Screen {
  id: string;
  name: string;
  widgets: Array<Widget>;
}
