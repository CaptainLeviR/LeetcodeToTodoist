export type DueSelection =
  | { type: 'string'; value: string }
  | { type: 'date'; value: string };

export interface CreateTaskRequest {
  type: 'createTodoistTask';
  title: string;
  url: string;
  due: DueSelection;
}

export interface CreateTaskResponse {
  ok: boolean;
  error?: 'missing_token' | 'todoist_error' | 'network_error';
  message?: string;
}

export interface GetProblemDataRequest {
  type: 'getProblemData';
}

export interface GetProblemDataResponse {
  ok: boolean;
  data?: {
    title: string;
    url: string;
  };
  message?: string;
}
