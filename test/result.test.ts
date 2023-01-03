import { Result } from "../src";
import { toBeTrue, toBeFalse, wait } from "./utility";

expect.extend({
  toBeTrue,
  toBeFalse,
});

describe("result", () => {
  test("creation", async () => {
    const a = Result.ok<string, Error>("abc");
    expect(a.isOk).toBeTrue();
    expect(a.isErr).toBeFalse();
    expect(a.unwrap()).toBe("abc");

    const b = Result.err<string, Error>(new Error("abc"));
    expect(b.isOk).toBeFalse();
    expect(b.isErr).toBeTrue();
    expect(() => b.unwrap()).toThrow();

    const c = await Result.fromAsync<string, Error>(async () => {
      await wait(5);
      return "abc";
    });
    expect(c.isOk).toBeTrue();
    expect(c.isErr).toBeFalse();
    expect(c.unwrap()).toBe("abc");

    const d = await Result.fromAsync<string, Error>(async () => {
      await wait(5);
      throw new Error("abc");
    });
    expect(d.isOk).toBeFalse();
    expect(d.isErr).toBeTrue();
    expect(() => d.unwrap()).toThrow();

    const e = await Result.fromCallback<string, Error>((res, _) => {
      res("abc");
    });
    expect(e.isOk).toBeTrue();
    expect(e.isErr).toBeFalse();
    expect(e.unwrap()).toBe("abc");

    const f = await Result.fromCallback<string, Error>((_, rej) => {
      rej(new Error("abc"));
    });
    expect(f.isOk).toBeFalse();
    expect(f.isErr).toBeTrue();
    expect(() => f.unwrap()).toThrow();

    const g = Result.of(() => {
      return "abc";
    });
    expect(g.isOk).toBeTrue();
    expect(g.isErr).toBeFalse();
    expect(g.unwrap()).toBe("abc");

    const h = Result.of(() => {
      throw new Error("abc");
    });
    expect(h.isOk).toBeFalse();
    expect(h.isErr).toBeTrue();
    expect(() => h.unwrap()).toThrow();

    const i = Result.of(() => {
      throw "abc";
    });
    expect(i.isOk).toBeFalse();
    expect(i.isErr).toBeTrue();
    expect(() => i.unwrap()).toThrow();

    const j = Result.of(() => {
      throw null;
    });
    expect(j.isOk).toBeFalse();
    expect(j.isErr).toBeTrue();
    expect(() => i.unwrap()).toThrow();
  });

  test("unwrapping", () => {
    // Ok tests
    const a = Result.ok("abc");
    expect(a.isOk).toBeTrue();
    expect(a.unwrap()).toBe("abc");
    expect(() => a.unwrapErr()).toThrow();
    expect(a.unwrapOr("d")).toBe("abc");

    // Err tests
    const b = Result.err(new Error("abc"));
    expect(b.isErr).toBeTrue();
    expect(() => b.unwrap()).toThrow();
    expect(b.unwrapErr()).toEqual(new Error("abc"));
    expect(b.unwrapOr("d")).toBe("d");
  });

  test("mapping", () => {
    // Ok tests
    const a = Result.ok<string, Error>("123");

    const am = a.map((val) => parseInt(val));
    expect(am.isOk).toBeTrue();
    expect(am.unwrap()).toBe(123);

    const amo = a.mapOr((val) => parseInt(val), 4);
    expect(amo.isOk).toBeTrue();
    expect(amo.unwrap()).toBe(123);

    const amof = a.mapOr(
      (val) => parseInt(val),
      () => 4
    );
    expect(amof.isOk).toBeTrue();
    expect(amof.unwrap()).toBe(123);

    // Err tests
    const b = Result.err<string, Error>(new Error("123"));

    const bm = b.map((val) => parseInt(val));
    expect(bm.isErr).toBeTrue();
    expect(() => bm.unwrap()).toThrow();

    const bmo = b.mapOr((val) => parseInt(val), 4);
    expect(bmo.isOk).toBeTrue();
    expect(bmo.unwrap()).toBe(4);

    const bmof = b.mapOr(
      (val) => parseInt(val),
      () => 4
    );
    expect(bmof.isOk).toBeTrue();
    expect(bmof.unwrap()).toBe(4);
  });

  test("branching", async () => {
    let ok = jest.fn();
    let err = jest.fn();

    const a = Result.ok<string, Error>("abc");
    a.when({ ok, err });
    expect(ok).toHaveBeenCalledWith("abc");

    const b = Result.err<string, Error>(new Error("abc"));
    b.when({ ok, err });
    expect(err).toHaveBeenCalledWith(new Error("abc"));

    ok = jest.fn();
    err = jest.fn();

    await a.whenAsync({
      ok: async (val) => {
        await wait(5);
        ok(val);
      },
      err: async (e) => {
        await wait(5);
        err(e);
      },
    });
    expect(ok).toHaveBeenCalledWith("abc");

    await b.whenAsync({
      ok: async (val) => {
        await wait(5);
        ok(val);
      },
      err: async (e) => {
        await wait(5);
        err(e);
      },
    });
    expect(err).toHaveBeenCalledWith(new Error("abc"));
  });
});
