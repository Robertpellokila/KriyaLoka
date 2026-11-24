<script setup>
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";

import AdminSidebar from "../components/layout/AdminSidebar.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";

const route = useRoute();

const pageTitle = computed(() => {
  return route.meta.title || "Dashboard";
});

const pageBreadcrumb = computed(() => {
  return route.meta.breadcrumb || "KriyaLoka / Admin";
});
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main Content -->
    <main class="admin-main">
      <div class="admin-page-heading">
        <div>
          <span class="admin-breadcrumb">
            {{ pageBreadcrumb }}
          </span>

          <h1 class="admin-page-title">
            {{ pageTitle }}
          </h1>
        </div>
        <NotificationBell />
      </div>

      <!-- Halaman sesuai route -->
      <div class="admin-page-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #fbf7f2;
  color: #332b25;
}

/* Main content */
.admin-main {
  flex: 1;
  min-width: 0;
  padding: 34px 40px;
}

.admin-page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.admin-breadcrumb {
  display: block;
  color: #a09388;
  font-size: 12px;
  font-weight: 500;
}

.admin-page-title {
  margin: 7px 0 0;
  color: #332b25;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
}

.admin-page-content {
  width: 100%;
  min-width: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .admin-main {
    padding: 28px 24px;
  }
}

@media (max-width: 720px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-main {
    padding: 24px 18px;
  }

  .admin-page-heading {
    margin-bottom: 24px;
  }

  .admin-page-title {
    font-size: 23px;
  }
}

@media (max-width: 430px) {
  .admin-main {
    padding: 20px 14px;
  }

  .admin-page-title {
    font-size: 21px;
  }
}
</style>
