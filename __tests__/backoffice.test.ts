import { describe, expect, it } from "vitest";
import {
  createSession,
  hashPassword,
  isValidSession,
  SESSION_SECONDS,
  sameText,
  verifyPassword,
} from "@/lib/backoffice/auth";
import {
  buildManifest,
  type Catalog,
  type CurationState,
  move,
  planPublish,
  slugify,
  syncState,
} from "@/lib/backoffice/curation";

describe("password", () => {
  it("should accept the right password and reject a wrong one", () => {
    const stored = hashPassword("correct horse");
    expect(verifyPassword("correct horse", stored)).toBe(true);
    expect(verifyPassword("wrong horse", stored)).toBe(false);
  });

  it("should produce a hash a .env file cannot mangle", () => {
    expect(hashPassword("x")).not.toContain("$");
  });

  it("should reject a malformed stored hash", () => {
    expect(verifyPassword("x", "plain-text")).toBe(false);
  });

  it("should compare usernames of different lengths without throwing", () => {
    expect(sameText("cami", "cami")).toBe(true);
    expect(sameText("cami", "camila")).toBe(false);
  });
});

describe("session", () => {
  const secret = "s".repeat(32);

  it("should accept its own session until it expires", () => {
    const now = 1_000_000;
    const token = createSession(secret, now);
    expect(isValidSession(token, secret, now + 1000)).toBe(true);
    expect(
      isValidSession(token, secret, now + SESSION_SECONDS * 1000 + 1),
    ).toBe(false);
  });

  it("should reject a tampered expiry, another secret or no cookie", () => {
    const token = createSession(secret, 0);
    const [, signature] = token.split(".");
    expect(isValidSession(`9999999999999.${signature}`, secret, 0)).toBe(false);
    expect(isValidSession(token, "other".repeat(8), 0)).toBe(false);
    expect(isValidSession(undefined, secret, 0)).toBe(false);
  });
});

const photo = (id: string) => ({
  id,
  path: `A/${id}`,
  width: 300,
  height: 200,
  exif: { iso: 100 },
});
const catalog: Catalog = {
  generatedAt: "2026-11-27T00:00:00Z",
  albums: [
    {
      key: "Croacia + Mostar ‘25",
      photos: [photo("a"), photo("b"), photo("c")],
    },
    { key: "BKT/parque guay guay", photos: [photo("d")] },
  ],
};

describe("syncState", () => {
  it("should add new albums and photos hidden, with a slug from the album name", () => {
    const state = syncState(catalog, { albums: [] });
    expect(state.albums.map((album) => [album.slug, album.visible])).toEqual([
      ["croacia-mostar-25", false],
      ["parque-guay-guay", false],
    ]);
    expect(state.albums[0].photos.every((p) => !p.visible)).toBe(true);
  });

  it("should keep existing choices and order, append new photos and drop missing ones", () => {
    const previous: CurationState = {
      albums: [
        {
          key: "Croacia + Mostar ‘25",
          slug: "croatia",
          title: { en: "Croatia", es: "Croacia" },
          visible: true,
          photos: [
            { id: "c", visible: true },
            { id: "gone", visible: true },
            { id: "a", visible: false },
          ],
        },
      ],
    };
    const [croatia] = syncState(catalog, previous).albums;
    expect(croatia.slug).toBe("croatia");
    expect(croatia.photos).toEqual([
      { id: "c", visible: true },
      { id: "a", visible: false },
      { id: "b", visible: false },
    ]);
  });
});

describe("buildManifest", () => {
  it("should publish only visible photos of visible albums, in the chosen order", () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[0] = {
      ...state.albums[0],
      visible: true,
      coverId: "a",
      photos: [
        { id: "c", visible: true },
        { id: "a", visible: false },
        { id: "b", visible: true },
      ],
    };
    const manifest = buildManifest(catalog, state, "now");
    expect(manifest.albums).toHaveLength(1);
    expect(manifest.albums[0].photos.map((p) => p.id)).toEqual(["c", "b"]);
    expect(manifest.albums[0].coverId).toBe("c");
  });

  it("should leave out a visible album with no visible photos", () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[1].visible = true;
    expect(buildManifest(catalog, state, "now").albums).toEqual([]);
  });
});

describe("planPublish", () => {
  it("should copy what is new and remove what is no longer shown", () => {
    const manifest = buildManifest(
      catalog,
      {
        albums: [
          {
            key: "BKT/parque guay guay",
            slug: "p",
            title: { en: "P" },
            visible: true,
            photos: [{ id: "d", visible: true }],
          },
        ],
      },
      "now",
    );
    expect(planPublish(manifest, ["x", "d"])).toEqual({
      copy: [],
      remove: ["x"],
    });
    expect(planPublish(manifest, [])).toEqual({ copy: ["d"], remove: [] });
  });
});

describe("helpers", () => {
  it("should slugify accents, quotes and symbols", () => {
    expect(slugify("España ‘25")).toBe("espana-25");
    expect(slugify("Bélgica")).toBe("belgica");
  });

  it("should move an item and ignore moves out of range", () => {
    expect(move(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(move(["a", "b"], 1, 2)).toEqual(["a", "b"]);
  });
});
