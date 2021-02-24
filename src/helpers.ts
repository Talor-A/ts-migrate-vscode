export type Success = { status: "success" };
export type Failure = { status: "failure"; message: string };
export type Status = Success | Failure;
export const asSuccess = (): Status => ({ status: "success" });
export const asFailure = (message: string): Status => ({
  status: "failure",
  message,
});
