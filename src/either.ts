import { None, Option, Some } from "./option";
import { Err, Ok, Result } from "./result";

/**
 * Type check for if the passed either is a Left.
 *
 * @param either The either to check.
 * @returns True if the either is a Left, false otherwise.
 */
export function isLeft<TLeft, TRight>(
  either: Either<TLeft, TRight>
): either is Left<TLeft, TRight> {
  return either.isLeft;
}

/**
 * Type check for if the passed either is a Right.
 *
 * @param either The either to check.
 * @returns True if the either is a Right, false otherwise.
 */
export function isRight<TLeft, TRight>(
  either: Either<TLeft, TRight>
): either is Right<TLeft, TRight> {
  return either.isRight;
}

export abstract class Either<TLeft, TRight> {
  /**
   * Creates a Left either with the given value.
   * @param value A value.
   * @returns A Left storing the given `value`.
   */
  static left<TLeft, TRight>(value: TLeft) {
    return new Left<TLeft, TRight>(value);
  }

  /**
   * Creates a Right either with the given value.
   * @param value A value.
   * @returns A Right storing the given `value`.
   */
  static right<TLeft, TRight>(value: TRight) {
    return new Right<TLeft, TRight>(value);
  }

  /**
   * Returns true if this either is a Left.
   */
  get isLeft(): boolean {
    return this instanceof Left<TLeft, TRight>;
  }

  /**
   * Returns true if this either is a Right.
   */
  get isRight(): boolean {
    return this instanceof Right<TLeft, TRight>;
  }

  /**
   * Unwraps the either's left value. If this either is a Right, this throws an error with the given message.
   *
   * @param message The message to pass to the error if this either is a Right.
   * @returns The value stored in the Left.
   */
  expectLeft(message: string): TLeft {
    if (isLeft(this)) return this.value;
    throw new Error(message);
  }

  /**
   * Unwraps the either's right value. If this either is a Left, this throws an error with the given message.
   *
   * @param message The message to pass to the error if this either is a Left.
   * @returns The value stored in the Right.
   */
  expectRight(message: string): TRight {
    if (isRight(this)) return this.value;
    throw new Error(message);
  }

  /**
   * Unwraps the either's left value. If this either is a Right, this throws an error.
   *
   * @returns The value stored in the Left.
   */
  unwrapLeft(): TLeft {
    return this.expectLeft("Cannot unwrap an instance of Right");
  }

  /**
   * Unwraps the either's left value. If this either is a Right, this returns
   * the passed value instead.
   *
   * @param value The value to return if the either is a Right.
   * @returns The value stored in the Left, or `value` if the either is a Right.
   */
  unwrapLeftOr(value: TLeft): TLeft {
    if (isLeft(this)) return this.value;
    return value;
  }

  /**
   * Unwraps the either's right value. If this either is a Left, this throws an error.
   *
   * @returns The value stored in the Right.
   */
  unwrapRight(): TRight {
    return this.expectRight("Cannot unwrap an instance of Left");
  }

  /**
   * Unwraps the either's right value. If this either is a Left, this returns
   * the passed value instead.
   *
   * @param value The value to return if the either is a Left.
   * @returns The value stored in the Right, or `value` if the either is a Left.
   */
  unwrapRightOr(value: TRight): TRight {
    if (isRight(this)) return this.value;
    return value;
  }

  /**
   * Unwraps the either as a union type.
   *
   * @returns The value stored in the either regardless of whether it's a Left or a Right.
   */
  asUnion(): TLeft | TRight {
    if (this.isLeft) return this.unwrapLeft();
    return this.unwrapRight();
  }

  /**
   * If this either is a Left, returns a Left that contains the value resulting from the
   * call to `leftOp`. Otherwise, returns a Right that contains the value resulting from
   * the call to `rightOp`.
   *
   * @param leftOp The mapping function to call with this either's left value.
   * @param rightOp The mapping function to call with this either's right value.
   * @returns A Left or Right with the mapped value, depending on the type of this either.
   */
  map<TNewLeft, TNewRight>(
    leftOp: (val: TLeft) => TNewLeft,
    rightOp: (val: TRight) => TNewRight
  ): Either<TNewLeft, TNewRight> {
    if (this.isLeft) return new Left(leftOp(this.unwrapLeft()));
    return new Right(rightOp(this.unwrapRight()));
  }

  /**
   * If this either is a Left, returns a Left that contains the value resulting from the
   * call to `op`. Otherwise, returns a Right with the original value.
   *
   * @param op The mapping function to call with this either's left value.
   * @returns A Left with the mapped value or a Right with the original value, depending on the type of this either.
   */
  mapLeft<TNew>(op: (val: TLeft) => TNew): Either<TNew, TRight> {
    if (this.isLeft) return new Left(op(this.unwrapLeft()));
    return new Right(this.unwrapRight());
  }

  /**
   * If this either is a Left, returns a Left that contains the value resulting from the
   * call to `op`. Otherwise, returns a Left with the passed value.
   *
   * @param op The mapping function to call with this either's left value.
   * @param value The default value if this either is a Right.
   * @returns A Left with the mapped value or the passed value, depending on the type of this either.
   */
  mapLeftOr<TNew>(op: (val: TLeft) => TNew, value: TNew): Either<TNew, TRight> {
    if (this.isLeft) return new Left(op(this.unwrapLeft()));
    return new Left(value);
  }

  /**
   * If this either is a Right, returns a Right that contains the value resulting from the
   * call to `op`. Otherwise, returns a Left with the original value.
   *
   * @param op The mapping function to call with this either's right value.
   * @returns A Right with the mapped value or a Left with the original value, depending on the type of this either.
   */
  mapRight<TNew>(op: (val: TRight) => TNew): Either<TLeft, TNew> {
    if (this.isRight) return new Right(op(this.unwrapRight()));
    return new Left(this.unwrapLeft());
  }

  /**
   * If this either is a Right, returns a Right that contains the value resulting from the
   * call to `op`. Otherwise, returns a Right with the passed value.
   *
   * @param op The mapping function to call with this either's right value.
   * @param value The default value if this either is a Left.
   * @returns A Left with the mapped value or the passed value, depending on the type of this either.
   */
  mapRightOr<TNew>(
    op: (val: TRight) => TNew,
    value: TNew
  ): Either<TLeft, TNew> {
    if (this.isRight) return new Right(op(this.unwrapRight()));
    return new Right(value);
  }

  /**
   * Performs an action depending on whether this option is a Left or a Right. If the former,
   * the action function is called passing the value of the Left. If the latter, the action function
   * is called passing the value of the Right.
   *
   * @param ops A `left` function that takes a value and a `right` function that takes a value.
   */
  when(ops: {
    left: (val: TLeft) => void;
    right: (val: TRight) => void;
  }): void {
    if (this.isLeft) return ops.left(this.unwrapLeft());
    else return ops.right(this.unwrapRight());
  }

  /**
   * Performs an action depending on whether this option is a Left or a Right. If the former,
   * the action function is called passing the value of the Left. If the latter, the action function
   * is called passing the value of the Right. The actions are executed asynchronously.
   *
   * @param ops A `left` function that takes a value and a `right` function that takes a value.
   * @returns The asynchronous `Promise` of calling an action function.
   */
  whenAsync(ops: {
    left: (val: TLeft) => Promise<void>;
    right: (val: TRight) => Promise<void>;
  }): Promise<void> {
    if (this.isLeft) return ops.left(this.unwrapLeft());
    else return ops.right(this.unwrapRight());
  }

  /**
   * Converts this either into an Option, resulting in a Some with this either's left value if
   * this either is a Left or a None if this either is a Right.
   *
   * @returns A Some or a None, depending on the type of this either.
   */
  asOptionLeft(): Option<TLeft> {
    if (this.isLeft) return new Some(this.unwrapLeft());
    return new None();
  }

  /**
   * Converts this either into an Option, resulting in a Some with this either's left value if
   * this either is a Left or a Some with the given value if this either is a Right.
   *
   * @returns A Some with this either's left value or the given value, depending on the type of this either.
   */
  asOptionLeftOr(value: TLeft): Option<TLeft> {
    if (this.isLeft) return new Some(this.unwrapLeft());
    return new Some(value);
  }

  /**
   * Converts this either into an Option, resulting in a Some with this either's left value if
   * this either is a Left and this either's left value passes the given predicate. Otherwise,
   * a None is returned.
   *
   * @returns Some with the either's left value if this either is a Left and the predicate succeeds, None otherwise.
   */
  filterLeft(pred: (val: TLeft) => boolean): Option<TLeft> {
    if (this.isLeft && pred(this.unwrapLeft()))
      return new Some(this.unwrapLeft());
    return new None();
  }

  /**
   * Converts this either into a Result, resulting in a Ok with this either's left value if
   * this either is a Left or a Err with the passed error if this either is a Right.
   *
   * @returns A Ok or a Err, depending on the type of this either.
   */
  asResultLeft<E extends Error>(err?: E): Result<TLeft, E> {
    if (this.isLeft) return new Ok(this.unwrapLeft());
    return new Err(err ?? (new Error("Either was not a Left") as E));
  }

  /**
   * Converts this either into an Option, resulting in a Some with this either's right value if
   * this either is a Right or a None if this either is a Left.
   *
   * @returns A Some or a None, depending on the type of this either.
   */
  asOptionRight(): Option<TRight> {
    if (this.isRight) return new Some(this.unwrapRight());
    return new None();
  }

  /**
   * Converts this either into an Option, resulting in a Some with this either's right value if
   * this either is a Right or a Some with the given value if this either is a Left.
   *
   * @returns A Some with this either's right value or the given value, depending on the type of this either.
   */
  asOptionRightOr(value: TRight): Option<TRight> {
    if (this.isRight) return new Some(this.unwrapRight());
    return new Some(value);
  }

  /**
   * Converts this either into an Option, resulting in a Some with this either's right value if
   * this either is a Right and this either's right value passes the given predicate. Otherwise,
   * a None is returned.
   *
   * @returns Some with the either's right value if this either is a Right and the predicate succeeds, None otherwise.
   */
  filterRight(pred: (val: TRight) => boolean): Option<TRight> {
    if (this.isRight && pred(this.unwrapRight()))
      return new Some(this.unwrapRight());
    return new None();
  }

  /**
   * Converts this either into a Result, resulting in a Ok with this either's right value if
   * this either is a Right or a Err with the passed error if this either is a Left.
   *
   * @returns A Ok or a Err, depending on the type of this either.
   */
  asResultRight<E extends Error>(err?: E): Result<TRight, E> {
    if (this.isRight) return new Ok(this.unwrapRight());
    return new Err(err ?? (new Error("Either was not a Right") as E));
  }
}

export class Left<TLeft, TRight> extends Either<TLeft, TRight> {
  value: TLeft;

  constructor(value: TLeft) {
    super();
    this.value = value;
  }
}

export class Right<TLeft, TRight> extends Either<TLeft, TRight> {
  value: TRight;

  constructor(value: TRight) {
    super();
    this.value = value;
  }
}
