<template>
  <footer class="main-footer">
    <div class="footer-content">
      <p class="icp-line">
        <a
          href="https://icp.gov.moe/?keyword=20257889"
          target="_blank"
          rel="noopener"
        >萌 ICP 备 20257889 号</a>
      </p>

      <p class="copyright">
        © {{ currentYear }} Vorest0628. All rights reserved.
      </p>

      <div class="social-links">
        <a
          href="https://github.com/Vorest0628"
          target="_blank"
          rel="noopener"
          aria-label="Github"
        >
          <i class="fab fa-github" />
        </a>
        <a
          href="https://space.bilibili.com/276555959"
          target="_blank"
          rel="noopener"
          aria-label="Bilibili"
        >
          <i class="fab fa-bilibili" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.main-footer {
  grid-area: footer;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: rgba(247, 252, 255, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 34px rgba(40, 108, 150, 0.14);
  padding: 1rem;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.icp-line,
.copyright {
  margin: 0;
  color: #5d7f99;
  font-size: 0.86rem;
}

.icp-line a {
  color: #2f7fca;
  text-decoration: none;
}

.icp-line a:hover {
  color: #1f6aa9;
}

.social-links {
  display: inline-flex;
  align-items: center;
  gap: 0.46rem;
}

.social-links a {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid rgba(104, 188, 245, 0.45);
  background: rgba(255, 255, 255, 0.9);
  color: #2f80cb;
  display: inline-grid;
  place-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.social-links a:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(52, 126, 183, 0.2);
}

@media (max-width: 680px) {
  .main-footer {
    border-radius: 16px;
  }

  .footer-content {
    justify-content: center;
    text-align: center;
  }
}
</style>
