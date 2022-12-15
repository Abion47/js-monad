import { Either, Option, Result } from "../src";
import { toBeTrue, toBeFalse, wait } from "./utility";

expect.extend({
  toBeTrue,
  toBeFalse,
});

describe("option", () => {
  test("creation", () => {
    const a = Either.left("abc");
    expect(a.isLeft).toBeTrue();
    expect(a.isRight).toBeFalse();
    expect(a.unwrapLeft()).toBe("abc");
    expect(() => a.unwrapRight()).toThrow();

    const b = Either.right("def");
    expect(b.isLeft).toBeFalse();
    expect(b.isRight).toBeTrue();
    expect(b.unwrapRight()).toBe("def");
    expect(() => b.unwrapLeft()).toThrow();
  });

  test("unwrapping", () => {
    const a = Either.left<string, number>("abc");
    const al = a.unwrapLeftOr("d");
    const ar = a.unwrapRightOr(4);
    expect(a.isLeft).toBeTrue();
    expect(al).toBe("abc");
    expect(ar).toBe(4);
    expect(typeof a.asUnion()).toBe("string");

    const b = Either.right<string, number>(123);
    const bl = b.unwrapLeftOr("d");
    const br = b.unwrapRightOr(4);
    expect(b.isRight).toBeTrue();
    expect(bl).toBe("d");
    expect(br).toBe(123);
    expect(typeof b.asUnion()).toBe("number");
  });

  test("mapping", () => {
    // Left tests
    const a = Either.left<string, number>("123");
    expect(a.isLeft).toBeTrue();
    expect(a.unwrapLeft()).toBe("123");

    const am = a.map(
      (lval) => parseInt(lval),
      (rval) => rval.toString()
    );
    expect(am.isLeft).toBeTrue();
    expect(am.unwrapLeft()).toBe(123);

    const aml = a.mapLeft((val) => parseInt(val));
    expect(aml.isLeft).toBeTrue();
    expect(aml.unwrapLeft()).toBe(123);

    const amlo = a.mapLeftOr((val) => parseInt(val), 4);
    expect(amlo.isLeft).toBeTrue();
    expect(amlo.unwrapLeft()).toBe(123);

    const amr = a.mapRight((val) => val.toString());
    expect(amr.isLeft).toBeTrue();
    expect(amr.unwrapLeft()).toBe("123");

    const amro = a.mapRightOr((val) => val.toString(), "4");
    expect(amro.isRight).toBeTrue();
    expect(amro.unwrapRight()).toBe("4");

    // Right tests
    const b = Either.right<string, number>(123);
    expect(b.isRight).toBeTrue();
    expect(b.unwrapRight()).toBe(123);

    const bm = b.map(
      (lval) => parseInt(lval),
      (rval) => rval.toString()
    );
    expect(bm.isRight).toBeTrue();
    expect(bm.unwrapRight()).toBe("123");

    const bml = b.mapLeft((val) => parseInt(val));
    expect(bml.isRight).toBeTrue();
    expect(bml.unwrapRight()).toBe(123);

    const bmlo = b.mapLeftOr((val) => parseInt(val), 4);
    expect(bmlo.isLeft).toBeTrue();
    expect(bmlo.unwrapLeft()).toBe(4);

    const bmr = b.mapRight((val) => val.toString());
    expect(bmr.isRight).toBeTrue();
    expect(bmr.unwrapRight()).toBe("123");

    const bmro = b.mapRightOr((val) => val.toString(), "4");
    expect(bmro.isRight).toBeTrue();
    expect(bmro.unwrapRight()).toBe("123");
  });

  test("branching", async () => {
    let left = jest.fn();
    let right = jest.fn();

    const a = Either.left<string, number>("abc");
    a.when({ left, right });
    expect(left).toHaveBeenCalledWith("abc");

    const b = Either.right<string, number>(123);
    b.when({ left, right });
    expect(right).toHaveBeenCalledWith(123);

    left = jest.fn();
    right = jest.fn();

    await a.whenAsync({
      left: async (val) => {
        await wait(5);
        left(val);
      },
      right: async (val) => {
        await wait(5);
        right(val);
      },
    });
    expect(left).toHaveBeenCalledWith("abc");

    await b.whenAsync({
      left: async (val) => {
        await wait(5);
        left(val);
      },
      right: async (val) => {
        await wait(5);
        right(val);
      },
    });
    expect(right).toHaveBeenCalledWith(123);
  });

  test("monad conversion", () => {
    // Left tests
    const a = Either.left<string, number>("abc");

    const aol = a.asOptionLeft();
    expect(aol instanceof Option).toBeTrue();
    expect(aol.isSome).toBeTrue();
    expect(aol.unwrap()).toBe("abc");

    const aolo = a.asOptionLeftOr("d");
    expect(aolo instanceof Option).toBeTrue();
    expect(aolo.isSome).toBeTrue();
    expect(aolo.unwrap()).toBe("abc");

    const afl1 = a.filterLeft((val) => val.startsWith("a"));
    expect(afl1 instanceof Option).toBeTrue();
    expect(afl1.isSome).toBeTrue();
    expect(afl1.unwrap()).toBe("abc");

    const afl2 = a.filterLeft((val) => val.startsWith("e"));
    expect(afl2 instanceof Option).toBeTrue();
    expect(afl2.isNone).toBeTrue();

    const arl1 = a.asResultLeft();
    expect(arl1 instanceof Result).toBeTrue();
    expect(arl1.isOk).toBeTrue();
    expect(arl1.unwrap()).toBe("abc");

    const arl2 = a.asResultLeft(new Error("custom error"));
    expect(arl2 instanceof Result).toBeTrue();
    expect(arl2.isOk).toBeTrue();
    expect(arl2.unwrap()).toBe("abc");

    const aor = a.asOptionRight();
    expect(aor instanceof Option).toBeTrue();
    expect(aor.isNone).toBeTrue();

    const aoro = a.asOptionRightOr(4);
    expect(aoro instanceof Option).toBeTrue();
    expect(aoro.isSome).toBeTrue();
    expect(aoro.unwrap()).toBe(4);

    const afr1 = a.filterRight((val) => val % 3 === 0);
    expect(afr1 instanceof Option).toBeTrue();
    expect(afr1.isNone).toBeTrue();

    const afr2 = a.filterRight((val) => val % 2 === 0);
    expect(afr2 instanceof Option).toBeTrue();
    expect(afr2.isNone).toBeTrue();

    const arr1 = a.asResultRight();
    expect(arr1 instanceof Result).toBeTrue();
    expect(arr1.isErr).toBeTrue();

    const arr2 = a.asResultRight(new Error("custom error"));
    expect(arr2 instanceof Result).toBeTrue();
    expect(arr2.isErr).toBeTrue();

    // Right tests
    const b = Either.right<string, number>(123);

    const bol = b.asOptionLeft();
    expect(bol instanceof Option).toBeTrue();
    expect(bol.isNone).toBeTrue();

    const bolo = b.asOptionLeftOr("d");
    expect(bolo instanceof Option).toBeTrue();
    expect(bolo.isSome).toBeTrue();
    expect(bolo.unwrap()).toBe("d");

    const bfl1 = b.filterLeft((val) => val.startsWith("a"));
    expect(bfl1 instanceof Option).toBeTrue();
    expect(bfl1.isNone).toBeTrue();

    const bfl2 = b.filterLeft((val) => val.startsWith("e"));
    expect(bfl2 instanceof Option).toBeTrue();
    expect(bfl2.isNone).toBeTrue();

    const brl1 = b.asResultLeft();
    expect(brl1 instanceof Result).toBeTrue();
    expect(brl1.isErr).toBeTrue();

    const brl2 = b.asResultLeft(new Error("custom error"));
    expect(brl2 instanceof Result).toBeTrue();
    expect(brl2.isErr).toBeTrue();

    const bor = b.asOptionRight();
    expect(bor instanceof Option).toBeTrue();
    expect(bor.isSome).toBeTrue();
    expect(bor.unwrap()).toBe(123);

    const boro = b.asOptionRightOr(4);
    expect(boro instanceof Option).toBeTrue();
    expect(boro.isSome).toBeTrue();
    expect(boro.unwrap()).toBe(123);

    const bfr1 = b.filterRight((val) => val % 3 === 0);
    expect(bfr1 instanceof Option).toBeTrue();
    expect(bfr1.isSome).toBeTrue();
    expect(boro.unwrap()).toBe(123);

    const bfr2 = b.filterRight((val) => val % 2 === 0);
    expect(bfr2 instanceof Option).toBeTrue();
    expect(bfr2.isNone).toBeTrue();

    const brr1 = b.asResultRight();
    expect(brr1 instanceof Result).toBeTrue();
    expect(brr1.isOk).toBeTrue();
    expect(brr1.unwrap()).toBe(123);

    const brr2 = b.asResultRight(new Error("custom error"));
    expect(brr2 instanceof Result).toBeTrue();
    expect(brr2.isOk).toBeTrue();
    expect(brr2.unwrap()).toBe(123);
  });
});
