'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './homepage.css';

interface PlatformData {
  name: string;
  bg: string;
  fg: string;
  svgPath: string;
}

const PLATFORMS: [string, string, string, string][] = [
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

const UA_VIDEO_HTML = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ud-s" x1="0" x2="1"><stop offset="0" stop-color="#7C3321"/><stop offset=".26" stop-color="#C4653F"/><stop offset=".5" stop-color="#DE8F66"/><stop offset=".74" stop-color="#B85A38"/><stop offset="1" stop-color="#712C1B"/></linearGradient>
<linearGradient id="ud-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D67B53"/><stop offset=".55" stop-color="#BC5D3A"/><stop offset="1" stop-color="#8A3822"/></linearGradient>
<linearGradient id="ud-t" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E08A62"/><stop offset=".6" stop-color="#C46440"/><stop offset="1" stop-color="#9A4429"/></linearGradient>
<linearGradient id="ud-w" x1="0" x2="1"><stop offset="0" stop-color="#8E3A24"/><stop offset=".5" stop-color="#C46440"/><stop offset="1" stop-color="#8E3A24"/></linearGradient>
<radialGradient id="ud-f"><stop offset="0" stop-color="#3A190C" stop-opacity=".4"/><stop offset="1" stop-color="#3A190C" stop-opacity="0"/></radialGradient>
<filter id="ud-lin" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".9 .05" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .25 0 0 0 0 .1 0 0 0 0 .05 0 0 0 .55 -.14"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="ud-bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.8"/></filter>
<clipPath id="ud-skc"><path d="M78 126C70 170 46 232 29 282C50 293 76 289 100 293C124 289 150 293 171 282C154 232 130 170 122 126Z"/></clipPath><symbol id="ua-dress" viewBox="0 0 200 300">
<ellipse cx="100" cy="290" rx="78" ry="8" fill="url(#ud-f)"/>
<g id="ud-all">
<path d="M72 38C60 40 46 50 33 78C46 86 61 82 71 71L75 52Z" fill="url(#ud-b)"/>
<path d="M128 38C140 40 154 50 167 78C154 86 139 82 129 71L125 52Z" fill="url(#ud-t)"/>
<path d="M78 126C70 170 46 232 29 282C50 293 76 289 100 293C124 289 150 293 171 282C154 232 130 170 122 126Z" fill="url(#ud-s)"/>
<path d="M96 132C92 190 80 240 70 291L100 293C124 289 150 293 171 282C154 232 130 170 122 126Z" fill="#F5C09A" opacity=".1"/>
<g clip-path="url(#ud-skc)"><path d="M86 131C80 190 62 240 44 285M106 134C107 190 104 240 100 291M117 132C124 190 142 240 158 284M132 150C142 200 150 245 164 281M66 196C58 226 48 252 38 280" fill="none" stroke="#45190B" stroke-opacity=".3" stroke-width="5" filter="url(#ud-bl)"/>
<path d="M95 134C92 190 88 240 80 291M112 134C115 190 120 240 126 291M146 190C152 224 160 252 166 280M58 206C54 232 48 256 42 280" fill="none" stroke="#F8C7A2" stroke-opacity=".34" stroke-width="4" filter="url(#ud-bl)"/>
</g><path d="M96 132C92 190 80 240 70 291" fill="none" stroke="#3E1708" stroke-opacity=".38" stroke-width="2.2"/>
<path d="M98 132C94 190 82 240 73 291" fill="none" stroke="#F4B890" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M29 282C50 293 76 289 100 293C124 289 150 293 171 282" fill="none" stroke="#F2B58E" stroke-opacity=".55" stroke-width="1.4"/>
<path d="M92 34L101 78L88 128L78 128C74 104 70 70 72 38C80 33 86 32 92 34Z" fill="url(#ud-b)"/>
<path d="M92 34C98 27 108 27 114 33L101 78Z" fill="#5E2415"/>
<path d="M92 34L101 78L110 90L122 128L88 128Z" fill="#B3563A"/>
<path d="M128 38C124 34 119 32 114 33L101 78L88 128L122 128C126 104 130 70 128 38Z" fill="url(#ud-t)"/>
<path d="M114 33L101 78L88 128" fill="none" stroke="#3E1708" stroke-opacity=".3" stroke-width="3" filter="url(#ud-bl)"/>
<path d="M114 33C108 56 104 66 101 78C96 96 92 112 88 128" fill="none" stroke="#F6BC96" stroke-opacity=".6" stroke-width="1.3"/>
<path d="M92 34L101 78M92 34C98 27 108 27 114 33" fill="none" stroke="#E9A57F" stroke-opacity=".55" stroke-width="1.2"/>
<path d="M122 124C112 116 104 108 98 98M80 124C86 114 90 106 94 100" fill="none" stroke="#45190B" stroke-opacity=".3" stroke-width="3" filter="url(#ud-bl)"/>
<path d="M77 123C92 128 108 128 123 123L124 134C108 139 92 139 76 134Z" fill="url(#ud-w)"/>
<path d="M77 124C92 129 108 129 123 124" fill="none" stroke="#F5BE98" stroke-opacity=".5" stroke-width="1"/>
<path d="M86 134C80 156 74 172 66 192L77 195C85 176 91 156 93 136Z" fill="url(#ud-b)" stroke="#6A2815" stroke-opacity=".35" stroke-width=".8"/>
<path d="M88 134C95 158 100 176 102 198L113 194C108 174 101 154 95 135Z" fill="url(#ud-t)" stroke="#6A2815" stroke-opacity=".35" stroke-width=".8"/>
<path d="M88 131C72 114 61 128 75 137Z" fill="url(#ud-t)" stroke="#6A2815" stroke-opacity=".4" stroke-width=".8"/>
<path d="M88 131C104 114 115 128 101 137Z" fill="url(#ud-b)" stroke="#6A2815" stroke-opacity=".4" stroke-width=".8"/>
<ellipse cx="88" cy="132" rx="5.5" ry="6" fill="#A44A2B" stroke="#5B2312" stroke-opacity=".4" stroke-width=".8"/>
</g>
<use href="#ud-all" filter="url(#ud-lin)"/>
</symbol></defs></svg>
<div class="ua-wrap">
  <div class="vid in">
    <div class="vh">
      <span class="vn">02</span>
      <div class="vt"><h3>Flight plan &amp; publish</h3><p>Drop the post on the best time in your weekly plan, switch on auto-publish and watch it take off on both platforms.</p></div>
      <div class="vc"><span>Schedule</span><span>Auto-publish</span><span>Live</span></div>
    </div>
    <div class="ua-player" id="ua-player">
      <div class="ua-viewport" data-k="viewport" role="img" aria-label="Video 2: schedule the dress post on the best time and publish it automatically to Instagram and LinkedIn">
        <div class="ua-stage" data-k="stage">
          <div class="ua-chrome"><i></i><i></i><i></i><span class="ua-url">🔒 app.unool.co/automation</span><span class="nv"><span>Compose</span><span class="on">Flight plan</span><span>Inbox</span></span><span class="ua-live">LIVE DEMO</span></div>
          <div class="ua-body">
            <!-- PART 2a · flight plan -->
            <div class="sub" data-k="b1">
              <div class="card" style="left:24px;top:20px;width:640px;height:400px">
                <div style="position:absolute;left:16px;top:12px;font-weight:600">Flight plan <span style="color:var(--dim);font-weight:500;font-size:13px">· this week</span></div>
                <div data-k="cal"><div class="dy" style="left:16px">MON</div><div class="dy" style="left:137.6px">TUE</div><div class="dy" style="left:259.2px">WED</div><div class="dy" style="left:380.8px">THU</div><div class="dy" style="left:502.4px">FRI</div><div class="cal"><div class="sl"><em>9:00</em><div class="q"><span class="pi sm ig"></span>Queued post</div></div><div class="sl" data-k="best"><em>9:00</em><div class="bt" data-k="bt">Best time · 9:40</div><div class="chip" data-k="dc" style="left:8px;top:22px;width:auto;right:8px;opacity:0"><div class="art"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>IG + LI</small></div></div></div><div class="sl"><em>9:00</em></div><div class="sl"><em>9:00</em><div class="q"><span class="pi sm ig"></span>Queued post</div></div><div class="sl"><em>9:00</em></div><div class="sl"><em>12:30</em></div><div class="sl"><em>12:30</em></div><div class="sl"><em>12:30</em><div class="q"><span class="pi sm li">in</span>Queued post</div></div><div class="sl"><em>12:30</em></div><div class="sl"><em>12:30</em></div><div class="sl"><em>17:00</em></div><div class="sl"><em>17:00</em></div><div class="sl"><em>17:00</em></div><div class="sl"><em>17:00</em></div><div class="sl"><em>17:00</em><div class="q"><span class="pi sm li">in</span>Queued post</div></div></div></div>
              </div>
              <div class="card" style="left:684px;top:20px;width:252px;height:400px;padding:16px">
                <div class="lbl">Ready to schedule</div>
                <div data-k="src" class="chip" style="position:relative;margin-top:14px;width:auto;height:84px;padding:12px"><div class="art" style="width:46px;height:58px;border-radius:8px"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>Instagram + LinkedIn</small></div></div>
                <div data-k="done" style="margin-top:16px;padding:12px;border-radius:12px;background:rgba(79,138,91,.12);color:var(--good);font-weight:600;font-size:13.5px;line-height:1.4">✓ Scheduled · Tue 9:40<small style="display:block;font-weight:500;color:var(--muted)">Your audience is most active then</small></div>
                <div class="tg2" style="left:16px;bottom:18px"><span class="sw" data-k="sw"></span><span data-k="swl">Auto-publish</span></div>
              </div>
              <div class="chip" data-k="dg"><div class="art"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>IG + LI</small></div></div>
            </div>
            <!-- PART 2b · publish -->
            <div class="sub" data-k="b2">
              <div class="card bp">
                <div style="display:flex;align-items:center;gap:12px"><span class="pi brand">ᘐ</span><div><div class="lbl">Flight UN-204</div><b style="font-size:15px">Auto-publish</b></div></div>
                <div class="rt"><div><small>FROM</small>Queue</div><div style="text-align:right"><small>TO</small>Live</div></div>
                <div class="bar2"><span data-k="pl">✈</span></div>
                <div style="font-size:19px;font-weight:600;margin-top:22px">Linen Wrap Dress drop</div>
                <div class="grid3"><div class="lbl">Platforms<b>IG + LI</b></div><div class="lbl">Departs<b>Tue 9:40</b></div><div class="lbl">Status<b data-k="fs" style="color:var(--accent2)">Scheduled</b></div></div>
                <div class="stub"><i></i><span>Boarding pass<br>issued by Unool</span></div>
              </div>
              <div class="card" style="left:468px;top:24px;width:464px;height:404px;padding:20px">
                <div class="lbl">Publishing</div><div data-k="steps" style="margin-top:6px"><div class="stp p"><span class="dot"></span><div><b>Departure time reached</b><small>Tue 9:40 · queue checked</small></div></div><div class="stp p"><span class="dot"></span><div><b>Preparing media</b><small>Resized for 4:5 and 1.91:1</small></div></div><div class="stp p"><span class="dot"></span><div><b>Publishing to Instagram</b><small>Container created → published</small></div></div><div class="stp p"><span class="dot"></span><div><b>Publishing to LinkedIn</b><small>Post shared to your profile</small></div></div></div>
                <div class="live2" data-k="lv"><div><span class="pi sm ig"></span>Instagram · Live</div><div><span class="pi sm li">in</span>LinkedIn · Live</div></div>
              </div>
            </div>
          </div>
          <div class="ua-cap"><span class="st" data-k="st">STEP 3</span><b data-k="cb">Flight plan</b><span data-k="ct">Drop it on the best time — Unool suggests when your audience is online.</span></div>
          <svg class="cur" data-k="cur" viewBox="0 0 22 22"><path d="M3 2l14 8-6.2 1.6L8 18z" fill="#2A1E17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
        </div>
        <div class="end" data-k="end"><div><b>Live on both platforms.</b><div class="eb"><button data-k="replay">↻ Replay</button></div></div></div>
      </div>
      <div class="ua-ctrl">
        <button class="ua-pb" data-k="play" aria-label="Play or pause"><svg viewBox="0 0 24 24"><path data-k="pp" d="M6 4h4v16h-4zM14 4h4v16h-4z"/></svg></button>
        <div class="ua-bar" data-k="bar" role="slider" aria-label="Seek walkthrough" tabindex="0"><i data-k="fill"></i><b data-k="knob"></b></div>
        <span class="ua-time" data-k="time">0:00 / 0:15</span>
      </div>
    </div>
  </div>
  <p class="ua-note">Demo data is simulated. Connect real accounts to see your own numbers.</p>
</div>
`;

function initUaPlayer(containerEl?: HTMLElement | null): () => void {
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
            ? '<div class="bt" data-k="bt">Best time · 9:40</div><div class="chip" data-k="dc" style="left:8px;top:22px;width:auto;right:8px"><div class="art"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>IG + LI</small></div></div>'
            : '') +
          '</div>';
      }
    }
    calEl.innerHTML = h + '</div>';
  }

  const STEPS: [string, string, number, number][] = [
    ['Departure time reached', 'Tue 9:40 · queue checked', 7, 7.6],
    ['Preparing media', 'Resized for 4:5 and 1.91:1', 7.6, 9],
    ['Publishing to Instagram', 'Container created → published', 9, 10.6],
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
    [0, 'STEP 3', 'Flight plan', 'Drop it on the best time — Unool suggests when your audience is online.'],
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

    const fs = t < 7 ? 'Scheduled' : t < 9 ? 'Boarding' : t < 12.2 ? 'In flight' : 'Landed · Live';
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
      if (dot) dot.textContent = d ? '✓' : '';
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

const UNOOL_VIDEO_HTML_DOC = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unool · Video 2 · Flight plan &amp; publish</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:transparent;overflow-x:hidden;padding:0;-webkit-font-smoothing:antialiased}
@media (min-width: 1px) {
  body:not(.embedded) {
    background: #FAF6EF;
  }
}
</style>
</head>
<body>
<!-- UNOOL · VIDEO 2 (Flight plan & publish) -->
<style>
.ua{--bg:#F3EBDF;--bg2:#EEE4D5;--surface:#FAF6EF;--surface2:#F0E7DA;--line:rgba(70,45,30,.12);--line2:rgba(70,45,30,.22);
--text:#2A1E17;--muted:#7B6A5C;--dim:#A19080;--accent:#C2603E;--accent2:#A44A2B;--soft:rgba(194,96,62,.13);--good:#4F8A5B;--warn:#B9812A;--li:#0A66C2;
--serif:'Instrument Serif',Georgia,serif;--sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
position:relative;background:transparent;color:var(--text);font-family:var(--sans);padding:0;overflow:hidden;isolation:isolate;-webkit-font-smoothing:antialiased}
.ua *,.ua *::before,.ua *::after{box-sizing:border-box}
.ua::before{display:none}
.ua-wrap{width:100%;max-width:1120px;margin:0 auto}
.ua button{font-family:inherit;color:inherit}
.ua-player{border-radius:18px;border:1px solid var(--line2);background:var(--surface);overflow:hidden;box-shadow:0 30px 70px -25px rgba(120,60,30,.35),0 0 0 5px rgba(70,45,30,.03);transition:box-shadow .5s}
.ua-player:hover{box-shadow:0 40px 90px -25px rgba(194,96,62,.45),0 0 0 6px rgba(194,96,62,.08)}
.ua-viewport{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:var(--bg2);cursor:pointer}
.ua-stage{position:absolute;left:0;top:0;width:960px;height:540px;transform-origin:0 0;font-size:15px}
.ua-chrome{position:absolute;inset:0 auto auto 0;width:960px;height:40px;background:var(--surface);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 16px;gap:8px}
.ua-chrome i{width:11px;height:11px;border-radius:50%;background:#D9CBB8}
.ua-url{margin-left:18px;flex:1;max-width:250px;height:24px;border-radius:7px;background:var(--bg2);color:var(--muted);font-size:12.5px;display:flex;align-items:center;padding:0 12px}
.ua .nv{display:flex;gap:4px;margin-left:12px}
.ua .nv span{padding:5px 11px;border-radius:8px;font-size:12px;font-weight:600;color:var(--muted)}
.ua .nv span.on{background:var(--soft);color:var(--accent2)}
.ua-live{margin-left:auto;display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;letter-spacing:.08em;color:var(--good)}
.ua-live::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--good);animation:p 1.4s infinite}
@keyframes p{to{box-shadow:0 0 0 9px rgba(79,138,91,0)}}
.ua-body{position:absolute;left:0;top:40px;width:960px;height:500px;overflow:hidden;background:radial-gradient(70% 90% at 50% 0,rgba(194,96,62,.09),transparent),var(--bg2)}
.sub{position:absolute;inset:0;opacity:0;visibility:hidden}
.card{position:absolute;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 1px 0 rgba(255,255,255,.8) inset,0 14px 30px -18px rgba(90,50,25,.38);overflow:hidden}
.lbl{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--dim);font-weight:700}
.pi{display:inline-flex;width:38px;height:38px;border-radius:11px;align-items:center;justify-content:center;flex:none;color:#fff;font-weight:700;font-size:15px}
.pi.ig{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='5.5'/%3E%3Ccircle cx='12' cy='12' r='4.2'/%3E%3Ccircle cx='17.4' cy='6.6' r='1.1' fill='%23fff' stroke='none'/%3E%3C/svg%3E") center/62% no-repeat,radial-gradient(circle at 30% 107%,#fdf497 0,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)}.pi.ig svg{display:none}.pi.li{background:#0A66C2;font:800 15px/1 Arial,Helvetica,sans-serif;letter-spacing:-.04em}.pi.li.sm{font-size:11px}.pi.brand{background:var(--accent);font-size:12px}
.pi.sm{width:22px;height:22px;border-radius:7px;font-size:11px}.pi svg{width:55%;height:55%}
@keyframes sp{to{transform:rotate(360deg)}}
.art{position:relative;overflow:hidden;background:radial-gradient(90% 70% at 50% 38%,#FBF4EA,#EADBC7 70%,#DCC8B0)}.art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.art svg{position:absolute;left:50%;top:50%;height:94%;width:auto;transform:translate(-50%,-50%)}
.art em{position:absolute;left:12px;bottom:8px;color:#fff;font:italic 20px var(--serif)}
.cal{position:absolute;left:16px;top:50px;width:608px;height:300px;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,100px)}
.dy{position:absolute;top:34px;font-size:11px;font-weight:700;letter-spacing:.09em;color:var(--dim);width:121.6px;padding-left:8px}
.sl{position:relative;border-top:1px solid var(--line);border-left:1px solid var(--line);padding:6px}
.sl em{position:absolute;right:8px;top:6px;font-style:normal;font-size:11.5px;color:var(--dim)}
.q{margin-top:22px;display:flex;gap:7px;align-items:center;padding:7px;border-radius:9px;background:var(--surface2);font-size:12px;font-weight:500;line-height:1.15}
.best{background:repeating-linear-gradient(135deg,rgba(194,96,62,.1) 0 8px,transparent 8px 16px);outline:1.5px dashed rgba(194,96,62,.6);outline-offset:-3px;border-radius:6px}
.bt{display:none}.best .bt{display:block;position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:11.5px;font-weight:700;color:var(--accent2)}
.tg2{position:absolute;display:flex;align-items:center;gap:10px;font-size:14px}
.sw{width:40px;height:22px;border-radius:99px;background:#D9CBB8;position:relative;flex:none}.sw::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.sw.on{background:var(--accent)}.sw.on::after{left:21px}
.bp{left:28px;top:24px;width:420px;height:404px;padding:22px}
.bar2{margin:20px 0 6px;height:34px;position:relative;border-top:2px dotted var(--line2);top:6px}
.bar2 span{position:absolute;top:-17px;font-size:24px;color:var(--accent)}
.rt{display:flex;justify-content:space-between;font:italic 34px var(--serif);margin-top:18px}
.rt small{display:block;font:600 10.5px var(--sans);letter-spacing:.1em;color:var(--dim);font-style:normal}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:18px}.grid3 b{display:block;font-size:14px;margin-top:4px}
.stub{position:absolute;left:0;right:0;bottom:0;height:78px;border-top:2px dashed var(--line2);background:var(--surface2);display:flex;align-items:center;gap:16px;padding:0 22px;font-size:12.5px;color:var(--muted)}
.stub i{flex:1;height:36px;background:repeating-linear-gradient(90deg,var(--text) 0 2px,transparent 2px 5px,var(--text) 5px 6px,transparent 6px 10px);opacity:.7;border-radius:3px}
.stp{display:flex;gap:14px;align-items:center;padding:12px 4px;border-bottom:1px solid var(--line)}.stp b{display:block;font-size:14.5px}.stp small{color:var(--dim);font-size:12.5px}
.dot{width:24px;height:24px;border-radius:50%;border:2px solid var(--line2);flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px}
.stp.a .dot{border-color:var(--accent);border-top-color:transparent;animation:sp .7s linear infinite}.stp.d .dot{background:var(--good);border-color:var(--good)}
.stp.p{opacity:.5}
.live2{display:flex;gap:10px;margin-top:14px}.live2 div{flex:1;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(79,138,91,.12);color:var(--good);font-weight:600;font-size:13.5px}
.cur{position:absolute;left:0;top:0;width:22px;height:22px;pointer-events:none;z-index:9;opacity:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}

.vh{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap}
.vn{display:none !important}
.vt h3{margin:0;font-size:20px;font-weight:600;letter-spacing:-.02em}
.vt p{margin:4px 0 0;color:var(--muted);font-size:13.5px;max-width:540px;line-height:1.45}
.vc{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
.vc span{padding:5px 10px;border-radius:99px;border:1px solid var(--line2);background:var(--surface);font-size:11.5px;font-weight:600;color:var(--muted)}
.chip{display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--line);border-radius:12px;position:absolute;z-index:8;padding:8px;font-size:13px;font-weight:600;color:var(--text);box-shadow:0 8px 24px -8px rgba(90,50,25,.3)}
.chip small{display:block;font-size:11px;font-weight:500;color:var(--dim)}
.vid{opacity:1;transform:none}
.ua-cap,.ua-ctrl,.ua-note,.end{display:none !important}
</style>

<section class="ua" id="unool-automation">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ud-s" x1="0" x2="1"><stop offset="0" stop-color="#7C3321"/><stop offset=".26" stop-color="#C4653F"/><stop offset=".5" stop-color="#DE8F66"/><stop offset=".74" stop-color="#B85A38"/><stop offset="1" stop-color="#712C1B"/></linearGradient>
<linearGradient id="ud-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D67B53"/><stop offset=".55" stop-color="#BC5D3A"/><stop offset="1" stop-color="#8A3822"/></linearGradient>
<linearGradient id="ud-t" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E08A62"/><stop offset=".6" stop-color="#C46440"/><stop offset="1" stop-color="#9A4429"/></linearGradient>
<linearGradient id="ud-w" x1="0" x2="1"><stop offset="0" stop-color="#8E3A24"/><stop offset=".5" stop-color="#C46440"/><stop offset="1" stop-color="#8E3A24"/></linearGradient>
<radialGradient id="ud-f"><stop offset="0" stop-color="#3A190C" stop-opacity=".4"/><stop offset="1" stop-color="#3A190C" stop-opacity="0"/></radialGradient>
<filter id="ud-lin" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".9 .05" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .25 0 0 0 0 .1 0 0 0 0 .05 0 0 0 .55 -.14"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="ud-bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.8"/></filter>
<clipPath id="ud-skc"><path d="M78 126C70 170 46 232 29 282C50 293 76 289 100 293C124 289 150 293 171 282C154 232 130 170 122 126Z"/></clipPath><symbol id="ua-dress" viewBox="0 0 200 300">
<ellipse cx="100" cy="290" rx="78" ry="8" fill="url(#ud-f)"/>
<g id="ud-all">
<path d="M72 38C60 40 46 50 33 78C46 86 61 82 71 71L75 52Z" fill="url(#ud-b)"/>
<path d="M128 38C140 40 154 50 167 78C154 86 139 82 129 71L125 52Z" fill="url(#ud-t)"/>
<path d="M78 126C70 170 46 232 29 282C50 293 76 289 100 293C124 289 150 293 171 282C154 232 130 170 122 126Z" fill="url(#ud-s)"/>
<path d="M96 132C92 190 80 240 70 291L100 293C124 289 150 293 171 282C154 232 130 170 122 126Z" fill="#F5C09A" opacity=".1"/>
<g clip-path="url(#ud-skc)"><path d="M86 131C80 190 62 240 44 285M106 134C107 190 104 240 100 291M117 132C124 190 142 240 158 284M132 150C142 200 150 245 164 281M66 196C58 226 48 252 38 280" fill="none" stroke="#45190B" stroke-opacity=".3" stroke-width="5" filter="url(#ud-bl)"/>
<path d="M95 134C92 190 88 240 80 291M112 134C115 190 120 240 126 291M146 190C152 224 160 252 166 280M58 206C54 232 48 256 42 280" fill="none" stroke="#F8C7A2" stroke-opacity=".34" stroke-width="4" filter="url(#ud-bl)"/>
</g><path d="M96 132C92 190 80 240 70 291" fill="none" stroke="#3E1708" stroke-opacity=".38" stroke-width="2.2"/>
<path d="M98 132C94 190 82 240 73 291" fill="none" stroke="#F4B890" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M29 282C50 293 76 289 100 293C124 289 150 293 171 282" fill="none" stroke="#F2B58E" stroke-opacity=".55" stroke-width="1.4"/>
<path d="M92 34L101 78L88 128L78 128C74 104 70 70 72 38C80 33 86 32 92 34Z" fill="url(#ud-b)"/>
<path d="M92 34C98 27 108 27 114 33L101 78Z" fill="#5E2415"/>
<path d="M92 34L101 78L110 90L122 128L88 128Z" fill="#B3563A"/>
<path d="M128 38C124 34 119 32 114 33L101 78L88 128L122 128C126 104 130 70 128 38Z" fill="url(#ud-t)"/>
<path d="M114 33L101 78L88 128" fill="none" stroke="#3E1708" stroke-opacity=".3" stroke-width="3" filter="url(#ud-bl)"/>
<path d="M114 33C108 56 104 66 101 78C96 96 92 112 88 128" fill="none" stroke="#F6BC96" stroke-opacity=".6" stroke-width="1.3"/>
<path d="M92 34L101 78M92 34C98 27 108 27 114 33" fill="none" stroke="#E9A57F" stroke-opacity=".55" stroke-width="1.2"/>
<path d="M122 124C112 116 104 108 98 98M80 124C86 114 90 106 94 100" fill="none" stroke="#45190B" stroke-opacity=".3" stroke-width="3" filter="url(#ud-bl)"/>
<path d="M77 123C92 128 108 128 123 123L124 134C108 139 92 139 76 134Z" fill="url(#ud-w)"/>
<path d="M77 124C92 129 108 129 123 124" fill="none" stroke="#F5BE98" stroke-opacity=".5" stroke-width="1"/>
<path d="M86 134C80 156 74 172 66 192L77 195C85 176 91 156 93 136Z" fill="url(#ud-b)" stroke="#6A2815" stroke-opacity=".35" stroke-width=".8"/>
<path d="M88 134C95 158 100 176 102 198L113 194C108 174 101 154 95 135Z" fill="url(#ud-t)" stroke="#6A2815" stroke-opacity=".35" stroke-width=".8"/>
<path d="M88 131C72 114 61 128 75 137Z" fill="url(#ud-t)" stroke="#6A2815" stroke-opacity=".4" stroke-width=".8"/>
<path d="M88 131C104 114 115 128 101 137Z" fill="url(#ud-b)" stroke="#6A2815" stroke-opacity=".4" stroke-width=".8"/>
<ellipse cx="88" cy="132" rx="5.5" ry="6" fill="#A44A2B" stroke="#5B2312" stroke-opacity=".4" stroke-width=".8"/>
</g>
<use href="#ud-all" filter="url(#ud-lin)"/>
</symbol></defs></svg>
<div class="ua-wrap">
  <div class="vid in">
    <div class="vh">
      <div class="vt">
        <h3>Flight plan &amp; publish</h3>
        <p>Drop the post on the best time in your weekly plan, switch on auto-publish and watch it take off on both platforms.</p>
      </div>
      <div class="vc"><span>Schedule</span><span>Auto-publish</span><span>Live</span></div>
    </div>
    <div class="ua-player" id="ua-player">
      <div class="ua-viewport" data-k="viewport" role="img" aria-label="Video 2: schedule the dress post on the best time and publish it automatically to Instagram and LinkedIn">
        <div class="ua-stage" data-k="stage">
          <div class="ua-chrome"><i></i><i></i><i></i><span class="ua-url">🔒 app.unool.co/automation</span><span class="nv"><span>Compose</span><span class="on">Flight plan</span><span>Inbox</span></span><span class="ua-live">LIVE DEMO</span></div>
          <div class="ua-body">
            <!-- PART 2a · flight plan -->
            <div class="sub" data-k="b1">
              <div class="card" style="left:24px;top:20px;width:640px;height:400px">
                <div style="position:absolute;left:16px;top:12px;font-weight:600">Flight plan <span style="color:var(--dim);font-weight:500;font-size:13px">· this week</span></div>
                <div data-k="cal"></div>
              </div>
              <div class="card" style="left:684px;top:20px;width:252px;height:400px;padding:16px">
                <div class="lbl">Ready to schedule</div>
                <div data-k="src" class="chip" style="position:relative;margin-top:14px;width:auto;height:84px;padding:12px"><div class="art" style="width:46px;height:58px;border-radius:8px"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>Instagram + LinkedIn</small></div></div>
                <div data-k="done" style="margin-top:16px;padding:12px;border-radius:12px;background:rgba(79,138,91,.12);color:var(--good);font-weight:600;font-size:13.5px;line-height:1.4">✓ Scheduled · Tue 9:40<small style="display:block;font-weight:500;color:var(--muted)">Your audience is most active then</small></div>
                <div class="tg2" style="left:16px;bottom:18px"><span class="sw" data-k="sw"></span><span data-k="swl">Auto-publish</span></div>
              </div>
              <div class="chip" data-k="dg"><div class="art"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>IG + LI</small></div></div>
            </div>
            <!-- PART 2b · publish -->
            <div class="sub" data-k="b2">
              <div class="card bp">
                <div style="display:flex;align-items:center;gap:12px"><span class="pi brand">ᘐ</span><div><div class="lbl">Flight UN-204</div><b style="font-size:15px">Auto-publish</b></div></div>
                <div class="rt"><div><small>FROM</small>Queue</div><div style="text-align:right"><small>TO</small>Live</div></div>
                <div class="bar2"><span data-k="pl">✈</span></div>
                <div style="font-size:19px;font-weight:600;margin-top:22px">Linen Wrap Dress drop</div>
                <div class="grid3"><div class="lbl">Platforms<b>IG + LI</b></div><div class="lbl">Departs<b>Tue 9:40</b></div><div class="lbl">Status<b data-k="fs" style="color:var(--accent2)">Scheduled</b></div></div>
                <div class="stub"><i></i><span>Boarding pass<br>issued by Unool</span></div>
              </div>
              <div class="card" style="left:468px;top:24px;width:464px;height:404px;padding:20px">
                <div class="lbl">Publishing</div><div data-k="steps" style="margin-top:6px"></div>
                <div class="live2" data-k="lv"><div><span class="pi sm ig"></span>Instagram · Live</div><div><span class="pi sm li">in</span>LinkedIn · Live</div></div>
              </div>
            </div>
          </div>
          <svg class="cur" data-k="cur" viewBox="0 0 22 22"><path d="M3 2l14 8-6.2 1.6L8 18z" fill="#2A1E17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
        </div>
      </div>
    </div>
  </div>
</div>
</section>

<script>
(function(){
'use strict';
var DUR=15;
var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))},prog=function(t,a,b){return clamp((t-a)/(b-a))},sm=function(x){return x*x*(3-2*x)};
var root=document.getElementById('ua-player'),cache={};
var $=function(k){return cache[k]||(cache[k]=root.querySelector('[data-k="'+k+'"]'))};
var viewport=$('viewport'),stage=$('stage');
function fit(){
  if(viewport&&stage){
    var w=viewport.clientWidth||root.clientWidth||640;
    stage.style.transform='scale('+(w/960)+')';
  }
}
if(window.ResizeObserver)new ResizeObserver(fit).observe(viewport);else addEventListener('resize',fit);fit();

/* ---- static builders: weekly calendar + publish steps ---- */
(function(){
  var T=['9:00','12:30','17:00'],P={'0-0':'ig','2-1':'li','3-0':'ig','4-2':'li'},h='',D=['MON','TUE','WED','THU','FRI'];
  D.forEach(function(d,i){h+='<div class="dy" style="left:'+(16+i*121.6)+'px">'+d+'</div>'});h+='<div class="cal">';
  for(var r=0;r<3;r++)for(var c=0;c<5;c++){var k=c+'-'+r,b=c==1&&r==0;h+='<div class="sl'+(b?'" data-k="best':'')+'"><em>'+T[r]+'</em>'+(P[k]?'<div class="q"><span class="pi sm '+P[k]+'">'+(P[k]=='li'?'in':'')+'</span>Queued post</div>':'')+(b?'<div class="bt" data-k="bt">Best time · 9:40</div><div class="chip" data-k="dc" style="left:8px;top:22px;width:auto;right:8px"><div class="art"><svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg></div><div>Linen Wrap Dress<small>IG + LI</small></div></div>':'')+'</div>'}
  $('cal').innerHTML=h+'</div>';
})();
var STEPS=[['Departure time reached','Tue 9:40 · queue checked',7,7.6],['Preparing media','Resized for 4:5 and 1.91:1',7.6,9],['Publishing to Instagram','Container created → published',9,10.6],['Publishing to LinkedIn','Post shared to your profile',10.4,12.1]];
$('steps').innerHTML=STEPS.map(function(s){return '<div class="stp p"><span class="dot"></span><div><b>'+s[0]+'</b><small>'+s[1]+'</small></div></div>'}).join('');
var stEls=[].slice.call(root.querySelectorAll('.stp'));

/* ---- cursor path: [time, x, y, opacity] ---- */
var F=[[0,700,300,0],[.4,700,300,0],[1,810,142,1],[1.6,810,142,1],[3.3,222,160,1],[3.8,260,210,1],[4.4,720,431,1],[5.4,760,400,0],[15,760,400,0]];
var CK=[1.5,3.3,4.5];
function cur(t){var i=0;while(i<F.length-2&&t>F[i+1][0])i++;var a=F[i],b=F[i+1],p=sm(prog(t,a[0],b[0]));return[a[1]+(b[1]-a[1])*p,a[2]+(b[2]-a[2])*p,a[3]+(b[3]-a[3])*p]}
function vis(el,t,a,b,dy){if(!el)return;var o=sm(prog(t,a,a+.45))*(1-sm(prog(t,b-.35,b)));if(a<=0)o=1-sm(prog(t,b-.35,b));el.style.opacity=o;el.style.visibility=o>.01?'visible':'hidden';if(dy)el.style.transform='translateY('+(1-sm(prog(t,a,a+.6)))*dy+'px)'}
function put(id,s){var e=$(id);if(e&&e._h!==s){e.innerHTML=s;e._h=s}}

/* ---- render(t): pure function of time ---- */
function render(t){
 vis($('b1'),t,0,6.5);vis($('b2'),t,6.5,999);
 /* schedule */
 var bestEl = $('best');
 if(bestEl) bestEl.className='sl'+(t>=.5&&t<3.3?' best':'');
 var cp=cur(t),drag=t>=1.5&&t<3.3;
 var srcEl = $('src');
 if(srcEl) srcEl.style.opacity=t<1.5?1:0;
 var dcEl = $('dc');
 if(dcEl) dcEl.style.opacity=t>=3.3?1:0;
 var dg=$('dg');
 if(dg){
   dg.style.opacity=drag?1:0;
   dg.style.left=(cp[0]-75)+'px';
   dg.style.top=(cp[1]-40-24)+'px';
   dg.style.transform='rotate('+(drag?-3:0)+'deg)';
 }
 var doneEl = $('done');
 if(doneEl) doneEl.style.opacity=sm(prog(t,3.4,3.9));
 var sw=t>=4.5;
 var swEl = $('sw');
 if(swEl) swEl.className='sw'+(sw?' on':'');
 put('swl',sw?'Auto-publish ON':'Auto-publish');
 /* publish */
 var fs=t<7?'Scheduled':t<9?'Boarding':t<12.2?'In flight':'Landed · Live';
 var fsEl = $('fs');
 if(fsEl) fsEl.textContent=fs;
 var plEl = $('pl');
 if(plEl) plEl.style.left=(prog(t,7,12.2)*92)+'%';
 STEPS.forEach(function(s,i){
   var e=stEls[i];
   if(!e)return;
   var d=t>=s[3],a=t>=s[2]&&!d;
   e.className='stp '+(d?'d':a?'a':'p');
   var dot = e.querySelector('.dot');
   if(dot) dot.textContent=d?'✓':'';
 });
 var lvEl = $('lv');
 if(lvEl){
   lvEl.style.opacity=sm(prog(t,12.4,13));
   lvEl.style.transform='translateY('+(1-sm(prog(t,12.4,13)))*10+'px)';
 }
 /* cursor */
 var cu=$('cur'),press=CK.some(function(c){return Math.abs(t-c)<.12});
 if(cu){
   cu.style.opacity=cp[2];
   cu.style.transform='translate('+cp[0]+'px,'+cp[1]+'px) scale('+(press?.82:1)+')';
 }
}

/* ---- player in continuous infinite loop ---- */
var t=0,playing=true,manual=false,dirty=true,last=performance.now(),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function setPlay(v){playing=v;last=performance.now();dirty=true}
function restart(){t=0;setPlay(true)}
function toggle(){manual=playing;setPlay(!playing)}
viewport.onclick=toggle;

if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){
    if(es[0].isIntersecting){if(!manual&&!reduce)setPlay(true)}else if(playing)setPlay(false);
  },{threshold:.15}).observe(viewport);
}
if(!reduce)setPlay(true);

(function loop(n){
  var d=Math.max(0,Math.min(0.1,(n-last)/1000));
  last=n;
  if(playing){
    t+=d;
    if(t>=DUR+1.4){
      t=0;
    }
    dirty=true;
  }
  if(dirty){dirty=false;render(t)}
  requestAnimationFrame(loop);
})(performance.now());

var sec=document.getElementById('unool-automation');
if(sec){
  sec.addEventListener('pointermove',function(e){
    var r=sec.getBoundingClientRect();
    sec.style.setProperty('--mx',(e.clientX-r.left)+'px');
    sec.style.setProperty('--my',(e.clientY-r.top)+'px');
  });
}

function notifyHeight(){
  try{
    var wrap=document.querySelector('.ua-wrap')||document.body;
    var h=wrap?wrap.offsetHeight:document.body.scrollHeight;
    if(h&&window.parent)window.parent.postMessage({type:'unool-video-resize',height:h},'*');
  }catch(e){}
}
notifyHeight();
window.addEventListener('resize',function(){fit();notifyHeight();});
if(window.ResizeObserver)new ResizeObserver(notifyHeight).observe(document.body);
setTimeout(function(){fit();notifyHeight();},100);
setTimeout(function(){fit();notifyHeight();},400);
setTimeout(function(){fit();notifyHeight();},1200);
})();
</script>
</body>
</html>`;

function BentoVideoPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(480);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'unool-video-resize' && typeof e.data.height === 'number') {
        if (e.data.height > 200) {
          setHeight(Math.ceil(e.data.height));
        }
      }
    }

    function checkDirect() {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          const wrap = (doc.querySelector('.ua-wrap') || doc.body) as HTMLElement;
          const h = wrap ? (wrap.offsetHeight || wrap.scrollHeight) : 0;
          if (h > 200) {
            setHeight(Math.ceil(h));
          }
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleMessage);
    const interval = setInterval(checkDirect, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={UNOOL_VIDEO_HTML_DOC}
        src="/unool-video-2-flight-plan.html"
        title="Flight plan & publish interactive walkthrough"
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          display: 'block',
          background: 'transparent',
          overflow: 'hidden',
        }}
        loading="eager"
        scrolling="no"
        onLoad={() => {
          try {
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
              const wrap = (doc.querySelector('.ua-wrap') || doc.body) as HTMLElement;
              const h = wrap ? (wrap.offsetHeight || wrap.scrollHeight) : 0;
              if (h > 200) {
                setHeight(Math.ceil(h));
              }
            }
          } catch (err) {}
        }}
      />
    </div>
  );
}

const UNOOL_VIDEO_3_HTML_DOC = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unool · Automation section</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:transparent;overflow-x:hidden;padding:0;-webkit-font-smoothing:antialiased}
@media (min-width: 1px) {
  body:not(.embedded) {
    background: #FAF6EF;
  }
}
</style>
</head>
<body>
<!-- UNOOL · 03 AUTOMATE COMMENTS & DMs — copy from here to the end of the script block. -->
<style>
.ua{--bg:#F3EBDF;--bg2:#EEE4D5;--surface:#FAF6EF;--surface2:#F0E7DA;--line:rgba(70,45,30,.12);--line2:rgba(70,45,30,.22);
--text:#2A1E17;--muted:#7B6A5C;--dim:#A19080;--accent:#C2603E;--accent2:#A44A2B;--soft:rgba(194,96,62,.13);--good:#4F8A5B;--warn:#B9812A;--li:#0A66C2;
--serif:'Instrument Serif',Georgia,serif;--sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
position:relative;background:transparent;color:var(--text);font-family:var(--sans);padding:8px 8px 18px;overflow:hidden;isolation:isolate;-webkit-font-smoothing:antialiased}
.ua *,.ua *::before,.ua *::after{box-sizing:border-box}
.ua::before{display:none}
.ua-wrap{max-width:1120px;margin:0 auto}.ua button{font-family:inherit;color:inherit}
.ua-head{text-align:center;max-width:740px;margin:0 auto 48px}
.ua-eyebrow{display:inline-flex;gap:8px;padding:6px 14px;border-radius:99px;border:1px solid var(--line2);background:var(--soft);font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent2);font-weight:600}
.ua h2{font-weight:500;font-size:clamp(38px,6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:22px 0 18px}
.ua h2 em{font-family:var(--serif);font-weight:400;color:var(--accent)}
.ua-sub{color:var(--muted);font-size:clamp(16px,2vw,19px);line-height:1.6;margin:0 0 28px}
.ua-btn{display:inline-flex;padding:13px 22px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;background:var(--accent);color:#fff;box-shadow:0 10px 28px -10px var(--accent);transition:transform .15s,background .15s}
.ua-btn:hover{transform:translateY(-1px);background:var(--accent2)}
.ua-player{border-radius:22px;border:1px solid var(--line2);background:var(--surface);overflow:hidden;box-shadow:0 40px 90px -35px rgba(120,60,30,.4),0 0 0 6px rgba(70,45,30,.03)}
.ua-viewport{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:var(--bg2);cursor:default}
.ua-stage{position:absolute;left:0;top:0;width:960px;height:540px;transform-origin:0 0;font-size:15px}
.ua-chrome{position:absolute;inset:0 auto auto 0;width:960px;height:40px;background:var(--surface);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 16px;gap:8px}
.ua-chrome i{width:11px;height:11px;border-radius:50%;background:#D9CBB8}
.ua-url{margin-left:18px;flex:1;max-width:380px;height:24px;border-radius:7px;background:var(--bg2);color:var(--muted);font-size:12.5px;display:flex;align-items:center;padding:0 12px}
.ua-live{margin-left:auto;display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;letter-spacing:.08em;color:var(--good)}
.ua-live::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--good);animation:p 1.4s infinite}
@keyframes p{to{box-shadow:0 0 0 9px rgba(79,138,91,0)}}
.ua-body{position:absolute;left:0;top:40px;width:960px;height:500px;overflow:hidden;background:radial-gradient(70% 90% at 50% 0,rgba(194,96,62,.09),transparent),var(--bg2)}
.ua-cap{display:none !important}
.ua-cap .st{font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--accent2);background:var(--soft);padding:4px 9px;border-radius:6px;white-space:nowrap}
.ua-cap b{color:var(--text);font-weight:600;white-space:nowrap}
.sub{position:absolute;inset:0;opacity:0;visibility:hidden}
.ttl{position:absolute;left:0;right:0;top:24px;text-align:center;font-size:22px;font-weight:600;letter-spacing:-.01em}
.card{position:absolute;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 8px 22px -14px rgba(90,50,25,.28);overflow:hidden}
.lbl{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--dim);font-weight:700}
.pi{display:inline-flex;width:38px;height:38px;border-radius:11px;align-items:center;justify-content:center;flex:none;color:#fff;font-weight:700;font-size:15px}
.pi.ig{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='5.5'/%3E%3Ccircle cx='12' cy='12' r='4.2'/%3E%3Ccircle cx='17.4' cy='6.6' r='1.1' fill='%23fff' stroke='none'/%3E%3C/svg%3E") center/62% no-repeat,radial-gradient(circle at 30% 107%,#fdf497 0,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)}.pi.ig svg{display:none}.pi.li{background:#0A66C2;font:800 15px/1 Arial,Helvetica,sans-serif;letter-spacing:-.04em}.pi.li.sm{font-size:11px}.pi.brand{background:var(--accent);font-size:12px}
.pi.sm{width:22px;height:22px;border-radius:7px;font-size:11px}.pi svg{width:55%;height:55%}
.av{width:30px;height:30px;border-radius:50%;flex:none;color:#fff;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center}
.btn{position:absolute;height:42px;border-radius:11px;background:var(--accent);color:#fff;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px}
.btn.busy{background:var(--surface2);color:var(--muted)}.btn.ok{background:rgba(79,138,91,.14);color:var(--good)}
.btn.busy::before{content:"";width:14px;height:14px;border-radius:50%;border:2px solid var(--line2);border-top-color:var(--accent);animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.art{position:relative;overflow:hidden;background:radial-gradient(90% 70% at 50% 38%,#FBF4EA,#EADBC7 70%,#DCC8B0)}.art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.art svg{position:absolute;left:50%;top:50%;height:94%;width:auto;transform:translate(-50%,-50%)}
.art em{position:absolute;left:12px;bottom:8px;color:#fff;font:italic 20px var(--serif)}
.acct{width:380px;height:230px;padding:26px;top:80px}
.acct .t{display:flex;gap:14px;align-items:center}.acct b{display:block;font-size:19px}.acct small{color:var(--muted);font-size:13px}
.acct .s{margin-top:26px;font-size:14.5px}.acct .btn{left:20px;right:20px;bottom:20px}
.tbox{margin-top:10px;height:128px;border:1px solid var(--accent);box-shadow:0 0 0 3px var(--soft);border-radius:12px;padding:12px;font-size:14.5px;line-height:1.5;background:var(--bg);white-space:pre-wrap}
.tbox.c::after,.cur-t::after{content:"";display:inline-block;width:2px;height:1.05em;background:var(--accent);margin-left:2px;vertical-align:-2px;animation:bl 1s steps(1) infinite}
@keyframes bl{50%{opacity:0}}
.att{display:flex;gap:12px;align-items:center;margin-top:12px;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}
.att .art{width:46px;height:58px;border-radius:8px}.att b{font-size:13.5px}.att small{display:block;color:var(--dim);font-size:12px;margin-top:2px}
.pv{top:22px;height:408px;padding:14px}.pv .h{display:flex;gap:9px;align-items:center;margin-bottom:10px;font-weight:600;font-size:13.5px}
.pv .h small{display:block;color:var(--dim);font-weight:500;font-size:11.5px}.pv .art{border-radius:10px}
.pv p{margin:10px 0 0;font-size:13px;line-height:1.5;color:#4A3A2F}.pv .tag{position:absolute;left:14px;right:14px;bottom:14px;padding:8px 10px;border-radius:9px;background:var(--soft);color:var(--accent2);font-size:12px;font-weight:600}
.cal{position:absolute;left:16px;top:50px;width:608px;height:300px;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,100px)}
.dy{position:absolute;top:34px;font-size:11px;font-weight:700;letter-spacing:.09em;color:var(--dim);width:121.6px;padding-left:8px}
.sl{position:relative;border-top:1px solid var(--line);border-left:1px solid var(--line);padding:6px}
.sl em{position:absolute;right:8px;top:6px;font-style:normal;font-size:11.5px;color:var(--dim)}
.q{margin-top:22px;display:flex;gap:7px;align-items:center;padding:7px;border-radius:9px;background:var(--surface2);font-size:12px;font-weight:500;line-height:1.15}
.best{background:repeating-linear-gradient(135deg,rgba(194,96,62,.1) 0 8px,transparent 8px 16px);outline:1.5px dashed rgba(194,96,62,.6);outline-offset:-3px;border-radius:6px}
.bt{display:none}.best .bt{display:block;position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:11.5px;font-weight:700;color:var(--accent2)}
.chip{position:absolute;display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:#fff;border:1px solid rgba(194,96,62,.5);box-shadow:0 10px 24px -10px rgba(120,50,20,.5);font-size:12.5px;font-weight:600;line-height:1.2;width:150px}
.chip .art{width:30px;height:38px;border-radius:6px;flex:none}.chip small{display:block;color:var(--muted);font-weight:500;font-size:11px}
.tg2{position:absolute;display:flex;align-items:center;gap:10px;font-size:14px}
.sw{width:40px;height:22px;border-radius:99px;background:#D9CBB8;position:relative;flex:none}.sw::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.sw.on{background:var(--accent)}.sw.on::after{left:21px}
.bp{left:28px;top:24px;width:420px;height:404px;padding:22px}
.bar2{margin:20px 0 6px;height:34px;position:relative;border-top:2px dotted var(--line2);top:6px}
.bar2 span{position:absolute;top:-17px;font-size:24px;color:var(--accent)}
.rt{display:flex;justify-content:space-between;font:italic 34px var(--serif);margin-top:18px}
.rt small{display:block;font:600 10.5px var(--sans);letter-spacing:.1em;color:var(--dim);font-style:normal}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:18px}.grid3 b{display:block;font-size:14px;margin-top:4px}
.stub{position:absolute;left:0;right:0;bottom:0;height:78px;border-top:2px dashed var(--line2);background:var(--surface2);display:flex;align-items:center;gap:16px;padding:0 22px;font-size:12.5px;color:var(--muted)}
.stub i{flex:1;height:36px;background:repeating-linear-gradient(90deg,var(--text) 0 2px,transparent 2px 5px,var(--text) 5px 6px,transparent 6px 10px);opacity:.7;border-radius:3px}
.stp{display:flex;gap:14px;align-items:center;padding:12px 4px;border-bottom:1px solid var(--line)}.stp b{display:block;font-size:14.5px}.stp small{color:var(--dim);font-size:12.5px}
.dot{width:24px;height:24px;border-radius:50%;border:2px solid var(--line2);flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px}
.stp.a .dot{border-color:var(--accent);border-top-color:transparent;animation:sp .7s linear infinite}.stp.d .dot{background:var(--good);border-color:var(--good)}
.stp.p{opacity:.5}
.live2{display:flex;gap:10px;margin-top:14px}.live2 div{flex:1;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(79,138,91,.12);color:var(--good);font-weight:600;font-size:13.5px}
.pill{display:flex;align-items:center;gap:6px;padding:7px 4px;border-radius:9px;font-size:12.5px;font-weight:600;color:var(--muted);justify-content:center;flex:1}.pill.on{background:var(--accent);color:#fff}
.thr{position:absolute;left:14px;right:14px;top:62px;bottom:10px;overflow:hidden;font-size:13.5px}
.m,.rp{display:flex;gap:9px;margin-top:11px}.bb{padding:9px 12px;border-radius:13px;background:var(--bg);border:1px solid var(--line);max-width:285px;line-height:1.4}
.bb b{font-size:12.5px;display:block;margin-bottom:2px}.bb p{margin:0}.bb small{display:block;font-size:11px;font-weight:700;color:var(--accent2);margin-bottom:2px}
.bb.hid{opacity:.4;text-decoration:line-through}.rp{margin-left:34px}.rp .bb{background:#F4E2D8;border-color:rgba(194,96,62,.35)}
.dm .rp{margin-left:auto;flex-direction:row-reverse}.dm .m{margin-right:34px}
.tg{margin:7px 0 0 39px;font-size:12px;font-weight:600;color:var(--dim)}.tg.bad{color:#B0453A}.tg.hold{color:var(--warn)}
.rd{position:absolute;left:16px;right:16px;top:36px}.rd small{display:block;margin-top:14px}.rd b{display:block;font-size:15px;margin-top:3px}
.kp{position:absolute;bottom:16px;width:68px;padding:10px 8px;border-radius:12px;background:var(--surface2);border:1px solid var(--line);font-size:11px;color:var(--muted);line-height:1.25}.kp b{display:block;font-size:24px;color:var(--text)}
.cur{position:absolute;left:0;top:0;width:22px;height:22px;pointer-events:none;z-index:9;opacity:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
.ua-ctrl{display:flex;align-items:center;gap:14px;padding:12px 18px;border-top:1px solid var(--line);background:var(--surface)}
.ua-pb{width:36px;height:36px;border-radius:50%;border:1px solid var(--line2);background:var(--surface2);cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}
.ua-pb svg{width:14px;height:14px;fill:var(--text)}
.ua-bar{position:relative;flex:1;height:6px;border-radius:99px;background:var(--surface2);border:1px solid var(--line);cursor:pointer;touch-action:none}.ua-bar::before{content:"";position:absolute;inset:-10px 0}
.ua-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,var(--accent2),var(--accent))}
.ua-bar b{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;border:2px solid var(--accent);box-shadow:0 2px 6px rgba(90,40,20,.3)}
.ua-time{font-size:12.5px;color:var(--muted);font-variant-numeric:tabular-nums;min-width:84px;text-align:right}
.ua-chapters{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.ch{position:relative;text-align:left;padding:16px 18px 20px;border-radius:16px;border:1px solid var(--line);background:var(--surface);cursor:pointer;overflow:hidden;transition:border-color .2s,background .2s,transform .2s}
.ch:hover{border-color:var(--line2);transform:translateY(-2px)}.ch.on{border-color:rgba(194,96,62,.6);background:#fff}
.ch small{display:block;font-size:11px;letter-spacing:.1em;color:var(--dim);font-weight:700}.ch.on small{color:var(--accent2)}
.ch b{display:block;font-size:17px;margin-top:6px;font-weight:600}.ch span{display:block;margin-top:4px;font-size:13.5px;color:var(--muted);line-height:1.4}
.ch i{position:absolute;left:0;bottom:0;height:3px;background:var(--accent);width:0}
.ua-note{margin-top:14px;text-align:center;font-size:12.5px;color:var(--dim)}

.ua-url{max-width:250px}.nv{display:flex;gap:4px;margin-left:12px}.nv span{padding:5px 11px;border-radius:8px;font-size:12px;font-weight:600;color:var(--muted)}.nv span.on{background:var(--soft);color:var(--accent2)}
.vid{margin-top:0}
.vh{display:flex;align-items:flex-end;gap:20px;margin-bottom:20px;flex-wrap:wrap}
.vn{font:italic 72px/.85 var(--serif);color:var(--accent)}
.vt h3{margin:0;font-size:clamp(24px,3vw,34px);font-weight:600;letter-spacing:-.02em}.vt p{margin:8px 0 0;color:var(--muted);font-size:15.5px;max-width:540px;line-height:1.5}
.vc{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}.vc span{padding:6px 12px;border-radius:99px;border:1px solid var(--line2);background:var(--surface);font-size:12.5px;font-weight:600;color:var(--muted)}
.end{display:none !important}
.end b{display:block;font:italic clamp(24px,4.4vw,44px) var(--serif);margin-bottom:18px}
.eb{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.eb button{padding:11px 20px;border-radius:12px;border:1px solid var(--line2);background:var(--surface);font-weight:600;font-size:14px;cursor:pointer}.eb .pri{background:var(--accent);border-color:var(--accent);color:#fff}
.card{box-shadow:0 1px 0 rgba(255,255,255,.8) inset,0 14px 30px -18px rgba(90,50,25,.38)}

.ic{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.bav{width:32px;height:32px;border-radius:50%;flex:none;background:var(--accent);color:#fff;font:italic 19px/1 var(--serif);display:flex;align-items:center;justify-content:center}
.bav.ring{border:2px solid transparent;box-shadow:inset 0 0 0 2px #fff;background:linear-gradient(var(--accent),var(--accent)) padding-box,linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5) border-box}
.bav.sq{border-radius:5px}
.pv.ig,.pv.li{padding:0;background:#fff;border-color:#dbdbdb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#262626}
.pv .ph0{display:flex;align-items:center;gap:9px;padding:10px 12px;font-size:13px}.pv .ph0 b{display:block;font-size:13px}.pv .ph0 small{display:block;color:#8e8e8e;font-size:11.5px;font-weight:400;line-height:1.3}.pv .ph0 .dots{margin-left:auto;color:#262626;letter-spacing:1px;font-size:12px}
.pv .art{border-radius:0}.pv .acts{display:flex;gap:13px;padding:9px 12px 4px}.pv .acts .ic{width:22px;height:22px}
.pv .pt{padding:0 12px;font-size:12.5px;line-height:1.35}.pv .pt b{font-weight:600}.pv .pt p{margin:3px 0 4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pv .pt small{color:#8e8e8e}.pv .tl{color:#00376b}
.pv.li{border-color:#e0dfdc;color:rgba(0,0,0,.9)}.pv .lt{margin:0;padding:0 12px 8px;font-size:12.5px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.pv .rx2{display:flex;justify-content:space-between;padding:7px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #e0dfdc}
.pv .acts2{display:flex;padding:4px 4px}.pv .acts2 span{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10.5px;font-weight:600;color:#666;padding:3px 0}
.pv .tag{left:10px;right:10px;bottom:10px;padding:6px 10px;font-size:11.5px;border-radius:8px}
.thr{left:0;right:0;top:57px;bottom:0;padding:0 14px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#262626}
.thr .ph{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:0 -14px;border-bottom:1px solid #efefef}.thr .ph.c{justify-content:center}.thr .ph b{font-size:14px;display:block}.thr .ph small{display:block;color:#8e8e8e;font-size:11.5px;font-weight:400}.thr .ph .ml{margin-left:auto;font-size:12px;color:#666}.thr .ph .bk{font-size:24px;line-height:1;color:#262626}
.thr .r{display:flex;gap:10px;margin-top:11px;align-items:flex-start}.thr .rin{margin-left:42px}
.thr .rx{flex:1;line-height:1.35}.thr .rx p{margin:0}.thr .rx small{display:block;color:#8e8e8e;font-size:11.5px;margin-top:3px}.thr .hr{color:#8e8e8e;font-size:15px}
.thr .r.hid{opacity:.38}.thr .cap{padding-bottom:11px;border-bottom:1px solid #efefef}
.thr .lb{background:#f2f2f2;border-radius:0 10px 10px 10px;padding:8px 11px;max-width:292px;line-height:1.35;flex:1}.thr .lb b{font-size:12.5px}.thr .lb em{color:#666;font-style:normal;font-size:11.5px}.thr .lb .hl{display:block;color:#666;font-size:11.5px}.thr .lb p{margin:5px 0 0;font-size:13px}
.thr .au{background:#e0e0e0;color:#555;font-style:normal;font-size:10px;padding:1px 5px;border-radius:4px;font-weight:600;margin-left:4px}
.thr .la{margin:3px 0 0 42px;font-size:12px;color:#666;font-weight:600}.thr .rin+.la{margin-left:84px}
.thr .dr{align-items:flex-end}.thr .db{padding:9px 14px;border-radius:20px;max-width:250px;line-height:1.35}.thr .db.in{background:#efefef}.thr .db.out{background:#3797f0;color:#fff}.thr .dr.rg{justify-content:flex-end}.thr .la.rg{text-align:right;margin-right:2px}
.thr .lm b{font-size:13px}.thr .lm em{color:#666;font-style:normal;font-size:11.5px;margin-left:6px}.thr .lbub{margin-top:3px;background:#f3f2ef;border-radius:0 12px 12px 12px;padding:8px 12px;max-width:270px;line-height:1.4}.thr .lbub.me{background:#e8f3fe}
.thr .ub{display:inline-block;margin-top:4px;font-size:10.5px;font-weight:700;color:var(--accent2);background:var(--soft);padding:2px 8px;border-radius:99px}
.thr .tg{margin:6px 0 0 42px;font-size:11.5px;font-weight:600;color:#8e8e8e}.thr .tg.bad{color:#C0392B}.thr .tg.hold{color:#B9812A;background:#FFF6E0;display:inline-block;padding:4px 9px;border-radius:8px}

/* ===== Video 3 · native Instagram / LinkedIn UI ===== */
.thr{display:flex;flex-direction:column;padding:0}
.nh{flex:none;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #efefef;min-height:48px}
.nh.c{justify-content:center;position:relative}.nh.c .ic{position:absolute;right:14px}
.nh b{font-size:14px;display:block}.nh small{display:block;color:#8e8e8e;font-size:11.5px;font-weight:400}.nh>.ic{margin-left:auto;width:20px;height:20px}.nh>.ic+.ic{margin-left:12px}.nh .bk{font-size:26px;line-height:1}
.nh .lin{flex:1;border:1px solid #c8c8c8;border-radius:20px;padding:8px 14px;color:#666;font-weight:400;font-size:12.5px}
.srt{flex:none;padding:8px 14px 0;font-size:12px;font-weight:600;color:#666}
.nb{flex:1;overflow:hidden;padding:0 14px 8px}.ni{will-change:transform}
.thr .ds{text-align:center;color:#8e8e8e;font-size:11px;margin-top:10px}
.nf{flex:none;display:flex;align-items:center;gap:10px;padding:9px 14px;border-top:1px solid #efefef;font-size:13px;color:#8e8e8e}
.nf .in{flex:1}.nf .po{color:#0095f6;font-weight:600}.nf.dm .in{border:1px solid #dbdbdb;border-radius:22px;padding:8px 14px}
.nf.lm{display:block}.nf.lm .in{background:#f3f2ef;border-radius:6px;padding:8px 12px;min-height:42px}.nf.lm .sd{display:flex;justify-content:flex-end;margin-top:8px}.nf.lm .sd span{background:#e8e8e8;color:#999;font-weight:600;padding:4px 14px;border-radius:99px;font-size:12px}
.lp{position:absolute;left:0;top:0;right:0;height:370px;overflow:hidden;background:#fff;color:#262626;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12.5px}
.np .ph0{display:flex;align-items:center;gap:9px;padding:10px 12px;font-size:13px}.np .ph0 small{display:block;color:#8e8e8e;font-size:11px;line-height:1.3}.np .dots{margin-left:auto}.np .fo{margin-left:auto;color:#0a66c2;font-weight:600}
.np .art{border-radius:0}.np .acts{display:flex;gap:13px;padding:9px 12px 4px}.np .acts .ic{width:22px;height:22px}
.np .pt{padding:0 12px;line-height:1.35}.np .pt p{margin:3px 0 4px}.np .pt small{display:block;color:#8e8e8e;font-size:12px}.np .pt .up{font-size:10px;margin-top:3px}
.np .lt{margin:0;padding:0 12px 8px;line-height:1.4}
.np .rx2{display:flex;justify-content:space-between;padding:7px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #e0dfdc}
.np .acts2{display:flex;padding:4px}.np .acts2 span{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10.5px;font-weight:600;color:#666;padding:3px 0}
.lh{display:flex;justify-content:space-between;align-items:center;padding:14px 14px 10px;font-size:15px;font-weight:700}.lh span{font-size:12.5px;font-weight:600;color:#8e8e8e}
.rw{display:flex;gap:11px;align-items:center;padding:8px 14px}.rw.on{background:#efefef}.rw b{font-size:13px;display:block}.rw small{color:#8e8e8e;font-size:12px}

/* ===== UX layer ===== */
.ua::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(460px 460px at var(--mx,50%) var(--my,25%),rgba(194,96,62,.14),transparent 70%)}
.ua h2 em{background:linear-gradient(100deg,var(--accent) 35%,#EBA77F 50%,var(--accent) 65%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sh 6s linear infinite}@keyframes sh{to{background-position:-250% 0}}
.vid{opacity:0;transform:translateY(32px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}.vid.in{opacity:1;transform:none}
.ua-player{transition:box-shadow .5s}.ua-player:hover{box-shadow:0 50px 100px -30px rgba(194,96,62,.5),0 0 0 6px rgba(194,96,62,.08)}
.ua-bar u{position:absolute;top:-4px;width:2px;height:12px;margin-left:-1px;background:var(--line2);border-radius:2px;pointer-events:none}
.try{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:14px 18px;border-top:1px solid var(--line);background:linear-gradient(90deg,var(--soft),transparent)}
.try b{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent2)}.try span{font-size:13px;color:var(--muted);margin-right:4px}
.try button{padding:8px 14px;border-radius:99px;border:1px solid var(--line2);background:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:transform .15s,background .15s,color .15s}.try button:hover{transform:translateY(-2px);background:var(--accent);color:#fff;border-color:var(--accent)}
.try .x{display:none !important}
.nf input.in{font:inherit;color:#262626;background:#fff;outline:0;min-width:0}.nf .po{cursor:pointer}
@media(max-width:700px){.ua{padding:32px 12px 36px}.ua-chapters{grid-template-columns:1fr}}
</style>

<section class="ua" id="unool-automation" aria-label="Automate comments and DMs">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="ud-s" x1="0" x2="1"><stop offset="0" stop-color="#7C3321"/><stop offset=".26" stop-color="#C4653F"/><stop offset=".5" stop-color="#DE8F66"/><stop offset=".74" stop-color="#B85A38"/><stop offset="1" stop-color="#712C1B"/></linearGradient>
<linearGradient id="ud-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D67B53"/><stop offset=".55" stop-color="#BC5D3A"/><stop offset="1" stop-color="#8A3822"/></linearGradient>
<linearGradient id="ud-t" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E08A62"/><stop offset=".6" stop-color="#C46440"/><stop offset="1" stop-color="#9A4429"/></linearGradient>
<linearGradient id="ud-w" x1="0" x2="1"><stop offset="0" stop-color="#8E3A24"/><stop offset=".5" stop-color="#C46440"/><stop offset="1" stop-color="#8E3A24"/></linearGradient>
<radialGradient id="ud-f"><stop offset="0" stop-color="#3A190C" stop-opacity=".4"/><stop offset="1" stop-color="#3A190C" stop-opacity="0"/></radialGradient>
<filter id="ud-lin" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".9 .05" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .25 0 0 0 0 .1 0 0 0 0 .05 0 0 0 .55 -.14"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="ud-bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.8"/></filter>
<clipPath id="ud-skc"><path d="M78 126C70 170 46 232 29 282C50 293 76 289 100 293C124 289 150 293 171 282C154 232 130 170 122 126Z"/></clipPath><symbol id="ua-dress" viewBox="0 0 200 300">
<ellipse cx="100" cy="290" rx="78" ry="8" fill="url(#ud-f)"/>
<g id="ud-all">
<path d="M72 38C60 40 46 50 33 78C46 86 61 82 71 71L75 52Z" fill="url(#ud-b)"/>
<path d="M128 38C140 40 154 50 167 78C154 86 139 82 129 71L125 52Z" fill="url(#ud-t)"/>
<path d="M78 126C70 170 46 232 29 282C50 293 76 289 100 293C124 289 150 293 171 282C154 232 130 170 122 126Z" fill="url(#ud-s)"/>
<path d="M96 132C92 190 80 240 70 291L100 293C124 289 150 293 171 282C154 232 130 170 122 126Z" fill="#F5C09A" opacity=".1"/>
<g clip-path="url(#ud-skc)"><path d="M86 131C80 190 62 240 44 285M106 134C107 190 104 240 100 291M117 132C124 190 142 240 158 284M132 150C142 200 150 245 164 281M66 196C58 226 48 252 38 280" fill="none" stroke="#45190B" stroke-opacity=".3" stroke-width="5" filter="url(#ud-bl)"/>
<path d="M95 134C92 190 88 240 80 291M112 134C115 190 120 240 126 291M146 190C152 224 160 252 166 280M58 206C54 232 48 256 42 280" fill="none" stroke="#F8C7A2" stroke-opacity=".34" stroke-width="4" filter="url(#ud-bl)"/>
</g><path d="M96 132C92 190 80 240 70 291" fill="none" stroke="#3E1708" stroke-opacity=".38" stroke-width="2.2"/>
<path d="M98 132C94 190 82 240 73 291" fill="none" stroke="#F4B890" stroke-opacity=".5" stroke-width="1.2"/>
<path d="M29 282C50 293 76 289 100 293C124 289 150 293 171 282" fill="none" stroke="#F2B58E" stroke-opacity=".55" stroke-width="1.4"/>
<path d="M92 34L101 78L88 128L78 128C74 104 70 70 72 38C80 33 86 32 92 34Z" fill="url(#ud-b)"/>
<path d="M92 34C98 27 108 27 114 33L101 78Z" fill="#5E2415"/>
<path d="M92 34L101 78L110 90L122 128L88 128Z" fill="#B3563A"/>
<path d="M128 38C124 34 119 32 114 33L101 78L88 128L122 128C126 104 130 70 128 38Z" fill="url(#ud-t)"/>
<path d="M114 33L101 78L88 128" fill="none" stroke="#3E1708" stroke-opacity=".3" stroke-width="3" filter="url(#ud-bl)"/>
<path d="M114 33C108 56 104 66 101 78C96 96 92 112 88 128" fill="none" stroke="#F6BC96" stroke-opacity=".6" stroke-width="1.3"/>
<path d="M92 34L101 78M92 34C98 27 108 27 114 33" fill="none" stroke="#E9A57F" stroke-opacity=".55" stroke-width="1.2"/>
<path d="M122 124C112 116 104 108 98 98M80 124C86 114 90 106 94 100" fill="none" stroke="#45190B" stroke-opacity=".3" stroke-width="3" filter="url(#ud-bl)"/>
<path d="M77 123C92 128 108 128 123 123L124 134C108 139 92 139 76 134Z" fill="url(#ud-w)"/>
<path d="M77 124C92 129 108 129 123 124" fill="none" stroke="#F5BE98" stroke-opacity=".5" stroke-width="1"/>
<path d="M86 134C80 156 74 172 66 192L77 195C85 176 91 156 93 136Z" fill="url(#ud-b)" stroke="#6A2815" stroke-opacity=".35" stroke-width=".8"/>
<path d="M88 134C95 158 100 176 102 198L113 194C108 174 101 154 95 135Z" fill="url(#ud-t)" stroke="#6A2815" stroke-opacity=".35" stroke-width=".8"/>
<path d="M88 131C72 114 61 128 75 137Z" fill="url(#ud-t)" stroke="#6A2815" stroke-opacity=".4" stroke-width=".8"/>
<path d="M88 131C104 114 115 128 101 137Z" fill="url(#ud-b)" stroke="#6A2815" stroke-opacity=".4" stroke-width=".8"/>
<ellipse cx="88" cy="132" rx="5.5" ry="6" fill="#A44A2B" stroke="#5B2312" stroke-opacity=".4" stroke-width=".8"/>
</g>
<use href="#ud-all" filter="url(#ud-lin)"/>
</symbol><symbol id="ic-heart" viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.3-9C1.1 8.7 3 5 6.5 5c2 0 3.5 1.2 5.5 3.3C14 6.200 15.500 5 17.500 5 21 5 22.900 8.700 21.300 12 19 16.400 12 21 12 21z"/></symbol><symbol id="ic-cmt" viewBox="0 0 24 24"><path d="M21 11.500a8.400 8.400 0 0 1-9 8.400 8.600 8.600 0 0 1-3.800-.9L3 21l2-5.200A8.400 8.400 0 1 1 21 11.500z"/></symbol><symbol id="ic-send" viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></symbol><symbol id="ic-bm" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></symbol><symbol id="ic-like" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.300a2 2 0 0 0 2-1.700l1.400-9a2 2 0 0 0-2-2.300zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></symbol><symbol id="ic-cm2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></symbol><symbol id="ic-rep" viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></symbol></defs></svg>
<div class="ua-wrap">
  <template id="ua-tpl"><div class="ua-player">
    <div class="ua-viewport" data-k="viewport" role="img" aria-label="Video 3: Unool automatically replies to comments and DMs on Instagram and LinkedIn about the dress post">
      <div class="ua-stage" data-k="stage">
        <div class="ua-chrome"><span class="nv"><span>Compose</span><span>Flight plan</span><span>Inbox</span></span><span class="ua-live">LIVE DEMO</span></div>
        <div class="ua-body">
          <!-- PART 3 · automation -->
          <div class="sub" data-k="c1">
            <div class="card" style="left:24px;top:20px;width:270px;height:460px;padding:0">
              <div class="lp np" data-k="lp" style="height:370px"></div><div style="position:absolute;left:0;right:0;top:370px;border-top:1px solid var(--line)"></div>
              <div class="tg2" style="left:16px;bottom:54px"><span class="sw" data-k="t1"></span>Auto-reply · comments</div>
              <div class="tg2" style="left:16px;bottom:16px"><span class="sw" data-k="t2"></span>Auto-reply · DMs</div>
            </div>
            <div class="card" style="left:306px;top:20px;width:366px;height:460px">
              <div data-k="tabs" style="display:flex;gap:6px;padding:12px 14px;border-bottom:1px solid var(--line)"></div>
              <div class="thr" data-k="thr"></div>
            </div>
            <div class="card" style="left:686px;top:20px;width:250px;height:460px">
              <div class="rd" style="top:20px"><div class="lbl">Unool · reading</div><div data-k="rd"></div></div>
              <div class="kp" style="left:12px;bottom:18px"><b data-k="k1">0</b>Replies sent</div><div class="kp" style="left:89px;bottom:18px"><b data-k="k2">0</b>Spam hidden</div><div class="kp" style="left:166px;bottom:18px"><b data-k="k3">0</b>Leads saved</div>
            </div>
          </div>
        </div>
        <svg class="cur" data-k="cur" viewBox="0 0 22 22"><path d="M3 2l14 8-6.2 1.6L8 18z" fill="#2A1E17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </div>
    </div>
    <div class="try" data-k="try"></div>
  </div>
  </template><div id="ua-vids"></div>
</div>
</section>

<script>
(function(){
'use strict';
var DRESS_PHOTO='/linen-wrap-dress.jpg'; /* optional: put a real product photo URL here and the dress illustration becomes that photo */
var clamp=function(v,a,b){a=a==null?0:a;b=b==null?1:b;return Math.min(b,Math.max(a,v))},prog=function(t,a,b){return clamp((t-a)/(b-a))},sm=function(x){return x*x*(3-2*x)};
var IG='<span class="pi sm ig"></span>',LI='<span class="pi sm li">in</span>';
var CAPS=[[32,'STEP 5','Automate','Comments on Instagram are read, answered and spam is hidden.'],[44.5,'STEP 6','LinkedIn comments','Professional questions get on-brand answers.'],[54.5,'STEP 7','Smart DMs','Asks if they follow, shares the code and keeps answering.'],[74,'STEP 8','Your approval','Sensitive leads wait for you before anything is sent.']];
function make(host,cfg){
var root=host,cache={},T0=cfg.t0,DUR=cfg.dur;
var $=function(k){return cache[k]||(cache[k]=root.querySelector('[data-k="'+k+'"]'))};
var viewport=$('viewport'),stage=$('stage'),nvEls=[].slice.call(root.querySelectorAll('.nv span'));
function fit(){stage.style.transform='scale('+viewport.clientWidth/960+')'}
if(window.ResizeObserver)new ResizeObserver(fit).observe(viewport);else addEventListener('resize',fit);fit();

var TABS=[[IG,'Comments'],[LI,'Comments'],[IG,'DMs'],[LI,'DMs']];
$('tabs').innerHTML=TABS.map(function(t){return '<span class="pill">'+t[0]+t[1]+'</span>'}).join('');
var tabEls=[].slice.call(root.querySelectorAll('.pill'));
/* ---- script for part 3 ---- */
var PH=[
 {a:34,b:44.5,it:[{n:'@maya.kapoor',c:'#C2603E',pk:'i',x:'Love this colour 😍 Is it available in M?',t:34.6,tp:35.3,te:36.8,rep:'Thank you, Maya! 💛 Yes, M is in stock — I’ve sent the size guide to your DMs.',i:'Size question',r:'Keywords: size, available',a:'Reply + send DM'},
  {n:'@cheap.followers.24',c:'#9A8878',pk:'i',x:'Get 10K followers now 🚀 click my bio',t:37.4,sp:38.4,i:'Spam · 98%',r:'Spam filter',a:'Hide comment'},
  {n:'@karan.dev',c:'#3E6C94',pk:'i',x:'What’s the price? Do you deliver to Delhi? 🙏',t:40,tp:40.7,te:42.4,rep:'Hi Karan! It’s ₹3,499 and we deliver to Delhi in 2–3 days 🚚 Free shipping above ₹2,000.',i:'Price + delivery question',r:'FAQ match · 97%',a:'Reply with answer'}]},
 {a:44.5,b:54.5,it:[{n:'Priya Menon · Founder, Loom & Co',c:'#3E6C94',pk:'l',x:'Beautiful work! Is the linen sourced sustainably?',t:45.1,tp:45.9,te:47.9,rep:'Thank you, Priya! The linen is OEKO-TEX certified and woven by artisan partners in India 🌿',i:'Product question',r:'FAQ match · 96%',a:'Reply with answer'},
  {n:'Arjun Nair · Buyer, Tulsi Boutique',c:'#4F8A5B',pk:'l',x:'Lovely piece. Do you ship internationally?',t:49.2,tp:50,te:52,rep:'Thank you, Arjun! Yes — we ship worldwide, and delivery takes 7–10 days 🌍',i:'Shipping question',r:'FAQ match · 95%',a:'Reply with answer'}]},
 {a:54.5,b:74,it:[{n:'aanya.s',c:'#4F8A5B',x:'Hi! Does the wrap dress come in M? 👋',t:55,tp:55.6,te:57.4,rep:'Hi Aanya! Yes — M is in stock 🎉 Quick check: are you following @saanvi.studio? Followers get 10% off 🧡',i:'Stock question',r:'Keywords: size, stock',a:'Reply + ask if following'},
  {n:'aanya.s',c:'#4F8A5B',x:'Yes, I follow you 🙌',t:58.6,tp:59.1,te:60.7,rep:'Amazing, thank you! 💛 Your code is SAANVI10 — apply it at checkout.',i:'Follower confirmed',r:'Follow check · passed',a:'Share 10% code'},
  {n:'aanya.s',c:'#4F8A5B',x:'How long does delivery to Hyderabad take?',t:62,tp:62.6,te:64.4,rep:'Delivery to Hyderabad takes 3–4 days, and shipping is free above ₹2,000 🚚',i:'Delivery question',r:'FAQ match · 97%',a:'Auto-reply'},
  {n:'aanya.s',c:'#4F8A5B',x:'Can I return it if the size is off?',t:65.6,tp:66.2,te:68.2,rep:'Of course! Free 7-day returns and exchanges. Want me to hold an M for you?',i:'Returns question',r:'FAQ match · 95%',a:'Auto-reply'},
  {n:'aanya.s',c:'#4F8A5B',x:'Yes please, hold one 🙏',t:69.6,tp:70.1,te:71.6,rep:'Done! What’s your email for the checkout link?',i:'Buying intent · lead',r:'Lead capture',a:'Reply + save lead',lead:1}]},
 {a:74,b:85,it:[{n:'Rohan Mehta',c:'#B9812A',x:'We run a boutique in Pune — can we stock your dresses wholesale?',t:74.5,ha:75.4,hb:76.8,tp:76.9,te:78.6,rep:'Thanks for reaching out, Rohan! Sharing our wholesale catalogue now — what’s the best email?',i:'Wholesale · sensitive',r:'Approval required',a:'Hold → you approve',lead:1},
  {n:'Rohan Mehta',c:'#B9812A',x:'Is there a minimum order?',t:80.4,tp:81,te:82.8,rep:'Our wholesale minimum is 12 pieces, mixed sizes allowed. Catalogue is on its way 📩',i:'Wholesale question',r:'FAQ match · 94%',a:'Auto-reply'}]}];
var ALL=[];PH.forEach(function(p){p.it.forEach(function(i){ALL.push(i)})});
function typh(s,p){var a=Array.from(s),n=Math.round(a.length*clamp(p));return a.slice(0,n).join('')+'<span style="visibility:hidden">'+a.slice(n).join('')+'</span>'}
function typ(s,p){var a=Array.from(s);return a.slice(0,Math.round(a.length*p)).join('')}
var K=['igc','lic','igd','lid'];
function nm(it){return it.n.replace(/^@/,'').split(' · ')[0]}
function hlt(it){return it.n.split(' · ').slice(1).join(' · ')}
function ub(d,it){return '<span class="ub">✦ '+(d?'Unool is typing…':it.hb?'Approved by you · sent by Unool':'Auto-reply by Unool')+'</span>'}
var ico=function(p){return '<svg class="ic" viewBox="0 0 24 24">'+p+'</svg>'},INF=ico('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),VID=ico('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/>'),SND=ico('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>'),use=function(i){return '<svg class="ic"><use href="#'+i+'"/></svg>'};
function art(h){return '<div class="art" style="height:'+h+'px">'+(DRESS_PHOTO?'<img alt="Linen Wrap Dress" src="'+DRESS_PHOTO+'">':'<svg viewBox="0 0 200 300"><use href="#ua-dress"/></svg>')+'</div>'}
function left(k,lk,cm){var ig=k[0]=='i';
 if(k[2]=='d'){var R=ig?[['aanya.s','Hi! Does the wrap dress come in M? 👋 · now','#4F8A5B'],['nisha.r','Sent a reel · 2h','#8A6BBE'],['the.loomco','Thanks so much! · 1d','#3E6C94'],['kavya.m','😍 · 3d','#B9812A']]:[['Rohan Mehta','We run a boutique in Pune… · now','#B9812A'],['Priya Menon','Thank you for the reply · 1d','#3E6C94'],['Ishaan Rao','Sounds great, let’s connect · 3d','#4F8A5B'],['Meera Shah','Congrats on the launch! · 1w','#8A6BBE']];
  return '<div class="lh"><b>'+(ig?'saanvi.studio ⌄':'Messaging')+'</b><span>'+(ig?'Messages':'Focused ⌄')+'</span></div>'+R.map(function(r,i){return '<div class="rw'+(i?'':' on')+'"><span class="av" style="background:'+r[2]+';width:40px;height:40px;font-size:15px">'+r[0].charAt(0).toUpperCase()+'</span><div><b>'+r[0]+'</b><small>'+r[1]+'</small></div></div>'}).join('')}
 if(ig)return '<div class="ph0"><span class="bav ring">S</span><b>saanvi.studio</b><span class="dots">•••</span></div>'+art(150)+'<div class="acts">'+use('ic-heart')+use('ic-cmt')+use('ic-send')+'<span style="margin-left:auto">'+use('ic-bm')+'</span></div><div class="pt"><b><span class="vl"></span> likes</b><p><b>saanvi.studio</b> Meet the Linen Wrap Dress 🌿✨ Hand-woven terracotta, made for warm days.</p><small>View all <span class="vm"></span> comments</small><small class="up">2 HOURS AGO</small></div>';
 return '<div class="ph0"><span class="bav sq" style="width:38px;height:38px">S</span><div><b>Saanvi Studio</b><small>1,248 followers</small><small>2h · 🌐</small></div><span class="fo">+ Follow</span></div><p class="lt">Introducing the Linen Wrap Dress. Woven by artisan partners for warm days. Sizes XS–XL.</p>'+art(104)+'<div class="rx2"><span>👍❤️ <span class="vr"></span></span><span><span class="vm"></span> comments · 2 reposts</span></div><div class="acts2"><span>'+use('ic-like')+'Like</span><span>'+use('ic-cm2')+'Comment</span><span>'+use('ic-rep')+'Repost</span><span>'+use('ic-send')+'Send</span></div>'}
function hdr(k){var av=function(c,l){return '<span class="av" style="background:'+c+'">'+l+'</span>'};
 return k=='igc'?'<div class="nh c"><b>Comments</b>'+SND+'</div>'
 :k=='lic'?'<div class="nh"><span class="bav sq" style="width:32px;height:32px;font-size:18px">S</span><div class="lin">Add a comment…</div></div><div class="srt">Most relevant ▾</div>'
 :k=='igd'?'<div class="nh"><span class="bk">‹</span>'+av('#4F8A5B','A')+'<div><b>aanya.s</b><small>Active now</small></div>'+VID+INF+'</div>'
 :'<div class="nh">'+av('#B9812A','R')+'<div><b>Rohan Mehta</b><small>Boutique owner · Pune</small></div><span style="margin-left:auto">•••</span></div>'}
function cap(k){return k=='igc'?'<div class="r cap" style="padding-top:2px"><span class="bav ring">S</span><div class="rx"><p><b>saanvi.studio</b> Meet the Linen Wrap Dress 🌿✨ Hand-woven terracotta, made for warm days.</p><small>2h</small></div></div>':k=='igd'?'<div class="ds">Today 9:52 AM</div>':k=='lid'?'<div class="ds">TODAY</div>':''}
function ftr(k){return k=='igc'?'<div class="nf"><span class="bav ring" style="width:28px;height:28px;font-size:16px">S</span><span class="in">Add a comment…</span><span class="po">Post</span></div>':k=='igd'?'<div class="nf dm"><span class="in">Message…</span><span>🎙</span><span>🖼</span><span>♡</span></div>':k=='lid'?'<div class="nf lm"><div class="in">Write a message…</div><div class="sd"><span>Send</span></div></div>':''}
function item(it,t,k){
 var hid=it.sp&&t>=it.sp,n=nm(it),c='<span class="av" style="background:'+it.c+'">'+n.charAt(0).toUpperCase()+'</span>',h,r='',tg='',d=t<it.te;
 if(k=='igc')h='<div class="r'+(hid?' hid':'')+'">'+c+'<div class="rx"><p><b>'+n+'</b> '+it.x+'</p><small>2m &nbsp; Reply</small></div><span class="hr">♡</span></div>';
 else if(k=='lic')h='<div class="r">'+c+'<div class="lb"><b>'+n+'</b> <em>· 1st</em><span class="hl">'+hlt(it)+'</span><p>'+it.x+'</p></div></div><div class="la">Like &nbsp;|&nbsp; Reply</div>';
 else if(k=='igd')h='<div class="r dr">'+c+'<div class="db in">'+it.x+'</div></div>';
 else h='<div class="r lm">'+c+'<div><b>'+n+'</b><em>9:52 AM</em><div class="lbub">'+it.x+'</div></div></div>';
 if(hid)return h+'<div class="tg bad">⌫ Hidden by Unool · spam</div>';
 if(!it.rep)return h;
 if(it.ha&&t>=it.ha&&t<it.hb)return h+'<div class="tg hold">⏸ Held for your approval — sensitive lead</div>';
 if(t<it.tp)return h+'<div class="tg">✦ Unool is reading…</div>';
 var x=typh(it.rep,prog(t,it.tp,it.te));
 if(k=='igc')r='<div class="r rin"><span class="bav ring" style="width:28px;height:28px;font-size:16px">S</span><div class="rx"><p><b>saanvi.studio</b> '+x+'</p><small>now &nbsp; Reply</small>'+ub(d,it)+'</div><span class="hr">♡</span></div>';
 else if(k=='lic')r='<div class="r rin"><span class="bav sq" style="width:28px;height:28px;font-size:16px">S</span><div class="lb"><b>Saanvi Studio</b><i class="au">Author</i><span class="hl">1,248 followers</span><p>'+x+'</p></div></div><div class="la">Like &nbsp;|&nbsp; Reply &nbsp; '+ub(d,it)+'</div>';
 else if(k=='igd')r='<div class="r dr rg"><div class="db out">'+x+'</div></div><div class="la rg">'+ub(d,it)+'</div>';
 else r='<div class="r lm"><span class="bav sq">S</span><div><b>Saanvi Studio</b><em>9:53 AM</em><div class="lbub me">'+x+'</div>'+ub(d,it)+'</div></div>';
 return h+r}
/* ---- cursor ---- */
var F=[[32,420,300,0],[32.4,200,330,1],[33.1,60,400,1],[33.6,70,420,1],[33.9,60,440,1],[34.5,100,430,0]];
var CK=[33.1,33.9];
function cur(t){var i=0;while(i<F.length-2&&t>F[i+1][0])i++;var a=F[i],b=F[i+1],p=sm(prog(t,a[0],b[0]));return[a[1]+(b[1]-a[1])*p,a[2]+(b[2]-a[2])*p,a[3]+(b[3]-a[3])*p]}
function vis(el,t,a,b,dy){var o=sm(prog(t,a,a+.45))*(1-sm(prog(t,b-.35,b)));if(a<=T0)o=1-sm(prog(t,b-.35,b));el.style.opacity=o;el.style.visibility=o>.01?'visible':'hidden';if(dy)el.style.transform='translateY('+(1-sm(prog(t,a,a+.6)))*dy+'px)'}
function btn(el,state,txt){el.className='btn'+(state?' '+state:'');if(el._t!==txt){el.textContent=txt;el._t=txt}}
function put(id,s){var e=$(id);if(e._h!==s){e.innerHTML=s;e._h=s}}

/* ---- render(t): pure function of time ---- */
var S={c1:[32,57]};
function render(t){if(cfg.live&&LV.on){live(performance.now());return}
 var LS=cfg.sc[cfg.sc.length-1];for(var k in S){if(cfg.sc.indexOf(k)<0){$(k).style.visibility='hidden';continue}vis($(k),t,S[k][0],k==LS?999:S[k][1])}
 var cp=cur(t);
 /* automation */
 $('t1').className='sw'+(t>=33.1?' on':'');$('t2').className='sw'+(t>=33.9?' on':'');
 var ph=null,pi=-1;PH.forEach(function(p,i){if(t>=p.a&&t<p.b){ph=p;pi=i}});
 tabEls.forEach(function(e,i){e.className='pill'+(i==pi?' on':'')});
 var th=$('thr');th.className='thr';
 if(ph){if(th._pi!==pi){th._pi=pi;th.innerHTML=hdr(K[pi])+'<div class="nb"><div class="ni"></div></div>'+ftr(K[pi]);th._ni=th.querySelector('.ni');th._ni._f=0}
 var ni=th._ni,h=cap(K[pi])+ph.it.filter(function(i){return t>=i.t}).map(function(i){return item(i,t,K[pi])}).join('');
 if(ni._h!==h){ni._h=h;ni.innerHTML=h;var dy=-Math.max(0,ni.offsetHeight-ni.parentNode.clientHeight+8)+'px';if(ni._y!==dy){ni._y=dy;ni.style.transition=ni._f?'transform .4s ease':'none';ni.style.transform='translateY('+dy+')';ni._f=1}}
 th.style.opacity=sm(prog(t,ph.a,ph.a+.4))*(1-sm(prog(t,ph.b-.3,ph.b)))}else{if(th._pi!=null){th._pi=null;th.innerHTML=''}th.style.opacity=1}
 var pf=(pi<0?'igc':K[pi]).charAt(0),last=null,rp=0,sp=0,ld=0,cm=0;ALL.forEach(function(i){if(t>=i.t){last=i;if(i.pk==pf)cm++}if(i.rep&&t>=i.te)rp++;if(i.sp&&t>=i.sp)sp++;if(i.lead&&t>=i.te)ld++});
 put('rd',last?'<small class="lbl">Intent</small><b>'+last.i+'</b><small class="lbl">Rule matched</small><b>'+last.r+'</b><small class="lbl">Action</small><b>'+last.a+'</b>':'<small style="color:var(--dim)">Waiting for activity…</small>');
 $('k1').textContent=rp;$('k2').textContent=sp;$('k3').textContent=ld;var lp=$('lp'),lk2=pi<0?'igc':K[pi],LKV=124+Math.round(34*prog(t,32,85));if(lp._k!==lk2){lp._k=lk2;lp._v=null;lp.innerHTML=left(lk2)}var sv=LKV+'|'+cm;if(lp._v!==sv){lp._v=sv;[].forEach.call(lp.querySelectorAll('.vl'),function(e){e.textContent=LKV});[].forEach.call(lp.querySelectorAll('.vr'),function(e){e.textContent=Math.round(LKV/5)});[].forEach.call(lp.querySelectorAll('.vm'),function(e){e.textContent=cm})}
 /* cursor */
 var cu=$('cur'),press=CK.some(function(c){return Math.abs(t-c)<.12});
 cu.style.opacity=cp[2];cu.style.transform='translate('+cp[0]+'px,'+cp[1]+'px) scale('+(press?.82:1)+')';
 /* caption + chapters + controls */
 var ci=0;CAPS.forEach(function(c,i){if(t>=c[0])ci=i});var c=CAPS[ci];var _st=$('st'),_cb=$('cb'),_ct=$('ct');if(_st)_st.textContent=c[1];if(_cb)_cb.textContent=c[2];if(_ct)_ct.textContent=c[3];
 var ni=2;nvEls.forEach(function(e,i){e.className=i==ni?'on':''});
}

/* ---- Try it live: viewer plays the customer ---- */
var LV={on:0,m:[],ask:0},tr=$('try');
if(cfg.live){tr.innerHTML='<b>✦ Try it live</b><span>Be the customer — tap a question or type your own in the DM box:</span>'+['Is it available in M?','How long is delivery?','What’s the return policy?','Can I buy wholesale?'].map(function(q){return '<button data-q="'+q+'">'+q+'</button>'}).join('');
}else tr.remove();
function esc(x){return x.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function ans(q){var l=q.toLowerCase();
 if(LV.ask){LV.ask=0;if(/\\b(no|not|nope|haven)/.test(l))return['No worries! Follow @saanvi.studio and I’ll unlock your 10% code 🧡','Follow check · pending','Follow check','Ask to follow'];if(/yes|yeah|yep|follow|done|sure/.test(l))return['Amazing, thank you! 💛 Your code is SAANVI10 — apply it at checkout.','Follower confirmed','Follow check · passed','Share 10% code']}
 if(/\\b(size|m|l|xl|available|stock)\\b/.test(l)){LV.ask=1;return['Yes — that size is in stock 🎉 Quick check: are you following @saanvi.studio? Followers get 10% off 🧡','Stock question','Keywords: size, stock','Reply + ask if following']}
 if(/deliver|ship|days|when/.test(l))return['Delivery takes 3–4 days across India, and shipping is free above ₹2,000 🚚','Delivery question','FAQ match · 97%','Auto-reply'];
 if(/return|exchange|refund/.test(l))return['Free 7-day returns and exchanges — no questions asked 💛','Returns question','FAQ match · 95%','Auto-reply'];
 if(/price|cost|how much|₹/.test(l))return['The Linen Wrap Dress is ₹3,499 — with 20% off for the first 50 orders 🧡','Price question','FAQ match · 96%','Auto-reply'];
 if(/wholesale|bulk|boutique|reseller/.test(l))return['Lovely! Wholesale enquiries get a quick approval from our team — I’ve flagged yours 🙌','Wholesale · sensitive','Approval required','Hold → you approve'];
 return['Thanks for your message! I’ve passed this to the team and they’ll reply shortly 🧡','Unclear intent','No rule matched','Hand off to a human']}
function send(q){var a=ans(q);LV.m.push({n:'aanya.s',c:'#4F8A5B',x:esc(q),s:performance.now(),t:0,tp:.5,te:.5+Math.max(1.2,a[0].length*.03),rep:a[0],i:a[1],r:a[2],a:a[3]})}
var liveTimer=null;
function goLive(q){
  if(!LV.on){
    LV.on=1;LV.m=[];LV.ask=0;
    tr.classList.add('on');
    var cu=$('cur');if(cu)cu.style.opacity=0;
    viewport.scrollIntoView({behavior:'smooth',block:'center'});
  }
  if(q)send(q);
  clearTimeout(liveTimer);
  liveTimer=setTimeout(function(){exitLive()},7000);
  setTimeout(function(){var i=$('thr').querySelector('input');if(i)i.focus({preventScroll:true})},60);
}
function exitLive(){clearTimeout(liveTimer);LV.on=0;tr.classList.remove('on');var th=$('thr');if(th)th._pi=null;dirty=true}
function sub(){var i=$('thr').querySelector('input');if(i&&i.value.trim()){send(i.value.trim());i.value=''}}
function live(now){var c1=$('c1');c1.style.opacity=1;c1.style.visibility='visible';var th=$('thr');
 if(th._pi!=='L'){th._pi='L';th.innerHTML=hdr('igd')+'<div class="nb"><div class="ni"></div></div><div class="nf dm"><input class="in" placeholder="Message…" autocomplete="off"><span class="po">Send</span></div>';th._ni=th.querySelector('.ni');th._ni._f=0;th.style.opacity=1}
 var ni=th._ni,h='<div class="ds">Today</div>'+(LV.m.length?'':'<div class="ds" style="margin-top:70px;font-size:12.5px;line-height:1.6">You’re Aanya 👋<br>Ask about the dress below</div>')+LV.m.map(function(m){return item(m,(now-m.s)/1000,'igd')}).join('');
 if(ni._h!==h){ni._h=h;ni.innerHTML=h;var dy=-Math.max(0,ni.offsetHeight-ni.parentNode.clientHeight+8)+'px';if(ni._y!==dy){ni._y=dy;ni.style.transition=ni._f?'transform .4s ease':'none';ni.style.transform='translateY('+dy+')';ni._f=1}}
 tabEls.forEach(function(e,i){e.className='pill'+(i==2?' on':'')});nvEls.forEach(function(e,i){e.className=i==2?'on':''});
 var lp=$('lp');if(lp._k!=='igd'){lp._k='igd';lp.innerHTML=left('igd')}
 var la=null,dn=0;LV.m.forEach(function(m){if(now>=m.s+m.tp*1000)la=m;if(now>=m.s+m.te*1000)dn++});
 put('rd',la?'<small class="lbl">Intent</small><b>'+la.i+'</b><small class="lbl">Rule matched</small><b>'+la.r+'</b><small class="lbl">Action</small><b>'+la.a+'</b>':'<small style="color:var(--dim)">Waiting for a message…</small>');
 $('k1').textContent=11+dn;$('k2').textContent=1;$('k3').textContent=2;
 var _st=$('st'),_cb=$('cb'),_ct=$('ct');if(_st)_st.textContent='TRY IT';if(_cb)_cb.textContent='You’re the customer';if(_ct)_ct.textContent='Ask anything — Unool replies in real time.';}
tr.onclick=function(e){var b=e.target.closest&&e.target.closest('button');if(!b)return;if(b.getAttribute('data-q'))goLive(b.getAttribute('data-q'));else exitLive()};
root.addEventListener('keydown',function(e){if(LV.on&&e.key=='Enter'&&e.target.tagName=='INPUT')sub()});
root.addEventListener('click',function(e){if(LV.on&&e.target.classList&&e.target.classList.contains('po'))sub()});
/* ---- player continuous infinite loop (no controls, no pause, no replay) ---- */
var t=0,playing=true,dirty=true,last=performance.now(),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
viewport.setAttribute('aria-label',cfg.aria);
viewport.onclick=null;

if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){
    if(es[0].isIntersecting){if(!reduce)playing=true}else playing=false;
  },{threshold:.15}).observe(viewport);
}
if(!reduce)playing=true;

function tick(n){
  var d=Math.max(0,Math.min(0.1,(n-last)/1000));
  last=n;
  if(playing){
    t+=d;
    if(t>=DUR+1.0){
      t=0;
      if(LV.on)exitLive();
    }
    dirty=true;
  }
  if(dirty||LV.on){
    dirty=false;
    render(T0+t);
  }
}
function go(){t=0;dirty=true;host.scrollIntoView({behavior:'smooth',block:'center'});playing=true}
if(DRESS_PHOTO)[].forEach.call(root.querySelectorAll('.art'),function(a){a.innerHTML='<img alt="Linen Wrap Dress" src="'+DRESS_PHOTO+'">'});
return{tick:tick,go:go};
}
var CFG=[
 {t0:32,dur:53,live:1,sc:['c1'],n:'03',h:'Automate comments & DMs',p:'Every comment and DM on Instagram and LinkedIn is read, answered or hidden — and sensitive ones wait for your approval.',chips:['Instagram','LinkedIn','Comments','DMs'],nx:'',end:'Every reply, handled.',aria:'Video 3: Unool automatically replies to comments and DMs on Instagram and LinkedIn about the dress post'}];
var tpl=document.getElementById('ua-tpl').innerHTML,wrap=document.getElementById('ua-vids'),players=[],rio=window.IntersectionObserver?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}})},{threshold:.08}):null;
CFG.forEach(function(c,i){var d=document.createElement('div');d.className='vid';
 d.innerHTML='<div class="vh"><div class="vt"><h3>'+c.h+'</h3><p>'+c.p+'</p></div><div class="vc">'+c.chips.map(function(x){return'<span>'+x+'</span>'}).join('')+'</div></div>'+tpl;
 wrap.appendChild(d);if(rio)rio.observe(d);else d.className+=' in';if(i<2)c.next=function(){players[i+1].go()};
 players.push(make(d.querySelector('.ua-player'),c))});
var sec=document.getElementById('unool-automation');sec.addEventListener('pointermove',function(e){var r=sec.getBoundingClientRect();sec.style.setProperty('--mx',(e.clientX-r.left)+'px');sec.style.setProperty('--my',(e.clientY-r.top)+'px')});
(function loop(n){players.forEach(function(p){p.tick(n)});requestAnimationFrame(loop)})(performance.now());

function notifyHeight(){
  try{
    var wrap=document.querySelector('.ua-wrap')||document.querySelector('.ua')||document.body;
    var h=wrap?wrap.offsetHeight:document.body.scrollHeight;
    if(h&&window.parent)window.parent.postMessage({type:'unool-automation-resize',height:h},'*');
  }catch(e){}
}
notifyHeight();
window.addEventListener('resize',function(){notifyHeight();});
if(window.ResizeObserver)new ResizeObserver(notifyHeight).observe(document.body);
setTimeout(function(){notifyHeight();},100);
setTimeout(function(){notifyHeight();},400);
setTimeout(function(){notifyHeight();},1200);
})();
</script>
</body>
</html>`;

function AutomationVideoPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(760);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (
        e.data &&
        (e.data.type === 'unool-automation-resize' || e.data.type === 'unool-video-resize') &&
        typeof e.data.height === 'number'
      ) {
        if (e.data.height > 200) {
          setHeight(Math.ceil(e.data.height));
        }
      }
    }

    function checkDirect() {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          const wrap = (doc.querySelector('.ua-wrap') || doc.querySelector('.ua') || doc.body) as HTMLElement;
          const h = wrap ? (wrap.offsetHeight || wrap.scrollHeight) : 0;
          if (h > 200) {
            setHeight(Math.ceil(h));
          }
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleMessage);
    const interval = setInterval(checkDirect, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={UNOOL_VIDEO_3_HTML_DOC}
        src="/unool-video-3-automation.html?v=3"
        title="Automate comments & DMs interactive walkthrough"
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          display: 'block',
          background: 'transparent',
          overflow: 'hidden',
        }}
        loading="eager"
        scrolling="no"
        onLoad={() => {
          try {
            const doc = iframeRef.current?.contentDocument;
            if (doc) {
              const wrap = (doc.querySelector('.ua-wrap') || doc.querySelector('.ua') || doc.body) as HTMLElement;
              const h = wrap ? (wrap.offsetHeight || wrap.scrollHeight) : 0;
              if (h > 200) {
                setHeight(Math.ceil(h));
              }
            }
          } catch (err) {}
        }}
      />
    </div>
  );
}

function renderPhoneMockups(root: HTMLElement, rawText: string) {
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

    // 0: Instagram — pixel-perfect authentic iOS feed post
    CD[0].innerHTML =
      SB +
      // Instagram header bar — wordmark + actions
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
      '<span class="ig-location">Paris, France • Original audio</span>' +
      '</div>' +
      '<span class="ig-more">···</span>' +
      '</div>' +
      // Post media — full-bleed 1080x1350 vertical dress image
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
      '<div class="ig-caption"><b>pixenox.atelier</b> Meet the Linen Wrap Dress 🌿 Hand-woven terracotta linen, crafted for warm days. Sizes XS–XL.<br>First 50 orders get <b>20% off</b> this week only ✨</div>' +
      '<div class="ig-tags">#sustainablefashion #slowfashion #linendress #atelier</div>' +
      '<div class="ig-comments-link">View all 64 comments</div>' +
      '<div class="ig-timestamp">2 HOURS AGO</div>' +
      '</div>' +
      '</div>' +
      // Instagram bottom nav
      tb([['home'], ['search'], ['plus'], ['heart'], ['user']], 0) +
      HI;

    // 1: LinkedIn — pixel-perfect native feed post
    CD[1].innerHTML =
      SB +
      // LinkedIn header bar — avatar + search + messaging
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
      '<div class="li-author-name">Pixenox Atelier <small>• 1st</small></div>' +
      '<span class="li-author-sub">Sustainable Artisan Apparel &amp; Design</span>' +
      '<div class="li-author-time">2h • <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM1.5 8h3a11.5 11.5 0 00.7 4H2.4A6.5 6.5 0 011.5 8zm0-1a6.5 6.5 0 01.9-3h2.8a11.5 11.5 0 00-.7 3h-3zm6.5-5.5a10 10 0 011.9 4.5h-3.8A10 10 0 018 1.5zm0 13a10 10 0 01-1.9-4.5h3.8A10 10 0 018 14.5zm0-5.5H5.1A10.8 10.8 0 015 8c0-.3 0-.7.1-1h5.8c.1.3.1.7.1 1 0 .3 0 .7-.1 1H8zm2.8 4a11.5 11.5 0 00.7-3h3a6.5 6.5 0 01-.9 3h-2.8zm.7-4a11.5 11.5 0 00-.7-3h2.8a6.5 6.5 0 01.9 3h-3z"/></svg></div>' +
      '</div>' +
      '<span class="li-follow-btn">+ Follow</span>' +
      '<span class="li-more-btn">···</span>' +
      '</div>' +
      // Post body — formatted for LinkedIn
      '<div class="li-body">' +
      '<p><b>🌿 Introducing the Linen Wrap Dress:</b></p>' +
      '<p>Hand-woven terracotta linen, crafted for warm days and effortless movement. Sizes XS–XL.</p>' +
      '<p>→ 100% breathable organic European linen<br>→ Hand-dyed natural terracotta hue<br>→ Tailored zero-waste silhouette</p>' +
      '<p>First 50 pieces: <b>20% off this week only.</b></p>' +
      '<p class="li-tags">#SustainableFashion #SlowFashion #LinenDress #Atelier</p>' +
      '</div>' +
      // Full-bleed post image (LinkedIn style — extends edge-to-edge)
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
      '<span>98 comments • 34 reposts</span>' +
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
    text === 'At Pixenox, we just shipped our AI-powered design system that reduces brand iteration time by 80%. Here’s what we learned building it.';

  if (isDefault) {
    // 0: LinkedIn
    CD[0].innerHTML =
      SB +
      '<div class="lh"><span class="av">P</span><div class="srch">' +
      ic('search', 15, 2) +
      'Search</div>' +
      ic('chat', 23, 1.7) +
      '</div><div class="fd"><div class="lp"><div class="ph"><span class="av">P</span><div><b>Pixenox</b> • 1st<small>AI Design Systems</small><small>2h • 🌐</small></div><span class="fl">+ Follow</span></div><p><b>🚀 Big announcement from Pixenox:</b></p><p>We just shipped our AI-powered design system that reduces brand iteration time by <b>80%.</b></p><p>→ Consistency beats creativity at scale<br>→ Design tokens are your secret weapon<br>→ AI amplifies designers, not replaces them</p><p><i>#DesignSystems #AI #Startups</i></p><div class="gfx"><u style="background:#fdf6ee"></u><u style="background:#e8a595"></u><u style="background:#c84b31"></u><em>80%<small>faster iteration</small></em></div><div class="rx"><span>👍❤️💡 842</span><span>67 comments • 12 reposts</span></div><div class="ar"><span>' +
      ic('like', 19) +
      'Like</span><span>' +
      ic('chat', 19) +
      'Comment</span><span>' +
      ic('rep', 19) +
      'Repost</span><span>' +
      ic('send', 19) +
      'Send</span></div></div><div class="lp"><div class="ph"><span class="av" style="background:#7a3b69">M</span><div><b>Maya Chen</b> • 2nd<small>Brand Lead at Northwind</small></div></div></div></div>' +
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
      ' <span class="g">@pixenox · now</span></div><p>We just shipped something big at <span class="bl">@pixenox</span> 🔥</p><p>An AI design system that cuts brand iteration time by 80%.</p><p>Thread on what we learned 🧵👇</p>' +
      xm([['chat', '48'], ['rep', '312'], ['heart', '1.2K'], ['eye', '45K'], ['up', '']]) +
      '</div></div><div class="xp"><span class="av">P</span><div class="bx"><div><b>Pixenox</b> ' +
      VB +
      ' <span class="g">@pixenox · now</span></div><p>Old way: create → review → 3 weeks back-and-forth.</p><p>Pixenox way: design tokens + AI = instant brand-consistent output ⚡</p>' +
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
        ' <span class="g">2m</span><span class="g r">···</span></div><p>okay so we’ve been quietly working on something at pixenox and i’m finally allowed to talk about it</p><p>we built an AI design system that does in hours what used to take our team weeks</p><p>the biggest lesson? AI doesn’t make designers obsolete — it makes them dangerous (in the best way) 🔥</p><div class="tx">' +
        ic('heart', 20, 1.6) +
        ic('chat', 20, 1.6) +
        ic('rep', 20, 1.6) +
        ic('send', 20, 1.6) +
        '</div><div class="g">89 replies · 234 likes</div></div></div><div class="xp"><span class="av" style="background:#2a7f78">M</span><div class="bx"><div><b>maya.builds</b> <span class="g">1m</span></div><p>wait, this is huge. how are you handling token drift across brands?</p><div class="tx">' +
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
  const metricVal = metricMatch ? metricMatch[0] : '⚡';
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
  const xInsight = rest.length > 0 ? rest[0] : '1 thought → adapted natively for 30+ platforms in 0.8s.';

  const thText = (text || 'something exciting is in the works').toLowerCase();

  // 0: Dynamic LinkedIn
  CD[0].innerHTML =
    SB +
    '<div class="lh"><span class="av">U</span><div class="srch">' +
    ic('search', 15, 2) +
    'Search</div>' +
    ic('chat', 23, 1.7) +
    '</div><div class="fd"><div class="lp"><div class="ph"><span class="av">U</span><div><b>You</b> • 1st<small>Creator &amp; Founder</small><small>Just now • 🌐</small></div><span class="fl">+ Follow</span></div><p><b>🚀 Big update:</b></p><p>' +
    safe +
    '</p><p>' +
    bullets.map(b => '→ ' + b).join('<br>') +
    '</p><p><i>' +
    hashTags +
    '</i></p><div class="gfx"><u style="background:#fdf6ee"></u><u style="background:#e8a595"></u><u style="background:#c84b31"></u><em>' +
    metricVal +
    '<small>' +
    metricLabel +
    '</small></em></div><div class="rx"><span>👍❤️💡 1.2K</span><span>94 comments • 38 reposts</span></div><div class="ar"><span>' +
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
    ' <span class="g">@you · now</span></div><p>' +
    xHook +
    ' 🔥</p><p>Thread on what we learned 🧵👇</p>' +
    xm([['chat', '54'], ['rep', '412'], ['heart', '1.8K'], ['eye', '62K'], ['up', '']]) +
    '</div></div><div class="xp"><span class="av">U</span><div class="bx"><div><b>You</b> ' +
    VB +
    ' <span class="g">@you · now</span></div><p>' +
    xInsight +
    ' ⚡</p>' +
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
      ' <span class="g">now</span><span class="g r">···</span></div><p>okay so i wanted to share something we’ve been working on...</p><p>' +
      thText +
      '</p><p>the biggest lesson? speed and consistency compound faster than anything else ✨</p><div class="tx">' +
      ic('heart', 20, 1.6) +
      ic('chat', 20, 1.6) +
      ic('rep', 20, 1.6) +
      ic('send', 20, 1.6) +
      '</div><div class="g">124 replies · 410 likes</div></div></div></div>' +
      tb([['home'], ['search'], ['plus'], ['heart'], ['user']], 0) +
      HI;
  }
}

interface ProfilePreviewTemplate {
  id: string;
  name: string;
  category: string;
  tagline: string;
  color: string;
  screenBg: string;
  textColor: string;
  subtextColor: string;
  appBarColor: string;
  avatarBg: string;
  avatarText: string;
  badge: { text: string; bg: string; color: string; border?: string };
  role: string;
  bio?: string;
  proofs: Array<{ val: string; lbl: string }>;
  proofBg: string;
  proofBorder: string;
  proofValColor: string;
  proofLblColor: string;
  linkBg: string;
  linkBorder: string;
  linkHoverBorder: string;
  linkTitleColor: string;
  linkSubColor: string;
  links: Array<{
    platform: string;
    iconSvg: string;
    iconBg: string;
    iconFg: string;
    title: string;
    subtitle: string;
  }>;
}

const PROFILE_PREVIEW_TEMPLATES: ProfilePreviewTemplate[] = [
  // 01 — THE STORYTELLER / LOVER (Terracotta #c84b31 — Unool Signature)
  {
    id: 'storyteller',
    name: 'The Storyteller',
    category: 'Unool Signature',
    tagline: 'Warm editorial storytelling across every network',
    color: '#c84b31',
    screenBg: '#ffffff',
    textColor: '#1c0b09',
    subtextColor: '#6c5b56',
    appBarColor: '#1c0b09',
    avatarBg: 'linear-gradient(135deg, #521f13, #c84b31)',
    avatarText: 'P',
    badge: { text: '✦ Signature Story', bg: 'rgba(200, 75, 49, 0.1)', color: '#c84b31', border: '1px solid rgba(200, 75, 49, 0.2)' },
    role: 'AI Design Systems • San Francisco',
    bio: '“Automated storytelling across every network you use.”',
    proofs: [
      { val: '80%', lbl: 'Faster build' },
      { val: '30+', lbl: 'Networks' },
      { val: '1 Link', lbl: 'Everywhere' }
    ],
    proofBg: 'rgba(200, 75, 49, 0.04)',
    proofBorder: '1px solid rgba(200, 75, 49, 0.14)',
    proofValColor: '#c84b31',
    proofLblColor: '#7a5850',
    linkBg: '#ffffff',
    linkBorder: '1px solid #ede8e3',
    linkHoverBorder: '#c84b31',
    linkTitleColor: '#1c0b09',
    linkSubColor: '#6c5b56',
    links: [
      {
        platform: 'LinkedIn',
        iconSvg: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        iconBg: '#0A66C2',
        iconFg: '#ffffff',
        title: 'LinkedIn',
        subtitle: 'AI Design Systems Launch Case Study'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'X (Twitter)',
        subtitle: '@pixenox · Building in public thread'
      },
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: '@pixenox.design · Visual components'
      },
      {
        platform: 'YouTube',
        iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        iconBg: '#F00',
        iconFg: '#ffffff',
        title: 'YouTube',
        subtitle: 'Full design systems walkthrough'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#c84b31',
        iconFg: '#ffffff',
        title: '15+ more connected links',
        subtitle: 'Substack, Discord, Threads, GitHub'
      }
    ]
  },

  // 02 — THE CREATOR (Peach / Salmon #e8a595)
  {
    id: 'creator',
    name: 'The Creator',
    category: 'Influencer & Media',
    tagline: 'Visual-first dynamic creator studio',
    color: '#e8a595',
    screenBg: 'linear-gradient(180deg, #fffbf9 0%, #fff0eb 100%)',
    textColor: '#26160f',
    subtextColor: '#8c6258',
    appBarColor: '#26160f',
    avatarBg: 'linear-gradient(135deg, #e8a595, #ea580c)',
    avatarText: 'P',
    badge: { text: '🎬 Top Creator', bg: 'rgba(232, 165, 149, 0.25)', color: '#b4482a', border: '1px solid rgba(180, 72, 42, 0.25)' },
    role: 'Visual Systems & Creative Tech',
    bio: '“Designing motion systems and interactive experiments.”',
    proofs: [
      { val: '250K', lbl: 'Audience' },
      { val: '4.9★', lbl: 'Asset Kits' },
      { val: 'Weekly', lbl: 'Drops' }
    ],
    proofBg: 'rgba(255, 255, 255, 0.7)',
    proofBorder: '1px solid rgba(232, 165, 149, 0.35)',
    proofValColor: '#b4482a',
    proofLblColor: '#8c6258',
    linkBg: 'rgba(255, 255, 255, 0.85)',
    linkBorder: '1px solid rgba(232, 165, 149, 0.3)',
    linkHoverBorder: '#b4482a',
    linkTitleColor: '#26160f',
    linkSubColor: '#8c6258',
    links: [
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: 'Reels & visual tokens library'
      },
      {
        platform: 'YouTube',
        iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        iconBg: '#F00',
        iconFg: '#ffffff',
        title: 'YouTube',
        subtitle: '4K speedruns & livestreams'
      },
      {
        platform: 'TikTok',
        iconSvg: '<path d="M17.5 6.5a4.5 4.5 0 0 1-3.5-3.8h-2.5v11.8a2.5 2.5 0 1 1-2.5-2.5c.3 0 .7.1 1 .2V9.7a5.5 5.5 0 1 0 4 5.3V8.2a7.5 7.5 0 0 0 3.5 1.2V6.5z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'TikTok',
        subtitle: '60-sec engineering tips'
      },
      {
        platform: 'Dribbble',
        iconSvg: '<path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>',
        iconBg: '#EA4C89',
        iconFg: '#ffffff',
        title: 'Dribbble',
        subtitle: 'Featured visual concepts'
      },
      {
        platform: 'Kit',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#ea580c',
        iconFg: '#ffffff',
        title: 'Creator Kit (Free)',
        subtitle: 'Download Figma design tokens & assets'
      }
    ]
  },

  // 03 — THE FOUNDER (Deep Wine / Maroon #832723)
  {
    id: 'founder',
    name: 'The Founder',
    category: 'Startup & Corporate',
    tagline: 'High-conviction executive presence',
    color: '#832723',
    screenBg: 'linear-gradient(180deg, #16070a 0%, #240a0e 100%)',
    textColor: '#fdf6ee',
    subtextColor: '#d8b9b0',
    appBarColor: '#fdf6ee',
    avatarBg: 'linear-gradient(135deg, #3d0c1a, #832723)',
    avatarText: 'P',
    badge: { text: '✓ Verified Founder', bg: 'rgba(131, 39, 35, 0.5)', color: '#ffb3a7', border: '1px solid rgba(255, 179, 167, 0.3)' },
    role: 'Founder & CEO • Pixenox Labs',
    bio: '“Scaling autonomous brand storytelling for modern founders.”',
    proofs: [
      { val: '$2.4M', lbl: 'ARR Run-rate' },
      { val: '80%', lbl: 'Time saved' },
      { val: '100+', lbl: 'Enterprises' }
    ],
    proofBg: 'rgba(255, 255, 255, 0.06)',
    proofBorder: '1px solid rgba(255, 255, 255, 0.12)',
    proofValColor: '#ffb3a7',
    proofLblColor: '#d8b9b0',
    linkBg: 'rgba(255, 255, 255, 0.06)',
    linkBorder: '1px solid rgba(255, 255, 255, 0.1)',
    linkHoverBorder: '#832723',
    linkTitleColor: '#fdf6ee',
    linkSubColor: '#d8b9b0',
    links: [
      {
        platform: 'LinkedIn',
        iconSvg: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        iconBg: '#0A66C2',
        iconFg: '#ffffff',
        title: 'LinkedIn',
        subtitle: '2026 Letter to Founders & Vision'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'X (Twitter)',
        subtitle: '@pixenox · Daily founder reflections'
      },
      {
        platform: 'Substack',
        iconSvg: '<path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>',
        iconBg: '#FF6719',
        iconFg: '#ffffff',
        title: 'Substack',
        subtitle: 'The Autonomous Enterprise (Weekly)'
      },
      {
        platform: 'Pitch',
        iconSvg: '<path d="M3.5 11.2L12 3.5l8.5 7.7V21h-5.7v-6h-5.6v6H3.5z" stroke="currentColor" fill="none" stroke-width="1.8"/>',
        iconBg: '#832723',
        iconFg: '#ffffff',
        title: 'Series A Pitch Deck',
        subtitle: 'Traction overview & financial metrics'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#c84b31',
        iconFg: '#ffffff',
        title: 'Press Kit & Speaking',
        subtitle: 'Keynotes, podcasts, facts & bio'
      }
    ]
  },

  // 04 — THE MINIMALIST (Almond / Sand #d8b9b0)
  {
    id: 'minimalist',
    name: 'The Minimalist',
    category: 'Individual & Portfolio',
    tagline: 'Quiet, restrained editorial luxury',
    color: '#d8b9b0',
    screenBg: '#faf7f2',
    textColor: '#1f1a17',
    subtextColor: '#7d726b',
    appBarColor: '#1f1a17',
    avatarBg: 'linear-gradient(135deg, #c4a49a, #8c6a60)',
    avatarText: 'P',
    badge: { text: '✦ Selected Work', bg: 'rgba(216, 185, 176, 0.35)', color: '#4a3b35', border: '1px solid rgba(74, 59, 53, 0.15)' },
    role: 'Systems Designer & Typographer',
    bio: '“Simplicity is clarity made visible.”',
    proofs: [
      { val: '12', lbl: 'Yrs crafting' },
      { val: 'SF', lbl: 'California' },
      { val: 'Selected', lbl: 'Archive' }
    ],
    proofBg: '#ffffff',
    proofBorder: '1px solid #e7ded5',
    proofValColor: '#1f1a17',
    proofLblColor: '#7d726b',
    linkBg: '#ffffff',
    linkBorder: '1px solid #e7ded5',
    linkHoverBorder: '#1f1a17',
    linkTitleColor: '#1f1a17',
    linkSubColor: '#7d726b',
    links: [
      {
        platform: 'LinkedIn',
        iconSvg: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        iconBg: '#4a3b35',
        iconFg: '#ffffff',
        title: 'LinkedIn',
        subtitle: 'Advisory & systems consulting'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#1f1a17',
        iconFg: '#ffffff',
        title: 'X',
        subtitle: 'Essays on design systems'
      },
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: '#8c6a60',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: 'Printed monograph & objects'
      },
      {
        platform: 'Monograph',
        iconSvg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="none" stroke="currentColor" stroke-width="2"/>',
        iconBg: '#7d726b',
        iconFg: '#ffffff',
        title: 'Autonomous Systems (2026)',
        subtitle: 'Selected case studies & specimens'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#4a3b35',
        iconFg: '#ffffff',
        title: 'Complete Archive',
        subtitle: '14 case studies & design tokens'
      }
    ]
  },

  // 05 — THE DEVELOPER (Obsidian Dark Cyber #1c0b09)
  {
    id: 'developer',
    name: 'The Developer',
    category: 'Technical & Systems',
    tagline: 'Terminal-first cyber dark profile',
    color: '#1c0b09',
    screenBg: 'linear-gradient(180deg, #090a0f 0%, #11131c 100%)',
    textColor: '#f8fafc',
    subtextColor: '#94a3b8',
    appBarColor: '#f8fafc',
    avatarBg: 'linear-gradient(135deg, #0f172a, #1e293b)',
    avatarText: 'P',
    badge: { text: '● terminal live', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' },
    role: 'Lead Systems Architect • Rust & TS',
    bio: '$ pnpm dlx unool-cli@latest init',
    proofs: [
      { val: '1.4k ★', lbl: 'GitHub Stars' },
      { val: '99.9%', lbl: 'Core Uptime' },
      { val: '0ms', lbl: 'Edge Sync' }
    ],
    proofBg: 'rgba(18, 20, 29, 0.95)',
    proofBorder: '1px solid rgba(56, 189, 248, 0.2)',
    proofValColor: '#38bdf8',
    proofLblColor: '#94a3b8',
    linkBg: 'rgba(18, 20, 29, 0.95)',
    linkBorder: '1px solid rgba(255, 255, 255, 0.08)',
    linkHoverBorder: '#38bdf8',
    linkTitleColor: '#f8fafc',
    linkSubColor: '#94a3b8',
    links: [
      {
        platform: 'GitHub',
        iconSvg: '<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>',
        iconBg: '#24292e',
        iconFg: '#ffffff',
        title: 'GitHub',
        subtitle: 'github.com/xpixenoxx/unool'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'X (Twitter)',
        subtitle: 'Engineering logs & benchmarks'
      },
      {
        platform: 'Discord',
        iconSvg: '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>',
        iconBg: '#5865F2',
        iconFg: '#ffffff',
        title: 'Discord',
        subtitle: 'Join developer community server'
      },
      {
        platform: 'npm',
        iconSvg: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
        iconBg: '#CB3837',
        iconFg: '#ffffff',
        title: 'npm package',
        subtitle: '@unool/engine v2.4.0'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#22c55e',
        iconFg: '#ffffff',
        title: 'Documentation',
        subtitle: 'REST & WebSocket API Guide'
      }
    ]
  },

  // 06 — THE STUDIO (Atelier Violet #4f46e5)
  {
    id: 'studio',
    name: 'The Studio',
    category: 'Agency & Collective',
    tagline: 'Culture-defining creative atelier',
    color: '#4f46e5',
    screenBg: 'linear-gradient(180deg, #0c0916 0%, #171228 100%)',
    textColor: '#fdf6ee',
    subtextColor: '#c7d2fe',
    appBarColor: '#fdf6ee',
    avatarBg: 'linear-gradient(135deg, #311042, #4f46e5)',
    avatarText: 'P',
    badge: { text: '🏛️ Studio Atelier', bg: 'rgba(79, 70, 229, 0.25)', color: '#a5b4fc', border: '1px solid rgba(165, 180, 252, 0.3)' },
    role: 'Culture & Digital Experience Studio',
    bio: '“Crafting digital worlds for leading brands.”',
    proofs: [
      { val: '15', lbl: 'Awwwards' },
      { val: '50M+', lbl: 'Global reach' },
      { val: '2026', lbl: 'Roster open' }
    ],
    proofBg: 'rgba(255, 255, 255, 0.06)',
    proofBorder: '1px solid rgba(129, 140, 248, 0.25)',
    proofValColor: '#a5b4fc',
    proofLblColor: '#c7d2fe',
    linkBg: 'rgba(255, 255, 255, 0.05)',
    linkBorder: '1px solid rgba(255, 255, 255, 0.09)',
    linkHoverBorder: '#818cf8',
    linkTitleColor: '#fdf6ee',
    linkSubColor: '#c7d2fe',
    links: [
      {
        platform: 'Portfolio',
        iconSvg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
        iconBg: '#4f46e5',
        iconFg: '#ffffff',
        title: 'Selected Works',
        subtitle: 'Interactive brand case studies'
      },
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: 'Prototypes, motion & objects'
      },
      {
        platform: 'Reel',
        iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        iconBg: '#1AB7EA',
        iconFg: '#ffffff',
        title: 'Studio Reel (4K)',
        subtitle: '2026 motion showreel & sound'
      },
      {
        platform: 'Monograph',
        iconSvg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="none" stroke="currentColor" stroke-width="2"/>',
        iconBg: '#4338ca',
        iconFg: '#ffffff',
        title: 'Design Specimen',
        subtitle: 'Digital Culture Yearbook'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#818cf8',
        iconFg: '#ffffff',
        title: 'Inquire & Commission',
        subtitle: 'Booking for Q4 2026 projects'
      }
    ]
  }
];

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const spRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stmRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const [activeProfileTpl, setActiveProfileTpl] = useState(0);
  const currentTpl = PROFILE_PREVIEW_TEMPLATES[activeProfileTpl] || PROFILE_PREVIEW_TEMPLATES[0];

  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      if (id === 'overview') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } else {
        const navOffset = 70;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = Math.max(0, elementPosition + window.pageYOffset - navOffset);
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
      window.history.pushState(null, '', href);
      setActiveSection(id);
    }
  };

  const [thought] = useState(
    'Meet the Linen Wrap Dress 🌿 Hand-woven terracotta, made for warm days. Sizes XS–XL. First 50 pieces: 20% off this week.'
  );

  // 3-step auto-playing video flow: 0 = Connect accounts, 1 = Write post, 2 = Adapt (Mobile view)
  const [flowStep, setFlowStep] = useState<0 | 1 | 2>(0);
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: false,
    linkedin: false,
  });
  const [isInstagramConnecting, setIsInstagramConnecting] = useState(true);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState(false);
  const [isAdapted, setIsAdapted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-play like a video: transitions through connect -> write -> adapt without waiting for user input
  useEffect(() => {
    if (!isPlaying) return;

    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timer4: NodeJS.Timeout;

    if (flowStep === 0) {
      // Step 1: Connect accounts sequence
      setConnectedAccounts({ instagram: false, linkedin: false });
      setIsInstagramConnecting(true);
      setIsLinkedInConnecting(false);

      // Instagram finishes connecting
      timer1 = setTimeout(() => {
        setConnectedAccounts((prev) => ({ ...prev, instagram: true }));
        setIsInstagramConnecting(false);
      }, 1200);

      // LinkedIn starts connecting
      timer2 = setTimeout(() => {
        setIsLinkedInConnecting(true);
      }, 1800);

      // LinkedIn finishes connecting
      timer3 = setTimeout(() => {
        setConnectedAccounts((prev) => ({ ...prev, linkedin: true }));
        setIsLinkedInConnecting(false);
      }, 2700);

      // Auto-advance to Step 2 (Write post)
      timer4 = setTimeout(() => {
        setFlowStep(1);
      }, 3700);
    } else if (flowStep === 1) {
      // Step 2: Write post & auto-click Adapt
      setIsAdapted(false);

      // Auto-click Adapt button
      timer1 = setTimeout(() => {
        setIsAdapted(true);
      }, 2000);

      // Auto-advance to Step 3 (Mobile phone deck)
      timer2 = setTimeout(() => {
        setFlowStep(2);
      }, 3100);
    } else if (flowStep === 2) {
      // Step 3: Mobile Phone Deck
      const tabs = rootRef.current?.querySelectorAll<HTMLElement>('#tabs button[data-i]');
      if (tabs && tabs[0]) tabs[0].click();
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [flowStep, isPlaying]);

  const handleConnectInstagram = () => {
    if (connectedAccounts.instagram) {
      setConnectedAccounts((prev) => ({ ...prev, instagram: false }));
      setIsInstagramConnecting(false);
      return;
    }
    setIsInstagramConnecting(true);
    setTimeout(() => {
      setConnectedAccounts((prev) => ({ ...prev, instagram: true }));
      setIsInstagramConnecting(false);
    }, 600);
  };

  const handleConnectLinkedIn = () => {
    if (connectedAccounts.linkedin) {
      setConnectedAccounts((prev) => ({ ...prev, linkedin: false }));
      return;
    }
    setIsLinkedInConnecting(true);
    setTimeout(() => {
      setConnectedAccounts((prev) => ({ ...prev, linkedin: true }));
      setIsLinkedInConnecting(false);
    }, 600);
  };

  const handleAdapt = () => {
    setIsAdapted(true);
    setTimeout(() => {
      setFlowStep(2);
      setIsAdapted(false);
    }, 550);
  };

  useEffect(() => {
    if (!rootRef.current) return;
    renderPhoneMockups(rootRef.current, thought);
  }, [thought, flowStep]);

  useEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;
    const $ = (s: string) => root.querySelector<HTMLElement>(s);
    const $$ = (s: string) => root.querySelectorAll<HTMLElement>(s);

    const P = PLATFORMS;
    const N = P.length;

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
    function mini(p: [string, string, string, string], s: number, sz: number) {
      return (
        '<span class="mi" style="background:' +
        p[1] +
        ';width:' +
        sz +
        'px;height:' +
        sz +
        'px">' +
        svg(p, s) +
        '</span>'
      );
    }

    // Scroll progress bar & Nav scroll styling
    const nav = $('#nav');
    const bar = $('#bar');
    const sectionIds = ['overview', 'voices', 'features', 'profile', 'analytics', 'pricing'];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (nav) nav.classList.toggle('s', scrollY > 40);
      if (bar) {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        bar.style.width = totalHeight > 0 ? (scrollY / totalHeight) * 100 + '%' : '0%';
      }

      const scrollPos = scrollY + 120;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Marquee Bands
    const nm = P.map(p => '<span>' + p[0] + '</span>').join('');
    const m1 = $('#m1');
    const m2 = $('#m2');
    if (m1) m1.innerHTML = nm + nm;
    if (m2) m2.innerHTML = nm + nm;

    // Chips in bento
    const chips = $('#chips');
    if (chips) {
      chips.innerHTML =
        P.slice(0, 14)
          .map(p => '<span>' + p[0] + '</span>')
          .join('') +
        '<span style="background:var(--terra)">+' +
        (N - 14) +
        ' more</span>';
    }

    // Tab buttons with mini icons (matched by platform name)
    $$('#tabs button[data-i]').forEach(b => {
      const label = b.textContent?.trim().toLowerCase() || '';
      const platform = P.find(p => p[0].toLowerCase() === label);
      if (platform) {
        b.insertAdjacentHTML('afterbegin', mini(platform, 14, 22));
      } else {
        const idx = Number(b.dataset.i);
        if (!isNaN(idx) && P[idx]) {
          b.insertAdjacentHTML('afterbegin', mini(P[idx], 14, 22));
        }
      }
    });

    // Populate Phone Mockups
    renderPhoneMockups(root, thought);

    // Streamgraph Analytics
    const sv = $('#strm');
    const tip = $('#tip');
    let streamRafId = 0;
    if (sv && tip) {
      const K = 14;
      const W = 900;
      const H = 300;
      let hov = 0;
      const A: [string, string, number[]][] = [
        ['X', '#e8a595', [2, 2.6, 3.4, 3, 4.2, 3.8, 5.6, 5, 6.4, 6, 5.2, 6.6, 7.4, 7]],
        ['LinkedIn', '#fdf6ee', [3, 4, 3.6, 5.2, 4.8, 6.4, 6, 8.6, 7.2, 6.6, 8, 9.4, 8.2, 10]],
        ['Instagram', '#ff8a5c', [1.6, 1.8, 2.4, 2, 2.6, 3.2, 2.8, 3.6, 4.2, 3.8, 4.6, 4.2, 5, 5.4]],
        ['Threads', '#c84b31', [1, 1.4, 1.2, 2, 2.4, 2.2, 3, 3.8, 3.4, 4.6, 4.2, 5, 4.6, 5.8]]
      ];
      const tot: number[] = [];
      const ys: number[][] = [];
      let sum = 0;
      const D: string[] = [];

      for (let i = 0; i < K; i++) {
        tot[i] = 0;
        D[i] = 'Oct ' + (6 + i);
        for (let k = 0; k < 4; k++) tot[i] += A[k][2][i];
        sum += tot[i];
      }

      const mx = Math.max.apply(0, tot);
      const sc = (H * 0.74) / mx;
      const pk = tot.indexOf(mx);
      const xs = (i: number) => (i * W) / (K - 1);

      for (let k = 0; k < 4; k++) {
        ys[k] = [];
        for (let i = 0; i < K; i++) {
          let y = H / 2 - (tot[i] * sc) / 2;
          for (let j = 0; j < k; j++) y += A[j][2][i] * sc;
          ys[k][i] = y;
        }
      }

      function cv(p: number[][]) {
        let d = '';
        for (let q = 1; q < p.length; q++) {
          const m = (p[q - 1][0] + p[q][0]) / 2;
          d += 'C' + m + ',' + p[q - 1][1] + ' ' + m + ',' + p[q][1] + ' ' + p[q][0] + ',' + p[q][1];
        }
        return d;
      }

      let h =
        '<svg viewBox="0 0 ' +
        W +
        ' ' +
        (H + 26) +
        '"><defs>' +
        A.map(function(a, k) {
          return (
            '<linearGradient id="sg' +
            k +
            '" x1="0" x2="1"><stop offset="0" stop-color="' +
            a[1] +
            '" stop-opacity=".5"/><stop offset=".6" stop-color="' +
            a[1] +
            '" stop-opacity=".92"/><stop offset="1" stop-color="' +
            a[1] +
            '"/></linearGradient>'
          );
        }).join('') +
        '</defs>';

      A.forEach(function(a, k) {
        const t: number[][] = [];
        const b: number[][] = [];
        for (let q = 0; q < K; q++) {
          t.push([xs(q), ys[k][q]]);
          b.push([xs(q), ys[k][q] + a[2][q] * sc - 2.5]);
        }
        b.reverse();
        h +=
          '<path d="M' +
          t[0] +
          cv(t) +
          'L' +
          b[0] +
          cv(b) +
          'Z" fill="url(#sg' +
          k +
          ')"/><path d="M' +
          t[0] +
          cv(t) +
          '" fill="none" stroke="#fff" stroke-opacity=".35"/>';
      });

      for (let i = 0; i < K; i += 2) {
        h +=
          '<text x="' +
          xs(i) +
          '" y="' +
          (H + 20) +
          '" fill="#fdf6ee" fill-opacity=".5" font-size="14" text-anchor="middle">' +
          D[i] +
          '</text>';
      }

      const px = xs(pk);
      const py = ys[0][pk] - 8;
      h +=
        '<circle class="pk" cx="' +
        px +
        '" cy="' +
        py +
        '" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="' +
        px +
        '" cy="' +
        py +
        '" r="4" fill="#fff"/><line id="sl" y1="0" y2="' +
        H +
        '" stroke="#fff" stroke-dasharray="3 5" stroke-opacity=".6"/>' +
        A.map(function() {
          return '<circle class="dt" r="5.5" stroke="#fff" stroke-width="2"/>';
        }).join('') +
        '</svg>';

      sv.insertAdjacentHTML('afterbegin', h);
      const sl = $('#sl');
      const dots = sv.querySelectorAll<HTMLElement>('.dt');
      A.forEach(function(a, k) {
        if (dots[k]) dots[k].setAttribute('fill', a[1]);
      });

      const rk = $('#rk');
      if (rk) rk.textContent = Math.round(sum) + 'K';
      const lgd = $('#lgd');
      if (lgd) {
        lgd.innerHTML = A.slice()
          .reverse()
          .map(function(a) {
            return '<span><i style="background:' + a[1] + '"></i>' + a[0] + '</span>';
          })
          .join('');
      }

      function go(f: number) {
        f = Math.max(0, Math.min(K - 1, f));
        const i0 = Math.min(K - 2, Math.floor(f));
        let t = f - i0;
        t = t * t * (3 - 2 * t);
        const x = (f * W) / (K - 1);
        if (sl) {
          sl.setAttribute('x1', String(x));
          sl.setAttribute('x2', String(x));
        }
        let s2 = '<small>' + D[Math.round(f)] + '</small>';
        A.forEach(function(a, k) {
          const v = a[2][i0] + (a[2][i0 + 1] - a[2][i0]) * t;
          const y0 = ys[k][i0] + (ys[k][i0 + 1] - ys[k][i0]) * t;
          if (dots[k]) {
            dots[k].setAttribute('cx', String(x));
            dots[k].setAttribute('cy', String(y0 + (v * sc) / 2));
          }
          s2 +=
            '<div style="border-color:' +
            a[1] +
            '"><small>' +
            a[0] +
            '</small><b>' +
            v.toFixed(1) +
            'K</b></div>';
        });
        if (tip && sv) {
          tip.innerHTML = s2;
          const w = sv.clientWidth;
          const hw = tip.offsetWidth / 2;
          tip.style.left = Math.max(hw, Math.min(w - hw, (x / W) * w)) + 'px';
        }
      }

      sv.addEventListener('pointermove', function(e) {
        hov = 1;
        const r = sv.getBoundingClientRect();
        go(((e.clientX - r.left) / r.width) * (K - 1));
      });
      sv.addEventListener('pointerleave', function() {
        hov = 0;
      });

      function loop(t: number) {
        if (!hov) go(((Math.sin(t / 2400 - 1.2) + 1) / 2) * (K - 1));
        streamRafId = requestAnimationFrame(loop);
      }
      streamRafId = requestAnimationFrame(loop);
    }

    // 3D Platform Sphere in Stage
    const sp = $('#sp');
    const st = $('#stage');
    let sphereRafId = 0;
    interface SphereTile extends HTMLDivElement {
      v: [number, number, number];
      a: number;
      b: number;
    }
    const T: SphereTile[] = [];
    let R = 200;
    let ry = 0;
    let rx = -0.25;
    let vy = 0.004;
    let drag = 0;
    let lx = 0;
    let ly = 0;

    if (sp && st) {
      P.forEach(function(p, i) {
        const y = 1 - (2 * (i + 0.5)) / N;
        const r = Math.sqrt(1 - y * y);
        const t = i * 2.39996;
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r;
        const d = document.createElement('div') as unknown as SphereTile;
        d.className = 'tl';
        d.style.background = p[1];
        d.style.color = p[2];
        d.innerHTML = svg(p, 34) + '<small>' + p[0].replace('Manual / Other', 'Other') + '</small>';
        d.v = [x, y, z];
        d.a = Math.atan2(x, z);
        d.b = Math.asin(y);
        sp.appendChild(d);
        T.push(d);
      });

      function sizeSphere() {
        if (!st) return;
        const availableR = Math.min(st.clientWidth * 0.44, st.clientHeight * 0.46, 275);
        R = Math.max(185, Math.round(availableR));
        T.forEach(function(d) {
          d.style.transform = 'rotateY(' + d.a + 'rad) rotateX(' + d.b + 'rad) translateZ(' + R + 'px)';
        });
      }
      sizeSphere();
      window.addEventListener('resize', sizeSphere);
      const coreEl = sp.querySelector('.core') as HTMLElement | null;

      function fr() {
        if (!sp) return;
        if (!drag) ry += vy;
        sp.style.transform = 'rotateX(' + rx + 'rad) rotateY(' + ry + 'rad)';
        if (coreEl) {
          coreEl.style.transform = 'rotateY(' + -ry + 'rad) rotateX(' + -rx + 'rad)';
        }
        const cy = Math.cos(ry);
        const sy = Math.sin(ry);
        const cx = Math.cos(rx);
        const sx = Math.sin(rx);
        T.forEach(function(d) {
          const v = d.v;
          const z1 = -v[0] * sy + v[2] * cy;
          const z2 = -v[1] * sx + z1 * cx;
          d.style.opacity = String(0.3 + (0.7 * (z2 + 1)) / 2);
        });
        sphereRafId = requestAnimationFrame(fr);
      }
      sphereRafId = requestAnimationFrame(fr);

      const handlePointerDown = (e: PointerEvent) => {
        drag = 1;
        lx = e.clientX;
        ly = e.clientY;
      };
      const handlePointerUp = () => {
        drag = 0;
      };
      const handlePointerMove = (e: MouseEvent) => {
        if (!drag) return;
        ry += (e.clientX - lx) * 0.01;
        rx = Math.max(-1, Math.min(1, rx - (e.clientY - ly) * 0.006));
        lx = e.clientX;
        ly = e.clientY;
      };

      st.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointermove', handlePointerMove);
    }

    // Publish everywhere demo click
    let busy = 0;
    const pubBtn = $('#pub');
    const stt = $('#st');
    if (pubBtn && stt) {
      pubBtn.onclick = function() {
        if (busy) return;
        busy = 1;
        let c = 0;
        vy = 0.03;
        stt.innerHTML = 'Publishing <b id="pc">0</b>/' + N + ' …';

        T.forEach(function(d, i) {
          setTimeout(function() {
            d.classList.add('ok');
            const pc = $('#pc');
            if (pc) pc.textContent = String(++c);
            if (c === N) {
              vy = 0.004;
              stt.innerHTML = '✓ Live on <b>' + N + ' platforms</b> · 1 link · 1 click';
            }
          }, i * 90);
        });

        setTimeout(function() {
          T.forEach(function(d) {
            d.classList.remove('ok');
          });
          stt.innerHTML = 'Ready · <b>' + N + ' platforms</b> connected';
          busy = 0;
        }, N * 90 + 3200);
      };
    }

    // Animated platform counter (0 -> 30)
    let n1Count = 0;
    const n1 = $('#n1');
    const c1 = setInterval(function() {
      if (!n1) return;
      n1.textContent = String(++n1Count);
      if (n1Count >= N) clearInterval(c1);
    }, 40);

    // Profile subdomain cycling
    const names = ['yourname', 'pixenox', 'acme', 'studio'];
    let ni = 0;
    const nmEl = $('#nm');
    const nameInterval = setInterval(function() {
      ni = (ni + 1) % 4;
      if (nmEl) nmEl.textContent = names[ni];
    }, 2200);

    // 3D Phone Deck cycling & tilt
    const cds = $$('.cd');
    const tbBtns = $$('#tabs button[data-i]');
    const cps = [
      'Instagram · Visual narrative · 2,200 chars',
      'LinkedIn · Professional authority · 3,000 chars'
    ];
    let act = 0;
    let deckHov = 0;
    const dk = $('#deck');
    const cap = $('#cap');

    function setDeck(a: number) {
      act = a;
      const total = cds.length;
      cds.forEach(function(c, i) {
        if (total === 2) {
          const p = i === a ? 0 : (i === 1 ? 1 : -1);
          c.style.setProperty('--p', String(p));
          c.style.setProperty('--a', String(Math.abs(p)));
          c.style.zIndex = i === a ? '3' : '1';
          c.classList.toggle('cur', i === a);
        } else {
          const d = (i - a + total) % total;
          const p = d === 0 ? 0 : d === 1 ? 1 : -1;
          c.style.setProperty('--p', String(p));
          c.style.setProperty('--a', String(Math.abs(p)));
          c.style.zIndex = d === 0 ? '3' : '1';
          c.classList.toggle('cur', d === 0);
        }
      });
      tbBtns.forEach(function(b, i) {
        b.classList.toggle('on', i === a);
      });
      if (cap && cps[a]) cap.textContent = cps[a];
    }

    cds.forEach(function(c, i) {
      c.onclick = function() {
        setDeck(i);
      };
    });
    tbBtns.forEach(function(b, i) {
      b.onclick = function() {
        setDeck(i);
      };
    });
    setDeck(0);

    if (dk) {
      dk.onmouseenter = function() {
        deckHov = 1;
      };
      dk.onmouseleave = function() {
        deckHov = 0;
        dk.style.setProperty('--tx', '0');
        dk.style.setProperty('--ty', '0');
      };
      dk.addEventListener('mousemove', function(e) {
        const r = dk.getBoundingClientRect();
        dk.style.setProperty('--tx', String(((e.clientX - r.left) / r.width - 0.5) * 18));
        dk.style.setProperty('--ty', String(-((e.clientY - r.top) / r.height - 0.5) * 10));
      });
    }

    const deckInterval = setInterval(function() {
      if (!deckHov && cds.length > 0) setDeck((act + 1) % cds.length);
    }, 5000);

    // Smart Scheduling Calendar dots
    const cal = $('#cal');
    if (cal) {
      let hh = '';
      for (let i = 0; i < 28; i++) {
        hh += '<i class="' + (i % 5 === 2 ? 'f' : '') + (i === 17 ? ' h' : '') + '"></i>';
      }
      cal.innerHTML = hh;
    }

    // Human in the loop Approve toggle
    const ap = $('#ap');
    if (ap) {
      ap.onclick = function() {
        ap.classList.toggle('on');
        ap.textContent = ap.classList.contains('on') ? 'Approved ✓' : 'Approve';
      };
    }

    // Card hover spotlight tracking (tilt/rotation removed)
    function tilt(el: HTMLElement, m: number, w?: HTMLElement) {
      const targetWrap = w || el;
      targetWrap.addEventListener('mousemove', function(e) {
        const r = targetWrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        // Tilt/rotation removed: keep only spotlight coordinate tracking
        el.style.setProperty('--mx', (x + 0.5) * r.width + 'px');
        el.style.setProperty('--my', (y + 0.5) * r.height + 'px');
      });
      targetWrap.addEventListener('mouseleave', function() {
        // Transform reset removed
      });
    }

    $$('.bt:not(.ua-bento-card)').forEach(function(e) {
      tilt(e, 8);
    });
    $$('.pc').forEach(function(e) {
      tilt(e, 12);
    });
    const pf = $('#pf');
    const pst = $('#pst');
    if (pf && pst) tilt(pf, 34, pst);

    // Reveal on scroll
    const io = new IntersectionObserver(
      function(es) {
        es.forEach(function(e) {
          if (e.isIntersecting) e.target.classList.add('in');
        });
      },
      { threshold: 0.15 }
    );
    $$('.rv').forEach(function(e) {
      io.observe(e);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(c1);
      clearInterval(nameInterval);
      clearInterval(deckInterval);
      cancelAnimationFrame(sphereRafId);
      cancelAnimationFrame(streamRafId);
      io.disconnect();
    };
  }, []);

  return (
    <div className="unool-home-page" ref={rootRef}>
      <div id="bar"></div>

      {/* Navigation */}
      <nav id="nav">
        <div className="ni">
          <Link
            href="#overview"
            className="lg"
            aria-label="UNOOL Home"
            onClick={(e) => scrollToSection(e, '#overview')}
          >
            <img src="/unool-logo-white.png" alt="UNOOL" className="lg-img" />
          </Link>
          <div className="nl">
            <a
              href="#overview"
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#overview')}
            >
              Overview
            </a>
            <a
              href="#voices"
              className={activeSection === 'voices' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#voices')}
            >
              Platforms
            </a>
            <a
              href="#features"
              className={activeSection === 'features' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#features')}
            >
              Features
            </a>
            <a
              href="#profile"
              className={activeSection === 'profile' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#profile')}
            >
              Profiles
            </a>
            <a
              href="#analytics"
              className={activeSection === 'analytics' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#analytics')}
            >
              Analytics
            </a>
            <a
              href="#pricing"
              className={activeSection === 'pricing' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#pricing')}
            >
              Pricing
            </a>
          </div>
          <div className="nr">
            <Link href="/signin">Log in</Link>
            <Link className="btn" href="/signup">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="dark">
        {/* Hero Section */}
        <section id="overview">
          <div className="hero-content">
            <div className="hero-pill-badge">
              <span className="hero-pill-sparkle">✦</span>
              <span className="hero-pill-tag">Unified Social Engine</span>
              <span className="hero-pill-sep">·</span>
              <span className="hero-pill-text">30+ Channels Sync Live</span>
              <span className="hero-pill-arrow">→</span>
            </div>
            <h1 className="d">
              <span>
                <s style={{ '--i': 1 } as React.CSSProperties}>One</s>{' '}
                <s style={{ '--i': 2 } as React.CSSProperties}>link.</s>
              </span>
              <span>
                <em>
                  <s style={{ '--i': 3 } as React.CSSProperties}>One</s>{' '}
                  <s style={{ '--i': 4 } as React.CSSProperties}>click.</s>
                </em>
              </span>
              <span>
                <s style={{ '--i': 5 } as React.CSSProperties}>Everywhere.</s>
              </span>
            </h1>
            <p className="sub">
              Unool is your social media command center. Paste a single link and we build your profile,
              write platform-native posts, and publish to LinkedIn, X, Instagram, YouTube, Discord and
              30+ more — in one click.
            </p>
            <div className="go">
              <input
                id="url"
                value="https://yourname.unool.co"
                readOnly
                aria-label="Your link"
                style={{ cursor: 'default' }}
              />
              <button className="btn" id="pub">
                Publish everywhere →
              </button>
            </div>
            <div id="st">
              <span className="st-pulse-dot"></span>
              <span>Ready · <b>30 platforms</b> connected live</span>
            </div>
            <div className="stats">
              <div className="stat-card">
                <div className="stat-val"><span id="n1">0</span>+</div>
                <div className="stat-lbl">Platforms</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">1</div>
                <div className="stat-lbl">Link</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">1</div>
                <div className="stat-lbl">Click</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">30s</div>
                <div className="stat-lbl">Setup</div>
              </div>
            </div>
          </div>

          <div className="stage" id="stage" ref={stageRef}>
            <div className="sp" id="sp" ref={spRef}>
              <div className="core">
                <img src="/unool-icon.png" alt="UNOOL" className="core-img" />
              </div>
            </div>
          </div>
        </section>

        {/* Diagonal Marquee Ticker Bands */}
        <div className="bands">
          <div className="bd a">
            <div id="m1"></div>
          </div>
          <div className="bd b">
            <div id="m2"></div>
          </div>
        </div>

        {/* Platform Voices Section */}
        <section id="voices">
          <h2 className="d rv">
            One thought. <em>Every voice.</em>
          </h2>
          <p className="sub rv" style={{ margin: '24px auto 0' }}>
            Unool adapts your content to each platform’s native format, tone, and limits. Here are just
            three examples out of 30+.
          </p>

          {/* Interactive Flow Step Switcher */}
          <div className="flow-steps-nav rv">
            <div className="flow-step-pills">
              <button
                type="button"
                className={`flow-step-pill ${flowStep === 0 ? 'active' : ''}`}
                onClick={() => { setFlowStep(0); setIsPlaying(false); }}
              >
                <span className="flow-step-num">1</span>
                <span>Connect</span>
              </button>
              <button
                type="button"
                className={`flow-step-pill ${flowStep === 1 ? 'active' : ''}`}
                onClick={() => { setFlowStep(1); setIsPlaying(false); }}
              >
                <span className="flow-step-num">2</span>
                <span>Write</span>
              </button>
              <button
                type="button"
                className={`flow-step-pill ${flowStep === 2 ? 'active' : ''}`}
                onClick={() => { setFlowStep(2); setIsPlaying(false); }}
              >
                <span className="flow-step-num">3</span>
                <span>Adapt</span>
              </button>
            </div>
          </div>

          {/* macOS Browser Mockup Container for Steps 1 & 2 */}
          <div className={`flow-browser-window rv ${flowStep === 2 ? 'flow-hidden' : ''}`}>
            <div className="flow-browser-topbar">
              <div className="flow-window-dots">
                <span className="flow-window-dot red"></span>
                <span className="flow-window-dot yellow"></span>
                <span className="flow-window-dot green"></span>
              </div>
              <div className="flow-url-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>app.unool.co/automation</span>
              </div>
              <div className="flow-browser-subnav">
                <span className={`flow-subnav-tab ${flowStep === 1 ? 'active' : ''}`} onClick={() => setFlowStep(1)}>
                  Compose
                </span>
                <span className="flow-subnav-tab" onClick={() => setFlowStep(0)}>
                  Accounts
                </span>
                <span className="flow-subnav-tab" onClick={() => setFlowStep(2)}>
                  Previews
                </span>
              </div>
              <div className="flow-live-badge">
                <span className="flow-live-dot"></span>
                <span>LIVE DEMO</span>
              </div>
            </div>

            {/* STEP 1: Connect your accounts */}
            {flowStep === 0 && (
              <div className="flow-step-connect">
                <h3 className="flow-step-title">Connect your accounts</h3>
                <p className="flow-step-subtitle">
                  Connect your business and personal channels once. Unool handles native formatting, tone, and character limits automatically.
                </p>

                <div className="flow-account-grid">
                  {/* Instagram Card */}
                  <div className={`flow-account-card ${connectedAccounts.instagram ? 'connected' : ''}`}>
                    <div className="flow-account-header">
                      <div className="flow-account-icon ig-gradient">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                          <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>
                        </svg>
                      </div>
                      <div className="flow-account-info">
                        <span className="flow-account-name">Instagram</span>
                        <span className="flow-account-sub">Business or creator account</span>
                      </div>
                    </div>
                    <div className="flow-account-status">
                      {connectedAccounts.instagram ? (
                        <span className="status-connected">✓ Connected as @pixenox</span>
                      ) : (
                        <span className="status-idle">Not connected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`flow-connect-btn ${isInstagramConnecting ? 'connecting' : ''} ${connectedAccounts.instagram ? 'connected' : ''}`}
                      onClick={handleConnectInstagram}
                    >
                      {isInstagramConnecting ? (
                        <>
                          <span className="flow-spinner"></span>
                          <span>Connecting...</span>
                        </>
                      ) : connectedAccounts.instagram ? (
                        <>
                          <span>✓ Connected</span>
                        </>
                      ) : (
                        <span>Connect Instagram</span>
                      )}
                    </button>
                  </div>

                  {/* LinkedIn Card */}
                  <div className={`flow-account-card ${connectedAccounts.linkedin ? 'connected' : ''}`}>
                    <div className="flow-account-header">
                      <div className="flow-account-icon li-blue">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </div>
                      <div className="flow-account-info">
                        <span className="flow-account-name">LinkedIn</span>
                        <span className="flow-account-sub">Personal profile or Page</span>
                      </div>
                    </div>
                    <div className="flow-account-status">
                      {connectedAccounts.linkedin ? (
                        <span className="status-connected">✓ Connected as Pixenox</span>
                      ) : (
                        <span className="status-idle">Not connected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`flow-connect-btn li-btn ${isLinkedInConnecting ? 'connecting' : ''} ${connectedAccounts.linkedin ? 'connected' : ''}`}
                      onClick={handleConnectLinkedIn}
                    >
                      {isLinkedInConnecting ? (
                        <>
                          <span className="flow-spinner"></span>
                          <span>Connecting...</span>
                        </>
                      ) : connectedAccounts.linkedin ? (
                        <>
                          <span>✓ Connected</span>
                        </>
                      ) : (
                        <span>Connect LinkedIn</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flow-step-actions">
                  <button
                    type="button"
                    className="flow-next-btn"
                    onClick={() => setFlowStep(1)}
                  >
                    <span>Next: Write the post</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Writing the post */}
            {flowStep === 1 && (
              <div className="flow-step-write">
                <div className="flow-post-container">
                  <span className="flow-post-label">NEW POST</span>

                  {/* Attached Media */}
                  <div className="flow-media-card">
                    <img
                      src="/linen-wrap-dress.jpg"
                      alt="linen-wrap-dress.jpg"
                      className="flow-media-thumb"
                    />
                    <div className="flow-media-meta">
                      <span className="flow-media-filename">linen-wrap-dress.jpg</span>
                      <span className="flow-media-specs">1080 × 1350 · attached</span>
                    </div>
                    <span className="flow-media-badge">Attached</span>
                  </div>

                  {/* Post Draft Box (Linen Wrap Dress) */}
                  <div className="flow-draft-box">
                    <p className="flow-draft-content">
                      Meet the Linen Wrap Dress 🌿 Hand-woven terracotta, made for warm days. Sizes XS–XL. First 50 pieces: 20% off this week.
                    </p>
                  </div>

                  {/* Platform Indicator */}
                  <div className="flow-destinations-bar">
                    <div className="flow-platform-chips">
                      <span className="chip ig-gradient">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839"/></svg>
                      </span>
                      <span className="chip li-blue">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </span>
                    </div>
                    <span className="flow-destinations-text">Posting to both</span>
                  </div>

                  {/* Adapt Action Button */}
                  <button
                    type="button"
                    className={`flow-adapt-cta ${isAdapted ? 'adapted' : ''}`}
                    onClick={handleAdapt}
                  >
                    {isAdapted ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>✓ Adapted for both</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Adapt for both</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Phone Deck (Mobile View in Original Respective Platforms) */}
          <div className={`flow-adapt-stage rv ${flowStep !== 2 ? 'flow-hidden' : ''}`}>
            <div className="deck" id="deck">
              <div className="cd ig"></div>
              <div className="cd li"></div>
            </div>

            <div className="tabs" id="tabs">
              <button className="on" data-i="0">
                Instagram
              </button>
              <button data-i="1">LinkedIn</button>
            </div>
            <p id="cap">Instagram · Visual narrative · 2,200 chars</p>
          </div>
        </section>
      </div>

      {/* Features Bento Grid */}
      <section id="features">
        <h2 className="d rv">
          Everything flows. <em>Nothing breaks.</em>
        </h2>
        <div className="bento" id="bento">
          <div className="bt w12 dk rv">
            <div className="ib">❖</div>
            <h3>Multi-Network Composer</h3>
            <p>Write once. Adapted to every platform’s limits, formatting and best practices.</p>
            <div className="chips" id="chips"></div>
          </div>

          <div className="bt rv">
            <div className="ib">✓</div>
            <h3>Human-in-the-Loop</h3>
            <p>AI drafts. You approve. Nothing posts without your click.</p>
            <div className="ab">
              <button className="ap" id="ap">
                Approve
              </button>
              <button>Edit</button>
            </div>
          </div>

          <div className="bt w8 rv ua-bento-card">
            <BentoVideoPlayer />
          </div>

          {/* Video 3: Automate Comments & DMs (Added right after Image 2) */}
          <div className="bt w12 rv ua-bento-card ua-automation-card" style={{ padding: 0 }}>
            <AutomationVideoPlayer />
          </div>

        </div>
      </section>

      {/* Profile Section */}
      <section id="profile">
        <h2 className="d rv">
          Your entire professional story. <em>One beautiful URL.</em>
        </h2>
        <p className="lead rv">
          Paste your LinkedIn, portfolio, or GitHub. Unool builds a stunning profile at{' '}
          <b>yourname.unool.co</b> in under 30 seconds.
        </p>
        <div className="split">
          <div className="pst" id="pst">
            {/* Authentic Unool Phone Frame */}
            <div className="pf" id="pf">
              {/* Dynamic Island Pill */}
              <div className="pf-notch">
                <span className="pf-notch-lens"></span>
                <span className="pf-notch-sensor"></span>
              </div>

              {/* Status bar */}
              <div className="pf-status" style={{ color: currentTpl.appBarColor }}>
                <span>9:41</span>
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <svg width="13" height="9" viewBox="0 0 17 11" fill="currentColor">
                    <rect y="7" width="3" height="4" rx=".8" />
                    <rect x="4.6" y="5" width="3" height="6" rx=".8" />
                    <rect x="9.2" y="2.5" width="3" height="8.5" rx=".8" />
                    <rect x="13.8" width="3" height="11" rx=".8" />
                  </svg>
                  <svg width="12" height="9" viewBox="0 0 16 11" fill="currentColor">
                    <path d="M8 10.4l2-2.1a2.9 2.9 0 00-4 0zM3.7 6a6 6 0 018.6 0l1.2-1.3a7.8 7.8 0 00-11 0zM.8 3A10.2 10.2 0 0115.2 3L16 1.8a11.7 11.7 0 00-16 0z" />
                  </svg>
                  <svg width="18" height="9" viewBox="0 0 25 12" fill="currentColor">
                    <rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".5" />
                    <rect x="2" y="2" width="16" height="8" rx="2" />
                    <path d="M23 4v4c.8-.3 1.5-1 1.5-2s-.7-1.7-1.5-2z" opacity=".6" />
                  </svg>
                </span>
              </div>

              {/* Top App bar */}
              <div className="pf-appbar" style={{ color: currentTpl.appBarColor }}>
                <span style={{ cursor: 'pointer', fontSize: '18px' }}>☰</span>
                <div className="brand">
                  unool<span>.</span>
                </div>
                <span>😎</span>
              </div>

              {/* Scrollable Screen Body */}
              <div
                className="pf-screen"
                style={{
                  background: currentTpl.screenBg,
                  color: currentTpl.textColor,
                }}
              >
                {/* Avatar with verified badge */}
                <div className="pf-avatar-wrap">
                  <div
                    className="pf-avatar"
                    style={{
                      background: currentTpl.avatarBg,
                    }}
                  >
                    {currentTpl.avatarText}
                  </div>
                  <span className="pf-badge-verified" title="Verified Unool Profile">
                    ✓
                  </span>
                </div>

                {/* Profile Name & Subtitle */}
                <h4 className="pf-name">Pixenox</h4>
                <div className="pf-role" style={{ color: currentTpl.subtextColor }}>
                  {currentTpl.role}
                </div>

                {/* Proof Points Grid (Original Unool feature) */}
                <div className="pf-proofs">
                  {currentTpl.proofs.map((pr, pIdx) => (
                    <div
                      key={pIdx}
                      className="pf-proof-item"
                      style={{
                        background: currentTpl.proofBg,
                        border: currentTpl.proofBorder,
                      }}
                    >
                      <span className="pf-proof-val" style={{ color: currentTpl.proofValColor }}>
                        {pr.val}
                      </span>
                      <span className="pf-proof-lbl" style={{ color: currentTpl.proofLblColor }}>
                        {pr.lbl}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bio / Quote Box */}
                {currentTpl.bio && (
                  <div
                    className="pf-bio"
                    style={{
                      background: currentTpl.proofBg,
                      color: currentTpl.subtextColor,
                    }}
                  >
                    {currentTpl.bio}
                  </div>
                )}

                {/* Authentic Link Cards */}
                <div className="pf-links">
                  {currentTpl.links.map((lk, lIdx) => (
                    <div
                      key={lIdx}
                      className="pf-link-card"
                      style={{
                        background: currentTpl.linkBg,
                        border: currentTpl.linkBorder,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = currentTpl.linkHoverBorder;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = currentTpl.linkBorder.replace('1px solid ', '');
                      }}
                    >
                      <i
                        className="pf-link-icon"
                        style={{
                          background: lk.iconBg,
                          color: lk.iconFg,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `<svg viewBox="0 0 24 24" width="16" height="16" fill="${lk.iconFg}">${lk.iconSvg}</svg>`,
                        }}
                      />
                      <div className="pf-link-info">
                        <span className="pf-link-title" style={{ color: currentTpl.linkTitleColor }}>
                          {lk.title}
                        </span>
                        <span className="pf-link-sub" style={{ color: currentTpl.linkSubColor }}>
                          {lk.subtitle}
                        </span>
                      </div>
                      <span className="pf-link-arrow" style={{ color: currentTpl.color }}>
                        →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rv">
            <h3 className="d">
              Every link. <em>One home.</em>
            </h3>
            <p className="lead" style={{ margin: 0 }}>
              Automated storytelling across every network you use. Customizable, instantly shareable — pick
              a theme and watch it change live.
            </p>

            {/* Template Swatches matching Image 2 */}
            <div className="sw" id="sw" style={{ marginTop: '24px' }}>
              {PROFILE_PREVIEW_TEMPLATES.map((tpl, i) => (
                <button
                  key={tpl.id}
                  className={activeProfileTpl === i ? 'on' : ''}
                  style={{ background: tpl.color }}
                  data-c={tpl.color}
                  title={`${tpl.name} (${tpl.category})`}
                  aria-label={tpl.name}
                  onClick={() => {
                    setActiveProfileTpl(i);
                    if (rootRef.current) {
                      rootRef.current.style.setProperty('--acc', tpl.color);
                    }
                  }}
                />
              ))}
            </div>

            <Link className="btn" href="/signup">
              Get started →
            </Link>
          </div>
        </div>

        {/* Analytics & Insights — placed after Every link. One home. */}
        <div
          id="analytics"
          className="an-wrap"
          style={{
            maxWidth: '1100px',
            margin: '80px auto 0',
            textAlign: 'left',
            perspective: '1400px',
          }}
        >
          <div className="bt w12 dk an rv">
            <div>
              <div className="ib">↗</div>
              <h3>Analytics &amp; Insights</h3>
              <p>
                Track engagement across all platforms in one dashboard. Understand what resonates. Grow
                intelligently.
              </p>
              <div className="kp">
                <div>
                  <b id="rk">—</b>
                  <small>Reach · 14 days</small>
                </div>
                <div>
                  <b>6.9%</b>
                  <small>Engagement</small>
                </div>
                <div>
                  <b>Tue 9:40</b>
                  <small>Best time</small>
                </div>
              </div>
              <div className="lgd" id="lgd"></div>
            </div>
            <div className="strm" id="strm" ref={stmRef}>
              <div className="tip" id="tip" ref={tipRef}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <div className="pricing-header-wrap">
          <h2 className="d rv">
            Start free. <em>Scale when you’re ready.</em>
          </h2>
          <div className="pricing-sublink rv">
            <Link href="/pricing">
              Compare all 4 plans &amp; full features (including Studio for agencies) →
            </Link>
          </div>
        </div>
        <div className="pl">
          {/* Spark (Free) */}
          <div className="pc rv">
            <h3>Spark</h3>
            <div className="for">Perfect for solo creators &amp; founders</div>
            <div className="pr">
              $0<small>/mo (Free forever)</small>
            </div>
            <ul>
              <li>1 profile at yourname.unool.co</li>
              <li>15 scheduled posts/month</li>
              <li>2 connected platforms</li>
              <li>5 persona templates</li>
              <li>Follow-to-Unlock gates</li>
              <li>250 automated IG comments/mo</li>
            </ul>
            <Link className="btn" href="/signup">
              Get Started Free
            </Link>
          </div>

          {/* Creator */}
          <div className="pc rv">
            <h3>Creator</h3>
            <div className="for">For growing creators &amp; personal brands</div>
            <div className="pr">
              ₹799<small>/mo ($9)</small>
            </div>
            <ul>
              <li>Everything in Spark, plus:</li>
              <li>Unlimited posts/month</li>
              <li>4 connected platforms</li>
              <li>All 16 persona templates</li>
              <li>No "Made with Unool" badge</li>
              <li>Basic DM Concierge &amp; 90-day analytics</li>
            </ul>
            <Link className="btn" href="/signup?plan=creator">
              Start 14-day trial
            </Link>
          </div>

          {/* Pro */}
          <div className="pc pro rv">
            <div className="pc-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="for">The full engine for serious creators &amp; teams</div>
            <div className="pr">
              ₹1,999<small>/mo ($24)</small>
            </div>
            <ul>
              <li>Everything in Creator, plus:</li>
              <li>8 connected platforms</li>
              <li>Custom domain (yourdomain.com)</li>
              <li>Full DM Concierge + Knowledge Base</li>
              <li>FlightPlan AI &amp; Lead Scoring</li>
              <li>3 team seats &amp; priority support</li>
            </ul>
            <Link className="btn" href="/signup?plan=pro">
              Get Pro →
            </Link>
          </div>

          {/* Studio (Agency) */}
          <div className="pc studio rv">
            <div className="pc-badge" style={{ background: '#8b5cf6', boxShadow: '0 4px 12px rgba(139, 92, 246, .35)' }}>
              Agency
            </div>
            <h3>Studio</h3>
            <div className="for">For agencies &amp; teams</div>
            <div className="pr">
              ₹4,166<small>/mo ($49)</small>
            </div>
            <ul>
              <li>Everything in Pro, plus:</li>
              <li>3 workspaces (3 brands/clients)</li>
              <li>Full white-label (zero branding)</li>
              <li>Unlimited channels &amp; AI credits</li>
              <li>10 team seats + granular roles</li>
              <li>Webhook API + Zapier triggers</li>
              <li>Priority support + onboarding call</li>
            </ul>
            <Link className="btn" href="/signup?plan=studio" style={{ background: '#8b5cf6' }}>
              Start 14-day trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta">
        <h2 className="d rv">
          Ready to own your
          <br />
          <em>professional presence?</em>
        </h2>
        <Link className="btn" href="/signup" style={{ padding: '20px 40px', fontSize: '18px' }}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <Link
              href="#overview"
              className="lg"
              aria-label="UNOOL Home"
              onClick={(e) => scrollToSection(e, '#overview')}
            >
              <img src="/unool-logo.png" alt="UNOOL" className="lg-img" />
            </Link>
            <p className="footer-legal-text">
              Unool is a personal branding and publishing platform owned and operated by{' '}
              <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">
                Pixenox Solutions
              </a>
              . Built to help founders, creators, and teams own their professional narrative.
            </p>
            <p className="footer-legal-text" style={{ fontSize: '12px', marginTop: '6px', opacity: 0.8 }}>
              Corporate Portal:{' '}
              <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">
                www.pixenox.com
              </a>{' '}
              · Prathipadu, Kakinada District, Andhra Pradesh, India
            </p>
          </div>

          <div className="footer-links-group">
            <span className="footer-heading">Legal &amp; Policies</span>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/refund">Refund &amp; Cancellation</Link>
            <Link href="/shipping">Shipping &amp; Delivery</Link>
          </div>

          <div className="footer-links-group">
            <span className="footer-heading">Support &amp; Contact</span>
            <Link href="/contact">Contact Us</Link>
            <a href="mailto:connect@pixenox.com">connect@pixenox.com</a>
            <a href="mailto:support@unool.co">support@unool.co</a>
            <span style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '4px' }}>
              Support Hours: Mon-Fri 9AM-6PM IST
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Pixenox Solutions. All rights reserved.</span>
          <span>Unool &trade; is a registered trademark of Pixenox Solutions.</span>
        </div>
      </footer>
    </div>
  );
}