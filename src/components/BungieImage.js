import React from 'react';

import { bungieUrl } from 'src/lib/destinyUtils';

export default function BungieImage({ src, ...props }) {
  return src ? <img src={bungieUrl(src)} {...props} alt="" /> : null;
}
