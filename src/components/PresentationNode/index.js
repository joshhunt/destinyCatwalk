import React from 'react';
import { Link } from 'react-router';

import BungieImage from 'src/components/BungieImage';

import s from './styles.styl';

export default function PresentationNode({
  presentationNode,
  membershipId,
  membershipType
}) {
  if (!presentationNode) {
    return null;
  }

  return (
    <Link
      to={`/triumphs/${membershipType}/${membershipId}/${
        presentationNode.hash
      }`}
      className={s.root}
    >
      <BungieImage
        className={s.icon}
        src={presentationNode.displayProperties.icon}
      />

      <div className={s.main}>
        {presentationNode.displayProperties &&
          presentationNode.displayProperties.name}
      </div>
    </Link>
  );
}
