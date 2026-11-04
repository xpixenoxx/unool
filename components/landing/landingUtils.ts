'use client';
// Landing page utility functions, data constants, and hooks.
// Auto-extracted from app/page.tsx for modularization.
import React from 'react';
import { UA_VIDEO_HTML } from '@/components/landing/demo-html';

export interface PlatformData {
  name: string;
  bg: string;
  fg: string;
  svgPath: string;
}

export const PLATFORMS: [string, string, string, string][] = [
  [
    'LinkedIn',
    '#0A66C2',
    '#fff',
    '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>'
  ],
  [
    'X',
    '#000',
    '#fff',
    '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>'
  ],
  [
    'Threads',
    '#000',
    '#fff',
    '<path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/>'
  ],
  [
    'Facebook',
    '#1877F2',
    '#fff',
    '<path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>'
  ],
  [
    'Instagram',
    'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
    '#fff',
    '<path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>'
  ],
  [
    'YouTube',
    '#F00',
    '#fff',
    '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>'
  ],
  [
    'Pinterest',
    '#E60023',
    '#fff',
    '<path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>'
  ],
  [
    'Reddit',
    '#FF4500',
    '#fff',
    '<path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"/>'
  ],
  [
    'Mastodon',
    '#6364FF',
    '#fff',
    '<path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>'
  ],
  [
    'Twitch',
    '#9146FF',
    '#fff',
    '<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>'
  ],
  [
    'Telegram',
    '#26A5E4',
    '#fff',
    '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>'
  ],
  [
    'Dribbble',
    '#EA4C89',
    '#fff',
    '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.849 9.876c-.365-.116-3.236-.97-6.525-.444 1.365 3.754 1.924 6.812 2.031 7.448 2.344-1.585 4.013-4.1 4.494-7.004zm-6.234 7.958c-.156-.917-.765-4.11-2.232-7.92-.067.02-5.9 2.053-8.196 6.524 1.764 1.385 3.996 2.208 6.413 2.208 1.447 0 2.823-.295 4.015-.812zm-11.847-2.63c.232-.407 3.104-5.152 8.492-6.897.138-.046.275-.086.413-.122-.265-.596-.55-1.189-.848-1.774-4.887 1.439-9.946 1.372-10.405 1.362-.004.318-.004.64-.004.965 0 2.684 1.018 5.136 2.352 6.466zm-2.467-9.13c.47.008 4.774.026 9.66-1.272-1.73-3.076-3.6-5.666-3.876-6.044-2.924 1.376-5.108 4.068-5.784 7.316zm6.814-7.307c.287.387 2.187 2.97 3.896 6.115 3.716-1.391 5.291-3.507 5.477-3.774-1.845-1.641-4.272-2.636-6.928-2.636-.84 0-1.661.102-2.445.295zm10.536 3.55c-.222.296-1.973 2.542-5.835 4.118.245.5.479 1.004.693 1.515.082.183.153.367.224.54 3.477-.438 6.932.265 7.279.336-.021-2.467-.898-4.73-2.361-6.509z"/>'
  ],
  [
    'Skool',
    '#FFC53A',
    '#000',
    '<text x="12" y="16.6" text-anchor="middle" font-family="Bricolage Grotesque,Arial,sans-serif" font-weight="800" font-size="13.5" fill="#000">sk</text>'
  ],
  [
    'Kick',
    '#000',
    '#53FC18',
    '<path d="M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z"/>'
  ],
  [
    'Farcaster',
    '#855DCD',
    '#fff',
    '<path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>'
  ],
  [
    'Bluesky',
    '#0285FF',
    '#fff',
    '<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>'
  ],
  [
    'Slack',
    '#fff',
    '#4A154B',
    '<path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>'
  ],
  [
    'Discord',
    '#5865F2',
    '#fff',
    '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>'
  ],
  [
    'Whop',
    '#FF6243',
    '#fff',
    '<path d="M3 8l4 9 5-7 5 7 4-9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
  ],
  [
    'Medium',
    '#000',
    '#fff',
    '<path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>'
  ],
  [
    'Dev.to',
    '#0A0A0A',
    '#fff',
    '<path d="M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.21v4.24h1.37c.38 0 .66-.05.84-.16.18-.11.32-.28.41-.53.09-.24.14-.58.14-1.02v-.83c0-.45-.05-.79-.14-1.03-.09-.24-.23-.4-.41-.5zm14.39-7.86H2.19C.98 2.19 0 3.17 0 4.38v15.24c0 1.21.98 2.19 2.19 2.19h19.62c1.21 0 2.19-.98 2.19-2.19V4.38c0-1.21-.98-2.19-2.19-2.19zm-13.62 13h-4.4V8.81h4.4c.83 0 1.5.15 2.01.44.51.3.89.74 1.14 1.33.25.59.38 1.34.38 2.25v.34c0 .91-.13 1.66-.38 2.25-.25.59-.63 1.03-1.14 1.33-.51.29-1.18.44-2.01.44zm6.05 0h-3.41V8.81h3.41v1.17h-2.13v1.88h1.89v1.17h-1.89v1.88h2.13v1.28zm5.72-3.92-1.63 3.92h-1.45l-1.63-3.92V17.3h-1.28V8.81h1.7l1.94 4.67 1.94-4.67h1.7v8.49h-1.28v-4.08z"/>'
  ],
  [
    'Hashnode',
    '#2962FF',
    '#fff',
    '<path d="M22.351 8.019l-6.37-6.37a5.63 5.63 0 0 0-7.962 0l-6.37 6.37a5.63 5.63 0 0 0 0 7.962l6.37 6.37a5.63 5.63 0 0 0 7.962 0l6.37-6.37a5.63 5.63 0 0 0 0-7.962zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/>'
  ],
  [
    'Lemmy',
    '#00BC8C',
    '#fff',
    '<path d="M2.9595 4.2228a3.9132 3.9132 0 0 0-.332.019c-.8781.1012-1.67.5699-2.155 1.3862-.475.8-.5922 1.6809-.35 2.4971.2421.8162.8297 1.5575 1.6982 2.1449.0053.0035.0106.0076.0163.0114.746.4498 1.492.7431 2.2877.8994-.02.3318-.0272.6689-.006 1.0181.0634 1.0432.4368 2.0006.996 2.8492l-2.0061.8189a.4163.4163 0 0 0-.2276.2239.416.416 0 0 0 .0879.455.415.415 0 0 0 .2941.1231.4156.4156 0 0 0 .1595-.0312l2.2093-.9035c.408.4859.8695.9315 1.3723 1.318.0196.0151.0407.0264.0603.0423l-1.2918 1.7103a.416.416 0 0 0 .664.501l1.314-1.7385c.7185.4548 1.4782.7927 2.2294 1.0242.3833.7209 1.1379 1.1871 2.0202 1.1871.8907 0 1.6442-.501 2.0242-1.2072.744-.2347 1.4959-.5729 2.2073-1.0262l1.332 1.7606a.4157.4157 0 0 0 .7439-.1936.4165.4165 0 0 0-.0799-.3074l-1.3099-1.7345c.0083-.0075.0178-.0113.0261-.0188.4968-.3803.9549-.8175 1.3622-1.2939l2.155.8794a.4156.4156 0 0 0 .5412-.2276.4151.4151 0 0 0-.2273-.5432l-1.9438-.7928c.577-.8538.9697-1.8183 1.0504-2.8693.0268-.3507.0242-.6914.0079-1.0262.7905-.1572 1.5321-.4502 2.2737-.8974.0053-.0033.011-.0076.0163-.0113.8684-.5874 1.456-1.3287 1.6982-2.145.2421-.8161.125-1.697-.3501-2.497-.4849-.8163-1.2768-1.2852-2.155-1.3863a3.2175 3.2175 0 0 0-.332-.0189c-.7852-.0151-1.6231.229-2.4286.6942-.5926.342-1.1252.867-1.5433 1.4387-1.1699-.6703-2.6923-1.0476-4.5635-1.0785a15.5768 15.5768 0 0 0-.5111 0c-2.085.034-3.7537.43-5.0142 1.1449-.0033-.0038-.0045-.0114-.008-.0152-.4233-.5916-.973-1.1365-1.5835-1.489-.8055-.465-1.6434-.7083-2.4286-.6941Z"/>'
  ],
  [
    'Listmonk',
    '#0045FF',
    '#fff',
    '<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0m0 5.1953A6.8047 6.8047 0 0 1 18.8047 12 6.8047 6.8047 0 0 1 12 18.8047 6.8047 6.8047 0 0 1 5.1953 12 6.8047 6.8047 0 0 1 12 5.1953"/>'
  ],
  [
    'WhatsApp',
    '#25D366',
    '#fff',
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>'
  ],
  [
    'MeWe',
    '#2F435E',
    '#fff',
    '<path d="M12 2C6.477 2 2 6.477 2 12c0 2.21.72 4.25 1.94 5.9L2.5 21.5l3.77-1.38C7.88 21.31 9.87 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.8 13.8h-1.6l-1.8-6.4h1.6l1 4.2 1-4.2h1.6l1 4.2 1-4.2h1.6l-1.8 6.4h-1.6l-1-4-1 4z"/>'
  ],
  [
    'TikTok',
    '#000',
    '#fff',
    '<path d="M17.5 6.5a4.5 4.5 0 0 1-3.5-3.8h-2.5v11.8a2.5 2.5 0 1 1-2.5-2.5c.3 0 .7.1 1 .2V9.7a5.5 5.5 0 1 0 4 5.3V8.2a7.5 7.5 0 0 0 3.5 1.2V6.5z"/>'
  ],
  [
    'GitHub',
    '#24292e',
    '#fff',
    '<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>'
  ],
  [
    'Substack',
    '#FF6719',
    '#fff',
    '<path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>'
  ],
  [
    'Manual / Other',
    '#4B5563',
    '#fff',
    '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
  ]
];

function svg(p: [string, string, string, string], s: number) {
  return (
    '<svg viewBox="0 0 24 24" width="' +
    s +
    '" height="' +
    s +
    '" fill="' +
    p[2] +
    '">' +
    p[3] +
    '</svg>'
  );
}

const IC: Record<string, string> = {
  home: 'M3.5 11.2L12 3.5l8.5 7.7V21h-5.7v-6h-5.6v6H3.5z',
  search: 'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM15.5 15.5L21 21',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 20.5S3.8 15.4 3.8 9.6A4.6 4.6 0 0112 7.2a4.6 4.6 0 018.2 2.4c0 5.8-8.2 10.9-8.2 10.9z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20.5c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5',
  bell: 'M6 17v-6a6 6 0 0112 0v6l1.8 2H4.2zM10 21.5h4',
  mail: 'M3 5.5h18v13H3zM3.4 6.5L12 13.5l8.6-7',
  chat: 'M4 4.5h16v12H9.5L4 20.5z',
  rep: 'M4 11V9a3 3 0 013-3h12l-3-3M20 13v2a3 3 0 01-3 3H5l3 3',
  send: 'M21 3L3 10.5l7 3 3 7.5z',
  like: 'M7 10.5v10H3.5v-10zM7 10.5l4-7.5c2 0 3 1.2 3 3v3.5h5.5L17.8 20.5H7',
  job: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
  net: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16.5 4.5a3.2 3.2 0 010 6M19 15c2 .7 3 2.2 3 4.5',
  eye: 'M5 20.5v-9M12 20.5V4M19 20.5v-6',
  up: 'M12 16V3.5M7 8l5-5 5 5M5 12v8.5h14V12'
};

function ic(name: string, s: number, w?: number) {
  return (
    '<svg viewBox="0 0 24 24" width="' +
    s +
    '" height="' +
    s +
    '" fill="none" stroke="currentColor" stroke-width="' +
    (w || 1.8) +
    '" stroke-linecap="round" stroke-linejoin="round"><path d="' +
    IC[name] +
    '"/></svg>'
  );
}

const SB =
  '<div class="sb"><b>9:41</b><u class="isl"></u><span><svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect y="7" width="3" height="4" rx=".8"/><rect x="4.6" y="5" width="3" height="6" rx=".8"/><rect x="9.2" y="2.5" width="3" height="8.5" rx=".8"/><rect x="13.8" width="3" height="11" rx=".8"/></svg><svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 10.4l2-2.1a2.9 2.9 0 00-4 0zM3.7 6a6 6 0 018.6 0l1.2-1.3a7.8 7.8 0 00-11 0zM.8 3A10.2 10.2 0 0115.2 3L16 1.8a11.7 11.7 0 00-16 0z"/></svg><svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="8" rx="2.2"/><path d="M23 4v4c.8-.3 1.5-1 1.5-2s-.7-1.7-1.5-2z" opacity=".5"/></svg></span></div>';
const HI = '<u class="hi"></u>';
const VB =
  '<svg width="14" height="14" viewBox="0 0 24 24" style="vertical-align:-2px"><circle cx="12" cy="12" r="11" fill="#1d9bf0"/><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function tb(a: [string, string?][], onIdx: number, lab?: number) {
  return (
    '<div class="tb">' +
    a
      .map(function(n, i) {
        return (
          '<span class="' +
          (i === onIdx ? 'on' : '') +
          '">' +
          ic(n[0], 23, i === onIdx ? 2.3 : 1.7) +
          (lab && n[1] ? '<small>' + n[1] + '</small>' : '') +
          '</span>'
        );
      })
      .join('') +
    '</div>'
  );
}

function xm(a: [string, string][]) {
  return (
    '<div class="xm">' +
    a
      .map(function(x) {
        return '<span>' + ic(x[0], 15) + x[1] + '</span>';
      })
      .join('') +
    '</div>'
  );
}

export function initUaPlayer(containerEl?: HTMLElement | null): () => void {
  const root = containerEl
    ? (containerEl.querySelector<HTMLElement>('#ua-player') || containerEl)
    : document.getElementById('ua-player');
  if (!root) return () => {};
  const cache: Record<string, HTMLElement | null> = {};
  const $ = function(k: string): HTMLElement | null {
    if (cache[k] !== undefined) return cache[k];
    const el = root.querySelector<HTMLElement>('[data-k="' + k + '"]');
    cache[k] = el;
    return el;
  };
  const viewport = $('viewport');
  const stage = $('stage');
  if (!viewport || !stage) return () => {};

  function fit() {
    if (viewport && stage) {
      const w = viewport.clientWidth || 640;
      stage.style.transform = 'scale(' + (w / 960) + ')';
    }
  }

  let ro: ResizeObserver | null = null;
  if (typeof window !== 'undefined') {
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(fit);
      ro.observe(viewport);
    } else {
      window.addEventListener('resize', fit);
    }
  }
  fit();

  const calEl = $('cal');
  if (calEl && calEl.children.length === 0) {
    const T = ['9:00', '12:30', '17:00'];
    const P: Record<string, string> = { '0-0': 'ig', '2-1': 'li', '3-0': 'ig', '4-2': 'li' };
    let h = '';
    const D = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    D.forEach(function(d, i) {
      h += '<div class="dy" style="left:' + (16 + i * 121.6) + 'px">' + d + '</div>';
    });
    h += '<div class="cal">';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const k = c + '-' + r;
        const b = c === 1 && r === 0;
        h +=
          '<div class="sl' +
          (b ? '" data-k="best' : '') +
          '"><em>' +
          T[r] +
          '</em>' +
          (P[k]
            ? '<div class="q"><span class="pi sm ' +
              P[k] +
              '">' +
              (P[k] === 'li' ? 'in' : '') +
              '</span>Queued post</div>'
            : '') +
          (b
            ? '<div class="bt" data-k="bt">Best time ┬╖ 9:40</div><div class="chip" data-k="dc" style="left:8px;top:22px;width:auto;right:8px"><div class="art"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>IG + LI</small></div></div>'
            : '') +
          '</div>';
      }
    }
    calEl.innerHTML = h + '</div>';
  }

  const STEPS: [string, string, number, number][] = [
    ['Departure time reached', 'Tue 9:40 ┬╖ queue checked', 7, 7.6],
    ['Preparing media', 'Resized for 4:5 and 1.91:1', 7.6, 9],
    ['Publishing to Instagram', 'Container created ΓåÆ published', 9, 10.6],
    ['Publishing to LinkedIn', 'Post shared to your profile', 10.4, 12.1]
  ];
  const stepsEl = $('steps');
  if (stepsEl && stepsEl.children.length === 0) {
    stepsEl.innerHTML = STEPS.map(function(s) {
      return (
        '<div class="stp p"><span class="dot"></span><div><b>' +
        s[0] +
        '</b><small>' +
        s[1] +
        '</small></div></div>'
      );
    }).join('');
  }
  const stEls = Array.from(root.querySelectorAll<HTMLElement>('.stp'));

  const DUR = 15;
  const clamp = function(v: number, a: number, b: number) {
    a = a == null ? 0 : a;
    b = b == null ? 1 : b;
    return Math.min(b, Math.max(a, v));
  };
  const prog = function(t: number, a: number, b: number) {
    return clamp((t - a) / (b - a), 0, 1);
  };
  const sm = function(x: number) {
    return x * x * (3 - 2 * x);
  };

  const F = [
    [0, 700, 300, 0],
    [0.4, 700, 300, 0],
    [1, 810, 142, 1],
    [1.6, 810, 142, 1],
    [3.3, 222, 160, 1],
    [3.8, 260, 210, 1],
    [4.4, 720, 431, 1],
    [5.4, 760, 400, 0],
    [15, 760, 400, 0]
  ];
  const CK = [1.5, 3.3, 4.5];

  function cur(t: number) {
    let i = 0;
    while (i < F.length - 2 && t > F[i + 1][0]) i++;
    const a = F[i];
    const b = F[i + 1];
    const p = sm(prog(t, a[0], b[0]));
    return [a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p, a[3] + (b[3] - a[3]) * p];
  }

  function vis(el: HTMLElement | null, t: number, a: number, b: number, dy?: number) {
    if (!el) return;
    let o = sm(prog(t, a, a + 0.45)) * (1 - sm(prog(t, b - 0.35, b)));
    if (a <= 0) o = 1 - sm(prog(t, b - 0.35, b));
    el.style.opacity = String(o);
    el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    if (dy) el.style.transform = 'translateY(' + (1 - sm(prog(t, a, a + 0.6))) * dy + 'px)';
  }

  function put(id: string, s: string) {
    const e = $(id) as (HTMLElement & { _h?: string }) | null;
    if (e && e._h !== s) {
      e.innerHTML = s;
      e._h = s;
    }
  }

  const CAPS: [number, string, string, string][] = [
    [0, 'STEP 3', 'Flight plan', 'Drop it on the best time ΓÇö Unool suggests when your audience is online.'],
    [6.5, 'STEP 4', 'Publish', 'At the scheduled minute it goes live everywhere, hands-free.']
  ];

  function render(t: number) {
    vis($('b1'), t, 0, 6.5);
    vis($('b2'), t, 6.5, 999);

    const bestEl = $('best');
    if (bestEl) bestEl.className = 'sl' + (t >= 0.5 && t < 3.3 ? ' best' : '');
    const cp = cur(t);
    const drag = t >= 1.5 && t < 3.3;
    const srcEl = $('src');
    if (srcEl) srcEl.style.opacity = t < 1.5 ? '1' : '0';
    const dcEl = $('dc');
    if (dcEl) dcEl.style.opacity = t >= 3.3 ? '1' : '0';
    const dg = $('dg');
    if (dg) {
      dg.style.opacity = drag ? '1' : '0';
      dg.style.left = cp[0] - 75 + 'px';
      dg.style.top = cp[1] - 40 - 24 + 'px';
      dg.style.transform = 'rotate(' + (drag ? -3 : 0) + 'deg)';
    }
    const doneEl = $('done');
    if (doneEl) doneEl.style.opacity = String(sm(prog(t, 3.4, 3.9)));
    const sw = t >= 4.5;
    const swEl = $('sw');
    if (swEl) swEl.className = 'sw' + (sw ? ' on' : '');
    put('swl', sw ? 'Auto-publish ON' : 'Auto-publish');

    const fs = t < 7 ? 'Scheduled' : t < 9 ? 'Boarding' : t < 12.2 ? 'In flight' : 'Landed ┬╖ Live';
    const fsEl = $('fs');
    if (fsEl) fsEl.textContent = fs;
    const plEl = $('pl');
    if (plEl) plEl.style.left = prog(t, 7, 12.2) * 92 + '%';

    STEPS.forEach(function(s, i) {
      const e = stEls[i];
      if (!e) return;
      const d = t >= s[3];
      const a = t >= s[2] && !d;
      e.className = 'stp ' + (d ? 'd' : a ? 'a' : 'p');
      const dot = e.querySelector('.dot');
      if (dot) dot.textContent = d ? 'Γ£ô' : '';
    });

    const lvEl = $('lv');
    if (lvEl) {
      lvEl.style.opacity = String(sm(prog(t, 12.4, 13)));
      lvEl.style.transform = 'translateY(' + (1 - sm(prog(t, 12.4, 13))) * 10 + 'px)';
    }

    const cu = $('cur');
    const press = CK.some(function(c) {
      return Math.abs(t - c) < 0.12;
    });
    if (cu) {
      cu.style.opacity = String(cp[2]);
      cu.style.transform = 'translate(' + cp[0] + 'px,' + cp[1] + 'px) scale(' + (press ? 0.82 : 1) + ')';
    }

    let ci = 0;
    CAPS.forEach(function(c, i) {
      if (t >= c[0]) ci = i;
    });
    const c = CAPS[ci];
    const stEl = $('st');
    if (stEl) stEl.textContent = c[1];
    const cbEl = $('cb');
    if (cbEl) cbEl.textContent = c[2];
    const ctEl = $('ct');
    if (ctEl) ctEl.textContent = c[3];

    const pc = (t / DUR) * 100 + '%';
    const fillEl = $('fill');
    if (fillEl) fillEl.style.width = pc;
    const knobEl = $('knob');
    if (knobEl) knobEl.style.left = pc;
    const m = function(s: number) {
      s = Math.floor(s);
      return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    };
    const timeEl = $('time');
    if (timeEl) timeEl.textContent = m(t) + ' / ' + m(DUR);
  }

  let t = 0;
  let playing = false;
  let manual = false;
  let ended = false;
  let dirty = true;
  let last = performance.now();
  const pp = $('pp');
  const endEl = $('end');
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function setPlay(v: boolean) {
    playing = v;
    if (pp) pp.setAttribute('d', v ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M7 4l13 8-13 8z');
    last = performance.now();
    dirty = true;
  }
  function setEnd(v: boolean) {
    ended = v;
    if (endEl) endEl.classList.toggle('on', v);
  }
  function restart() {
    t = 0;
    setEnd(false);
    setPlay(true);
  }
  function toggle() {
    if (ended) {
      manual = false;
      restart();
      return;
    }
    manual = playing;
    setPlay(!playing);
  }

  if (endEl) endEl.onclick = function(e) { e.stopPropagation(); };
  const playBtn = $('play');
  if (playBtn) playBtn.onclick = toggle;
  if (viewport) viewport.onclick = toggle;
  const replayBtn = $('replay');
  if (replayBtn) {
    replayBtn.onclick = function(e) {
      e.stopPropagation();
      manual = false;
      restart();
    };
  }

  const bar = $('bar');
  let dragging = false;
  function seek(e: PointerEvent | KeyboardEvent) {
    if (!bar || !('clientX' in e)) return;
    const r = bar.getBoundingClientRect();
    t = clamp((e.clientX - r.left) / r.width, 0, 1) * (DUR - 0.05);
    setEnd(false);
    dirty = true;
  }

  if (bar) {
    bar.onpointerdown = function(e: PointerEvent) {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      seek(e);
    };
    bar.onpointermove = function(e: PointerEvent) {
      if (dragging) seek(e);
    };
    bar.onpointerup = function() {
      dragging = false;
    };
    bar.onkeydown = function(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') t = Math.min(DUR - 0.05, t + 2);
      if (e.key === 'ArrowLeft') t = Math.max(0, t - 2);
      dirty = true;
    };
  }

  let io: IntersectionObserver | null = null;
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window && viewport) {
    io = new IntersectionObserver(
      function(es) {
        if (es[0].isIntersecting) {
          if (!manual && !reduce) setPlay(true);
        } else if (playing) {
          setPlay(false);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(viewport);
  } else if (!reduce) {
    setPlay(true);
  }

  let animId = 0;
  function loop(n: number) {
    const d = Math.max(0, Math.min(0.1, (n - last) / 1000));
    last = n;
    if (playing) {
      t += d;
      if (t >= DUR + 1.8) {
        t = 0;
        setEnd(false);
      } else if (t >= DUR) {
        setEnd(true);
      } else if (ended) {
        setEnd(false);
      }
      dirty = true;
    }
    if (dirty) {
      dirty = false;
      render(t);
    }
    animId = requestAnimationFrame(loop);
  }
  render(0);
  animId = requestAnimationFrame(loop);

  const sec = containerEl || document.getElementById('unool-automation');
  const handlePointerMove = function(e: PointerEvent) {
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    sec.style.setProperty('--mx', e.clientX - r.left + 'px');
    sec.style.setProperty('--my', e.clientY - r.top + 'px');
  };
  if (sec) sec.addEventListener('pointermove', handlePointerMove as EventListener);

  return function cleanup() {
    cancelAnimationFrame(animId);
    if (ro && viewport) ro.disconnect();
    if (typeof window !== 'undefined') window.removeEventListener('resize', fit);
    if (io && viewport) io.disconnect();
    if (sec) sec.removeEventListener('pointermove', handlePointerMove as EventListener);
  };
}

export function renderPhoneMockups(root: HTMLElement, rawText: string) {
  const CD = root.querySelectorAll<HTMLElement>('.cd');
  if (CD.length < 2) return;

  const text = (rawText || '').trim();
  const isDress =
    text.includes('Linen Wrap Dress') ||
    text.includes('terracotta') ||
    text.includes('linen') ||
    text.includes('dress');

  if (isDress) {
    const brandAvatarSm =
      '<div class="px-av sm"><span style="font-family:\'DM Serif Display\',Georgia,serif;font-style:italic">P</span></div>';
    const brandAvatar =
      '<div class="px-av"><span style="font-family:\'DM Serif Display\',Georgia,serif;font-style:italic">P</span></div>';

    // 0: Instagram ΓÇö pixel-perfect authentic iOS feed post
    CD[0].innerHTML =
      SB +
      // Instagram header bar ΓÇö wordmark + actions
      '<div class="ig-header">' +
      '<span class="ig-wordmark">Instagram</span>' +
      '<div class="ig-header-actions">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
      '<div class="ig-dm-btn">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</div>' +
      '</div>' +
      '</div>' +
      // Feed body
      '<div class="fd">' +
      // Post header row
      '<div class="ig-post-header">' +
      '<div class="ig-story-ring">' +
      brandAvatarSm +
      '</div>' +
      '<div class="ig-author-meta">' +
      '<div class="ig-author-name">pixenox.atelier <svg viewBox="0 0 24 24" width="13" height="13" fill="#0095f6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>' +
      '<span class="ig-location">Paris, France ΓÇó Original audio</span>' +
      '</div>' +
      '<span class="ig-more">┬╖┬╖┬╖</span>' +
      '</div>' +
      // Post media ΓÇö full-bleed 1080x1350 vertical dress image
      '<div class="ig-media"><img src="/linen-wrap-dress.jpg" alt="Linen Wrap Dress" /></div>' +
      // Instagram engagement action row
      '<div class="ig-action-bar">' +
      '<div class="ig-action-left">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</div>' +
      '<div class="ig-dots"><span class="active"></span><span></span><span></span></div>' +
      '<div class="ig-bookmark">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>' +
      '</div>' +
      '</div>' +
      // Instagram caption & social proof
      '<div class="ig-post-info">' +
      '<div class="ig-likes-row">Liked by <b>clara.style</b> and <b>2,842 others</b></div>' +
      '<div class="ig-caption"><b>pixenox.atelier</b> Meet the Linen Wrap Dress ≡ƒî┐ Hand-woven terracotta linen, crafted for warm days. Sizes XSΓÇôXL.<br>First 50 orders get <b>20% off</b> this week only Γ£¿</div>' +
      '<div class="ig-tags">#sustainablefashion #slowfashion #linendress #atelier</div>' +
      '<div class="ig-comments-link">View all 64 comments</div>' +
      '<div class="ig-timestamp">2 HOURS AGO</div>' +
      '</div>' +
      '</div>' +
      // Instagram bottom nav
      tb([['home'], ['search'], ['plus'], ['heart'], ['user']], 0) +
      HI;

    // 1: LinkedIn ΓÇö pixel-perfect native feed post
    CD[1].innerHTML =
      SB +
      // LinkedIn header bar ΓÇö avatar + search + messaging
      '<div class="lh">' +
      brandAvatarSm +
      '<div class="srch">' +
      ic('search', 15, 2) +
      '<span>Search</span>' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="li-qr-icon"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm10-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 0h2v2h-2v-2zm4 0h2v4h-4v-2h2v-2zm0-4h2v2h-2v-2zm-4 4h-2v-4h4v2h-2v2z"/></svg>' +
      '</div>' +
      '<div class="li-msg-btn">' +
      ic('chat', 22, 1.7) +
      '</div>' +
      '</div>' +
      // Feed body
      '<div class="fd">' +
      '<div class="li-card">' +
      // Post header row
      '<div class="li-author-row">' +
      brandAvatar +
      '<div class="li-author-meta">' +
      '<div class="li-author-name">Pixenox Atelier <small>ΓÇó 1st</small></div>' +
      '<span class="li-author-sub">Sustainable Artisan Apparel &amp; Design</span>' +
      '<div class="li-author-time">2h ΓÇó <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM1.5 8h3a11.5 11.5 0 00.7 4H2.4A6.5 6.5 0 011.5 8zm0-1a6.5 6.5 0 01.9-3h2.8a11.5 11.5 0 00-.7 3h-3zm6.5-5.5a10 10 0 011.9 4.5h-3.8A10 10 0 018 1.5zm0 13a10 10 0 01-1.9-4.5h3.8A10 10 0 018 14.5zm0-5.5H5.1A10.8 10.8 0 015 8c0-.3 0-.7.1-1h5.8c.1.3.1.7.1 1 0 .3 0 .7-.1 1H8zm2.8 4a11.5 11.5 0 00.7-3h3a6.5 6.5 0 01-.9 3h-2.8zm.7-4a11.5 11.5 0 00-.7-3h2.8a6.5 6.5 0 01.9 3h-3z"/></svg></div>' +
      '</div>' +
      '<span class="li-follow-btn">+ Follow</span>' +
      '<span class="li-more-btn">┬╖┬╖┬╖</span>' +
      '</div>' +
      // Post body ΓÇö formatted for LinkedIn
      '<div class="li-body">' +
      '<p><b>≡ƒî┐ Introducing the Linen Wrap Dress:</b></p>' +
      '<p>Hand-woven terracotta linen, crafted for warm days and effortless movement. Sizes XSΓÇôXL.</p>' +
      '<p>ΓåÆ 100% breathable organic European linen<br>ΓåÆ Hand-dyed natural terracotta hue<br>ΓåÆ Tailored zero-waste silhouette</p>' +
      '<p>First 50 pieces: <b>20% off this week only.</b></p>' +
      '<p class="li-tags">#SustainableFashion #SlowFashion #LinenDress #Atelier</p>' +
      '</div>' +
      // Full-bleed post image (LinkedIn style ΓÇö extends edge-to-edge)
      '<div class="li-media"><img src="/linen-wrap-dress.jpg" alt="Linen Wrap Dress" /></div>' +
      // Reactions row with authentic LinkedIn badge icons
      '<div class="li-reactions-row">' +
      '<div class="li-rx-left">' +
      '<div class="li-rx-stack">' +
      '<span class="li-rx-icon li-rx-like"><svg viewBox="0 0 16 16" width="9" height="9" fill="#fff"><path d="M4.5 7v7H2V7h2.5zm1.5 7h5.8c.8 0 1.5-.6 1.7-1.4l1.1-4.6c.2-1-.6-1.9-1.6-1.9H9.4V3c0-.8-.7-1.5-1.5-1.5-.5 0-.9.2-1.2.6L6 7v7z"/></svg></span>' +
      '<span class="li-rx-icon li-rx-love"><svg viewBox="0 0 16 16" width="9" height="9" fill="#fff"><path d="M8 13.8s-5.2-3.4-5.2-7.5C2.8 3.8 4.8 2 7 2c1.2 0 2.2.6 2.8 1.5C10.4 2.6 11.4 2 12.6 2c2.2 0 4.2 1.8 4.2 4.3 0 4.1-5.2 7.5-5.2 7.5L8 13.8z"/></svg></span>' +
      '<span class="li-rx-icon li-rx-bulb"><svg viewBox="0 0 16 16" width="9" height="9" fill="#fff"><path d="M8 1.5a4.5 4.5 0 00-2.8 8c.5.4.8 1 .8 1.5v.5h4v-.5c0-.6.3-1.1.8-1.5a4.5 4.5 0 00-2.8-8zM6.5 13h3v1h-3z"/></svg></span>' +
      '</div>' +
      '<span style="font-weight:600;margin-left:3px">1,420</span>' +
      '</div>' +
      '<span>98 comments ΓÇó 34 reposts</span>' +
      '</div>' +
      // Action buttons row
      '<div class="li-action-bar">' +
      '<span class="li-action-btn">' + ic('like', 17) + 'Like</span>' +
      '<span class="li-action-btn">' + ic('chat', 17) + 'Comment</span>' +
      '<span class="li-action-btn">' + ic('rep', 17) + 'Repost</span>' +
      '<span class="li-action-btn">' + ic('send', 17) + 'Send</span>' +
      '</div>' +
      '</div></div>' +
      // LinkedIn bottom nav
      tb(
        [
          ['home', 'Home'],
          ['net', 'My Network'],
          ['plus', 'Post'],
          ['bell', 'Notifications'],
          ['job', 'Jobs']
        ],
        0,
        1
      ) +
      HI;

    return;
  }

  const isDefault =
    text.includes('At Pixenox, we just shipped') ||
    text === 'At Pixenox, we just shipped our AI-powered design system that reduces brand iteration time by 80%. HereΓÇÖs what we learned building it.';

  if (isDefault) {
    // 0: LinkedIn
    CD[0].innerHTML =
      SB +
      '<div class="lh"><span class="av">P</span><div class="srch">' +
      ic('search', 15, 2) +
      'Search</div>' +
      ic('chat', 23, 1.7) +
      '</div><div class="fd"><div class="lp"><div class="ph"><span class="av">P</span><div><b>Pixenox</b> ΓÇó 1st<small>AI Design Systems</small><small>2h ΓÇó ≡ƒîÉ</small></div><span class="fl">+ Follow</span></div><p><b>≡ƒÜÇ Big announcement from Pixenox:</b></p><p>We just shipped our AI-powered design system that reduces brand iteration time by <b>80%.</b></p><p>ΓåÆ Consistency beats creativity at scale<br>ΓåÆ Design tokens are your secret weapon<br>ΓåÆ AI amplifies designers, not replaces them</p><p><i>#DesignSystems #AI #Startups</i></p><div class="gfx"><u style="background:#fdf6ee"></u><u style="background:#e8a595"></u><u style="background:#c84b31"></u><em>80%<small>faster iteration</small></em></div><div class="rx"><span>≡ƒæìΓ¥ñ∩╕Å≡ƒÆí 842</span><span>67 comments ΓÇó 12 reposts</span></div><div class="ar"><span>' +
      ic('like', 19) +
      'Like</span><span>' +
      ic('chat', 19) +
      'Comment</span><span>' +
      ic('rep', 19) +
      'Repost</span><span>' +
      ic('send', 19) +
      'Send</span></div></div><div class="lp"><div class="ph"><span class="av" style="background:#7a3b69">M</span><div><b>Maya Chen</b> ΓÇó 2nd<small>Brand Lead at Northwind</small></div></div></div></div>' +
      tb(
        [
          ['home', 'Home'],
          ['net', 'My Network'],
          ['plus', 'Post'],
          ['bell', 'Notifications'],
          ['job', 'Jobs']
        ],
        0,
        1
      ) +
      HI;

    // 1: X (Twitter)
    CD[1].innerHTML =
      SB +
      '<div class="hd xh"><span class="av" style="width:28px;height:28px;font-size:12px">P</span>' +
      svg(PLATFORMS[1], 20) +
      '<span></span></div><div class="xt"><span class="on">For you</span><span>Following</span></div><div class="fd"><div class="xp"><div class="col"><span class="av">P</span><u class="thl"></u></div><div class="bx"><div><b>Pixenox</b> ' +
      VB +
      ' <span class="g">@pixenox ┬╖ now</span></div><p>We just shipped something big at <span class="bl">@pixenox</span> ≡ƒöÑ</p><p>An AI design system that cuts brand iteration time by 80%.</p><p>Thread on what we learned ≡ƒº╡≡ƒæç</p>' +
      xm([['chat', '48'], ['rep', '312'], ['heart', '1.2K'], ['eye', '45K'], ['up', '']]) +
      '</div></div><div class="xp"><span class="av">P</span><div class="bx"><div><b>Pixenox</b> ' +
      VB +
      ' <span class="g">@pixenox ┬╖ now</span></div><p>Old way: create ΓåÆ review ΓåÆ 3 weeks back-and-forth.</p><p>Pixenox way: design tokens + AI = instant brand-consistent output ΓÜí</p>' +
      xm([['chat', '21'], ['rep', '140'], ['heart', '860'], ['eye', '18K'], ['up', '']]) +
      '</div></div></div><span class="fab">+</span>' +
      tb([['home'], ['search'], ['bell'], ['mail']], 0) +
      HI;

    // 2: Threads
    if (CD[2]) {
      CD[2].innerHTML =
        SB +
        '<div class="hd">' +
        svg(PLATFORMS[2], 28) +
        '</div><div class="xt"><span class="on">For you</span><span>Following</span></div><div class="fd"><div class="xp"><div class="col"><span class="av">P</span><u class="thl"></u></div><div class="bx"><div><b>pixenox</b> ' +
        VB +
        ' <span class="g">2m</span><span class="g r">┬╖┬╖┬╖</span></div><p>okay so weΓÇÖve been quietly working on something at pixenox and iΓÇÖm finally allowed to talk about it</p><p>we built an AI design system that does in hours what used to take our team weeks</p><p>the biggest lesson? AI doesnΓÇÖt make designers obsolete ΓÇö it makes them dangerous (in the best way) ≡ƒöÑ</p><div class="tx">' +
        ic('heart', 20, 1.6) +
        ic('chat', 20, 1.6) +
        ic('rep', 20, 1.6) +
        ic('send', 20, 1.6) +
        '</div><div class="g">89 replies ┬╖ 234 likes</div></div></div><div class="xp"><span class="av" style="background:#2a7f78">M</span><div class="bx"><div><b>maya.builds</b> <span class="g">1m</span></div><p>wait, this is huge. how are you handling token drift across brands?</p><div class="tx">' +
        ic('heart', 20, 1.6) +
        ic('chat', 20, 1.6) +
        ic('rep', 20, 1.6) +
        ic('send', 20, 1.6) +
        '</div></div></div></div>' +
        tb([['home'], ['search'], ['plus'], ['heart'], ['user']], 0) +
        HI;
    }
    return;
  }

  // Dynamic native adaptation for user's thought
  const safe = (text || 'Your original thought')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const metricMatch = text.match(/(\d+[\d,.]*%\b|\$\d+[\d,.]*[kKmMbB]?\b|\b\d+x\b|\b\d+[\d,.]*\b)/);
  const metricVal = metricMatch ? metricMatch[0] : 'ΓÜí';
  const metricLabel = metricMatch ? 'key highlight' : 'native voice';

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  const mainSentence = sentences[0] || text || 'Here is our latest update.';
  const rest = sentences.slice(1);

  let bullets = [
    'Tone matched to platform audiences',
    'Character limits & formatting respected',
    'Published natively in one click'
  ];
  if (rest.length >= 2) {
    bullets = rest.slice(0, 3);
  } else if (rest.length === 1) {
    bullets = [rest[0], 'Speed of iteration compounds your reach', 'Consistency is the ultimate competitive advantage'];
  }

  const isTech = /ai|code|software|api|model|system|build/i.test(text);
  const isFounder = /founder|startup|growth|launch|team|sale|product/i.test(text);
  const hashTags = isTech
    ? '#AI #Tech #Innovation #Startups'
    : isFounder
    ? '#Founders #BuildInPublic #Startups #Growth'
    : '#Leadership #Innovation #Growth #Strategy';

  const xHook = text.length > 140 ? mainSentence : text;
  const xInsight = rest.length > 0 ? rest[0] : '1 thought ΓåÆ adapted natively for 30+ platforms in 0.8s.';

  const thText = (text || 'something exciting is in the works').toLowerCase();

  // 0: Dynamic LinkedIn
  CD[0].innerHTML =
    SB +
    '<div class="lh"><span class="av">U</span><div class="srch">' +
    ic('search', 15, 2) +
    'Search</div>' +
    ic('chat', 23, 1.7) +
    '</div><div class="fd"><div class="lp"><div class="ph"><span class="av">U</span><div><b>You</b> ΓÇó 1st<small>Creator &amp; Founder</small><small>Just now ΓÇó ≡ƒîÉ</small></div><span class="fl">+ Follow</span></div><p><b>≡ƒÜÇ Big update:</b></p><p>' +
    safe +
    '</p><p>' +
    bullets.map(b => 'ΓåÆ ' + b).join('<br>') +
    '</p><p><i>' +
    hashTags +
    '</i></p><div class="gfx"><u style="background:#fdf6ee"></u><u style="background:#e8a595"></u><u style="background:#c84b31"></u><em>' +
    metricVal +
    '<small>' +
    metricLabel +
    '</small></em></div><div class="rx"><span>≡ƒæìΓ¥ñ∩╕Å≡ƒÆí 1.2K</span><span>94 comments ΓÇó 38 reposts</span></div><div class="ar"><span>' +
    ic('like', 19) +
    'Like</span><span>' +
    ic('chat', 19) +
    'Comment</span><span>' +
    ic('rep', 19) +
    'Repost</span><span>' +
    ic('send', 19) +
    'Send</span></div></div></div>' +
    tb(
      [
        ['home', 'Home'],
        ['net', 'My Network'],
        ['plus', 'Post'],
        ['bell', 'Notifications'],
        ['job', 'Jobs']
      ],
      0,
      1
    ) +
    HI;

  // 1: Dynamic X
  CD[1].innerHTML =
    SB +
    '<div class="hd xh"><span class="av" style="width:28px;height:28px;font-size:12px">U</span>' +
    svg(PLATFORMS[1], 20) +
    '<span></span></div><div class="xt"><span class="on">For you</span><span>Following</span></div><div class="fd"><div class="xp"><div class="col"><span class="av">U</span><u class="thl"></u></div><div class="bx"><div><b>You</b> ' +
    VB +
    ' <span class="g">@you ┬╖ now</span></div><p>' +
    xHook +
    ' ≡ƒöÑ</p><p>Thread on what we learned ≡ƒº╡≡ƒæç</p>' +
    xm([['chat', '54'], ['rep', '412'], ['heart', '1.8K'], ['eye', '62K'], ['up', '']]) +
    '</div></div><div class="xp"><span class="av">U</span><div class="bx"><div><b>You</b> ' +
    VB +
    ' <span class="g">@you ┬╖ now</span></div><p>' +
    xInsight +
    ' ΓÜí</p>' +
    xm([['chat', '29'], ['rep', '180'], ['heart', '940'], ['eye', '24K'], ['up', '']]) +
    '</div></div></div><span class="fab">+</span>' +
    tb([['home'], ['search'], ['bell'], ['mail']], 0) +
    HI;

  // 2: Dynamic Threads
  if (CD[2]) {
    CD[2].innerHTML =
      SB +
      '<div class="hd">' +
      svg(PLATFORMS[2], 28) +
      '</div><div class="xt"><span class="on">For you</span><span>Following</span></div><div class="fd"><div class="xp"><div class="col"><span class="av">U</span><u class="thl"></u></div><div class="bx"><div><b>you</b> ' +
      VB +
      ' <span class="g">now</span><span class="g r">┬╖┬╖┬╖</span></div><p>okay so i wanted to share something weΓÇÖve been working on...</p><p>' +
      thText +
      '</p><p>the biggest lesson? speed and consistency compound faster than anything else Γ£¿</p><div class="tx">' +
      ic('heart', 20, 1.6) +
      ic('chat', 20, 1.6) +
      ic('rep', 20, 1.6) +
      ic('send', 20, 1.6) +
      '</div><div class="g">124 replies ┬╖ 410 likes</div></div></div></div>' +
      tb([['home'], ['search'], ['plus'], ['heart'], ['user']], 0) +
      HI;
  }
}

// -- Dynamic pricing (DB-backed) -----------------------------------------------
export interface HomePlanPrice {
  id: string;
  name: string;
  monthlyInr: string;
  annualMonthlyInr: string;
}

export const HOMEPAGE_PRICE_FALLBACK: HomePlanPrice[] = [
  { id: 'spark',   name: 'Spark',   monthlyInr: '$0',     annualMonthlyInr: '$0' },
  { id: 'creator', name: 'Creator', monthlyInr: 'Rs799',  annualMonthlyInr: 'Rs666' },
  { id: 'pro',     name: 'Pro',     monthlyInr: 'Rs1,999',annualMonthlyInr: 'Rs1,666' },
  { id: 'studio',  name: 'Studio',  monthlyInr: 'Rs4,166',annualMonthlyInr: 'Rs4,166' },
];

export function useHomepagePricing() {
  const [prices, setPrices] = React.useState<HomePlanPrice[]>(HOMEPAGE_PRICE_FALLBACK);
  React.useEffect(() => {
    fetch('/api/billing/plans?country=IN', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.plans?.length) return;
        const mapped: HomePlanPrice[] = data.plans.map((p: {
          id: string; name: string; isFreeTier: boolean;
          pricing: { monthlyDisplay: string; annualMonthlyDisplay: string };
        }) => ({
          id: p.id,
          name: p.name,
          monthlyInr: p.isFreeTier ? 'Free' : p.pricing.monthlyDisplay,
          annualMonthlyInr: p.isFreeTier ? 'Free' : p.pricing.annualMonthlyDisplay,
        }));
        setPrices(mapped);
      })
      .catch(() => {});
  }, []);
  return prices;
}
