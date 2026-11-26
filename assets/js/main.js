/**
 * SIT AL-KAUTSAR MUKOMUKO - SPMB 2027/2028
 * Konfigurasi Kontak Admin & Interaktivitas UI Global
 */

// Pusat nomor WhatsApp Admin tiap jenjang (format internasional tanpa tanda +)
// Silakan ganti nomor placeholder SD IT, PAUD IT, dan SMA IT dengan nomor asli
window.SPMB_ADMINS = {
  "PAUD IT 1": { label: "Admin PAUD IT 1", phone: "6282281226345" },
  "PAUD IT 2": { label: "Admin PAUD IT 2", phone: "6282281226345" },
  "SD IT":     { label: "Admin SD IT",     phone: "6281200000001" },
  "SMP IT":    { label: "Admin SMP IT",    phone: "6282281226345" },
  "SMA IT":    { label: "Admin SMA IT",    phone: "6281200000002" }
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inisialisasi Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // 2. Mobile Navigation Toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });

    // Tutup menu mobile saat link diklik
    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
      });
    });
  }

  // 3. FAQ Accordion
  const faqTriggers = document.querySelectorAll(".faq-trigger");
  faqTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const parent = trigger.closest(".faq-item");
      const content = parent.querySelector(".faq-content");
      const icon = parent.querySelector(".faq-icon");
      const isOpen = !content.classList.contains("hidden");

      // Tutup item lain agar rapi
      document.querySelectorAll(".faq-item").forEach((item) => {
        item.querySelector(".faq-content").classList.add("hidden");
        item.querySelector(".faq-icon").classList.remove("rotate-180");
      });

      if (!isOpen) {
        content.classList.remove("hidden");
        icon.classList.add("rotate-180");
      }
    });
  });

  // 4. Render Daftar Admin di Floating WhatsApp Modal
  renderWaAdminList();
});

function renderWaAdminList() {
  const container = document.getElementById("wa-admin-list");
  if (!container) return;

  const defaultText = encodeURIComponent(
    "Assalamu'alaikum Admin SPMB SIT Al-Kautsar Mukomuko, saya ingin bertanya mengenai pendaftaran TA 2027/2028."
  );

  container.innerHTML = Object.entries(window.SPMB_ADMINS)
    .map(([jenjang, info]) => {
      const url = `https://wa.me/${info.phone}?text=${defaultText}`;
      return `
        <a href="${url}" target="_blank" rel="noopener noreferrer"
           class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emeraldPrimary/40 transition">
          <div>
            <span class="block font-bold text-slate-800 text-xs">${info.label}</span>
            <span class="block text-[11px] text-slate-500">Jenjang ${jenjang}</span>
          </div>
          <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">Chat</span>
        </a>
      `;
    })
    .join("");
}

function toggleWaModal() {
  const modal = document.getElementById("wa-modal");
  if (modal) {
    modal.classList.toggle("hidden");
  }
}

function openWaModal() {
  const modal = document.getElementById("wa-modal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}
