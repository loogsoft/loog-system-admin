import styles from "./SkeletonCard.module.css";

export function SkeletonCard() {
  return (
    <div className={`${styles.card} ${styles.skeletonCard}`}>
      <div className={styles.skeletonMedia}>
      </div>

      <div className={styles.skeletonBody}>
        <div className={styles.skeletonBadge} />
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonCategory}`} />
        
        <div className={styles.skeletonMeta}>
          <div className={`${styles.skeletonLine} ${styles.skeletonMetaLine}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonMetaLine}`} />
        </div>
      </div>
    </div>
  );
}
