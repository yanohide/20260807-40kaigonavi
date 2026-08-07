import type { PortableTextBlock } from "sanity";

function randomKey() {
  return Math.random().toString(36).slice(2, 14);
}

/** Empty paragraph block for new documents (WordPress-style starting point). */
export function createEmptyPortableTextBlock(): PortableTextBlock {
  return {
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: randomKey(),
        text: "",
        marks: [],
      },
    ],
  };
}
