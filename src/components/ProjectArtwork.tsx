import type { ProjectVisual } from "@/data/project-catalog";

const stroke = "#b9a47d";
const panel = "#191c19";
const subdued = "#777d73";
const bright = "#e4dbca";
const green = "#91a384";

export default function ProjectArtwork({ visual, title }: { visual: ProjectVisual; title: string }) {
  return (
    <svg className={"project-art project-art-" + visual} viewBox="0 0 960 580" role="img" aria-label={"Conceptual project visual for " + title + "; not an application screenshot."}>
      <defs>
        <linearGradient id={"art-bg-" + visual} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#24251f" />
          <stop offset="1" stopColor="#0b0d0c" />
        </linearGradient>
        <linearGradient id={"art-glow-" + visual} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#d9b881" stopOpacity=".22" />
          <stop offset="1" stopColor="#9b7660" stopOpacity=".02" />
        </linearGradient>
        <pattern id={"art-grid-" + visual} width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M 34 0 L 0 0 0 34" fill="none" stroke="#fff" strokeOpacity=".035" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="960" height="580" rx="28" fill={"url(#art-bg-" + visual + ")"} />
      <rect width="960" height="580" rx="28" fill={"url(#art-grid-" + visual + ")"} />
      <circle cx="788" cy="84" r="250" fill={"url(#art-glow-" + visual + ")"} />
      <rect x="1" y="1" width="958" height="578" rx="27" fill="none" stroke="#fff" strokeOpacity=".1" />
      <path d="M0 58h960" stroke="#fff" strokeOpacity=".1" />
      <circle cx="28" cy="30" r="5" fill="#dd8b73" opacity=".9" />
      <circle cx="46" cy="30" r="5" fill="#cdb883" opacity=".9" />
      <circle cx="64" cy="30" r="5" fill="#879a7a" opacity=".9" />
      <text x="91" y="35" fill="#85877f" fontSize="12" fontFamily="monospace" letterSpacing="1.8">PROJECT VISUAL  /  CONCEPT VIEW</text>
      <rect x="0" y="58" width="67" height="522" fill="#101210" opacity=".88" />
      <path d="M67 58v522" stroke="#fff" strokeOpacity=".07" />
      <rect x="21" y="86" width="25" height="25" rx="8" fill="#d8c5a2" fillOpacity=".17" />
      <path d="M28 99h11M33.5 93.5v11" stroke="#d8c5a2" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="26" y="138" width="15" height="15" rx="4" fill="#fff" fillOpacity=".1" />
      <rect x="26" y="171" width="15" height="15" rx="4" fill="#fff" fillOpacity=".065" />
      <rect x="26" y="204" width="15" height="15" rx="4" fill="#fff" fillOpacity=".065" />

      {visual === "retail-iq" && (
        <>
          <text x="97" y="103" fill={bright} fontSize="22" fontFamily="Arial, sans-serif">Retail intelligence</text>
          <text x="97" y="124" fill={subdued} fontSize="11" fontFamily="monospace" letterSpacing="1">CUSTOMER VALUE  ·  RETENTION  ·  PRODUCT AFFINITY</text>
          <rect x="97" y="151" width="509" height="132" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="119" y="180" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">CUSTOMER VALUE OVER TIME</text>
          <path d="M120 248h455M120 225h455M120 202h455" stroke="#fff" strokeOpacity=".055" />
          <path d="M128 243c37-17 50-7 75-25s47 13 76-7 50-3 74-24 48 16 79-1 44 3 71-20 42-3 65-13" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M128 243c37-17 50-7 75-25s47 13 76-7 50-3 74-24 48 16 79-1 44 3 71-20 42-3 65-13v55H128z" fill={stroke} fillOpacity=".08" />
          <rect x="622" y="151" width="239" height="132" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="644" y="180" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">SEGMENT LENS</text>
          <text x="644" y="218" fill={bright} fontSize="17" fontFamily="Arial, sans-serif">RFM profiles</text>
          <text x="644" y="241" fill={subdued} fontSize="12" fontFamily="Arial, sans-serif">Recency · frequency · value</text>
          <rect x="97" y="301" width="764" height="190" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="119" y="331" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">CONNECTED ANALYSIS</text>
          {[
            ["Cohorts", 120, 370],
            ["Market basket", 354, 370],
            ["Instacart", 588, 370],
          ].map(([label, x, y]) => (
            <g key={label}>
              <rect x={x} y={y} width="205" height="82" rx="9" fill="#21251f" stroke="#fff" strokeOpacity=".07" />
              <circle cx={Number(x) + 24} cy={Number(y) + 27} r="6" fill={green} />
              <text x={Number(x) + 40} y={Number(y) + 32} fill={bright} fontSize="14" fontFamily="Arial, sans-serif">{label}</text>
              <path d={"M" + (Number(x) + 22) + " " + (Number(y) + 56) + "h148"} stroke="#fff" strokeOpacity=".12" />
              <path d={"M" + (Number(x) + 22) + " " + (Number(y) + 66) + "h94"} stroke="#fff" strokeOpacity=".07" />
            </g>
          ))}
        </>
      )}

      {visual === "shoplens" && (
        <>
          <text x="97" y="103" fill={bright} fontSize="22" fontFamily="Arial, sans-serif">ShopLens Analytics</text>
          <text x="97" y="124" fill={subdued} fontSize="11" fontFamily="monospace" letterSpacing="1">E-COMMERCE  /  RFM  /  CHURN  /  COHORTS</text>
          <rect x="97" y="151" width="256" height="333" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="119" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">PIPELINE</text>
          {["Clean transactions", "Star schema", "Customer segments", "Retention cohorts"].map((label, index) => (
            <g key={label}>
              <circle cx="128" cy={220 + index * 65} r="10" fill={index === 3 ? "#32372e" : "#34362e"} stroke={index === 3 ? green : stroke} strokeOpacity=".8" />
              <text x="128" y={224 + index * 65} textAnchor="middle" fill="#e8ddc8" fontSize="9" fontFamily="monospace">{String(index + 1).padStart(2, "0")}</text>
              <text x="151" y={224 + index * 65} fill={bright} fontSize="13" fontFamily="Arial, sans-serif">{label}</text>
              {index < 3 && <path d={"M128 " + (231 + index * 65) + "v41"} stroke="#a98e65" strokeOpacity=".55" strokeDasharray="3 5" />}
            </g>
          ))}
          <rect x="371" y="151" width="490" height="157" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="394" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">RETENTION CURVE</text>
          <path d="M396 270h436M396 240h436M396 210h436" stroke="#fff" strokeOpacity=".05" />
          <path d="M400 217c56 16 80 4 119 25s73 2 114 22 68 11 104 31 57 6 92 20" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle cx="519" cy="242" r="4" fill={bright} /><circle cx="633" cy="264" r="4" fill={bright} /><circle cx="737" cy="295" r="4" fill={bright} />
          <rect x="371" y="327" width="490" height="157" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="394" y="357" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">CUSTOMER SEGMENTS</text>
          {[["Champions", 394, 393, 360], ["Loyal", 394, 421, 280], ["At risk", 394, 449, 205]].map(([label, x, y, width]) => (
            <g key={label}>
              <text x={x} y={y} fill={bright} fontSize="12" fontFamily="Arial, sans-serif">{label}</text>
              <rect x="510" y={Number(y) - 10} width="304" height="7" rx="4" fill="#2a2e28" />
              <rect x="510" y={Number(y) - 10} width={width} height="7" rx="4" fill={stroke} fillOpacity=".8" />
            </g>
          ))}
        </>
      )}

      {visual === "sales" && (
        <>
          <text x="97" y="103" fill={bright} fontSize="22" fontFamily="Arial, sans-serif">Retail sales overview</text>
          <text x="97" y="124" fill={subdued} fontSize="11" fontFamily="monospace" letterSpacing="1">PERFORMANCE  /  PRODUCT  /  TIME  /  GEOGRAPHY</text>
          <rect x="97" y="151" width="500" height="327" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="119" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">SALES TREND</text>
          <path d="M120 421h452M120 377h452M120 333h452M120 289h452M120 245h452" stroke="#fff" strokeOpacity=".045" />
          <path d="M135 398l54-30 53 8 55-67 54 19 53-43 55 30 56-62 55 8" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {[135, 189, 242, 297, 351, 404, 459, 515, 570].map((x, index) => <circle key={x} cx={x} cy={[398, 368, 376, 309, 328, 285, 315, 253, 261][index]} r="4" fill={bright} />)}
          <rect x="618" y="151" width="243" height="149" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="640" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">PRODUCT MIX</text>
          {[84, 141, 106, 174, 119, 153, 94].map((height, index) => (
            <rect key={index} x={644 + index * 27} y={270 - height * .38} width="13" height={height * .38} rx="4" fill={index === 3 ? stroke : "#818973"} fillOpacity={index === 3 ? ".95" : ".62"} />
          ))}
          <rect x="618" y="319" width="243" height="159" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="640" y="349" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">CUSTOMER VALUE</text>
          {[["Country mix", 378], ["RFM groups", 411], ["Peak hours", 444]].map(([label, y]) => (
            <g key={label}>
              <text x="640" y={y} fill={bright} fontSize="12" fontFamily="Arial, sans-serif">{label}</text>
              <circle cx="830" cy={Number(y) - 4} r="4" fill={green} />
              <path d={"M640 " + (Number(y) + 9) + "h194"} stroke="#fff" strokeOpacity=".075" />
            </g>
          ))}
        </>
      )}

      {visual === "customer" && (
        <>
          <text x="97" y="103" fill={bright} fontSize="22" fontFamily="Arial, sans-serif">Shopping behaviour</text>
          <text x="97" y="124" fill={subdued} fontSize="11" fontFamily="monospace" letterSpacing="1">DEMOGRAPHICS  /  CATEGORY  /  LOYALTY</text>
          <rect x="97" y="151" width="300" height="332" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="120" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">SHOPPER PROFILE</text>
          <circle cx="179" cy="259" r="43" fill="#3b3b30" />
          <circle cx="179" cy="243" r="14" fill="#c7b593" fillOpacity=".76" />
          <path d="M147 291c3-24 16-35 32-35s29 11 32 35" fill="#a69270" fillOpacity=".72" />
          <text x="239" y="244" fill={bright} fontSize="14" fontFamily="Arial, sans-serif">Purchase profile</text>
          <text x="239" y="265" fill={subdued} fontSize="11" fontFamily="Arial, sans-serif">Segmented attributes</text>
          <path d="M120 325h252M120 370h252M120 415h252" stroke="#fff" strokeOpacity=".075" />
          <text x="120" y="351" fill={subdued} fontSize="11" fontFamily="monospace">AGE · CATEGORY</text>
          <text x="120" y="396" fill={subdued} fontSize="11" fontFamily="monospace">SEASON · LOCATION</text>
          <text x="120" y="441" fill={subdued} fontSize="11" fontFamily="monospace">SUBSCRIPTION · SHIPPING</text>
          <rect x="419" y="151" width="442" height="332" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="442" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">PURCHASE PATTERNS</text>
          {[["Apparel", 238], ["Footwear", 211], ["Accessories", 179], ["Outerwear", 146], ["Other", 110]].map(([label, width], index) => (
            <g key={label}>
              <text x="442" y={226 + index * 48} fill={bright} fontSize="12" fontFamily="Arial, sans-serif">{label}</text>
              <rect x="545" y={213 + index * 48} width="272" height="10" rx="5" fill="#2b2e29" />
              <rect x="545" y={213 + index * 48} width={width} height="10" rx="5" fill={index === 0 ? stroke : green} fillOpacity=".8" />
            </g>
          ))}
          <path d="M442 453h375" stroke="#fff" strokeOpacity=".075" />
          <text x="442" y="472" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing=".5">SQL SEGMENTS  →  POWER BI</text>
        </>
      )}

      {visual === "mask" && (
        <>
          <text x="97" y="103" fill={bright} fontSize="22" fontFamily="Arial, sans-serif">Face mask detection</text>
          <text x="97" y="124" fill={subdued} fontSize="11" fontFamily="monospace" letterSpacing="1">FACE LOCALISATION  /  TRANSFER LEARNING</text>
          <rect x="97" y="151" width="486" height="332" rx="12" fill="#121715" stroke="#fff" strokeOpacity=".07" />
          <path d="M121 179h36M121 179v36M560 179h-36M560 179v36M121 455h36M121 455v-36M560 455h-36M560 455v-36" stroke={green} strokeWidth="2" strokeOpacity=".6" />
          <ellipse cx="341" cy="314" rx="104" ry="121" fill="#a99779" fillOpacity=".15" stroke="#dac8a7" strokeOpacity=".55" />
          <path d="M303 295c7-6 14-6 21 0M359 295c7-6 14-6 21 0" fill="none" stroke={bright} strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
          <path d="M316 354q25 18 51 0" fill="none" stroke={stroke} strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" />
          <path d="M288 325q54-17 106 0v39q-52 27-106 0z" fill="#a3b096" fillOpacity=".55" stroke={green} strokeWidth="2" />
          <path d="M298 335h85M300 346h83M306 357h71" stroke="#dfe4d6" strokeOpacity=".2" />
          <rect x="610" y="151" width="251" height="150" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="633" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">INFERENCE FLOW</text>
          <text x="633" y="220" fill={bright} fontSize="14" fontFamily="Arial, sans-serif">OpenCV DNN</text>
          <text x="633" y="241" fill={subdued} fontSize="11" fontFamily="Arial, sans-serif">SSD · ResNet-10 faces</text>
          <path d="M634 260h190" stroke={stroke} strokeOpacity=".6" strokeDasharray="3 5" />
          <text x="633" y="283" fill={bright} fontSize="13" fontFamily="Arial, sans-serif">MobileNetV2 classifier</text>
          <rect x="610" y="320" width="251" height="163" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="633" y="351" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">CLASS OUTPUT</text>
          <rect x="633" y="370" width="205" height="40" rx="8" fill="#84967c" fillOpacity=".18" stroke={green} strokeOpacity=".45" />
          <circle cx="653" cy="390" r="6" fill={green} />
          <text x="671" y="395" fill={bright} fontSize="13" fontFamily="Arial, sans-serif">With mask</text>
          <rect x="633" y="423" width="205" height="40" rx="8" fill="#bb7866" fillOpacity=".1" stroke="#bb7866" strokeOpacity=".35" />
          <circle cx="653" cy="443" r="6" fill="#c67f6c" />
          <text x="671" y="448" fill={bright} fontSize="13" fontFamily="Arial, sans-serif">Without mask</text>
        </>
      )}

      {visual === "reviewpilot" && (
        <>
          <text x="97" y="103" fill={bright} fontSize="22" fontFamily="Arial, sans-serif">ReviewPilot AI</text>
          <text x="97" y="124" fill={subdued} fontSize="11" fontFamily="monospace" letterSpacing="1">PULL REQUEST  /  HYBRID CODE REVIEW</text>
          <rect x="97" y="151" width="511" height="332" rx="12" fill="#141715" stroke="#fff" strokeOpacity=".07" />
          <rect x="97" y="151" width="511" height="44" rx="12" fill="#202420" />
          <path d="M97 195h511" stroke="#fff" strokeOpacity=".08" />
          <circle cx="120" cy="173" r="6" fill="#91a384" />
          <text x="139" y="178" fill={bright} fontSize="12" fontFamily="monospace">pull/284  ·  payment validation</text>
          {[
            ["18", " async def validate_payment(data):", "old"],
            ["19", "     token = request.headers.get('key')", "old"],
            ["20", "     if token == configured_token:", "new"],
            ["21", "         return authorize(data)", "new"],
            ["22", "     raise InvalidToken()", "new"],
            ["23", "", "old"],
          ].map(([line, code, kind], index) => (
            <g key={line}>
              <rect x="98" y={211 + index * 34} width="510" height="33" fill={kind === "new" ? "#82967b" : "#b57668"} fillOpacity=".07" />
              <text x="121" y={232 + index * 34} fill={subdued} fontSize="12" fontFamily="monospace">{line}</text>
              <text x="153" y={232 + index * 34} fill={kind === "new" ? "#c9d5c1" : "#d5ada2"} fontSize="12" fontFamily="monospace">{code}</text>
            </g>
          ))}
          <rect x="628" y="151" width="233" height="332" rx="12" fill={panel} stroke="#fff" strokeOpacity=".07" />
          <text x="650" y="181" fill={subdued} fontSize="10" fontFamily="monospace" letterSpacing="1">REVIEW FINDINGS</text>
          <rect x="650" y="203" width="189" height="73" rx="9" fill="#241e19" stroke="#c68c67" strokeOpacity=".35" />
          <circle cx="670" cy="226" r="5" fill="#d9a36c" />
          <text x="684" y="230" fill="#e5cdb1" fontSize="11" fontFamily="monospace">SECURITY · HIGH</text>
          <path d="M670 246h139M670 258h111" stroke="#fff" strokeOpacity=".18" />
          <rect x="650" y="292" width="189" height="73" rx="9" fill="#1e211b" stroke={green} strokeOpacity=".35" />
          <circle cx="670" cy="315" r="5" fill={green} />
          <text x="684" y="319" fill="#d0d9c9" fontSize="11" fontFamily="monospace">STATIC CHECK</text>
          <path d="M670 335h139M670 347h111" stroke="#fff" strokeOpacity=".18" />
          <rect x="650" y="381" width="189" height="73" rx="9" fill="#1c1f20" stroke="#8f9aa0" strokeOpacity=".35" />
          <circle cx="670" cy="404" r="5" fill="#9aa4a8" />
          <text x="684" y="408" fill="#d0d3d2" fontSize="11" fontFamily="monospace">AI REVIEW</text>
          <path d="M670 424h139M670 436h111" stroke="#fff" strokeOpacity=".18" />
        </>
      )}
    </svg>
  );
}
