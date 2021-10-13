import {
  ConverterOptions,
  ConvertOptions,
  initialize,
  svg2png,
} from "./deps.ts";

const getOptionsFromUrl = (url: string): ConvertOptions => {
  try {
    const { searchParams } = new URL(url);
    const scale = Number(searchParams.get("svg2png-scale")) || 1;
    return { scale };
  } catch (e) {
    return {};
  }
};

const getSvgUrl = (source: string): string | Response => {
  try {
    const { href, origin } = new URL(source);
    const svgPath = new URL(
      href.substring(origin.length + 1).replace(/(https?:)\/\/?/, "$1//"),
    );
    return svgPath.toString();
  } catch (e) {
    return new Response("Invalid URL", { status: 400 });
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
    await initialize(Deno.readFile("./svg2png_wasm_bg.wasm")).catch(() => {});
    const options: ConverterOptions = {
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

    const svgUrl = getSvgUrl(req.url);
    if (svgUrl instanceof Response) return svgUrl;

    const svg = await fetchSvg(svgUrl);
    if (svg instanceof Response) return svg;

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

addEventListener("fetch", async (event) => {
  event.respondWith(handleRequest(event.request));
});
