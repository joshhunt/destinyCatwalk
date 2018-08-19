import React from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(
  // require('@fortawesome/free-brands-svg-icon/faPlaystation'),
  // require('@fortawesome/free-brands-svg-icon/faXbox'),
  // require('@fortawesome/free-brands-svg-icon/faWindows'),
  require('@fortawesome/free-brands-svg-icons/faXbox').faXbox,
  require('@fortawesome/free-brands-svg-icons/faPlaystation').faPlaystation,
  require('@fortawesome/free-brands-svg-icons/faWindows').faWindows,

  require('@fortawesome/pro-light-svg-icons/faBook').faBook,
  require('@fortawesome/pro-light-svg-icons/faThLarge').faThLarge,
  require('@fortawesome/pro-light-svg-icons/faShoppingBasket').faShoppingBasket,
  require('@fortawesome/pro-regular-svg-icons/faChevronDown').faChevronDown,
  require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus,
  require('@fortawesome/pro-regular-svg-icons/faSync').faSync,
  require('@fortawesome/pro-regular-svg-icons/faExternalLinkSquareAlt')
    .faExternalLinkSquareAlt
);

window.__faLibrary = library;

export default function Icon({ icon, name, brand, light, solid, ...props }) {
  let prefix = 'far';

  if (brand) {
    prefix = 'fab';
  } else if (light) {
    prefix = 'fal';
  } else if (solid) {
    prefix = 'fas';
  }

  return <FontAwesomeIcon icon={[prefix, icon || name]} {...props} />;
}
