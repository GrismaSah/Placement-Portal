import React from "react";
import { avatarColors, displayName, initials } from "../../utils/avatar";

/**
 * Initials avatar, shared by the navbar trigger and the profile header.
 * `size` is a pixel value; the font scales with it so one component covers both.
 */
const Avatar = ({ user, size = 44 }) => {
  const name = displayName(user);

  return (
    <span
      className="avatar"
      style={{
        ...avatarColors(user),
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
      }}
      // The surrounding control carries the accessible name, so the visual
      // initials are decorative here.
      aria-hidden="true"
      title={name}
    >
      {initials(user)}
    </span>
  );
};

export default Avatar;
