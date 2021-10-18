// deno run --allow-net --allow-read --watch ./index.ts

/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import {
  ConverterOptions,
  ConvertOptions,
  initialize,
  listenAndServe,
  parseMarkdown,
  svg2png,
} from "./deps.ts";

const getOptionsFromUrl = (url: string): ConvertOptions => {
  try {
    const { searchParams } = new URL(url);
    const scale = Number(searchParams.get("svg2png-scale")) || 1;
    const backgroundColor = searchParams.get("svg2png-background") || undefined;
    return { scale, backgroundColor };
  } catch (e) {
    return {};
  }
};

const getSvgUrl = (source: string): string | undefined => {
  try {
    const { href, origin } = new URL(source);
    const svgPath = new URL(
      href.substring(origin.length + 1).replace(/(https?:)\/\/?/, "$1//"),
    );
    return svgPath.toString();
  } catch (e) {
    return undefined;
  }
};

const fetchSvg = async (svgUrl: string): Promise<string | Response> => {
  try {
    const response = await fetch(svgUrl);
    const body = await response.text();
    if (response.ok) return body;
    return new Response(`SVGFetchError: ${body || response.statusText}`, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (e) {
    return new Response(`${e}`, { status: 500 });
  }
};

const handleRequest = async (req: Request): Promise<Response> => {
  try {
    const svgUrl = getSvgUrl(req.url);
    if (svgUrl === undefined) {
      return new Response(
        parseMarkdown(await Deno.readFile("./README.md")),
        { headers: { "content-type": "text/html" } },
      );
    }

    const svg = await fetchSvg(svgUrl);
    if (svg instanceof Response) return svg;

    await initialize(Deno.readFile("./svg2png.wasm")).catch(() => {});
    const options: ConverterOptions & ConvertOptions = {
      ...getOptionsFromUrl(req.url),
      fonts: await Promise.all([
        Deno.readFile("NotoSansJP-Black.otf"),
        Deno.readFile("NotoSansJP-Bold.otf"),
        Deno.readFile("NotoSansJP-Light.otf"),
        Deno.readFile("NotoSansJP-Medium.otf"),
        Deno.readFile("NotoSansJP-Regular.otf"),
        Deno.readFile("NotoSansJP-Thin.otf"),
      ]),
      defaultFontFamily: {
        sansSerifFamily: "Noto Sans JP",
        serifFamily: "Noto Sans JP",
        cursiveFamily: "Noto Sans JP",
        fantasyFamily: "Noto Sans JP",
        monospaceFamily: "Noto Sans JP",
      },
    };

    const buf = await svg2png(svg, options);
    return new Response(buf, {
      headers: {
        "content-type": "image/png",
      },
    });
  } catch (e) {
    return new Response(`${e}`, {
      status: 500,
    });
  }
};

await listenAndServe(":8080", handleRequest);
