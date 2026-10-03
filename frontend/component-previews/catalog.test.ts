import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import catalog from "./catalog.json";
import { storyRegistry } from "./src/story-registry";
import { previewStates } from "./src/story-types";

const repository = process.cwd();
const normalize = (value: string) => value.replaceAll("\\", "/");

async function componentFiles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await componentFiles(target)));
    else if (
      entry.name.endsWith(".vue") &&
      normalize(target).includes("/components/")
    ) {
      result.push(normalize(path.relative(repository, target)));
    }
  }
  return result.sort();
}

describe("component preview catalog", () => {
  it("registers every components directory Vue file exactly once", async () => {
    const discovered = await componentFiles(path.join(repository, "frontend"));
    const registered = catalog.map((entry) => entry.source).sort();
    expect(discovered).toHaveLength(79);
    expect(registered).toHaveLength(79);
    expect(registered).toEqual(discovered);
  });

  it("keeps IDs, names and aliases unique and paths valid", async () => {
    const ids = catalog.map((entry) => entry.id.toLocaleLowerCase());
    const names = catalog.map((entry) => entry.name.toLocaleLowerCase());
    const aliases = catalog.flatMap((entry) =>
      entry.aliases.map((alias) => alias.toLocaleLowerCase()),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(aliases).size).toBe(aliases.length);

    for (const entry of catalog) {
      await expect(
        stat(path.join(repository, entry.source)),
      ).resolves.toBeDefined();
      await expect(
        stat(path.join(repository, entry.story.split("#")[0])),
      ).resolves.toBeDefined();
    }
  });

  it("provides one complete state contract for every registered component", () => {
    expect(Object.keys(storyRegistry).sort()).toEqual(
      catalog.map((entry) => entry.name).sort(),
    );
    for (const entry of catalog) {
      const story = storyRegistry[entry.name];
      expect(story.name).toBe(entry.name);
      expect(story.supported).toContain("default");
      expect(story.supported).toContain("mobile");
      expect(new Set(story.supported).size).toBe(story.supported.length);
      for (const state of previewStates) {
        expect(
          story.supported.includes(state) || Boolean(story.reason?.[state]),
          `${entry.name}/${state}`,
        ).toBe(true);
      }
    }
  });
});
