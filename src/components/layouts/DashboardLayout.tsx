import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";
import { Header } from "../Header/Header";
import { MessageModal } from "../messageModal/MessageModal";
import { useState } from "react";

export function DashboardLayout() {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  return (
    <div className={styles.container}>
      <Sidebar />

      <div className={styles.main}>
        <Header isMessageModalOpen={setIsMessageModalOpen} title={""} />
        <main className={styles.content}>
          <Outlet />
          <MessageModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}
