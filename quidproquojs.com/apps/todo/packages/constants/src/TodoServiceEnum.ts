export enum TodoServiceEnum {
  Admin = 'admin',
  Auth = 'auth',
  Design = 'design',
  Shell = 'shell',
  Todo = 'todo',
}

export type TodoServiceEnumValues = `${TodoServiceEnum}`;
export const todoServiceNames: TodoServiceEnum[] = Object.values(TodoServiceEnum) as TodoServiceEnum[];
