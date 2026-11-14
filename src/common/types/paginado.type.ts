export interface Paginado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
