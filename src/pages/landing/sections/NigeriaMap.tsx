import { useEffect, useState } from "react";

type NodeKind = "turnout" | "sentiment" | "field" | "watch";

interface MapNode {
  /** State (or FCT) this node sits on. */
  name: string;
  x: number;
  y: number;
  kind: NodeKind;
  /** Pulse cycle length in seconds. */
  dur: number;
  /** Stagger, so the rings never beat in unison. */
  delay: number;
}

/** Node colours match the legend beneath the map. */
const NODE_COLOUR: Record<NodeKind, string> = {
  turnout: "var(--l-signal)",
  sentiment: "var(--l-positive)",
  field: "var(--l-foreground)",
  watch: "var(--l-amber)",
};

/**
 * Nigeria's national boundary, generated from Natural Earth 1:10m public-domain
 * country data: simplified to 213 points, projected equirectangular with
 * longitude scaled by cos(mean latitude) so the country isn't stretched, then
 * fitted to this 400x300 viewBox.
 */
const OUTLINE =
  "M58.2 75.8L60.1 74L58.4 69.9L59.8 67.6L59.4 52.6L67.5 46L71.9 39L73 25.5L76.4 24.9L83.6 19.3L93.4 17L103.8 17.9L107.8 14.7L112 14L129.3 20.8L131.8 19.7L135.7 21.2L151.5 39.1L155.2 39L158.8 35.6L164.3 35.7L176.3 29.1L184.2 30.4L192.6 36.9L196.2 37.1L200.2 41.1L207.6 43.2L225.7 44.5L235.2 34.8L240.5 31.8L256 28.3L277.4 28.6L289 32L294.7 35.6L306.3 37.1L308.8 32L315.6 28.4L317.4 25.9L316.6 25.1L327.4 23.4L330.3 18.8L338 19L350.8 36.7L354.3 56.7L362.6 57.7L367.7 62.5L364.1 75.4L366.4 77.7L365.9 81L353.6 88.8L348.5 87.7L342.1 95.1L336.1 106.3L333.2 119.5L327.5 122.6L327 127.5L328.4 129.5L326.5 136.8L317 141.5L318.2 144.7L314.7 159L308.7 163.3L303.4 163.2L304.4 166.4L299.4 169.5L298.4 181.6L293.6 188.4L293.7 192.5L285.7 201.3L289.5 206.5L280.8 212.3L280 218.8L276.8 220.9L275.5 224.2L268.3 224.8L266.1 216.1L262.6 214.9L260.4 210.3L254.5 207.5L253.3 205.1L251 212.3L243.1 212.2L241.2 208.6L233.7 214.8L231.3 214.6L228.6 222L218.7 228.2L208.7 240L205.2 241.4L204.2 245.5L206.5 248.5L203.6 260.9L196.1 273.6L192.7 272.5L193 269.7L191.3 271.1L186.3 265.6L191.1 275.3L189.3 278.2L168.9 278.8L168.5 273.6L167.3 277.5L161.2 276.7L162.6 278.7L161.2 279.4L155.3 272.2L158.5 279L156.5 280.9L155.5 279.4L154.5 281.3L153.4 277.3L154.5 275.5L152.3 273L153 276.5L150.5 274.4L154 282.4L152.4 283.1L149.6 282.4L147.3 270.6L145.4 270.1L149.7 283.5L145.4 283.7L145.9 276.5L144.8 281.7L143.6 279.2L144.6 284.2L142.5 284.2L140.7 279.4L141.3 284.2L132.9 285.4L134.6 281.3L132.7 282.5L132 279.6L131.6 285.2L128.5 286L127.8 282.1L126.5 282.2L127.1 285.3L125.3 284.7L125 281.9L124.3 284.3L122.3 283.3L114 275.7L110.7 269.7L111.6 270.3L108.2 261.8L110.7 262.7L110.1 261.2L111.3 261.4L110 260L107.6 260.8L106.9 255.7L113.5 254.6L112.3 251.9L115.3 250.1L111.8 251.3L110.9 253.7L109.2 253L109.5 254.2L102.9 251.2L103.6 248.9L108.4 249.5L109.7 247.6L111.6 248.7L109.9 246.8L106.5 248.3L106.8 244.9L105.2 247.9L102.4 248.9L101 247.6L100.3 242.9L101.7 243.3L105.5 239.6L98.6 243.7L90.3 233.2L80.8 226.9L52.2 224.5L56.6 224.2L65.1 219.8L55.9 222.2L54.9 220L52.7 221.5L52.2 225.8L33.2 226.7L35.3 217.3L33.5 209.3L35.3 207.6L34.1 206.1L34.2 197.2L35.7 195.3L33.7 192.2L33.9 186.3L32.3 183.4L34.1 175.1L33 171.4L35 150.5L43.6 149.5L45.7 144L45.2 139.2L48.4 134.2L50.8 133.7L50.6 129.5L55.8 128.2L58 125.3L60.1 119.7L57.5 115.8L59.7 111.5L63.1 112.3L64.9 106.9L61.9 101L61.7 92.4L54.6 83.7L58.2 75.8Z";

/**
 * All 36 states and the FCT, positioned at their capitals through the same
 * projection as the outline — so every node sits where that state actually is.
 */
const NODES: MapNode[] = [
  { name: "SOKOTO", x: 104.1, y: 37.2, kind: "field", dur: 3, delay: 0 },
  { name: "KEBBI", x: 75, y: 54.5, kind: "turnout", dur: 3.4, delay: 0.11 },
  { name: "ZAMFARA", x: 143.8, y: 62.7, kind: "watch", dur: 3.8, delay: 0.22 },
  { name: "KATSINA", x: 170.1, y: 39.2, kind: "turnout", dur: 4.2, delay: 0.33 },
  { name: "KANO", x: 195.8, y: 67.2, kind: "sentiment", dur: 4.6, delay: 0.44 },
  { name: "JIGAWA", x: 218.7, y: 74, kind: "field", dur: 3, delay: 0.55 },
  { name: "YOBE", x: 292, y: 74.3, kind: "turnout", dur: 3.4, delay: 0.66 },
  { name: "BORNO", x: 325.2, y: 72, kind: "watch", dur: 3.8, delay: 0.77 },
  { name: "BAUCHI", x: 232.7, y: 115.1, kind: "turnout", dur: 4.2, delay: 0.88 },
  { name: "GOMBE", x: 269.9, y: 115.6, kind: "sentiment", dur: 4.6, delay: 0.99 },
  { name: "ADAMAWA", x: 306.5, y: 146.5, kind: "field", dur: 3, delay: 1.1 },
  { name: "KADUNA", x: 165.6, y: 109.1, kind: "turnout", dur: 3.4, delay: 1.21 },
  { name: "NIGER", x: 140.7, y: 134.9, kind: "watch", dur: 3.8, delay: 1.32 },
  { name: "PLATEAU", x: 205.3, y: 126.7, kind: "turnout", dur: 4.2, delay: 1.43 },
  { name: "NASARAWA", x: 195.8, y: 166.6, kind: "sentiment", dur: 4.6, delay: 1.54 },
  { name: "TARABA", x: 275.5, y: 155.3, kind: "field", dur: 3, delay: 1.65 },
  { name: "FCT", x: 167, y: 150.5, kind: "turnout", dur: 3.4, delay: 1.76 },
  { name: "KWARA", x: 84.8, y: 166.3, kind: "watch", dur: 3.8, delay: 1.87 },
  { name: "OYO", x: 66.6, y: 198, kind: "turnout", dur: 4.2, delay: 1.98 },
  { name: "OSUN", x: 85.1, y: 187, kind: "sentiment", dur: 4.6, delay: 2.09 },
  { name: "EKITI", x: 103.5, y: 191.2, kind: "field", dur: 3, delay: 2.2 },
  { name: "ONDO", x: 103, y: 201.7, kind: "turnout", dur: 3.4, delay: 2.31 },
  { name: "OGUN", x: 51.3, y: 204.5, kind: "watch", dur: 3.8, delay: 2.42 },
  { name: "LAGOS", x: 51.3, y: 220.1, kind: "turnout", dur: 4.2, delay: 2.53 },
  { name: "KOGI", x: 146, y: 186.1, kind: "sentiment", dur: 4.6, delay: 2.64 },
  { name: "BENUE", x: 196.4, y: 188.1, kind: "field", dur: 3, delay: 2.75 },
  { name: "EDO", x: 114.7, y: 227.5, kind: "turnout", dur: 3.4, delay: 2.86 },
  { name: "DELTA", x: 145.8, y: 231.4, kind: "watch", dur: 3.8, delay: 2.97 },
  { name: "ANAMBRA", x: 155.3, y: 231.1, kind: "turnout", dur: 4.2, delay: 3.08 },
  { name: "ENUGU", x: 167.3, y: 224.6, kind: "sentiment", dur: 4.6, delay: 3.19 },
  { name: "EBONYI", x: 184.3, y: 228, kind: "field", dur: 3, delay: 3.3 },
  { name: "IMO", x: 154.1, y: 251.8, kind: "turnout", dur: 3.4, delay: 3.41 },
  { name: "ABIA", x: 167, y: 250.4, kind: "watch", dur: 3.8, delay: 3.52 },
  { name: "CROSS RIVER", x: 190.5, y: 266.5, kind: "turnout", dur: 4.2, delay: 3.63 },
  { name: "AKWA IBOM", x: 179.3, y: 264.3, kind: "sentiment", dur: 4.6, delay: 3.74 },
  { name: "RIVERS", x: 154.7, y: 270.8, kind: "field", dur: 3, delay: 3.85 },
  { name: "BAYELSA", x: 132.6, y: 267.7, kind: "turnout", dur: 3.4, delay: 3.96 },
];

/** Relay paths between each node and its nearest neighbour. */
const CONNECTORS: [number, number, number, number][] = [
  [104.1, 37.2, 75, 54.5],
  [143.8, 62.7, 170.1, 39.2],
  [195.8, 67.2, 218.7, 74],
  [292, 74.3, 325.2, 72],
  [232.7, 115.1, 205.3, 126.7],
  [269.9, 115.6, 232.7, 115.1],
  [306.5, 146.5, 275.5, 155.3],
  [165.6, 109.1, 140.7, 134.9],
  [140.7, 134.9, 167, 150.5],
  [195.8, 166.6, 196.4, 188.1],
  [84.8, 166.3, 85.1, 187],
  [66.6, 198, 51.3, 204.5],
  [85.1, 187, 103.5, 191.2],
  [103.5, 191.2, 103, 201.7],
  [51.3, 204.5, 51.3, 220.1],
  [146, 186.1, 167, 150.5],
  [114.7, 227.5, 103, 201.7],
  [145.8, 231.4, 155.3, 231.1],
  [167.3, 224.6, 155.3, 231.1],
  [184.3, 228, 167.3, 224.6],
  [154.1, 251.8, 167, 250.4],
  [190.5, 266.5, 179.3, 264.3],
  [154.7, 270.8, 154.1, 251.8],
  [132.6, 267.7, 154.7, 270.8],
];

/** How long each state stays highlighted. */
const STATE_DWELL_MS = 1600;

/**
 * Live monitoring map for the hero panel.
 *
 * Each node is a solid dot with a hollow ring pulsing around it on its own
 * cycle; the staggered durations keep the surface feeling continuously active
 * rather than metronomic. Motion is dropped entirely when the visitor has asked
 * for reduced motion.
 */
export default function NigeriaMap() {
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    // Holding on one state is the calmer behaviour when motion is unwelcome.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setFocus((i) => (i + 1) % NODES.length),
      STATE_DWELL_MS,
    );
    return () => clearInterval(id);
  }, []);

  const active = NODES[focus];
  // Flip the label inboard near the right edge so it can never be clipped.
  const labelRight = active.x > 300;

  return (
    <div className="px-5 py-3">
      <svg
        viewBox="0 0 400 300"
        className="h-auto w-full"
        role="img"
        aria-label={`Map of Nigeria showing Sentinel monitoring nodes in all 36 states and the FCT; currently highlighting ${active.name}`}
      >
        <defs>
          <linearGradient id="l-map-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--l-panel-2)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--l-panel)" stopOpacity="0.5" />
          </linearGradient>

          <pattern id="l-map-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M16 0 L0 0 0 16"
              fill="none"
              stroke="var(--l-hairline)"
              strokeWidth="0.4"
              opacity="0.5"
            />
          </pattern>
        </defs>

        <path d={OUTLINE} fill="url(#l-map-fill)" stroke="var(--l-hairline)" strokeWidth="1" />
        {/* Second pass lays the grid inside the boundary only. */}
        <path d={OUTLINE} fill="url(#l-map-grid)" />

        <g stroke="var(--l-signal)" strokeWidth="0.6" opacity="0.35" fill="none">
          {CONNECTORS.map(([x1, y1, x2, y2]) => (
            <line
              key={`${x1}-${y1}-${x2}-${y2}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeDasharray="3 4"
            />
          ))}
        </g>

        {/* Highlight ring and label for the state currently in focus. */}
        <circle
          cx={active.x}
          cy={active.y}
          r="12"
          fill="none"
          stroke="var(--l-signal)"
          strokeWidth="1.2"
          opacity="0.7"
        />
        <text
          x={active.x + (labelRight ? -16 : 16)}
          y={active.y + 3}
          textAnchor={labelRight ? "end" : "start"}
          fontSize="11"
          fontFamily="var(--font-l-mono)"
          letterSpacing="0.6"
          fill="var(--l-foreground)"
        >
          {active.name}
        </text>

        {NODES.map((node) => {
          const colour = NODE_COLOUR[node.kind];
          return (
            <g key={node.name}>
              <circle cx={node.x} cy={node.y} r="2" fill={colour} />
              <circle
                cx={node.x}
                cy={node.y}
                r="5"
                fill="none"
                stroke={colour}
                strokeWidth="1"
                className="l-map-pulse"
                style={{
                  transformOrigin: `${node.x}px ${node.y}px`,
                  animationDuration: `${node.dur}s`,
                  animationDelay: `${node.delay}s`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
