/**
 * Type check for if the passed result is a Ok.
 *
 * @param result The result to check.
 * @returns True if the result is a Ok, false otherwise.
 */
export function isOk<T, E extends Error>(
  result: Result<T, E>
): result is Ok<T, E> {
  return result.isOk;
}

/**
 * Type check for if the passed result is a Err.
 *
 * @param result The result to check.
 * @returns True if the result is a Err, false otherwise.
 */
export function isErr<T, E extends Error>(
  result: Result<T, E>
): result is Err<T, E> {
  return result.isErr;
}

export abstract class Result<T, E extends Error> {
  /**
   * Creates a Ok result with the given value.
   *
   * @param value A value.
   * @returns A Ok storing the given `value`.
   */
  static ok<T, E extends Error>(value: T): Result<T, E> {
    return new Ok<T, E>(value);
  }

  /**
   * Creates a Err result with the given error.
   *
   * @param error An error.
   * @returns A Err storing the given `error`.
   */
  static error<T, E extends Error>(error: E): Result<T, E> {
    return new Err<T, E>(error);
  }

  /**
   * Wraps an asynchronous action and listens for the result. If the promise is successful,
   * the value returned is an Ok with the returned result as the value. If the promise throws
   * an error, the value returned is an Err with the thrown error as the value.
   *
   * @param action The asynchronous action to take.
   * @returns An Ok of the action is successful, and an Err otherwise.
   */
  static async fromAsync<T, E extends Error>(
    action: () => Promise<T>
  ): Promise<Result<T, E>> {
    try {
      const res = await action();
      return new Ok<T, E>(res);
    } catch (err) {
      return new Err<T, E>(err as E);
    }
  }

  /**
   * Wraps an action and asynchronously listens for the result passed to one of the given
   * callbacks. If `resolve` is called, the result is a Ok with the passed value. If `reject`
   * is called, the result is a Err with the passed error. Throws an error if both callbacks
   * are called or if one is called more than once. (If neither callback is called, the returned
   * promise will never resolve.)
   *
   * @param action The action to take with the callbacks passed as parameters.
   * @returns Apromise containing a Ok if `resolve` is called or a Err if `reject` is called.
   */
  static fromCallback<T, E extends Error>(
    action: (resolve: (val: T) => void, reject: (err: E) => void) => void
  ): Promise<Result<T, E>> {
    return new Promise((res, _) => {
      action(
        (val: T) => res(new Ok(val)),
        (err: E) => res(new Err(err))
      );
    });
  }

  /**
   * Returns true if this result is a Ok.
   */
  get isOk(): boolean {
    return this instanceof Ok<T, E>;
  }

  /**
   * Returns true if this result is a Err.
   */
  get isErr(): boolean {
    return this instanceof Err<T, E>;
  }

  /**
   * Unwraps the result. If this result is a Err, this throws an error with the given message.
   *
   * @param message The message to pass to the error if this result is a Err.
   * @returns The value stored in the Ok.
   */
  expect(message: string): T {
    if (isOk(this)) return this.value;
    throw new Error(message);
  }

  /**
   * Unwraps the result's error. If this result is a Ok, this throws an error with the given message.
   *
   * @param message The message to pass to the error if this result is a Ok.
   * @returns The value stored in the Err.
   */
  expectErr(message: string): E {
    if (isErr(this)) return this.error;
    throw new Error(message);
  }

  /**
   * If the result is a Ok, this returns the stored value. Otherwise,
   * this throws an error.
   *
   * @returns The value stored in the Ok.
   */
  unwrap(): T {
    return this.expect("Cannot unwrap an instance of Err");
  }

  /**
   * If the result is a Err, this returns the stored error. Otherwise,
   * this throws an error.
   *
   * @returns The value stored in the Err.
   */
  unwrapErr(): E {
    return this.expectErr("Cannot unwrap an instance of Ok");
  }

  /**
   * If the result is a Ok, this returns the stored value. Otherwise,
   * this returns the passed `value`.
   *
   * @param value The value to return if the result is a Err.
   * @returns The value stored in the Ok, or `value` if the result is a Err.
   */
  unwrapOr(val: T): T {
    if (isOk(this)) return this.value;
    return val;
  }

  /**
   * If this result is a Ok, returns a Ok that contains the value resulting from
   * the call to `op` with the value of this Ok. Otherwise, returns a Err.
   *
   * @param op The mapping function to call with this result's value. Is not called if this result is a Err.
   * @returns A Ok with the mapped value, or a Err if this result is a Err.
   */
  map<U>(op: (val: T) => U): Result<U, E> {
    if (isOk(this)) return new Ok(op(this.value));
    return new Err(this.unwrapErr());
  }

  /**
   * If this result is a Ok, returns a Ok that contains the return value from
   * the call to `op` with the value of this Ok. Otherwise, returns a Ok that
   * contains the return value from the call to `elseOp` if it is a function and the
   * value of `elseOp` otherwise.
   *
   * @param op The mapping function to call with this result's value. Is not called if this result is a Err.
   * @param elseOp The function to call if this result is a Err.
   * @returns A Some with either the mapped value or the else value.
   */
  mapOr<U>(op: (val: T) => U, elseOp: U | (() => U)): Result<U, E> {
    if (isOk(this)) return new Ok(op(this.value));
    if (typeof elseOp === "function") return new Ok((elseOp as () => U)());
    return new Ok(elseOp);
  }

  /**
   * Performs an action depending on whether this result is a Ok or a Err. If the former,
   * the action function is called passing the value of the Ok. If the latter, the action
   * function is called passing the error of the Err.
   *
   * @param ops A `ok` function that takes a value and a `err` function that takes an error.
   */
  when(ops: { ok: (val: T) => void; err: (error: E) => void }) {
    if (isOk(this)) ops.ok(this.value);
    else ops.err(this.unwrapErr());
  }

  /**
   * Performs an action depending on whether this result is a Ok or a Err. If the former,
   * the action function is called passing the value of the Ok. If the latter, the action
   * function is called passing the error of the Err. The actions are executed
   * asynchronously.
   *
   * @param ops A `ok` function that takes a value and a `err` function that takes an error.
   * @returns The asynchronous `Promise` of calling an action function.
   */
  whenAsync(ops: {
    ok: (val: T) => Promise<void>;
    err: (error: E) => Promise<void>;
  }): Promise<void> {
    if (isOk(this)) return ops.ok(this.value);
    else return ops.err(this.unwrapErr());
  }
}

export class Ok<T, E extends Error> extends Result<T, E> {
  value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }
}

export class Err<T, E extends Error> extends Result<T, E> {
  error: E;

  constructor(error: E) {
    super();
    this.error = error;
  }
}
