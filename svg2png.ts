import { createSvg2png } from "./deps.ts";

export type ConvertOptions = {
  scale?: number;
  fonts?: Uint8Array[];
  defaultFontFamily?: object;
};

export const svg2png: (
  svg: string,
  opts: ConvertOptions,
) => Promise<Uint8Array> = createSvg2png(
  Deno.readFile("./svg2png_wasm_bg.wasm"),
);
