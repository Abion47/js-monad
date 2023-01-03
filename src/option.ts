import { Err, Ok, Result } from "./result";

/**
 * Type check for if the passed option is a Some.
 *
 * @param option The option to check.
 * @returns True if the option is a Some, false otherwise.
 */
export function isSome<T>(option: Option<T>): option is Some<T> {
  return option.isSome;
}

/**
 * Type check for if the passed option is a None.
 *
 * @param option The option to check.
 * @returns True if the option is a None, false otherwise.
 */
export function isNone<T>(option: Option<T>): option is None<T> {
  return option.isNone;
}

export abstract class Option<T> {
  /**
   * Creates a Some option with the given value.
   *
   * @param value A value.
   * @returns A Some typed to T, storing the given `value`.
   */
  static some<T>(value: T): Option<T> {
    return new Some<T>(value);
  }

  /**
   * Creates a None option.
   *
   * @returns A None typed to T.
   */
  static none<T>(): Option<T> {
    return new None<T>();
  }

  /**
   * If the passed `value` is null, this creates a None option. Otherwise,
   * this creates a Some option with the `value`.
   *
   * @param value A nullable value.
   * @returns Some if the `value` is not null, None otherwise.
   */
  static from<T>(value: T | null | undefined): Option<T> {
    if (value == null) return new None();
    return new Some<T>(value);
  }

  /**
   * Wraps an action and returns the result of the action as a Some. If the action
   * returns null or undefined, this returns a None.
   * @param action The action to take.
   * @returns Some if the action returns a non-null value, None otherwise.
   */
  static of<T>(action: () => T | null | undefined): Option<T> {
    const val = action();
    return this.from(val);
  }

  /**
   * Returns true if this option is a Some.
   */
  get isSome(): boolean {
    return this instanceof Some<T>;
  }

  /**
   * Returns true if this option is a None.
   */
  get isNone(): boolean {
    return this instanceof None<T>;
  }

  /**
   * Unwraps the option. If this option is a None, this throws an error with the given message.
   *
   * @param message The message to pass to the error if this option is a None.
   * @returns The value stored in the Some.
   */
  expect(message: string): T {
    if (isSome(this)) return this.value;
    throw new Error(message);
  }

  /**
   * If the option is a Some, this returns the stored value. Otherwise,
   * this throws an error.
   *
   * @returns The value stored in the Some.
   */
  unwrap(): T {
    return this.expect("Cannot unwrap an instance of None");
  }

  /**
   * If the option is a Some, this returns the stored value. Otherwise,
   * this returns the passed `value`.
   *
   * @param value The value to return if the option is a None.
   * @returns The value stored in the Some, or `value` if the option is a None.
   */
  unwrapOr(value: T): T {
    if (isSome(this)) return this.value;
    return value;
  }

  /**
   * Unwraps the option as a nullable type.
   *
   * @returns The value stored in the Some, or null if the option is a None.
   */
  asNullable(): T | null {
    if (isSome(this)) return this.value;
    return null;
  }

  /**
   * If this option is a Some, returns a Some that contains the value resulting from
   * the call to `op` with the value of this Some. Otherwise, returns a None.
   *
   * @param op The mapping function to call with this option's value. Is not called if this option is a None.
   * @returns A Some with the mapped value, or a None if this option is a None.
   */
  map<U>(op: (val: T) => U): Option<U> {
    if (isSome(this)) return new Some<U>(op(this.value));
    return new None<U>();
  }

  /**
   * If this option is a Some, returns a Some that contains the return value from
   * the call to `op` with the value of this Some. Otherwise, returns a Some that
   * contains the return value from the call to `elseOp` if it is a function and the
   * value of `elseOp` otherwise.
   *
   * @param op The mapping function to call with this option's value. Is not called if this option is a None.
   * @param elseOp The function to call if this option is a None.
   * @returns A Some with either the mapped value or the else value.
   */
  mapOr<U>(op: (val: T) => U, elseOp: U | (() => U)): Option<U> {
    if (isSome(this)) return new Some<U>(op(this.value));
    if (typeof elseOp === "function") return new Some<U>((elseOp as () => U)());
    return new Some<U>(elseOp);
  }

  /**
   * Calls the predicate with the value of this option. If the predicate returns true,
   * this returns a Some with the value. Otherwise, this returns a None.
   *
   * If this option is a None, this returns a None without calling the predicate.
   *
   * @param pred The predicate to call with the passed Some value.
   * @returns A Some if this option is a Some and the predicate returns true, or a None in any other circumstance.
   */
  filter(pred: (val: T) => boolean): Option<T> {
    if (isSome(this) && pred(this.value)) return new Some<T>(this.value);
    return new None<T>();
  }

  /**
   * Performs an action depending on whether this option is a Some or a None. If the former,
   * the action function is called passing the value of the Some.
   *
   * @param ops A `some` function that takes a value and a `none` function that takes no parameter.
   */
  when(ops: { some: (val: T) => void; none: () => void }): void {
    if (isSome(this)) ops.some(this.value);
    else ops.none();
  }

  /**
   * Performs an action depending on whether this option is a Some or a None. If the former,
   * the action function is called passing the value of the Some. The actions are executed
   * asynchronously.
   *
   * @param ops A `some` function that takes a value and a `none` function that takes no parameter.
   * @returns The asynchronous `Promise` of calling an action function.
   */
  whenAsync(ops: {
    some: (val: T) => Promise<void>;
    none: () => Promise<void>;
  }): Promise<void> {
    if (isSome(this)) return ops.some(this.value);
    else return ops.none();
  }

  /**
   * Converts this option into a result. If this option is a Some, a Ok is returned with the
   * stored value. If this option is a None, a Err is returned with the given error, or with a
   * default error if none is provided.
   *
   * @param err An optional specified error to pass to the Err if this option is a None.
   * @returns A Ok if this option is a Some, and an Err otherwise.
   */
  okOr<E extends Error>(err?: E): Result<T, E> {
    if (isSome(this)) return new Ok(this.value);
    return new Err(err ?? (new Error("Option was not a Some") as E));
  }
}

export class Some<T> extends Option<T> {
  value: T;

  constructor(value: T) {
    super();

    this.value = value;
  }
}

export class None<T> extends Option<T> {
  constructor() {
    super();
  }
}
