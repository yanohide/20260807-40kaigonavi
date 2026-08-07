import Image from "next/image";
import Link from "next/link";

import {
  HOME_ASSETS,
  HOME_OPERATOR_PROFILE,
} from "@/lib/homeContent";

function renderProfileLine(line: string) {
  const sep = line.indexOf("：");
  if (sep === -1) return line;
  return (
    <>
      <strong>
        <span className="profile-widget-bullet" aria-hidden="true">
          ●
        </span>
        {line.slice(0, sep + 1)}
      </strong>
      {line.slice(sep + 1)}
    </>
  );
}

export function OperatorProfileWidget() {
  return (
    <div className="profile-widget">
      <div className="profile-widget-body">
        <div className="profile-widget-avatar">
          <Image
            src={HOME_ASSETS.profileImage}
            alt={HOME_OPERATOR_PROFILE.caption}
            width={160}
            height={160}
            className="profile-widget-avatar-img"
          />
        </div>
        <p className="profile-widget-name">{HOME_OPERATOR_PROFILE.name}</p>
        <div className="profile-widget-text">
          <p className="profile-widget-text-heading">
            {HOME_OPERATOR_PROFILE.textHeading}
          </p>
          {HOME_OPERATOR_PROFILE.lines.map((line) => (
            <p key={line}>{renderProfileLine(line)}</p>
          ))}
        </div>
        <Link href="/about" className="profile-widget-link">
          運営者情報へ →
        </Link>
      </div>
    </div>
  );
}
