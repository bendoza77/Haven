import { ImageResponse } from "next/og";

/* Safari's touch icon has to be a raster, so it cannot reuse icon.svg. It is
   generated here instead of committed as a binary, which keeps the one
   description of the mark in code — change the numbers and both follow. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#191512";
const CREAM = "#f4efe9";

/* Same proportions as icon.svg, scaled from its 64-unit grid. */
const u = size.width / 64;

const bar = (x: number, y: number, width: number, height: number) => ({
  position: "absolute" as const,
  left: x * u,
  top: y * u,
  width: width * u,
  height: height * u,
  background: CREAM,
});

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          background: INK,
        }}
      >
        {/* stems */}
        <div style={bar(20.4, 16, 6.4, 32)} />
        <div style={bar(37.2, 16, 6.4, 32)} />
        {/* crossbar */}
        <div style={bar(20.4, 29.4, 23.2, 5.6)} />
        {/* slab serifs */}
        <div style={bar(16.6, 16, 14, 3.1)} />
        <div style={bar(33.4, 16, 14, 3.1)} />
        <div style={bar(16.6, 44.9, 14, 3.1)} />
        <div style={bar(33.4, 44.9, 14, 3.1)} />
      </div>
    ),
    size,
  );
}
