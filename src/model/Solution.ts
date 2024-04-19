import { Screen } from './screen';

export interface Solution {
  id: string;
  name: string;
  description?: string;
  screens: Array<Screen>;
}
