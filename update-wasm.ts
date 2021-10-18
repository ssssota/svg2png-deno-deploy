// deno run --allow-net --allow-write ./update-wasm.ts
const releasesResponse = await fetch(
  "https://api.github.com/repos/ssssota/svg2png-wasm/releases",
);
const releases = await releasesResponse.json();
const latestRelease = releases[0];
const wasmAsset = latestRelease.assets[0];
const downloadUrl = wasmAsset.browser_download_url;
const wasmResponse = await fetch(downloadUrl);
const wasmBuffer = await wasmResponse.arrayBuffer();
await Deno.writeFile("./svg2png.wasm", new Uint8Array(wasmBuffer));
