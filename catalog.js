(function () {
  var BASE = 'https://cdn.tools.deniz.cyou/';
  var REPO = 'https://github.com/denizwp/hogwarts-icons';
  var URL_LIMIT = 8000;
  var JSON_LIMIT = 60000;
  var NAME_LIMIT = 120;
  // The site shows this folder only. The CDN holds other folders too; their direct URLs keep working.
  var ROOT = 'icons';
  var TRANSLATABLE_EXT = /\.webp$/;
  var CHUNK = 240;
  var STORE_LANG = 'hogwarts-icons.lang';
  var STORE_DRAFTS = 'hogwarts-icons.drafts';

  // Used only when names/languages.json cannot be read.
  var DEFAULT_LANGUAGES = { en: 'English', tr: 'Türkçe' };

  // Languages a person may propose. names/languages.json decides which are open:
  // anything else can be drafted here, but submitting needs the owner to add it first.
  var PROPOSABLE = {
    ar: 'العربية', bg: 'Български', da: 'Dansk', el: 'Ελληνικά', fi: 'Suomi', he: 'עברית', hu: 'Magyar', id: 'Bahasa Indonesia',
    lt: 'Lietuvių', no: 'Norsk', 'pt-PT': 'Português (Portugal)', ro: 'Română', sk: 'Slovenčina', sv: 'Svenska', th: 'ไทย', vi: 'Tiếng Việt'
  };

  // Flag for each language's country of origin (flag-icons, MIT; es, br and sa simplified for this size). Windows browsers draw no flag emoji.
  var FLAGS = {
    en: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23012169" d="M0 0h640v480H0z"/><path fill="%23FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"/><path fill="%23C8102E" d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"/><path fill="%23FFF" d="M241 0v480h160V0zM0 160v160h640V160z"/><path fill="%23C8102E" d="M0 193v96h640v-96zM273 0v480h96V0z"/></svg>',
    tr: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd"><path fill="%23e30a17" d="M0 0h640v480H0z"/><path fill="%23fff" d="M407 247.5c0 66.2-54.6 119.9-122 119.9s-122-53.7-122-120 54.6-119.8 122-119.8 122 53.7 122 119.9"/><path fill="%23e30a17" d="M413 247.5c0 53-43.6 95.9-97.5 95.9s-97.6-43-97.6-96 43.7-95.8 97.6-95.8 97.6 42.9 97.6 95.9z"/><path fill="%23fff" d="m430.7 191.5-1 44.3-41.3 11.2 40.8 14.5-1 40.7 26.5-31.8 40.2 14-23.2-34.1 28.3-33.9-43.5 12-25.8-37z"/></g></svg>',
    de: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23fc0" d="M0 320h640v160H0z"/><path fill="%23000001" d="M0 0h640v160H0z"/><path fill="red" d="M0 160h640v160H0z"/></svg>',
    fr: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23fff" d="M0 0h640v480H0z"/><path fill="%23000091" d="M0 0h213.3v480H0z"/><path fill="%23e1000f" d="M426.7 0H640v480H426.7z"/></svg>',
    es: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23aa151b" d="M0 0h640v480H0z"/><path fill="%23f1bf00" d="M0 120h640v240H0z"/><path fill="%23aa151b" d="M172 196h44v88h-44z"/></svg>',
    'pt-BR': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23229e45" d="M0 0h640v480H0z"/><path fill="%23f8e509" d="M320 58 584 240 320 422 56 240z"/><circle cx="320" cy="240" r="112" fill="%232b49a3"/><path fill="none" stroke="%23fff" stroke-width="16" d="M212 214c78-8 150 12 214 62"/></svg>',
    it: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd" stroke-width="1pt"><path fill="%23fff" d="M0 0h640v480H0z"/><path fill="%23009246" d="M0 0h213.3v480H0z"/><path fill="%23ce2b37" d="M426.7 0H640v480H426.7z"/></g></svg>',
    pl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd"><path fill="%23fff" d="M640 480H0V0h640z"/><path fill="%23dc143c" d="M640 480H0V240h640z"/></g></svg>',
    nl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23ae1c28" d="M0 0h640v160H0z"/><path fill="%23fff" d="M0 160h640v160H0z"/><path fill="%2321468b" d="M0 320h640v160H0z"/></svg>',
    cs: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23fff" d="M0 0h640v240H0z"/><path fill="%23d7141a" d="M0 240h640v240H0z"/><path fill="%2311457e" d="M360 240 0 0v480z"/></svg>',
    uk: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd" stroke-width="1pt"><path fill="gold" d="M0 0h640v480H0z"/><path fill="%230057b8" d="M0 0h640v240H0z"/></g></svg>',
    ru: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23fff" d="M0 0h640v160H0z"/><path fill="%230039a6" d="M0 160h640v160H0z"/><path fill="%23d52b1e" d="M0 320h640v160H0z"/></svg>',
    ja: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><clipPath id="jp-a"><path fill-opacity=".7" d="M-88 32h640v480H-88z"/></clipPath></defs><g fill-rule="evenodd" stroke-width="1pt" clip-path="url%28%23jp-a%29" transform="translate%2888 -32%29"><path fill="%23fff" d="M-128 32h720v480h-720z"/><circle cx="523.1" cy="344.1" r="194.9" fill="%23bc002d" transform="translate%28-168.4 8.6%29scale%28.76554%29"/></g></svg>',
    ko: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 640 480"><defs><clipPath id="kr-a"><path fill-opacity=".7" d="M-95.8-.4h682.7v512H-95.8z"/></clipPath></defs><g fill-rule="evenodd" clip-path="url%28%23kr-a%29" transform="translate%2889.8 .4%29scale%28.9375%29"><path fill="%23fff" d="M-95.8-.4H587v512H-95.8Z"/><g transform="rotate%28-56.3 361.6 -101.3%29scale%2810.66667%29"><g id="kr-c"><path id="kr-b" fill="%23000001" d="M-6-26H6v2H-6Zm0 3H6v2H-6Zm0 3H6v2H-6Z"/><use xlink:href="%23kr-b" width="100%25" height="100%25" y="44"/></g><path stroke="%23fff" d="M0 17v10"/><path fill="%23cd2e3a" d="M0-12a12 12 0 0 1 0 24Z"/><path fill="%230047a0" d="M0-12a12 12 0 0 0 0 24A6 6 0 0 0 0 0Z"/><circle cy="-6" r="6" fill="%23cd2e3a"/></g><g transform="rotate%28-123.7 191.2 62.2%29scale%2810.66667%29"><use xlink:href="%23kr-c" width="100%25" height="100%25"/><path stroke="%23fff" d="M0-23.5v3M0 17v3.5m0 3v3"/></g></g></svg>',
    'zh-CN': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 640 480"><defs><path id="cn-a" fill="%23ff0" d="M-.6.8 0-1 .6.8-1-.3h2z"/></defs><path fill="%23ee1c25" d="M0 0h640v480H0z"/><use xlink:href="%23cn-a" width="30" height="20" transform="matrix%2871.9991 0 0 72 120 120%29"/><use xlink:href="%23cn-a" width="30" height="20" transform="matrix%28-12.33562 -20.5871 20.58684 -12.33577 240.3 48%29"/><use xlink:href="%23cn-a" width="30" height="20" transform="matrix%28-3.38573 -23.75998 23.75968 -3.38578 288 95.8%29"/><use xlink:href="%23cn-a" width="30" height="20" transform="matrix%286.5991 -23.0749 23.0746 6.59919 288 168%29"/><use xlink:href="%23cn-a" width="30" height="20" transform="matrix%2814.9991 -18.73557 18.73533 14.99929 240 216%29"/></svg>',
    'zh-TW': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><clipPath id="tw-a"><path d="M0 0h640v480H0z"/></clipPath><g clip-path="url%28%23tw-a%29"><path fill="red" d="M0 0h720v480H0z"/><path fill="%23000095" d="M0 0h360v240H0z"/><g fill="%23fff"><path d="m154 126.9-2.5 9.6 9.4 2.6-1.8-7.1zm46.9 5.1-1.8 7.1 9.4-2.6-2.5-9.6zm-41.8-24-5.1 5.1 1.9 6.9z"/><path d="m155.9 120-1.9 6.9 5.1 5.1z"/><path d="m154 113.1-6.9 6.9 6.9 6.9 1.9-6.9zm14 27.8 5.1 5.1 6.9-1.9zm18.9 5.1 9.6 2.5 2.6-9.4-7.1 1.8z"/><path d="m192 140.9 7.1-1.8 1.8-7.1zm-31.1-1.8 2.6 9.4 9.6-2.5-5.1-5.1zm19.1 5 6.9 1.9 5.1-5.1z"/><path d="m173.1 146 6.9 6.9 6.9-6.9-6.9-1.9zm-12.2-45.1-9.4 2.6 2.5 9.6 5.1-5.1zm-1.8 31.1 1.8 7.1 7.1 1.8zm45-12 1.9-6.9-5.1-5.1z"/><path d="m168 99.1-7.1 1.8-1.8 7.1zm32.9 8.9-1.8-7.1-7.1-1.8zm5.1 18.9 6.9-6.9-6.9-6.9-1.9 6.9z"/><path d="m200.9 108-8.9-8.9-12-3.2-12 3.2-8.9 8.9-3.2 12 3.2 12 8.9 8.9 12 3.2 12-3.2 8.9-8.9 3.2-12z"/><path d="m200.9 132 5.1-5.1-1.9-6.9zm5.1-18.9 2.5-9.6-9.4-2.6 1.8 7.1zm-6.9-12.2-2.6-9.4-9.6 2.5 5.1 5.1zm-26-6.9-9.6-2.5-2.6 9.4 7.1-1.8zm6.9 1.9-6.9-1.9-5.1 5.1z"/><path d="m186.9 94-6.9-6.9-6.9 6.9 6.9 1.9z"/><path d="m192 99.1-5.1-5.1-6.9 1.9zM173.1 146l-9.6 2.5 4.5 16.6 12-12.2zm-5.1 19.1 12 44.9 12-44.9-12-12.2zm-7.1-26-9.4-2.6-4.4 16.4 16.4-4.4z"/><path d="m147.1 152.9-12 45.1 32.9-32.9-4.5-16.6zm-12-20.9L102 165.1l45.1-12.2 4.4-16.4z"/><path d="m154 126.9-6.9-6.9-12 12 16.4 4.5zm0-13.8-2.5-9.6-16.4 4.5 12 12z"/><path d="M135.1 108 90 120l45.1 12 12-12zm90 24-16.6 4.5 4.4 16.4 45.1 12.2z"/><path d="m199.1 139.1-2.6 9.4 16.4 4.4-4.4-16.4zm-12.2 6.9-6.9 6.9 12 12.2 4.5-16.6zm19.1-19.1 2.5 9.6 16.6-4.5-12.2-12z"/><path d="m192 165.1 33.1 32.9-12.2-45.1-16.4-4.4zm7.1-64.2 9.4 2.6 4.4-16.4-16.4 4.4z"/><path d="M225.1 108 258 75.1l-45.1 12-4.4 16.4zm-12.2-20.9L225.1 42 192 75.1l4.5 16.4zm12.2 44.9 44.9-12-44.9-12-12.2 12z"/><path d="m206 113.1 6.9 6.9 12.2-12-16.6-4.5zm-38-38L135.1 42l12 45.1 16.4 4.4z"/><path d="m160.9 100.9 2.6-9.4-16.4-4.4 4.4 16.4z"/><path d="m147.1 87.1-45.1-12 33.1 32.9 16.4-4.5zm39.8 6.9 9.6-2.5-4.5-16.4-12 12z"/><path d="M192 75.1 180 30l-12 45.1 12 12z"/><path d="m173.1 94 6.9-6.9-12-12-4.5 16.4z"/></g><circle cx="180" cy="120" r="51.1" fill="%23000095"/><circle cx="180" cy="120" r="45.1" fill="%23fff"/></g></svg>',
    ar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23199d3f" d="M0 0h640v480H0z"/><path fill="%23fff" d="M170 180h300v40H170zM190 310h260v14H190z"/></svg>',
    bg: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23fff" d="M0 0h640v160H0z"/><path fill="%2300966e" d="M0 160h640v160H0z"/><path fill="%23d62612" d="M0 320h640v160H0z"/></svg>',
    da: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23c8102e" d="M0 0h640.1v480H0z"/><path fill="%23fff" d="M205.7 0h68.6v480h-68.6z"/><path fill="%23fff" d="M0 205.7h640.1v68.6H0z"/></svg>',
    el: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%230d5eaf" fill-rule="evenodd" d="M0 0h640v53.3H0z"/><path fill="%23fff" fill-rule="evenodd" d="M0 53.3h640v53.4H0z"/><path fill="%230d5eaf" fill-rule="evenodd" d="M0 106.7h640V160H0z"/><path fill="%23fff" fill-rule="evenodd" d="M0 160h640v53.3H0z"/><path fill="%230d5eaf" d="M0 0h266.7v266.7H0z"/><path fill="%230d5eaf" fill-rule="evenodd" d="M0 213.3h640v53.4H0z"/><path fill="%23fff" fill-rule="evenodd" d="M0 266.7h640V320H0z"/><path fill="%230d5eaf" fill-rule="evenodd" d="M0 320h640v53.3H0z"/><path fill="%23fff" fill-rule="evenodd" d="M0 373.3h640v53.4H0z"/><g fill="%23fff" fill-rule="evenodd" stroke-width="1.3"><path d="M106.7 0H160v266.7h-53.3z"/><path d="M0 106.7h266.7V160H0z"/></g><path fill="%230d5eaf" d="M0 426.7h640V480H0z"/></svg>',
    fi: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23fff" d="M0 0h640v480H0z"/><path fill="%23002f6c" d="M0 174.5h640v131H0z"/><path fill="%23002f6c" d="M175.5 0h130.9v480h-131z"/></svg>',
    he: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><clipPath id="il-a"><path fill-opacity=".7" d="M-87.6 0H595v512H-87.6z"/></clipPath></defs><g fill-rule="evenodd" clip-path="url%28%23il-a%29" transform="translate%2882.1%29scale%28.94%29"><path fill="%23fff" d="M619.4 512H-112V0h731.4z"/><path fill="%230038b8" d="M619.4 115.2H-112V48h731.4zm0 350.5H-112v-67.2h731.4zm-483-275 110.1 191.6L359 191.6z"/><path fill="%23fff" d="m225.8 317.8 20.9 35.5 21.4-35.3z"/><path fill="%230038b8" d="M136 320.6 246.2 129l112.4 190.8z"/><path fill="%23fff" d="m225.8 191.6 20.9-35.5 21.4 35.4zM182 271.1l-21.7 36 41-.1-19.3-36zm-21.3-66.5 41.2.3-19.8 36.3zm151.2 67 20.9 35.5-41.7-.5zm20.5-67-41.2.3 19.8 36.3zm-114.3 0L189.7 256l28.8 50.3 52.8 1.2 32-51.5-29.6-52z"/></g></svg>',
    hu: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd"><path fill="%23fff" d="M640 480H0V0h640z"/><path fill="%23388d00" d="M640 480H0V320h640z"/><path fill="%23d43516" d="M640 160.1H0V.1h640z"/></g></svg>',
    id: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23e70011" d="M0 0h640v240H0Z"/><path fill="%23fff" d="M0 240h640v240H0Z"/></svg>',
    lt: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd" stroke-width="1pt" transform="scale%28.64143 .96773%29"><rect width="1063" height="708.7" fill="%23006a44" rx="0" ry="0" transform="scale%28.93865 .69686%29"/><rect width="1063" height="236.2" y="475.6" fill="%23c1272d" rx="0" ry="0" transform="scale%28.93865 .69686%29"/><path fill="%23fdb913" d="M0 0h997.8v164.6H0z"/></g></svg>',
    no: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23ed2939" d="M0 0h640v480H0z"/><path fill="%23fff" d="M180 0h120v480H180z"/><path fill="%23fff" d="M0 180h640v120H0z"/><path fill="%23002664" d="M210 0h60v480h-60z"/><path fill="%23002664" d="M0 210h640v60H0z"/></svg>',
    'pt-PT': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 640 480"><path fill="red" d="M256 0h384v480H256z"/><path fill="%23060" d="M0 0h256v480H0z"/><g fill="%23ff0" fill-rule="evenodd" stroke="%23000" stroke-linecap="round" stroke-linejoin="round" stroke-width=".6"><path d="M339.5 306.2c-32.3-1-180-93.2-181-108l8.1-13.5c14.7 21.3 165.7 111 180.6 107.8z"/><path d="M164.9 182.8c-2.9 7.8 38.6 33.4 88.4 63.8 49.9 30.3 92.9 49 96 46.4l1.5-2.8c-.6 1-2 1.3-4.3.6-13.5-3.9-48.6-20-92.1-46.4-43.6-26.4-81.4-50.7-87.3-61a6.3 6.3 0 0 1-.6-3.1h-.2l-1.2 2.2zm175.3 123.8c-.5 1-1.6 1-3.5.8-12-1.3-48.6-19.1-91.9-45-50.4-30.2-92-57.6-87.4-64.8l1.2-2.2.2.1c-4 12.2 82.1 61.4 87.2 64.6 49.8 30.8 91.8 48.9 95.5 44.2z"/><path d="M256.2 207.2c32.2-.3 72-4.4 95-13.6l-5-8c-13.5 7.5-53.5 12.5-90.3 13.2-43.4-.4-74.1-4.5-89.5-14.8l-4.6 8.6c28.2 12 57.2 14.5 94.4 14.6"/><path d="M352.5 193.8c-.8 1.3-15.8 6.4-37.8 10.2a381.2 381.2 0 0 1-58.6 4.3 416.1 416.1 0 0 1-56.2-3.6c-23.1-3.6-35-8.6-39.5-10.4l1.1-2.2c12.7 5 24.7 8 38.7 10.2A411.5 411.5 0 0 0 256 206a391.8 391.8 0 0 0 58.3-4.3c22.5-3.7 34.8-8.4 36.6-10.5zm-4.4-8.1c-2.4 2-14.6 6.3-36 9.7a388.2 388.2 0 0 1-55.8 4c-22 0-40.1-1.6-53.8-3.6-21.8-2.8-33.4-8-37.6-9.4l1.3-2.2c3.3 1.7 14.4 6.2 36.5 9.3a385 385 0 0 0 53.6 3.4 384 384 0 0 0 55.4-4c21.5-3 33.1-8.4 34.9-9.8zM150.3 246c19.8 10.7 63.9 16 105.6 16.4 38 .1 87.4-5.8 105.9-15.6l-.5-10.7c-5.8 9-58.8 17.7-105.8 17.4-47-.4-90.7-7.6-105.3-17v9.5"/><path d="M362.8 244.5v2.5c-2.8 3.4-20.2 8.4-42 12a434 434 0 0 1-65.4 4.4 400 400 0 0 1-62-4.3 155 155 0 0 1-44.4-12v-2.9c9.7 6.4 35.9 11.2 44.7 12.6 15.8 2.4 36.1 4.2 61.7 4.2 26.9 0 48.4-1.9 65-4.4 15.7-2.3 38-8.2 42.4-12.1m0-9v2.5c-2.8 3.3-20.2 8.3-42 11.9a434 434 0 0 1-65.4 4.5 414 414 0 0 1-62-4.3 155 155 0 0 1-44.4-12v-3c9.7 6.5 36 11.2 44.7 12.6a408 408 0 0 0 61.7 4.3c26.9 0 48.5-2 65-4.5 15.7-2.2 38-8.1 42.4-12m-107 68.8c-45.6-.2-84.7-12.4-93-14.4l6 9.4a249.8 249.8 0 0 0 87.4 14.3c34.7-1 65-3.7 86.3-14.1l6.2-9.8c-14.5 6.9-64 14.6-93 14.6"/><path d="M344.9 297.3a143 143 0 0 1-2.8 4c-10 3.6-26 7.4-32.6 8.4a295.5 295.5 0 0 1-53.7 5c-40.4-.6-73.5-8.5-89-15.3l-1.3-2.1.2-.4 2.1.9a286.5 286.5 0 0 0 88.2 14.5c18.8 0 37.5-2.1 52.6-4.8 23.2-4.7 32.6-8.2 35.5-9.8l.7-.4zm5.3-8.8a287.2 287.2 0 0 1-2 3.5c-5.4 2-20 6.2-41.3 9.2-14 1.9-22.7 3.8-50.6 4.3a347.4 347.4 0 0 1-94.2-14L161 289a390 390 0 0 0 95.4 14c25.5-.5 36.4-2.4 50.3-4.3 24.8-3.8 37.3-8 41-9.1a2.9 2.9 0 0 0 0-.2l2.6-1z"/><path d="M350.8 237.6c.1 30-15.3 57-27.6 68.8a99.3 99.3 0 0 1-67.8 28.2c-30.3.5-58.8-19.2-66.5-27.9a101 101 0 0 1-27.5-67.4c1.8-32.8 14.7-55.6 33.3-71.3a99.6 99.6 0 0 1 64.2-22.7 98.2 98.2 0 0 1 71 35.6c12.5 15.2 18 31.7 20.9 56.7M255.6 135a106 106 0 0 1 106 105.2 105.6 105.6 0 1 1-211.4 0c-.1-58 47.3-105.2 105.4-105.2"/><path d="M255.9 134.5c58.2 0 105.6 47.4 105.6 105.6S314.1 345.7 256 345.7s-105.6-47.4-105.6-105.6c0-58.2 47.4-105.6 105.6-105.6zM152.6 240c0 56.8 46.7 103.3 103.3 103.3 56.6 0 103.3-46.5 103.3-103.3s-46.7-103.3-103.3-103.3S152.6 183.2 152.6 240"/><path d="M256 143.3a97 97 0 0 1 96.7 96.7 97.1 97.1 0 0 1-96.7 96.8c-53 0-96.7-43.6-96.7-96.8a97.1 97.1 0 0 1 96.7-96.7M161.6 240c0 52 42.6 94.4 94.4 94.4s94.4-42.5 94.4-94.4c0-52-42.6-94.4-94.4-94.4a94.8 94.8 0 0 0-94.4 94.4"/><path d="M260.3 134h-9.1v212.3h9z"/><path d="M259.3 132.8h2.3v214.7h-2.2V132.8zm-9 0h2.4v214.7h-2.3z"/><path d="M361.6 244.2v-7.8l-6.4-6-36.3-9.6-52.2-5.3-63 3.2-44.8 10.6-9 6.7v7.9l22.9-10.3 54.4-8.5h52.3l38.4 4.2 26.6 6.4z"/><path d="M256 223.8c24.9 0 49 2.3 68.3 6 19.8 4 33.7 9 38.5 14.5v2.8c-5.8-7-24.5-12-39-15-19-3.6-43-6-67.9-6-26.1 0-50.5 2.6-69.3 6.2-15 3-35.1 9-37.6 14.8v-2.9c1.3-4 16.3-10 37.3-14.3 18.9-3.7 43.3-6.1 69.6-6.1zm0-9.1a383 383 0 0 1 68.3 6c19.8 4 33.7 9 38.5 14.6v2.7c-5.8-6.9-24.5-12-39-14.9-19-3.7-43-6-67.9-6a376 376 0 0 0-69.2 6.2c-14.5 2.7-35.4 8.9-37.7 14.7v-2.8c1.4-4 16.6-10.3 37.3-14.3 19-3.7 43.3-6.2 69.7-6.2m-.6-46.2c39.3-.2 73.6 5.5 89.3 13.5l5.7 10c-13.6-7.4-50.6-15-94.9-14-36.1.3-74.7 4-94 14.4l6.8-11.4c15.9-8.3 53.3-12.5 87.1-12.5"/><path d="M256 176.7a354 354 0 0 1 61.3 4.3c16 3 31.3 7.4 33.5 9.8l1.7 3c-5.3-3.4-18.6-7.3-35.6-10.5s-38.7-4.3-61-4.2c-25.3-.1-45 1.2-61.8 4.2a108.9 108.9 0 0 0-33.3 10.3l1.7-3.1c6-3 15.3-6.7 31.1-9.6 17.5-3.2 37.4-4.1 62.4-4.2m0-9c21.4-.2 42.6 1 59.1 4a96 96 0 0 1 30.6 10l2.5 4c-4.2-4.7-20-9.2-34.1-11.6-16.4-2.9-36.7-4-58.1-4.2a361 361 0 0 0-59.5 4.4 97.3 97.3 0 0 0-29.6 9.1l2.2-3.3c5.8-3 15.2-5.8 27-8.1a357 357 0 0 1 59.9-4.4zM308.4 284a276.4 276.4 0 0 0-52.5-4c-65.5.8-86.6 13.5-89.2 17.3l-5-8c16.8-12 52.4-18.8 94.6-18.2 21.9.4 40.8 1.9 56.6 5l-4.5 8"/><path d="M255.6 278.9c18.2.3 36 1 53.3 4.2l-1.2 2.2c-16-3-33.2-4-52-4-24.3-.2-48.7 2.1-70 8.2-6.7 1.9-17.8 6.2-19 9.8l-1.2-2c.4-2.2 7-6.6 19.6-10 24.4-7 47.2-8.3 70.5-8.4m.8-9.2a327 327 0 0 1 57.3 5l-1.3 2.3a299 299 0 0 0-56-4.9c-24.2 0-49.9 1.8-73.3 8.6-7.5 2.2-20.6 7-21 10.7l-1.2-2.2c.2-3.4 11.5-7.9 21.7-10.8 23.5-6.9 49.3-8.6 73.8-8.7"/><path d="m349.4 290.5-7.8 12.3-22.7-20.1-58.6-39.5-66.2-36.3-34.3-11.7 7.3-13.6 2.5-1.3 21.3 5.3 70.4 36.3 40.6 25.6L336 272l13.9 16z"/><path d="M158.6 195.5c6-4 50.2 15.6 96.6 43.6 46.1 28 90.3 59.6 86.3 65.5l-1.3 2.1-.6.5c.1-.1.8-1 0-3.1-2-6.5-33.4-31.5-85.3-62.9-50.7-30.1-92.9-48.3-97-43.1zM351 290.4c3.8-7.6-37.2-38.5-88.1-68.6-52-29.5-89.6-46.9-96.5-41.7L165 183c0 .1 0-.2.4-.5 1.2-1 3.3-1 4.2-1 11.8.2 45.5 15.7 92.8 42.8 20.8 12 87.6 55 87.3 67 0 1 .1 1.2-.3 1.8l1.7-2.6z"/></g><g transform="translate%280 26.7%29scale%281.06667%29"><path fill="%23fff" stroke="%23000" stroke-width=".7" d="M180.6 211a58.7 58.7 0 0 0 17.5 41.7 59 59 0 0 0 41.8 17.6 59.4 59.4 0 0 0 42-17.4 59 59 0 0 0 17.4-41.8v-79.2l-118.7-.2z"/><path fill="red" stroke="%23000" stroke-width=".5" d="M183 211.1a56.4 56.4 0 0 0 16.8 40 57 57 0 0 0 40.2 16.8 56.9 56.9 0 0 0 40.2-16.6 56.4 56.4 0 0 0 16.7-40v-77H183v76.8m91-53.7v48.9l-.1 5.1a33.2 33.2 0 0 1-10 24 34 34 0 0 1-24 10c-9.4 0-17.7-4-23.9-10.2a34 34 0 0 1-10-24v-54z"/><g id="pt-e"><g id="pt-d" fill="%23ff0" stroke="%23000" stroke-width=".5"><path stroke="none" d="M190.2 154.4c.1-5.5 4-6.8 4-6.8.1 0 4.3 1.4 4.3 6.9z"/><path d="m186.8 147.7-.7 6.3h4.2c0-5.2 4-6 4-6 .1 0 4 1.1 4.1 6h4.2l-.8-6.4zm-1 6.4h17c.3 0 .6.3.6.7 0 .5-.3.8-.6.8h-17c-.3 0-.6-.3-.6-.8 0-.4.3-.7.7-.7z"/><path d="M192 154c0-3.3 2.3-4.2 2.3-4.2s2.3 1 2.3 4.2H192m-5.8-9h16.3c.3 0 .6.4.6.8 0 .3-.3.6-.6.6h-16.3c-.3 0-.6-.3-.6-.7 0-.3.3-.6.6-.6zm.4 1.5H202c.3 0 .6.3.6.7 0 .4-.3.7-.6.7h-15.5c-.4 0-.6-.3-.6-.7 0-.4.2-.7.6-.7zm5-10.6h1.2v.8h.9v-.8h1.3v.9h.9v-1h1.2v2c0 .4-.2.6-.5.6h-4.4c-.3 0-.6-.2-.6-.5zm4.6 2.7.3 6.4h-4.3l.3-6.5h3.7"/><path id="pt-a" d="M191 141.6v3.4h-4v-3.4z"/><use xlink:href="%23pt-a" width="100%25" height="100%25" x="10.6"/><path id="pt-b" d="M186.3 139h1.2v1h.9v-1h1.2v1h.9v-1h1.2v2c0 .4-.2.6-.5.6h-4.3a.6.6 0 0 1-.6-.6z"/><use xlink:href="%23pt-b" width="100%25" height="100%25" x="10.6"/><path fill="%23000001" stroke="none" d="M193.9 140.6c0-.6.9-.6.9 0v1.6h-.9z"/><path id="pt-c" fill="%23000001" stroke="none" d="M188.6 142.8c0-.6.8-.6.8 0v1.2h-.8z"/><use xlink:href="%23pt-c" width="100%25" height="100%25" x="10.6"/></g><use xlink:href="%23pt-d" width="100%25" height="100%25" y="46.3"/><use xlink:href="%23pt-d" width="100%25" height="100%25" transform="rotate%28-45.2 312.8 180%29"/></g><use xlink:href="%23pt-d" width="100%25" height="100%25" x="45.7"/><use xlink:href="%23pt-e" width="100%25" height="100%25" transform="matrix%28-1 0 0 1 479.8 0%29"/><g id="pt-f" fill="%23fff"><path fill="%23039" d="M232.6 202.4a8.3 8.3 0 0 0 2.2 5.7 7.2 7.2 0 0 0 5.3 2.4c2.1 0 4-1 5.3-2.4a8.3 8.3 0 0 0 2.2-5.7v-10.8h-15z"/><circle cx="236.1" cy="195.7" r="1.5"/><circle cx="244.4" cy="195.7" r="1.5"/><circle cx="240.2" cy="199.7" r="1.5"/><circle cx="236.1" cy="203.9" r="1.5"/><circle cx="244.4" cy="203.9" r="1.5"/></g><use xlink:href="%23pt-f" width="100%25" height="100%25" y="-26"/><use xlink:href="%23pt-f" width="100%25" height="100%25" x="-20.8"/><use xlink:href="%23pt-f" width="100%25" height="100%25" x="20.8"/><use xlink:href="%23pt-f" width="100%25" height="100%25" y="25.8"/></g></svg>',
    ro: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd" stroke-width="1pt"><path fill="%2300319c" d="M0 0h213.3v480H0z"/><path fill="%23ffde00" d="M213.3 0h213.4v480H213.3z"/><path fill="%23de2110" d="M426.7 0H640v480H426.7z"/></g></svg>',
    sk: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23ee1c25" d="M0 0h640v480H0z"/><path fill="%230b4ea2" d="M0 0h640v320H0z"/><path fill="%23fff" d="M0 0h640v160H0z"/><path fill="%23fff" d="M233 370.8c-43-20.7-104.6-61.9-104.6-143.2 0-81.4 4-118.4 4-118.4h201.3s3.9 37 3.9 118.4S276 350 233 370.8"/><path fill="%23ee1c25" d="M233 360c-39.5-19-96-56.8-96-131.4s3.6-108.6 3.6-108.6h184.8s3.5 34 3.5 108.6C329 303.3 272.5 341 233 360"/><path fill="%23fff" d="M241.4 209c10.7.2 31.6.6 50.1-5.6 0 0-.4 6.7-.4 14.4s.5 14.4.5 14.4c-17-5.7-38.1-5.8-50.2-5.7v41.2h-16.8v-41.2c-12-.1-33.1 0-50.1 5.7 0 0 .5-6.7.5-14.4 0-7.8-.5-14.4-.5-14.4 18.5 6.2 39.4 5.8 50 5.6v-25.9c-9.7 0-23.7.4-39.6 5.7 0 0 .5-6.6.5-14.4 0-7.7-.5-14.4-.5-14.4 15.9 5.3 29.9 5.8 39.6 5.7-.5-16.4-5.3-37-5.3-37s9.9.7 13.8.7c4 0 13.8-.7 13.8-.7s-4.8 20.6-5.3 37c9.7.1 23.7-.4 39.6-5.7 0 0-.5 6.7-.5 14.4 0 7.8.5 14.4.5 14.4a119 119 0 0 0-39.7-5.7v26z"/><path fill="%230b4ea2" d="M233 263.3c-19.9 0-30.5 27.5-30.5 27.5s-6-13-22.2-13c-11 0-19 9.7-24.2 18.8 20 31.7 51.9 51.3 76.9 63.4 25-12 57-31.7 76.9-63.4-5.2-9-13.2-18.8-24.2-18.8-16.2 0-22.2 13-22.2 13S253 263.3 233 263.3"/></svg>',
    sv: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="%23005293" d="M0 0h640v480H0z"/><path fill="%23fecb00" d="M176 0v192H0v96h176v192h96V288h368v-96H272V0z"/></svg>',
    th: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><g fill-rule="evenodd"><path fill="%23f4f5f8" d="M0 0h640v480H0z"/><path fill="%232d2a4a" d="M0 162.5h640v160H0z"/><path fill="%23a51931" d="M0 0h640v82.5H0zm0 400h640v80H0z"/></g></svg>',
    vi: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><clipPath id="vn-a"><path fill-opacity=".7" d="M-85.3 0h682.6v512H-85.3z"/></clipPath></defs><g fill-rule="evenodd" clip-path="url%28%23vn-a%29" transform="translate%2880%29scale%28.9375%29"><path fill="%23da251d" d="M-128 0h768v512h-768z"/><path fill="%23ff0" d="M349.6 381 260 314.3l-89 67.3L204 272l-89-67.7 110.1-1 34.2-109.4L294 203l110.1.1-88.5 68.4 33.9 109.6z"/></g></svg>'
  };

  // Interface text. en is complete; any key or language missing here shows in English.
  var UI = {
    en: {
      title: 'Icon Catalog',
      search: 'Search: absinthe, dittany, wand…', searchLabel: 'Search icons',
      folders: 'Folders', all: 'All', icon: '{n} icon', icons: '{n} icons', none: 'No results.', allDone: 'Everything here has a name.',
      failed: 'Could not load the icon list. Check your connection and reload the page.',
      skip: 'Skip to icons', contact: 'Contact me:', language: 'Language',
      copy: 'Copy', copied: 'Copied', url: 'URL', path: 'Path', name: 'Name', openTab: 'Open in new tab', prev: 'Previous', next: 'Next', close: 'Close',
      untranslated: 'untranslated', coverage: '{lang}: {pct} translated', notOpenTag: 'not open yet',
      translate: 'Translate', addIcon: 'Add an icon',
      footNote: 'Unofficial fan project, not affiliated with Warner Bros. Games, Avalanche Software or Portkey Games.',
      footShort: 'Unofficial fan project', footRights: 'Image rights', footContributing: 'Contributing', footRepo: 'GitHub',
      translating: 'Translating into {lang}', progress: '{done} of {total} named ({pct})',
      draftsSaved: '{n} drafts saved in this browser', draftSaved: '1 draft saved in this browser',
      draftsVolatile: 'Drafts only in this tab: {n}. This browser is not saving them, so submit before you close it.',
      onlyUntranslated: 'Untranslated only', newLanguage: 'Start a new language…', newLanguageLabel: 'Start a new language', submit: 'Submit', submitCount: 'Submit {n}', done: 'Done',
      notOpenBar: '{lang} is not open yet. You can draft here, and submitting needs the language added first.',
      folderName: 'Folder name', draftTag: 'draft', previewKey: 'Alt+Enter: large preview', nameFor: 'Name for {source}, {path}',
      errLong: 'Keep it to 120 characters or fewer.', errAngle: 'Remove < and >.', errEntity: 'Write the character itself instead of an HTML entity such as &amp;.', errUrl: 'Remove the web address (://).',
      errControl: 'Remove the line breaks and control characters.', errBidi: 'Remove the text direction override characters.',
      sendTitle: 'Submit translation', sendSummary: '{n} names in {lang}.', sendSummaryOne: '1 name in {lang}.', sendNothing: 'Nothing to submit yet. Type a name into any icon first.',
      sendStale: 'Left out: {n}. Those icons are no longer in the catalog.',
      sendProblems: 'Fix these before you submit:', sendShow: 'Show', sendOffPage: 'This icon is on the main catalog page.',
      sendOpen: 'Open the prefilled issue on GitHub',
      sendLong: 'This is too long for a link. Copy it, open the issue, then paste it into the "Translation data" field.', sendCopyOpen: 'Copy and open GitHub',
      sendParts: 'This is too long for one issue, so it is split into {n} parts. Submit each one as its own issue. Each becomes its own pull request.',
      sendPart: 'Part {i} of {n}: {count} names', sendPartLink: 'Open prefilled issue', sendData: 'Translation data', sendCopy: 'Copy',
      sendNeeds: 'You need a GitHub account. On GitHub, tick the terms box and submit the issue.',
      sendNext: 'A check replies on the issue. If the names pass, it opens a pull request for the owner to review. If not, it lists the problems, and editing the issue runs it again.',
      sendKeep: 'Keep your drafts until the names are published. They clear themselves once they match.',
      sendNotOpen: '{lang} is not open yet, so GitHub would refuse these names. Adding a language is a pull request the owner reviews. Add this line to names/languages.json, then come back and submit: your drafts stay here.',
      sendLine: 'Line to add', sendEdit: 'Edit names/languages.json on GitHub',
      discard: 'Discard these drafts', discardSure: 'Discard for good ({n})',
      helpTitle: 'Contribute',
      helpTranslateTitle: 'Translate the names',
      helpTranslate: 'Icon names can be shown in any language we open. Switch to translate mode, type names right on the icons and submit them when you are ready. Your drafts stay in this browser until then. You need a GitHub account to submit.',
      helpTranslateGo: 'Start translating',
      helpIconTitle: 'Add an icon',
      helpIcon: 'Icons are added by pull request, and the owner reviews every one.',
      helpIconSteps: ['Fork the repository and create a branch.', 'Add .webp files in the folder under icons/ that fits. Most icons belong in icons/items/.', 'Open a pull request and fill in the template.'],
      helpIconTerms: 'Say where each file comes from: made by you, from the game or from a mod, and whether an AI tool made any of it. Size limits and naming rules are in CONTRIBUTING.md.',
      helpIconGo: 'Read CONTRIBUTING.md', helpRepo: 'Open the repository',
      helpRightsTitle: 'Rights',
      helpRights: 'This is an unofficial fan project, not affiliated with or endorsed by Warner Bros. Games, Avalanche Software, Portkey Games or Wizarding World. Harry Potter and related names and marks belong to their owners. The code is MIT licensed, the images are not: ASSETS.md says what each group is and how you may use it.',
      helpRightsGo: 'Read ASSETS.md'
    },
    tr: {
      title: 'İkon Kataloğu',
      search: 'Ara: absent, anahtar, dittany…', searchLabel: 'İkon ara',
      folders: 'Klasörler', all: 'Tümü', icon: '{n} ikon', icons: '{n} ikon', none: 'Sonuç yok.', allDone: 'Buradaki her ikonun adı var.',
      failed: 'İkon listesi yüklenemedi. Bağlantını kontrol edip sayfayı yenile.',
      skip: 'İkonlara geç', contact: 'Bana ulaş:', language: 'Dil',
      copy: 'Kopyala', copied: 'Kopyalandı', url: 'Adres', path: 'Yol', name: 'Ad', openTab: 'Yeni sekmede aç', prev: 'Önceki', next: 'Sonraki', close: 'Kapat',
      untranslated: 'çevrilmedi', coverage: '{lang}: {pct} çevrildi', notOpenTag: 'henüz açık değil',
      translate: 'Çevir', addIcon: 'İkon ekle',
      footNote: 'Resmî olmayan hayran projesi; Warner Bros. Games, Avalanche Software veya Portkey Games ile bağlantısı yoktur.',
      footShort: 'Resmî olmayan hayran projesi', footRights: 'Görsel hakları', footContributing: 'Katkı rehberi', footRepo: 'GitHub',
      translating: '{lang} çevirisi', progress: '{total} adın {done} tanesi hazır ({pct})',
      draftsSaved: '{n} taslak bu tarayıcıda kayıtlı', draftSaved: '1 taslak bu tarayıcıda kayıtlı',
      draftsVolatile: '{n} taslak yalnızca bu sekmede. Tarayıcı bunları kaydetmiyor, kapatmadan önce gönder.',
      onlyUntranslated: 'Yalnızca çevrilmemişler', newLanguage: 'Yeni dil başlat…', newLanguageLabel: 'Yeni dil başlat', submit: 'Gönder', submitCount: '{n} ad gönder', done: 'Bitti',
      notOpenBar: '{lang} henüz açık değil. Burada taslak yazabilirsin, göndermek için önce dilin eklenmesi gerekir.',
      folderName: 'Klasör adı', draftTag: 'taslak', previewKey: 'Alt+Enter: büyük önizleme', nameFor: '{source} için ad, {path}',
      errLong: 'En fazla 120 karakter yaz.', errAngle: '< ve > işaretlerini çıkar.', errEntity: '&amp; gibi HTML kodu yerine karakterin kendisini yaz.', errUrl: 'Web adresini (://) çıkar.',
      errControl: 'Satır sonlarını ve kontrol karakterlerini çıkar.', errBidi: 'Yazı yönü değiştiren karakterleri çıkar.',
      sendTitle: 'Çeviriyi gönder', sendSummary: '{lang} için {n} ad.', sendSummaryOne: '{lang} için 1 ad.', sendNothing: 'Henüz gönderilecek bir şey yok. Önce bir ikona ad yaz.',
      sendStale: 'Dışarıda bırakılan: {n}. O ikonlar artık katalogda yok.',
      sendProblems: 'Göndermeden önce bunları düzelt:', sendShow: 'Göster', sendOffPage: 'Bu ikon ana katalog sayfasında.',
      sendOpen: 'Hazır doldurulmuş issue’yu GitHub’da aç',
      sendLong: 'Bu, bağlantıya sığmayacak kadar uzun. Kopyala, issue’yu aç, sonra "Translation data" alanına yapıştır.', sendCopyOpen: 'Kopyala ve GitHub’ı aç',
      sendParts: 'Bu tek issue için fazla uzun, bu yüzden {n} parçaya bölündü. Her parçayı ayrı issue olarak gönder. Her biri ayrı pull request olur.',
      sendPart: 'Parça {i} / {n}: {count} ad', sendPartLink: 'Hazır issue’yu aç', sendData: 'Çeviri verisi', sendCopy: 'Kopyala',
      sendNeeds: 'GitHub hesabın olmalı. GitHub’da koşullar kutusunu işaretleyip issue’yu gönder.',
      sendNext: 'Issue’ya otomatik bir kontrol yanıt verir. Adlar geçerse sahibin inceleyeceği bir pull request açar. Geçmezse sorunları listeler, issue’yu düzenleyince yeniden çalışır.',
      sendKeep: 'Adlar yayınlanana kadar taslaklarını sakla. Eşleştiklerinde kendiliğinden temizlenirler.',
      sendNotOpen: '{lang} henüz açık değil, bu yüzden GitHub bu adları reddeder. Dil eklemek, sahibin incelediği bir pull request ile olur. Şu satırı names/languages.json dosyasına ekle, sonra dönüp gönder: taslakların burada kalır.',
      sendLine: 'Eklenecek satır', sendEdit: 'names/languages.json dosyasını GitHub’da düzenle',
      discard: 'Bu taslakları sil', discardSure: 'Kalıcı olarak sil ({n})',
      helpTitle: 'Katkıda bulun',
      helpTranslateTitle: 'Adları çevir',
      helpTranslate: 'İkon adları açtığımız her dilde gösterilebilir. Çeviri moduna geç, adları doğrudan ikonların üstüne yaz, hazır olunca gönder. O zamana kadar taslakların bu tarayıcıda kalır. Göndermek için GitHub hesabın olmalı.',
      helpTranslateGo: 'Çeviriye başla',
      helpIconTitle: 'İkon ekle',
      helpIcon: 'İkonlar pull request ile eklenir, sahibi her birini inceler.',
      helpIconSteps: ['Depoyu fork’la ve bir dal aç.', 'icons/ altında uygun klasöre .webp dosyalarını ekle. Çoğu ikon icons/items/ içine girer.', 'Pull request aç ve şablonu doldur.'],
      helpIconTerms: 'Her dosyanın kaynağını belirt: kendin yaptın, oyundan ya da moddan; bir kısmını yapay zekâ aracı yaptıysa onu da yaz. Boyut sınırları ve adlandırma kuralları CONTRIBUTING.md dosyasında.',
      helpIconGo: 'CONTRIBUTING.md dosyasını oku', helpRepo: 'Depoyu aç',
      helpRightsTitle: 'Haklar',
      helpRights: 'Bu resmî olmayan bir hayran projesidir; Warner Bros. Games, Avalanche Software, Portkey Games veya Wizarding World ile bağlantısı yoktur, onlarca desteklenmez. Harry Potter ve ilgili ad ve markalar sahiplerine aittir. Kod MIT lisanslıdır, görseller değildir: her grubun ne olduğu ve nasıl kullanılabileceği ASSETS.md dosyasında.',
      helpRightsGo: 'ASSETS.md dosyasını oku'
    },
    de: {
      title: 'Icon-Katalog', search: 'Icons suchen…', searchLabel: 'Icons suchen', folders: 'Ordner', all: 'Alle', icon: '{n} Icon', icons: '{n} Icons',
      none: 'Keine Ergebnisse.', allDone: 'Hier hat jedes Icon einen Namen.', skip: 'Zu den Icons springen', contact: 'Kontakt:', language: 'Sprache', copy: 'Kopieren', copied: 'Kopiert', url: 'URL', path: 'Pfad', name: 'Name',
      openTab: 'In neuem Tab öffnen', prev: 'Zurück', next: 'Weiter', close: 'Schließen', untranslated: 'nicht übersetzt', coverage: '{lang}: {pct} übersetzt', notOpenTag: 'noch nicht offen',
      translate: 'Übersetzen', addIcon: 'Icon hinzufügen', footShort: 'Inoffizielles Fanprojekt', footRights: 'Bildrechte', footContributing: 'Mitwirken', translating: 'Übersetzung: {lang}', progress: '{done} von {total} benannt ({pct})',
      draftsSaved: '{n} Entwürfe in diesem Browser gespeichert', draftSaved: '1 Entwurf in diesem Browser gespeichert', onlyUntranslated: 'Nur unübersetzte',
      newLanguage: 'Neue Sprache beginnen…', newLanguageLabel: 'Neue Sprache beginnen', submit: 'Senden', submitCount: '{n} senden', done: 'Fertig', folderName: 'Ordnername', draftTag: 'Entwurf'
    },
    fr: {
      title: 'Catalogue d’icônes', search: 'Rechercher des icônes…', searchLabel: 'Rechercher des icônes', folders: 'Dossiers', all: 'Tout', icon: '{n} icône', icons: '{n} icônes',
      none: 'Aucun résultat.', allDone: 'Ici, chaque icône a un nom.', skip: 'Aller aux icônes', contact: 'Me contacter :', language: 'Langue', copy: 'Copier', copied: 'Copié', url: 'URL', path: 'Chemin', name: 'Nom',
      openTab: 'Ouvrir dans un nouvel onglet', prev: 'Précédent', next: 'Suivant', close: 'Fermer', untranslated: 'non traduit', coverage: '{lang} : {pct} traduit', notOpenTag: 'pas encore ouverte',
      translate: 'Traduire', addIcon: 'Ajouter une icône', footShort: 'Projet de fans non officiel', footRights: 'Droits des images', footContributing: 'Contribuer', translating: 'Traduction : {lang}', progress: '{done} noms sur {total} ({pct})',
      draftsSaved: '{n} brouillons enregistrés dans ce navigateur', draftSaved: '1 brouillon enregistré dans ce navigateur', onlyUntranslated: 'Non traduits uniquement',
      newLanguage: 'Commencer une nouvelle langue…', newLanguageLabel: 'Commencer une nouvelle langue', submit: 'Envoyer', submitCount: 'Envoyer {n}', done: 'Terminé', folderName: 'Nom du dossier', draftTag: 'brouillon'
    },
    es: {
      title: 'Catálogo de iconos', search: 'Buscar iconos…', searchLabel: 'Buscar iconos', folders: 'Carpetas', all: 'Todo', icon: '{n} icono', icons: '{n} iconos',
      none: 'Sin resultados.', allDone: 'Aquí todos los iconos tienen nombre.', skip: 'Ir a los iconos', contact: 'Contacto:', language: 'Idioma', copy: 'Copiar', copied: 'Copiado', url: 'URL', path: 'Ruta', name: 'Nombre',
      openTab: 'Abrir en una pestaña nueva', prev: 'Anterior', next: 'Siguiente', close: 'Cerrar', untranslated: 'sin traducir', coverage: '{lang}: {pct} traducido', notOpenTag: 'aún no abierto',
      translate: 'Traducir', addIcon: 'Añadir un icono', footShort: 'Proyecto de fans no oficial', footRights: 'Derechos de imagen', footContributing: 'Colaborar', translating: 'Traducción: {lang}', progress: '{done} de {total} con nombre ({pct})',
      draftsSaved: '{n} borradores guardados en este navegador', draftSaved: '1 borrador guardado en este navegador', onlyUntranslated: 'Solo sin traducir',
      newLanguage: 'Empezar un idioma nuevo…', newLanguageLabel: 'Empezar un idioma nuevo', submit: 'Enviar', submitCount: 'Enviar {n}', done: 'Listo', folderName: 'Nombre de la carpeta', draftTag: 'borrador'
    },
    'pt-BR': {
      title: 'Catálogo de ícones', search: 'Buscar ícones…', searchLabel: 'Buscar ícones', folders: 'Pastas', all: 'Todos', icon: '{n} ícone', icons: '{n} ícones',
      none: 'Nenhum resultado.', allDone: 'Aqui todos os ícones têm nome.', skip: 'Ir para os ícones', contact: 'Contato:', language: 'Idioma', copy: 'Copiar', copied: 'Copiado', url: 'URL', path: 'Caminho', name: 'Nome',
      openTab: 'Abrir em nova aba', prev: 'Anterior', next: 'Próximo', close: 'Fechar', untranslated: 'sem tradução', coverage: '{lang}: {pct} traduzido', notOpenTag: 'ainda não aberto',
      translate: 'Traduzir', addIcon: 'Adicionar um ícone', footShort: 'Projeto de fãs não oficial', footRights: 'Direitos das imagens', footContributing: 'Contribuir', translating: 'Tradução: {lang}', progress: '{done} de {total} com nome ({pct})',
      draftsSaved: '{n} rascunhos salvos neste navegador', draftSaved: '1 rascunho salvo neste navegador', onlyUntranslated: 'Só sem tradução',
      newLanguage: 'Começar um novo idioma…', newLanguageLabel: 'Começar um novo idioma', submit: 'Enviar', submitCount: 'Enviar {n}', done: 'Concluir', folderName: 'Nome da pasta', draftTag: 'rascunho'
    },
    it: {
      title: 'Catalogo di icone', search: 'Cerca icone…', searchLabel: 'Cerca icone', folders: 'Cartelle', all: 'Tutte', icon: '{n} icona', icons: '{n} icone',
      none: 'Nessun risultato.', allDone: 'Qui ogni icona ha un nome.', skip: 'Vai alle icone', contact: 'Contatto:', language: 'Lingua', copy: 'Copia', copied: 'Copiato', url: 'URL', path: 'Percorso', name: 'Nome',
      openTab: 'Apri in una nuova scheda', prev: 'Precedente', next: 'Successiva', close: 'Chiudi', untranslated: 'non tradotto', coverage: '{lang}: {pct} tradotto', notOpenTag: 'non ancora aperta',
      translate: 'Traduci', addIcon: 'Aggiungi un’icona', footShort: 'Progetto di fan non ufficiale', footRights: 'Diritti delle immagini', footContributing: 'Contribuisci', translating: 'Traduzione: {lang}', progress: '{done} di {total} con nome ({pct})',
      draftsSaved: '{n} bozze salvate in questo browser', draftSaved: '1 bozza salvata in questo browser', onlyUntranslated: 'Solo non tradotte',
      newLanguage: 'Inizia una nuova lingua…', newLanguageLabel: 'Inizia una nuova lingua', submit: 'Invia', submitCount: 'Invia {n}', done: 'Fine', folderName: 'Nome della cartella', draftTag: 'bozza'
    },
    pl: {
      title: 'Katalog ikon', search: 'Szukaj ikon…', searchLabel: 'Szukaj ikon', folders: 'Foldery', all: 'Wszystkie', icon: 'Ikony: {n}', icons: 'Ikony: {n}',
      none: 'Brak wyników.', allDone: 'Tutaj każda ikona ma nazwę.', skip: 'Przejdź do ikon', contact: 'Kontakt:', language: 'Język', copy: 'Kopiuj', copied: 'Skopiowano', url: 'URL', path: 'Ścieżka', name: 'Nazwa',
      openTab: 'Otwórz w nowej karcie', prev: 'Poprzednia', next: 'Następna', close: 'Zamknij', untranslated: 'bez tłumaczenia', coverage: '{lang}: przetłumaczono {pct}', notOpenTag: 'jeszcze nieotwarty',
      translate: 'Tłumacz', addIcon: 'Dodaj ikonę', footShort: 'Nieoficjalny projekt fanowski', footRights: 'Prawa do obrazów', footContributing: 'Współtworzenie', translating: 'Tłumaczenie: {lang}', progress: 'Nazwy: {done} z {total} ({pct})',
      draftsSaved: 'Szkice zapisane w tej przeglądarce: {n}', draftSaved: 'Szkice zapisane w tej przeglądarce: 1', onlyUntranslated: 'Tylko bez tłumaczenia',
      newLanguage: 'Zacznij nowy język…', newLanguageLabel: 'Zacznij nowy język', submit: 'Wyślij', submitCount: 'Wyślij ({n})', done: 'Gotowe', folderName: 'Nazwa folderu', draftTag: 'szkic'
    },
    nl: {
      title: 'Pictogramcatalogus', search: 'Pictogrammen zoeken…', searchLabel: 'Pictogrammen zoeken', folders: 'Mappen', all: 'Alles', icon: '{n} pictogram', icons: '{n} pictogrammen',
      none: 'Geen resultaten.', allDone: 'Hier heeft elk pictogram een naam.', skip: 'Naar de pictogrammen', contact: 'Contact:', language: 'Taal', copy: 'Kopiëren', copied: 'Gekopieerd', url: 'URL', path: 'Pad', name: 'Naam',
      openTab: 'In nieuw tabblad openen', prev: 'Vorige', next: 'Volgende', close: 'Sluiten', untranslated: 'niet vertaald', coverage: '{lang}: {pct} vertaald', notOpenTag: 'nog niet open',
      translate: 'Vertalen', addIcon: 'Pictogram toevoegen', footShort: 'Onofficieel fanproject', footRights: 'Beeldrechten', footContributing: 'Bijdragen', translating: 'Vertaling: {lang}', progress: '{done} van {total} benoemd ({pct})',
      draftsSaved: '{n} concepten opgeslagen in deze browser', draftSaved: '1 concept opgeslagen in deze browser', onlyUntranslated: 'Alleen niet vertaald',
      newLanguage: 'Nieuwe taal beginnen…', newLanguageLabel: 'Nieuwe taal beginnen', submit: 'Versturen', submitCount: '{n} versturen', done: 'Klaar', folderName: 'Mapnaam', draftTag: 'concept'
    },
    cs: {
      title: 'Katalog ikon', search: 'Hledat ikony…', searchLabel: 'Hledat ikony', folders: 'Složky', all: 'Vše', icon: 'Ikony: {n}', icons: 'Ikony: {n}',
      none: 'Žádné výsledky.', allDone: 'Tady má každá ikona název.', skip: 'Přejít na ikony', contact: 'Kontakt:', language: 'Jazyk', copy: 'Kopírovat', copied: 'Zkopírováno', url: 'URL', path: 'Cesta', name: 'Název',
      openTab: 'Otevřít na nové kartě', prev: 'Předchozí', next: 'Další', close: 'Zavřít', untranslated: 'nepřeloženo', coverage: '{lang}: přeloženo {pct}', notOpenTag: 'zatím neotevřeno',
      translate: 'Překládat', addIcon: 'Přidat ikonu', footShort: 'Neoficiální fanouškovský projekt', footRights: 'Práva k obrázkům', footContributing: 'Přispívání', translating: 'Překlad: {lang}', progress: 'Názvy: {done} z {total} ({pct})',
      draftsSaved: 'Koncepty uložené v tomto prohlížeči: {n}', draftSaved: 'Koncepty uložené v tomto prohlížeči: 1', onlyUntranslated: 'Jen nepřeložené',
      newLanguage: 'Začít nový jazyk…', newLanguageLabel: 'Začít nový jazyk', submit: 'Odeslat', submitCount: 'Odeslat ({n})', done: 'Hotovo', folderName: 'Název složky', draftTag: 'koncept'
    },
    uk: {
      title: 'Каталог значків', search: 'Шукати значки…', searchLabel: 'Шукати значки', folders: 'Теки', all: 'Усі', icon: 'Значки: {n}', icons: 'Значки: {n}',
      none: 'Нічого не знайдено.', allDone: 'Тут кожен значок має назву.', skip: 'Перейти до значків', contact: 'Контакт:', language: 'Мова', copy: 'Копіювати', copied: 'Скопійовано', url: 'URL', path: 'Шлях', name: 'Назва',
      openTab: 'Відкрити в новій вкладці', prev: 'Попередній', next: 'Наступний', close: 'Закрити', untranslated: 'не перекладено', coverage: '{lang}: перекладено {pct}', notOpenTag: 'ще не відкрито',
      translate: 'Перекласти', addIcon: 'Додати значок', footShort: 'Неофіційний фанатський проєкт', footRights: 'Права на зображення', footContributing: 'Як долучитися', translating: 'Переклад: {lang}', progress: 'Назви: {done} з {total} ({pct})',
      draftsSaved: 'Чернетки в цьому браузері: {n}', draftSaved: 'Чернетки в цьому браузері: 1', onlyUntranslated: 'Лише неперекладені',
      newLanguage: 'Почати нову мову…', newLanguageLabel: 'Почати нову мову', submit: 'Надіслати', submitCount: 'Надіслати ({n})', done: 'Готово', folderName: 'Назва теки', draftTag: 'чернетка'
    },
    ru: {
      title: 'Каталог значков', search: 'Искать значки…', searchLabel: 'Искать значки', folders: 'Папки', all: 'Все', icon: 'Значки: {n}', icons: 'Значки: {n}',
      none: 'Ничего не найдено.', allDone: 'Здесь у каждого значка есть название.', skip: 'Перейти к значкам', contact: 'Контакт:', language: 'Язык', copy: 'Копировать', copied: 'Скопировано', url: 'URL', path: 'Путь', name: 'Название',
      openTab: 'Открыть в новой вкладке', prev: 'Предыдущий', next: 'Следующий', close: 'Закрыть', untranslated: 'не переведено', coverage: '{lang}: переведено {pct}', notOpenTag: 'ещё не открыт',
      translate: 'Перевести', addIcon: 'Добавить значок', footShort: 'Неофициальный фанатский проект', footRights: 'Права на изображения', footContributing: 'Как помочь', translating: 'Перевод: {lang}', progress: 'Названия: {done} из {total} ({pct})',
      draftsSaved: 'Черновики в этом браузере: {n}', draftSaved: 'Черновики в этом браузере: 1', onlyUntranslated: 'Только без перевода',
      newLanguage: 'Начать новый язык…', newLanguageLabel: 'Начать новый язык', submit: 'Отправить', submitCount: 'Отправить ({n})', done: 'Готово', folderName: 'Название папки', draftTag: 'черновик'
    },
    ja: {
      title: 'アイコンカタログ', search: 'アイコンを検索…', searchLabel: 'アイコンを検索', folders: 'フォルダー', all: 'すべて', icon: '{n} 個のアイコン', icons: '{n} 個のアイコン',
      none: '結果はありません。', allDone: 'ここのアイコンにはすべて名前があります。', skip: 'アイコンへ移動', contact: '連絡先:', language: '言語', copy: 'コピー', copied: 'コピーしました', url: 'URL', path: 'パス', name: '名前',
      openTab: '新しいタブで開く', prev: '前へ', next: '次へ', close: '閉じる', untranslated: '未翻訳', coverage: '{lang}: {pct} 翻訳済み', notOpenTag: '未公開',
      translate: '翻訳する', addIcon: 'アイコンを追加', footShort: '非公式ファンプロジェクト', footRights: '画像の権利', footContributing: '貢献する', translating: '{lang} に翻訳中', progress: '{total} 件中 {done} 件 ({pct})',
      draftsSaved: '{n} 件の下書きをこのブラウザーに保存しました', draftSaved: '1 件の下書きをこのブラウザーに保存しました', onlyUntranslated: '未翻訳のみ',
      newLanguage: '新しい言語を始める…', newLanguageLabel: '新しい言語を始める', submit: '送信', submitCount: '{n} 件を送信', done: '完了', folderName: 'フォルダー名', draftTag: '下書き'
    },
    ko: {
      title: '아이콘 카탈로그', search: '아이콘 검색…', searchLabel: '아이콘 검색', folders: '폴더', all: '전체', icon: '아이콘 {n}개', icons: '아이콘 {n}개',
      none: '결과가 없습니다.', allDone: '여기 있는 아이콘은 모두 이름이 있습니다.', skip: '아이콘으로 건너뛰기', contact: '연락처:', language: '언어', copy: '복사', copied: '복사됨', url: 'URL', path: '경로', name: '이름',
      openTab: '새 탭에서 열기', prev: '이전', next: '다음', close: '닫기', untranslated: '번역 안 됨', coverage: '{lang}: {pct} 번역됨', notOpenTag: '아직 열리지 않음',
      translate: '번역하기', addIcon: '아이콘 추가', footShort: '비공식 팬 프로젝트', footRights: '이미지 권리', footContributing: '기여하기', translating: '{lang} 번역 중', progress: '{total}개 중 {done}개 ({pct})',
      draftsSaved: '이 브라우저에 초안 {n}개 저장됨', draftSaved: '이 브라우저에 초안 1개 저장됨', onlyUntranslated: '번역 안 된 것만',
      newLanguage: '새 언어 시작…', newLanguageLabel: '새 언어 시작', submit: '보내기', submitCount: '{n}개 보내기', done: '완료', folderName: '폴더 이름', draftTag: '초안'
    },
    'zh-CN': {
      title: '图标目录', search: '搜索图标…', searchLabel: '搜索图标', folders: '文件夹', all: '全部', icon: '{n} 个图标', icons: '{n} 个图标',
      none: '没有结果。', allDone: '这里的每个图标都有名称。', skip: '跳到图标', contact: '联系我:', language: '语言', copy: '复制', copied: '已复制', url: '网址', path: '路径', name: '名称',
      openTab: '在新标签页中打开', prev: '上一个', next: '下一个', close: '关闭', untranslated: '未翻译', coverage: '{lang}:已翻译 {pct}', notOpenTag: '尚未开放',
      translate: '翻译', addIcon: '添加图标', footShort: '非官方粉丝项目', footRights: '图片权利', footContributing: '参与贡献', translating: '正在翻译为{lang}', progress: '{total} 个中已命名 {done} 个 ({pct})',
      draftsSaved: '{n} 份草稿已保存在此浏览器', draftSaved: '1 份草稿已保存在此浏览器', onlyUntranslated: '仅未翻译',
      newLanguage: '开始新语言…', newLanguageLabel: '开始新语言', submit: '提交', submitCount: '提交 {n} 项', done: '完成', folderName: '文件夹名称', draftTag: '草稿'
    },
    'zh-TW': {
      title: '圖示目錄', search: '搜尋圖示…', searchLabel: '搜尋圖示', folders: '資料夾', all: '全部', icon: '{n} 個圖示', icons: '{n} 個圖示',
      none: '沒有結果。', allDone: '這裡的每個圖示都有名稱。', skip: '跳到圖示', contact: '聯絡我:', language: '語言', copy: '複製', copied: '已複製', url: '網址', path: '路徑', name: '名稱',
      openTab: '在新分頁中開啟', prev: '上一個', next: '下一個', close: '關閉', untranslated: '未翻譯', coverage: '{lang}:已翻譯 {pct}', notOpenTag: '尚未開放',
      translate: '翻譯', addIcon: '新增圖示', footShort: '非官方粉絲專案', footRights: '圖片權利', footContributing: '參與貢獻', translating: '正在翻譯為{lang}', progress: '{total} 個中已命名 {done} 個 ({pct})',
      draftsSaved: '{n} 份草稿已儲存在此瀏覽器', draftSaved: '1 份草稿已儲存在此瀏覽器', onlyUntranslated: '僅未翻譯',
      newLanguage: '開始新語言…', newLanguageLabel: '開始新語言', submit: '提交', submitCount: '提交 {n} 項', done: '完成', folderName: '資料夾名稱', draftTag: '草稿'
    }
  };

  var lang = 'en';
  var languages = DEFAULT_LANGUAGES;
  var names = {};
  var drafts = {};
  var storageOk = true;
  var translating = false;
  var items = [];
  var nodes = [];
  var known = {};
  var byKey = {};
  var byNode = {};
  var root = { name: '', label: '', path: '', key: '', count: 0, open: 0, rest: 0, translatable: true, kids: {} };
  var closed = {};
  var state = { node: '', q: '', untranslated: false };
  var list = [];
  var shown = 0;
  var current = -1;
  var loaded = false;
  var saveTimer;
  var $ = function (id) { return document.getElementById(id); };
  var own = function (obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };

  /* ---------- small helpers ---------- */

  function el(tag, props, kids) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (type) { node.addEventListener(type, v[type]); });
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    });
    (kids || []).forEach(function (kid) { if (kid) node.append(kid); });
    return node;
  }

  function ui() {
    return UI[lang] || UI.en;
  }

  function t(key, vars) {
    var table = ui();
    var text = own(table, key) ? table[key] : UI.en[key];
    return text.replace(/\{(\w+)\}/g, function (m, v) { return vars && own(vars, v) ? vars[v] : m; });
  }

  function fmt(n) {
    try { return n.toLocaleString(lang); } catch (e) { return String(n); }
  }

  function pct(done, total) {
    var value = total ? Math.floor((done / total) * 100) / 100 : 0;
    try { return value.toLocaleString(lang, { style: 'percent' }); } catch (e) { return Math.round(value * 100) + '%'; }
  }

  function iconCount(n) {
    return t(n === 1 ? 'icon' : 'icons', { n: fmt(n) });
  }

  function languageName(code) {
    return own(languages, code) ? languages[code] : own(PROPOSABLE, code) ? PROPOSABLE[code] : code;
  }

  function isOpen(code) {
    return own(languages, code);
  }

  /* ---------- storage: everything must keep working without it ---------- */

  function storeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { storageOk = false; return null; }
  }

  function storeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function storeRemove(key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  }

  function loadDrafts() {
    var raw = storeGet(STORE_DRAFTS);
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(function (code) {
      if (!own(PROPOSABLE, code) && !isOpen(code)) return;
      var entries = data[code];
      if (!entries || typeof entries !== 'object') return;
      Object.keys(entries).forEach(function (key) {
        if (typeof entries[key] !== 'string') return;
        (own(drafts, code) ? drafts[code] : (drafts[code] = {}))[key] = entries[key];
      });
    });
  }

  function saveDrafts() {
    clearTimeout(saveTimer);
    saveTimer = null;
    storageOk = Object.keys(drafts).length ? storeSet(STORE_DRAFTS, JSON.stringify(drafts)) : storeRemove(STORE_DRAFTS);
    renderStatus();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDrafts, 300);
  }

  function draftsOf(code) {
    return own(drafts, code) ? drafts[code] : {};
  }

  function draftCount(code) {
    return Object.keys(draftsOf(code)).length;
  }

  function hasDraft(key) {
    return own(draftsOf(lang), key);
  }

  // A draft only exists while it differs from the published name, so a merged translation clears itself.
  function pruneDrafts(code) {
    if (!own(drafts, code)) return;
    var published = own(names, code) ? names[code] : {};
    var changed = false;
    Object.keys(drafts[code]).forEach(function (key) {
      if (own(published, key) && published[key] === drafts[code][key]) {
        delete drafts[code][key];
        changed = true;
      }
    });
    if (!Object.keys(drafts[code]).length) delete drafts[code];
    if (changed) saveDrafts();
  }

  function setDraft(key, raw) {
    var value = raw.trim();
    var entries = own(drafts, lang) ? drafts[lang] : (drafts[lang] = {});
    if (!value || value === published(key)) delete entries[key];
    else entries[key] = value;
    if (!Object.keys(entries).length) delete drafts[lang];
    scheduleSave();
    renderStatus();
  }

  /* ---------- names ---------- */

  function published(key) {
    var table = own(names, lang) ? names[lang] : null;
    return table && own(table, key) ? table[key] : '';
  }

  function englishName(key) {
    var table = own(names, 'en') ? names.en : null;
    return table && own(table, key) ? table[key] : '';
  }

  function isUntranslated(key) {
    return own(known, key) && !published(key) && !(translating && hasDraft(key));
  }

  // Fallback order set by the contract: this language's name, then a name from the file. Never another language.
  function fileName(file) {
    return lang === 'tr' ? baseName(file) : pretty(file);
  }

  function folderName(name) {
    return lang === 'tr' ? name : name.charAt(0).toUpperCase() + name.slice(1);
  }

  function shownName(key, fallback) {
    if (translating && hasDraft(key)) return draftsOf(lang)[key];
    return published(key) || fallback;
  }

  function relabel() {
    nodes.forEach(function (node) { node.label = shownName(node.key, folderName(node.name)); });
    items.forEach(function (it) {
      it.label = shownName(it.key, fileName(it.file));
      it.lower = (it.rel + ' ' + it.label + ' ' + englishName(it.key) + ' ' + dirLabel(it.dir, 0)).toLowerCase();
    });
  }

  function nameProblem(value) {
    if (Array.from(value).length > NAME_LIMIT) return 'errLong';
    if (/[<>]/.test(value)) return 'errAngle';
    if (/&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(value)) return 'errEntity';
    if (value.indexOf('://') >= 0) return 'errUrl';
    if (/[\u202a-\u202e\u2066-\u2069]/.test(value)) return 'errBidi';
    if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029\ufeff\ud800-\udfff]/u.test(value)) return 'errControl';
    return '';
  }

  function coverage(code) {
    var table = own(names, code) ? names[code] : {};
    var done = 0;
    var total = 0;
    items.concat(nodes).forEach(function (entry) {
      if (!entry.translatable) return;
      total++;
      if (own(table, entry.key)) done++;
    });
    return { done: done, total: total };
  }

  /* ---------- hash ---------- */

  function readHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var i = h.indexOf('?');
    var path = i < 0 ? h : h.slice(0, i);
    try { path = decodeURIComponent(path); } catch (e) { path = ''; }
    var params = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
    state.node = path.replace(/\/+$/, '');
    state.q = params.get('q') || '';
    return params;
  }

  function writeHash() {
    var parts = [];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (translating) parts.push('translate=1');
    history.replaceState(null, '', '#/' + state.node.split('/').map(encodeURIComponent).join('/') + (parts.length ? '?' + parts.join('&') : ''));
  }

  /* ---------- catalog tree ---------- */

  function build(dirs) {
    var prefix = ROOT + '/';
    Object.keys(dirs).sort().forEach(function (dir) {
      if (dir.indexOf(prefix) !== 0) return;
      dirs[dir].forEach(function (file) {
        if (!TRANSLATABLE_EXT.test(file)) return;
        known[dir + '/' + baseName(file)] = true;
        var keyPath = '';
        dir.split('/').forEach(function (p) {
          keyPath = keyPath ? keyPath + '/' + p : p;
          known[keyPath] = true;
        });
      });
      var rel = dir.slice(prefix.length);
      var node = root;
      var chain = [root];
      var path = '';
      rel.split('/').forEach(function (p) {
        path = path ? path + '/' + p : p;
        if (!own(node.kids, p)) {
          node.kids[p] = { name: p, label: p, path: path, key: prefix + path, count: 0, open: 0, rest: 0, translatable: false, kids: {} };
          nodes.push(node.kids[p]);
          byNode[prefix + path] = node.kids[p];
        }
        node = node.kids[p];
        chain.push(node);
      });
      dirs[dir].forEach(function (file) {
        var full = dir + '/' + file;
        var key = dir + '/' + baseName(file);
        var it = { dir: rel, file: file, path: full, key: key, rel: rel + '/' + file, label: '', lower: '', chain: chain, translatable: own(known, key) };
        items.push(it);
        byKey[key] = it;
        chain.forEach(function (n) {
          n.count++;
          if (it.translatable) {
            n.open++;
            n.translatable = true;
          }
        });
      });
    });
  }

  function dirLabel(dir, skip) {
    var node = root;
    var out = [];
    dir.split('/').forEach(function (p) {
      node = node && own(node.kids, p) ? node.kids[p] : null;
      if (node) out.push(node.label);
    });
    return out.slice(skip).join(' / ');
  }

  function find(path) {
    if (!path) return root;
    var node = root;
    var parts = path.split('/');
    for (var i = 0; i < parts.length; i++) {
      if (!own(node.kids, parts[i])) return null;
      node = node.kids[parts[i]];
    }
    return node;
  }

  function sortedKids(node) {
    return Object.keys(node.kids).filter(function (k) {
      return !translating || node.kids[k].translatable;
    }).sort(function (a, b) {
      return node.kids[a].label.localeCompare(node.kids[b].label, lang);
    }).map(function (k) { return node.kids[k]; });
  }

  function countRemaining() {
    root.rest = 0;
    nodes.forEach(function (node) { node.rest = 0; });
    items.forEach(function (it) {
      if (isUntranslated(it.key)) it.chain.forEach(function (n) { n.rest++; });
    });
  }

  function onlyUntranslated() {
    return translating && state.untranslated;
  }

  function renderTree() {
    var ul = $('tree');
    ul.textContent = '';
    if (onlyUntranslated()) countRemaining();
    var top = document.createElement('li');
    top.appendChild(nodeButton(root, t('all'), false));
    ul.appendChild(top);
    sortedKids(root).forEach(function (n) { ul.appendChild(branch(n)); });
  }

  function nodeButton(node, label, hasKids) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'node';
    if (node.path === state.node) b.setAttribute('aria-current', 'true');
    var car = document.createElement('span');
    car.className = 'car';
    car.textContent = hasKids ? (closed[node.path] ? '▸' : '▾') : '';
    var nm = document.createElement('span');
    nm.className = 'nm';
    nm.dir = 'auto';
    nm.textContent = label;
    if (translating && node.key && isUntranslated(node.key)) nm.appendChild(untranslatedMark());
    var ct = document.createElement('span');
    ct.className = 'ct';
    ct.textContent = fmt(onlyUntranslated() ? node.rest : translating ? node.open : node.count);
    b.append(car, nm, ct);
    b.addEventListener('click', function () {
      if (hasKids) closed[node.path] = node.path === state.node ? !closed[node.path] : false;
      select(node.path);
      setNav(false);
    });
    return b;
  }

  function branch(node) {
    var kids = sortedKids(node);
    var li = document.createElement('li');
    li.appendChild(nodeButton(node, node.label, kids.length > 0));
    if (kids.length && !closed[node.path]) {
      var ul = document.createElement('ul');
      kids.forEach(function (k) { ul.appendChild(branch(k)); });
      li.appendChild(ul);
    }
    return li;
  }

  function renderCrumbs() {
    var crumbs = $('crumbs');
    crumbs.textContent = '';
    var all = document.createElement('button');
    all.type = 'button';
    all.textContent = t('all');
    all.onclick = function () { select(''); };
    crumbs.appendChild(all);
    if (!state.node) return;
    var path = '';
    state.node.split('/').forEach(function (p) {
      path = path ? path + '/' + p : p;
      var sep = document.createElement('span');
      sep.textContent = '/';
      var target = path;
      var b = document.createElement('button');
      b.type = 'button';
      b.dir = 'auto';
      b.textContent = find(target).label;
      b.onclick = function () { select(target); };
      crumbs.append(sep, b);
    });
  }

  function baseName(file) {
    return file.replace(/\.[a-z0-9]+$/i, '');
  }

  function pretty(file) {
    return baseName(file)
      .replace(/^MOD_/, '')
      .replace(/_UI(_T)?_/, ' – ')
      .replace(/^UI(_T)?_/, '')
      .replace(/^wy_/, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function urlOf(it) {
    return BASE + it.path.split('/').map(encodeURIComponent).join('/');
  }

  function untranslatedMark() {
    return el('span', { class: 'unt', title: t('untranslated') }, [
      el('span', { text: '○', 'aria-hidden': 'true' }),
      el('span', { class: 'sr', text: ' (' + t('untranslated') + ')' })
    ]);
  }

  /* ---------- grid ---------- */

  function filter() {
    var prefix = state.node ? state.node + '/' : '';
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var only = onlyUntranslated();
    list = items.filter(function (it) {
      if (prefix && it.rel.indexOf(prefix) !== 0) return false;
      if (translating && !it.translatable) return false;
      if (only && !isUntranslated(it.key)) return false;
      for (var i = 0; i < words.length; i++) if (it.lower.indexOf(words[i]) < 0) return false;
      return true;
    });
    shown = 0;
    $('grid').textContent = '';
    var noneKey = only && !words.length ? 'allDone' : 'none';
    $('empty').dataset.t = noneKey;
    $('empty').textContent = t(noneKey);
    $('empty').hidden = list.length > 0;
    $('count').textContent = iconCount(list.length);
    renderLegend();
    more();
  }

  function renderLegend() {
    var legend = $('legend');
    legend.textContent = '';
    if (translating || !loaded) return;
    var cover = coverage(lang);
    legend.append(el('span', { text: t('coverage', { lang: languageName(lang), pct: pct(cover.done, cover.total) }) }));
    if (cover.done < cover.total) legend.append(' · ', el('span', { 'aria-hidden': 'true', text: '○ ' }), t('untranslated'));
  }

  function more() {
    var end = Math.min(list.length, shown + CHUNK);
    var frag = document.createDocumentFragment();
    for (var i = shown; i < end; i++) frag.appendChild(translating ? editFigure(list[i], i) : viewFigure(list[i], i));
    $('grid').appendChild(frag);
    shown = end;
  }

  function thumb(it) {
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = it.file;
    img.src = urlOf(it);
    return img;
  }

  function viewFigure(it, i) {
    var fig = document.createElement('figure');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.title = it.rel;
    fig.dataset.i = i;
    var cap = document.createElement('figcaption');
    var name = document.createElement('b');
    name.dir = 'auto';
    name.textContent = it.label;
    if (isUntranslated(it.key)) name.prepend(untranslatedMark());
    var dir = document.createElement('small');
    dir.textContent = dirLabel(it.dir, state.node ? state.node.split('/').length : 0) || ' ';
    cap.append(name, dir);
    fig.append(thumb(it), cap);
    return fig;
  }

  function sourceName(it) {
    return (lang !== 'en' && englishName(it.key)) || pretty(it.file);
  }

  function editFigure(it, i) {
    var fig = document.createElement('figure');
    fig.className = 'edit';
    fig.dataset.i = i;
    var source = sourceName(it);
    var input = el('input', {
      type: 'text', class: 'nm-in', dir: 'auto', spellcheck: false, autocomplete: 'off',
      value: hasDraft(it.key) ? draftsOf(lang)[it.key] : published(it.key),
      placeholder: fileName(it.file),
      'aria-label': t('nameFor', { source: source, path: it.rel }),
      'aria-keyshortcuts': 'Alt+Enter', title: t('previewKey')
    });
    input.dataset.key = it.key;
    var src = el('small', { class: 'src', title: it.rel }, [
      el('span', { dir: 'auto', text: source }),
      el('span', { class: 'dr', text: t('draftTag') })
    ]);
    var err = el('small', { class: 'err', id: 'err-' + i, hidden: true });
    input.setAttribute('aria-describedby', err.id);
    var cap = el('figcaption', null, [input, src, err]);
    fig.append(thumb(it), cap);
    markInput(input);
    return fig;
  }

  function markInput(input) {
    var key = input.dataset.key;
    var fig = input.closest('figure');
    var err = input.parentNode.querySelector('.err');
    var value = input.value.trim();
    var problem = value ? nameProblem(value) : '';
    input.classList.toggle('has-draft', hasDraft(key));
    if (fig) fig.classList.toggle('drafted', hasDraft(key));
    input.setAttribute('aria-invalid', problem ? 'true' : 'false');
    if (err) {
      err.hidden = !problem;
      err.textContent = problem ? t(problem) : '';
    }
  }

  function commitInput(input) {
    var key = input.dataset.key;
    setDraft(key, input.value);
    markInput(input);
    var it = own(byKey, key) ? byKey[key] : null;
    if (it) {
      it.label = shownName(key, fileName(it.file));
      it.lower = (it.rel + ' ' + it.label + ' ' + englishName(key) + ' ' + dirLabel(it.dir, 0)).toLowerCase();
    }
  }

  function moveFocus(from, delta) {
    var fig = from.closest('figure');
    var next = Number(fig.dataset.i) + delta;
    if (next < 0 || next >= list.length) return;
    while (next >= shown) more();
    var target = $('grid').querySelector('figure[data-i="' + next + '"] input');
    if (target) { target.focus(); target.select(); }
  }

  /* ---------- folder name, translate mode only ---------- */

  function renderFolderEdit() {
    var old = $('folder-edit');
    if (old) old.remove();
    if (!translating || !state.node) return;
    var node = find(state.node);
    if (!own(known, node.key)) return;
    var err = el('small', { class: 'err', id: 'folder-err', hidden: true });
    var input = el('input', {
      type: 'text', id: 'folder-in', class: 'nm-in', dir: 'auto', spellcheck: false, autocomplete: 'off',
      value: hasDraft(node.key) ? draftsOf(lang)[node.key] : published(node.key),
      placeholder: folderName(node.name),
      on: {
        input: function () { commitInput(input); },
        change: function () {
          relabel();
          renderTree();
          renderCrumbs();
          input.focus();
        }
      }
    });
    input.dataset.key = node.key;
    input.setAttribute('aria-describedby', 'folder-err');
    var label = el('label', { htmlFor: 'folder-in', text: t('folderName') });
    var box = el('div', { id: 'folder-edit', class: 'folder-edit' }, [label, el('div', { class: 'folder-in' }, [input, err])]);
    $('bar').appendChild(box);
    markInput(input);
  }

  /* ---------- select ---------- */

  function select(path) {
    var node = find(path);
    state.node = node && (!translating || node.translatable) ? path : '';
    writeHash();
    renderTree();
    renderCrumbs();
    renderFolderEdit();
    filter();
    $('main').scrollTop = 0;
  }

  /* ---------- copy ---------- */

  function copy(text, btn) {
    var done = function () {
      if (!btn || btn.classList.contains('ok')) return;
      var label = btn.textContent;
      btn.textContent = t('copied');
      btn.classList.add('ok');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('ok'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, btn); done(); });
    } else {
      fallback(text, btn);
      done();
    }
  }

  // A modal dialog makes the rest of the page inert, so the helper has to live inside it.
  function fallback(text, btn) {
    var host = (btn && btn.closest('dialog')) || document.body;
    var ta = document.createElement('textarea');
    ta.value = text;
    host.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------- icon dialog ---------- */

  function show(i) {
    if (i < 0 || i >= list.length) return;
    current = i;
    var it = list[i];
    var url = urlOf(it);
    $('d-title').dir = 'auto';
    $('d-title').textContent = it.label;
    $('d-img').src = url;
    $('d-img').alt = it.file;
    $('d-dim').textContent = '';
    $('d-url').value = url;
    $('d-path').value = it.path;
    $('d-name').value = baseName(it.file);
    $('d-open').href = url;
    $('d-pos').textContent = fmt(i + 1) + ' / ' + fmt(list.length) + (isUntranslated(it.key) ? ' · ' + t('untranslated') : '');
    var dlg = $('dlg');
    if (!dlg.open) dlg.showModal();
  }

  function step(delta) {
    var next = current + delta;
    if (next < 0 || next >= list.length) return;
    while (next >= shown) more();
    show(next);
  }

  /* ---------- static text ---------- */

  function applyStatic() {
    var html = document.documentElement;
    html.lang = own(UI, lang) ? lang : 'en';
    $('grid').lang = lang;
    $('tree').lang = lang;
    var title = t('title');
    document.title = title;
    $('title').textContent = title;
    $('q').placeholder = t('search');
    $('q').setAttribute('aria-label', t('searchLabel'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (node) {
      if (!node.classList.contains('ok')) node.textContent = t(node.dataset.t);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-label]'), function (node) {
      var label = t(node.dataset.tLabel);
      node.setAttribute('aria-label', label);
      node.title = node.id === 'd-prev' ? label + ' (←)' : node.id === 'd-next' ? label + ' (→)' : label + ' (Esc)';
    });
  }

  function renderFooter() {
    var foot = $('foot');
    foot.textContent = '';
    foot.append(
      el('span', { class: own(ui(), 'footNote') ? 'note-long' : '', text: own(ui(), 'footNote') ? t('footNote') : t('footShort') }),
      own(ui(), 'footNote') ? el('span', { class: 'note-short', text: t('footShort') }) : '',
      el('span', { class: 'links' }, [
        el('a', { href: REPO + '/blob/main/ASSETS.md', target: '_blank', rel: 'noopener', text: t('footRights') }),
        el('a', { href: REPO + '/blob/main/CONTRIBUTING.md', target: '_blank', rel: 'noopener', text: t('footContributing') }),
        el('a', { href: REPO, target: '_blank', rel: 'noopener', text: t('footRepo') })
      ])
    );
  }

  /* ---------- language selector ---------- */

  function renderTools() {
    var box = $('tools');
    box.textContent = '';
    var picker = languageMenu({
      id: 'lang', label: t('language'), current: lang, codes: languageOptions(), labelOf: languageLabel,
      onOpen: loadAllNames, onPick: setLang
    });
    var count = draftCount(lang);
    box.append(picker);
    if (translating) box.append(newLanguageMenu());
    box.append(
      el('button', {
        class: 'btn', id: 'translate', type: 'button', hidden: translating,
        text: t('translate') + (count ? ' (' + fmt(count) + ')' : ''),
        on: { click: function () { setTranslating(true); } }
      }),
      el('button', {
        class: 'btn', id: 'add-icon', type: 'button', text: t('addIcon'),
        on: { click: openHelp }
      })
    );
  }

  function newLanguageMenu() {
    var codes = Object.keys(PROPOSABLE)
      .filter(function (code) { return !isOpen(code) && code !== lang; })
      .sort(function (a, b) { return PROPOSABLE[a].localeCompare(PROPOSABLE[b]); });
    return languageMenu({
      id: 't-new', label: t('newLanguageLabel'), placeholder: t('newLanguage'), codes: codes,
      labelOf: function (code) { return PROPOSABLE[code]; }, onPick: setLang
    });
  }

  function flagImg(code) {
    return el('img', { class: 'flag', src: FLAGS[code] || '', alt: '', width: 20, height: 15, hidden: !FLAGS[code] });
  }

  // A listbox rather than a native select: option rows cannot hold images, and flags are the point.
  // Keyboard follows the select pattern: arrows, Home, End, typing to jump, Enter or Space to pick, Esc or Tab to close.
  function languageMenu(o) {
    var active = -1;
    var typed = '';
    var typedAt = 0;
    var listId = o.id + '-list';
    var chosen = el('span', { class: 'menu-text' });
    var trigger = el('button', {
      class: 'menu-btn', id: o.id, type: 'button', title: o.label,
      'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-controls': listId, 'aria-label': o.label,
      on: { click: function () { list.hidden ? open() : close(true); }, keydown: onKey }
    });
    var list = el('ul', { class: 'menu-list', id: listId, role: 'listbox', tabIndex: -1, hidden: true, 'aria-label': o.label, on: { keydown: onKey } });
    var rows = o.codes.map(function (code, i) {
      var text = el('span', { class: 'menu-text' });
      var row = el('li', {
        class: 'menu-row', id: listId + '-' + i, role: 'option', 'aria-selected': String(code === o.current),
        on: { click: function () { pick(i); }, pointermove: function () { setActive(i, false); } }
      }, [flagImg(code), text]);
      row.dataset.code = code;
      list.appendChild(row);
      return { row: row, text: text, code: code };
    });
    var wrap = el('div', { class: 'menu' }, [trigger, list]);
    trigger.appendChild(chosen);
    trigger.prepend(flagImg(o.current || ''));
    trigger.appendChild(el('span', { class: 'menu-car', 'aria-hidden': 'true', text: '▾' }));

    function refresh() {
      chosen.textContent = o.current ? o.labelOf(o.current) : o.placeholder;
      rows.forEach(function (r) { r.text.textContent = o.labelOf(r.code); });
    }
    wrap.refresh = refresh;
    refresh();

    function setActive(i, reveal) {
      if (active >= 0 && rows[active]) rows[active].row.classList.remove('on');
      active = i;
      if (!rows[i]) return list.removeAttribute('aria-activedescendant');
      rows[i].row.classList.add('on');
      list.setAttribute('aria-activedescendant', rows[i].row.id);
      if (reveal) rows[i].row.scrollIntoView({ block: 'nearest' });
    }
    function open() {
      if (o.onOpen) o.onOpen();
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrap.classList.toggle('up', trigger.getBoundingClientRect().bottom + list.offsetHeight > window.innerHeight - 8 && trigger.getBoundingClientRect().top > list.offsetHeight);
      var at = rows.findIndex(function (r) { return r.code === o.current; });
      setActive(at < 0 ? 0 : at, true);
      list.focus({ preventScroll: true });
      document.addEventListener('pointerdown', outside, true);
    }
    function close(refocus) {
      if (list.hidden) return;
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      if (refocus) trigger.focus();
    }
    function outside(e) {
      if (!wrap.contains(e.target)) close(false);
    }
    function pick(i) {
      var code = rows[i] && rows[i].code;
      close(true);
      if (code && code !== o.current) o.onPick(code);
    }
    function onKey(e) {
      var k = e.key;
      if (list.hidden) {
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
        return;
      }
      if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (k === 'Tab') close(false);
      else if (k === 'ArrowDown') { e.preventDefault(); setActive(Math.min(active + 1, rows.length - 1), true); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0), true); }
      else if (k === 'Home') { e.preventDefault(); setActive(0, true); }
      else if (k === 'End') { e.preventDefault(); setActive(rows.length - 1, true); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); pick(active); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var now = Date.now();
        typed = (now - typedAt > 700 ? '' : typed) + k.toLocaleLowerCase();
        typedAt = now;
        var hit = rows.findIndex(function (r) { return languageName(r.code).toLocaleLowerCase().indexOf(typed) === 0; });
        if (hit >= 0) setActive(hit, true);
      }
    }
    return wrap;
  }

  // Percentages need every names file, so they load only when someone reaches for the list.
  var allNames;

  function loadAllNames() {
    if (!loaded) return;
    allNames = allNames || Promise.all(Object.keys(languages).map(loadNames));
    allNames.then(function () {
      var box = $('lang');
      if (box && box.parentNode.refresh) box.parentNode.refresh();
    });
  }

  // English first, the rest by name
  function languageOptions() {
    var codes = Object.keys(languages);
    Object.keys(drafts).concat(lang).forEach(function (code) {
      if (codes.indexOf(code) < 0) codes.push(code);
    });
    return codes.sort(function (a, b) {
      if (a === 'en' || b === 'en') return a === 'en' ? -1 : 1;
      return languageName(a).localeCompare(languageName(b));
    });
  }

  function languageLabel(code) {
    if (!isOpen(code)) return languageName(code) + ' (' + t('notOpenTag') + ')';
    if (!loaded || !own(names, code)) return languageName(code);
    var cover = coverage(code);
    return languageName(code) + ' · ' + pct(cover.done, cover.total);
  }

  function pickLanguage(requested, open) {
    var candidates = [requested, storeGet(STORE_LANG)];
    for (var i = 0; i < candidates.length; i++) {
      var code = candidates[i];
      if (code && (open.indexOf(code) >= 0 || own(PROPOSABLE, code))) return code;
    }
    var browser = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var j = 0; j < browser.length; j++) {
      var wanted = String(browser[j]).toLowerCase();
      var match = open.filter(function (c) { return c.toLowerCase() === wanted; })[0]
        || open.filter(function (c) { return c.toLowerCase().split('-')[0] === wanted.split('-')[0]; })[0];
      if (match) return match;
    }
    return open.indexOf('en') >= 0 ? 'en' : open[0] || 'en';
  }

  function loadNames(code) {
    if (own(names, code)) return Promise.resolve();
    if (!isOpen(code)) {
      names[code] = {};
      return Promise.resolve();
    }
    return fetch('names/' + encodeURIComponent(code) + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (data) {
        var clean = {};
        if (data && typeof data === 'object') {
          Object.keys(data).forEach(function (key) {
            if (typeof data[key] === 'string' && data[key]) clean[key] = data[key];
          });
        }
        names[code] = clean;
        pruneDrafts(code);
      });
  }

  var langRequest = 0;

  function setLang(code) {
    var request = ++langRequest;
    storeSet(STORE_LANG, code);
    return loadNames(code).then(function () {
      if (request !== langRequest) return;
      lang = code;
      refresh();
    });
  }

  function refresh() {
    applyStatic();
    renderFooter();
    relabel();
    renderTools();
    renderBar();
    if (!loaded) return;
    $('total').textContent = iconCount(root.count);
    select(state.node);
  }

  /* ---------- translate mode ---------- */

  function setTranslating(on) {
    if (!on && saveTimer) saveDrafts();
    translating = on;
    document.body.classList.toggle('translating', on);
    refresh();
    if (on) {
      var first = window.matchMedia('(pointer:fine)').matches ? $('grid').querySelector('input') : null;
      (first || $('t-only')).focus({ preventScroll: true });
    } else if ($('translate')) {
      $('translate').focus();
    }
  }

  function renderBar() {
    var bar = $('tbar');
    bar.hidden = !translating;
    bar.textContent = '';
    if (!translating) return;
    var only = el('input', {
      type: 'checkbox', id: 't-only', checked: state.untranslated,
      on: {
        change: function (e) {
          state.untranslated = e.target.checked;
          relabel();
          renderTree();
          filter();
          $('main').scrollTop = 0;
        }
      }
    });
    var onlyLabel = el('label', { class: 'check' }, [only, ' ' + t('onlyUntranslated')]);

    bar.append(
      el('div', { class: 'tbar-state' }, [
        el('strong', { dir: 'auto', text: t('translating', { lang: languageName(lang) }) }),
        el('span', { id: 't-progress', class: 'muted' }),
        el('progress', { id: 't-meter', max: 1, value: 0, 'aria-hidden': 'true' }),
        el('span', { id: 't-drafts', class: 'muted', 'aria-live': 'polite' })
      ]),
      el('div', { class: 'tbar-tools' }, [
        onlyLabel,
        el('button', { class: 'btn primary', id: 't-submit', type: 'button', text: t('submit'), on: { click: openSend } }),
        el('button', { class: 'btn', id: 't-done', type: 'button', text: t('done'), on: { click: function () { setTranslating(false); } } })
      ])
    );
    if (!isOpen(lang)) bar.append(el('p', { class: 'tbar-note', text: t('notOpenBar', { lang: languageName(lang) }) }));
    renderStatus();
  }

  function renderStatus() {
    var btn = $('translate');
    var count = draftCount(lang);
    if (btn) btn.textContent = t('translate') + (count ? ' (' + fmt(count) + ')' : '');
    if (!translating || !$('t-drafts')) return;
    var cover = coverage(lang);
    var table = own(names, lang) ? names[lang] : {};
    var added = 0;
    Object.keys(draftsOf(lang)).forEach(function (key) { if (!own(table, key) && own(known, key) && (own(byKey, key) || own(byNode, key))) added++; });
    var done = cover.done + added;
    $('t-progress').textContent = t('progress', { done: fmt(done), total: fmt(cover.total), pct: pct(done, cover.total) });
    $('t-meter').max = cover.total || 1;
    $('t-meter').value = done;
    var text = !count ? '' : !storageOk ? t('draftsVolatile', { n: fmt(count) }) : count === 1 ? t('draftSaved') : t('draftsSaved', { n: fmt(count) });
    $('t-drafts').textContent = text;
    $('t-submit').textContent = count ? t('submitCount', { n: fmt(count) }) : t('submit');
  }

  /* ---------- submit, as set by docs/CONTRIBUTION-CONTRACT.md ---------- */

  function issueUrl(body) {
    var base = REPO + '/issues/new?template=translation.yml&title=' + encodeURIComponent('Translation: ' + languageName(body.lang));
    var full = base + '&payload=' + encodeURIComponent(JSON.stringify(body));
    return full.length <= URL_LIMIT ? { url: full, base: base, prefilled: true } : { url: base, base: base, prefilled: false };
  }

  function splitParts(code, entries) {
    var empty = JSON.stringify({ lang: code, names: {} }).length;
    var parts = [];
    var chunk = {};
    var size = empty;
    var count = 0;
    Object.keys(entries).sort().forEach(function (key) {
      var cost = JSON.stringify(key).length + JSON.stringify(entries[key]).length + 2;
      if (count && size + cost > JSON_LIMIT) {
        parts.push({ lang: code, names: chunk });
        chunk = {};
        size = empty;
        count = 0;
      }
      chunk[key] = entries[key];
      size += cost;
      count++;
    });
    if (count) parts.push({ lang: code, names: chunk });
    return parts;
  }

  function collect() {
    var table = draftsOf(lang);
    var good = {};
    var problems = [];
    var stale = 0;
    Object.keys(table).forEach(function (key) {
      if (!own(known, key)) { stale++; return; }
      var value = table[key].trim();
      if (!value || value === published(key)) return;
      var problem = nameProblem(value);
      if (problem) problems.push({ key: key, value: value, problem: problem });
      else good[key] = value;
    });
    return { good: good, problems: problems, stale: stale };
  }

  function dialogHead(titleKey, dlg) {
    return el('div', { class: 'dlg-top' }, [
      el('h2', { text: t(titleKey) }),
      el('button', {
        class: 'icon-btn', type: 'button', 'aria-label': t('close'), title: t('close') + ' (Esc)', text: '✕',
        on: { click: function () { dlg.close(); } }
      })
    ]);
  }

  function para(text, cls) {
    return el('p', { text: text, class: cls || '' });
  }

  function linkBtn(text, href, cls, onClick) {
    var props = { class: 'btn ' + (cls || ''), href: href, target: '_blank', rel: 'noopener', text: text };
    if (onClick) props.on = { click: onClick };
    return el('a', props);
  }

  function openSend() {
    if (saveTimer) saveDrafts();
    renderSend();
    var dlg = $('send');
    if (!dlg.open) dlg.showModal();
  }

  function renderSend() {
    var dlg = $('send');
    var box = $('send-body');
    box.textContent = '';
    box.append(dialogHead('sendTitle', dlg));
    var data = collect();
    var count = Object.keys(data.good).length;
    var langName = languageName(lang);

    if (!count && !data.problems.length) {
      box.append(para(t('sendNothing')));
      if (data.stale) box.append(para(t('sendStale', { n: fmt(data.stale) }), 'muted'));
      return;
    }

    box.append(para(count === 1 ? t('sendSummaryOne', { lang: langName }) : t('sendSummary', { n: fmt(count), lang: langName })));
    if (data.stale) box.append(para(t('sendStale', { n: fmt(data.stale) }), 'muted'));

    if (!isOpen(lang)) {
      var line = '"' + lang + '": "' + langName + '"';
      var lineInput = el('input', { id: 'send-line', readOnly: true, value: line, dir: 'ltr', 'aria-label': t('sendLine') });
      box.append(
        para(t('sendNotOpen', { lang: langName })),
        el('div', { class: 'row' }, [
          lineInput,
          el('button', { type: 'button', text: t('sendCopy'), on: { click: function (e) { copy(line, e.target); } } })
        ]),
        el('div', { class: 'actions' }, [linkBtn(t('sendEdit'), REPO + '/edit/main/names/languages.json', 'primary')])
      );
      box.append(discardBlock());
      return;
    }

    if (data.problems.length) {
      box.append(para(t('sendProblems')));
      var ul = el('ul', { class: 'problems' });
      data.problems.slice(0, 20).forEach(function (p) {
        var on = own(byKey, p.key) || own(byNode, p.key);
        ul.append(el('li', null, [
          el('span', { class: 'prob-text' }, [
            el('code', { dir: 'auto', text: p.value }),
            el('small', { text: t(p.problem) + (on ? '' : ' ' + t('sendOffPage')) })
          ]),
          on ? el('button', { class: 'btn', type: 'button', text: t('sendShow'), on: { click: function () { jumpTo(p.key); } } }) : null
        ]));
      });
      box.append(ul);
      box.append(discardBlock());
      return;
    }

    var parts = splitParts(lang, data.good);
    var built = parts.map(function (body) { return { body: body, text: JSON.stringify(body), issue: issueUrl(body) }; });
    if (built.length === 1 && built[0].issue.prefilled) {
      box.append(el('div', { class: 'actions' }, [linkBtn(t('sendOpen'), built[0].issue.url, 'primary')]));
    } else {
      var area = el('textarea', { id: 'send-data', readOnly: true, rows: 6, dir: 'ltr', spellcheck: false });
      var areaLabel = el('label', { htmlFor: 'send-data', text: t('sendData') });
      var firstManual = built.filter(function (b) { return !b.issue.prefilled; })[0];
      area.value = firstManual ? firstManual.text : '';
      box.append(para(built.length > 1 ? t('sendParts', { n: fmt(built.length) }) : t('sendLong')));
      if (built.length === 1) {
        box.append(el('div', { class: 'actions' }, [
          linkBtn(t('sendCopyOpen'), built[0].issue.base, 'primary', function (e) { copy(built[0].text, e.currentTarget); })
        ]));
      } else {
        var rows = el('ul', { class: 'parts' });
        built.forEach(function (b, i) {
          var label = t('sendPart', { i: fmt(i + 1), n: fmt(built.length), count: fmt(Object.keys(b.body.names).length) });
          rows.append(el('li', null, [
            el('span', { text: label }),
            b.issue.prefilled
              ? linkBtn(t('sendPartLink'), b.issue.url)
              : linkBtn(t('sendCopyOpen'), b.issue.base, '', function (e) {
                area.value = b.text;
                copy(b.text, e.currentTarget);
              })
          ]));
        });
        box.append(rows);
      }
      box.append(
        el('div', { class: 'field' }, [
          el('div', { class: 'field-top' }, [
            areaLabel,
            el('button', { class: 'btn', type: 'button', text: t('sendCopy'), on: { click: function (e) { copy(area.value, e.target); } } })
          ]),
          area
        ])
      );
    }
    box.append(para(t('sendNeeds')), para(t('sendNext'), 'muted'), para(t('sendKeep'), 'muted'), discardBlock());
  }

  function discardBlock() {
    var count = draftCount(lang);
    var armed = false;
    var btn = el('button', {
      class: 'btn quiet', type: 'button', text: t('discard'),
      on: {
        click: function () {
          if (!armed) {
            armed = true;
            btn.textContent = t('discardSure', { n: fmt(count) });
            btn.classList.add('danger');
            return;
          }
          delete drafts[lang];
          saveDrafts();
          $('send').close();
          refresh();
        },
        blur: function () {
          armed = false;
          btn.textContent = t('discard');
          btn.classList.remove('danger');
        }
      }
    });
    return el('div', { class: 'actions end' }, [btn]);
  }

  function jumpTo(key) {
    $('send').close();
    state.untranslated = false;
    state.q = '';
    $('q').value = '';
    var it = own(byKey, key) ? byKey[key] : null;
    var folder = own(byNode, key) ? byNode[key] : null;
    if (!it && !folder) return;
    renderBar();
    select(it ? it.dir : folder.path);
    var input = it ? null : $('folder-in');
    if (it) {
      var index = list.indexOf(it);
      while (index >= shown) more();
      input = $('grid').querySelector('figure[data-i="' + index + '"] input');
    }
    if (input) { input.focus(); input.select(); }
  }

  /* ---------- contribute dialog ---------- */

  function openHelp() {
    var dlg = $('help');
    var box = $('help-body');
    box.textContent = '';
    box.append(
      dialogHead('helpTitle', dlg),
      el('section', null, [
        el('h3', { text: t('helpIconTitle') }),
        para(t('helpIcon')),
        el('ol', { class: 'steps' }, (ui().helpIconSteps || UI.en.helpIconSteps).map(function (text) { return el('li', { text: text }); })),
        para(t('helpIconTerms'), 'muted'),
        el('div', { class: 'actions' }, [
          linkBtn(t('helpIconGo'), REPO + '/blob/main/CONTRIBUTING.md', 'primary'),
          linkBtn(t('helpRepo'), REPO)
        ])
      ]),
      el('section', null, [
        el('h3', { text: t('helpTranslateTitle') }),
        para(t('helpTranslate')),
        el('div', { class: 'actions' }, [
          el('button', {
            class: 'btn primary', type: 'button', text: t('helpTranslateGo'),
            on: { click: function () { dlg.close(); setTranslating(true); } }
          })
        ])
      ]),
      el('section', null, [
        el('h3', { text: t('helpRightsTitle') }),
        para(t('helpRights'), 'muted'),
        el('div', { class: 'actions' }, [linkBtn(t('helpRightsGo'), REPO + '/blob/main/ASSETS.md')])
      ])
    );
    if (!dlg.open) dlg.showModal();
  }

  /* ---------- wiring ---------- */

  function setNav(on) {
    document.body.classList.toggle('nav', on);
    $('toggle').setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  $('d-img').addEventListener('load', function (e) {
    $('d-dim').textContent = e.target.naturalWidth + '×' + e.target.naturalHeight;
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () { copy($(btn.dataset.copy).value, btn); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.row input'), function (input) {
    input.addEventListener('focus', function () { input.select(); });
  });

  $('d-close').addEventListener('click', function () { $('dlg').close(); });
  $('d-prev').addEventListener('click', function () { step(-1); });
  $('d-next').addEventListener('click', function () { step(1); });
  Array.prototype.forEach.call(document.querySelectorAll('dialog'), function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  });
  $('dlg').addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  $('grid').addEventListener('click', function (e) {
    var fig = e.target.closest('figure');
    if (!fig) return;
    if (translating && e.target.tagName !== 'IMG') return;
    show(Number(fig.dataset.i));
  });
  $('grid').addEventListener('keydown', function (e) {
    if (translating) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        if (e.altKey) show(Number(e.target.closest('figure').dataset.i));
        else moveFocus(e.target, e.shiftKey ? -1 : 1);
      }
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var fig = e.target.closest('figure');
    if (!fig) return;
    e.preventDefault();
    show(Number(fig.dataset.i));
  });
  $('grid').addEventListener('input', function (e) {
    if (e.target.tagName === 'INPUT') commitInput(e.target);
  });
  // A cleared field cannot delete a published name, so show that name again.
  $('grid').addEventListener('focusout', function (e) {
    if (e.target.tagName !== 'INPUT' || e.target.value.trim()) return;
    e.target.value = published(e.target.dataset.key);
    markInput(e.target);
  });

  var qTimer;
  $('q').addEventListener('input', function (e) {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      state.q = e.target.value.trim();
      writeHash();
      filter();
    }, 150);
  });

  $('toggle').addEventListener('click', function () { setNav(!document.body.classList.contains('nav')); });
  $('main').addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav')) {
      setNav(false);
      $('toggle').focus();
    }
  });
  $('skip').addEventListener('click', function (e) {
    e.preventDefault();
    $('main').focus();
  });
  window.addEventListener('pagehide', function () { if (saveTimer) saveDrafts(); });

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && shown < list.length) more();
  }, { root: $('main'), rootMargin: '600px' }).observe($('more'));

  /* ---------- start ---------- */

  var params = readHash();
  $('q').value = state.q;
  lang = pickLanguage(params.get('lang'), Object.keys(UI));
  applyStatic();
  renderFooter();
  renderTools();

  var languagesReady = fetch('names/languages.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (data) {
      if (data && typeof data === 'object' && Object.keys(data).length) {
        var clean = {};
        Object.keys(data).forEach(function (code) { if (typeof data[code] === 'string') clean[code] = data[code]; });
        languages = clean;
      }
      loadDrafts();
      var picked = pickLanguage(params.get('lang'), Object.keys(languages));
      if (picked !== lang) {
        lang = picked;
        applyStatic();
        renderFooter();
      }
      if (params.get('lang')) storeSet(STORE_LANG, lang);
      return Promise.all([loadNames('en'), loadNames(lang)]);
    });

  Promise.all([fetch(BASE + 'index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }), languagesReady])
    .then(function (results) {
      build(results[0].dirs || {});
      loaded = true;
      translating = params.get('translate') === '1';
      document.body.classList.toggle('translating', translating);
      refresh();
      if (params.get('contribute') === '1') openHelp();
    })
    .catch(function () {
      $('empty').hidden = false;
      $('empty').textContent = t('failed');
    });

})();
