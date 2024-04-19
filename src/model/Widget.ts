export interface Widget {
  id: string;
  name: string;
  type: 'BarChart' | 'PieChart' | 'Image';
  data?: any;
  configuration?: any;
}
