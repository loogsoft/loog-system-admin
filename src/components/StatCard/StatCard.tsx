import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

type StatCardProps = {
  label: string;
  value: string | number;
  badge?: string;
  badgeTone?: "success" | "neutral";
  icon?: ReactNode;
  sub?: string;
  backgroundColor?: string;
  color?: string;
  valueBackgroundColor?: string;
  valueColor?: string;
  iconBackgroundColor?: string;
  iconColor?: string;
};

export default function StatCard({
  label,
  value,
  badge,
  badgeTone = "success",
  icon,
  sub,
  backgroundColor,
  color,
  valueBackgroundColor,
  valueColor,
  iconBackgroundColor,
  iconColor,
}: StatCardProps) {
  const showHeader = Boolean(icon || badge);

  return (
    <div
      className={styles.card}
      style={{ backgroundColor: backgroundColor || undefined, color: color || undefined }}
    >
      {showHeader ? (
        <div className={styles.header}>
          {icon ? (
            <span
              className={styles.icon}
              aria-hidden
              style={{
                backgroundColor: iconBackgroundColor || undefined,
                color: iconColor || undefined,
              }}
            >
              {icon}
            </span>
          ) : (
            <span />
          )}
          {badge ? (
            <span
              className={`${styles.badge} ${
                badgeTone === "neutral" ? styles.badgeNeutral : ""
              }`}
            >
              {badge}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className={styles.label}>{label}</div>
      <div
        className={`${styles.value} ${sub ? styles.valueSmall : ""}`}
        style={{
          backgroundColor: valueBackgroundColor || undefined,
          color: valueColor || undefined,
          borderRadius: valueBackgroundColor ? 8 : undefined,
          padding: valueBackgroundColor ? "2px 8px" : undefined,
          display: valueBackgroundColor ? "inline-block" : undefined,
        }}
      >
        {value}
      </div>
      {sub ? <div className={styles.sub}>{sub}</div> : null}
    </div>
  );
}
