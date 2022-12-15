import { isNone, isSome, Option } from "../src";
import { toBeTrue, toBeFalse, wait } from "./utility";

expect.extend({
  toBeTrue,
  toBeFalse,
});

describe("option", () => {
  test("creation", () => {
    const a = Option.some("abc");
    expect(a.isSome).toBeTrue();
    expect(a.isNone).toBeFalse();
    expect(a.unwrap()).toBe("abc");

    const b = Option.none();
    expect(b.isSome).toBeFalse();
    expect(b.isNone).toBeTrue();
    expect(() => b.unwrap()).toThrow();

    const c = Option.from<string>("abc");
    expect(c.isSome).toBeTrue();
    expect(c.isNone).toBeFalse();
    expect(c.unwrap()).toBe("abc");

    const d = Option.from<string>(null);
    expect(d.isSome).toBeFalse();
    expect(d.isNone).toBeTrue();
    expect(() => d.unwrap()).toThrow();

    const e = Option.from<string>(undefined);
    expect(e.isSome).toBeFalse();
    expect(e.isNone).toBeTrue();
    expect(() => e.unwrap()).toThrow();
  });

  test("unwrapping", () => {
    // Some test
    const a = Option.some<string>("abc");
    expect(a.unwrap()).toBe("abc");
    expect(a.unwrapOr("d")).toBe("abc");
    expect(a.asNullable()).toBe("abc");

    // None test
    const b = Option.none<string>();
    expect(() => b.unwrap()).toThrow();
    expect(b.unwrapOr("d")).toBe("d");
    expect(b.asNullable()).toBeNull();
  });

  test("mapping", () => {
    // Some test
    const a = Option.some<string>("123");

    const am = a.map((val) => parseInt(val));
    expect(am.isSome).toBeTrue();
    expect(am.unwrap()).toBe(123);

    const amo1 = a.mapOr((val) => parseInt(val), 4);
    expect(amo1.isSome).toBeTrue();
    expect(amo1.unwrap()).toBe(123);

    const amo2 = a.mapOr(
      (val) => parseInt(val),
      () => 4
    );
    expect(amo2.isSome).toBeTrue();
    expect(amo2.unwrap()).toBe(123);

    const amf1 = a.filter((val) => val.startsWith("1"));
    expect(amf1.isSome).toBeTrue();
    expect(amf1.unwrap()).toBe("123");

    const amf2 = a.filter((val) => val.startsWith("5"));
    expect(amf2.isNone).toBeTrue();

    // None test
    const b = Option.none<string>();

    const bm = b.map((val) => parseInt(val));
    expect(bm.isNone).toBeTrue();

    const bmo1 = b.mapOr((val) => parseInt(val), 4);
    expect(bmo1.isSome).toBeTrue();
    expect(bmo1.unwrap()).toBe(4);

    const bmo2 = b.mapOr(
      (val) => parseInt(val),
      () => 4
    );
    expect(bmo2.isSome).toBeTrue();
    expect(bmo2.unwrap()).toBe(4);

    const bmf1 = b.filter((val) => val.startsWith("1"));
    expect(bmf1.isNone).toBeTrue();

    const bmf2 = b.filter((val) => val.startsWith("5"));
    expect(bmf2.isNone).toBeTrue();
  });

  test("branching", async () => {
    let some = jest.fn();
    let none = jest.fn();

    const a = Option.some<string>("abc");
    a.when({ some, none });
    expect(some).toHaveBeenCalledWith("abc");

    const b = Option.none<string>();
    b.when({ some, none });
    expect(none).toHaveBeenCalled();

    some = jest.fn();
    none = jest.fn();

    await a.whenAsync({
      some: async (val) => {
        await wait(5);
        some(val);
      },
      none: async () => {
        await wait(5);
        none();
      },
    });
    expect(some).toHaveBeenCalledWith("abc");

    await b.whenAsync({
      some: async (val) => {
        await wait(5);
        some(val);
      },
      none: async () => {
        await wait(5);
        none();
      },
    });
    expect(none).toHaveBeenCalled();
  });

  test("monad conversion", () => {
    const a = Option.some<string>("abc");
    const ao = a.okOr(new Error("abc"));
    expect(ao.isOk).toBeTrue();
    expect(ao.unwrap()).toBe("abc");

    const b = Option.none<string>();
    const bo = b.okOr(new Error("abc"));
    expect(bo.isErr).toBeTrue();
    expect(bo.unwrapErr()).toEqual(new Error("abc"));
    const bo2 = b.okOr();
    expect(bo2.isErr).toBeTrue();
    expect(bo2.unwrapErr()).toEqual(new Error("Option was not a Some"));
  });

  test("misc", () => {
    const a = Option.some("abc");
    expect(isSome(a)).toBeTrue();
    expect(isNone(a)).toBeFalse();

    const b = Option.none();
    expect(isSome(b)).toBeFalse();
    expect(isNone(b)).toBeTrue();
  });
});
