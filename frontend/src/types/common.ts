export interface ApiEnvelopeSuccess<T> {
  success: true;
  data: T;
}

export interface ApiEnvelopeError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeError;

export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
