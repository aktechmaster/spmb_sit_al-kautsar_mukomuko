/**
 * SIT AL-KAUTSAR MUKOMUKO - SPMB 2027/2028
 * Logika Formulir Pendaftaran Multi-Step, Upload Berkas Base64,
 * Kartu Bukti Digital, dan Cek Status Real-Time.
 */

// =========================================================================
// PENTING: TEMPELKAN URL WEB APP GOOGLE APPS SCRIPT ANDA DI BAWAH INI
// =========================================================================
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwDNWR5TgD1mBj8al4muPEyov_rG1Bs2rW6xesoXWzAi5DytmfzdVm6F6872zpy0EI-zw/exec";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("spmb-form")) {
    initRegistrationForm();
  }
  if (document.getElementById("status-search-form")) {
    initStatusSearch();
  }
});

/* =========================================================================
   BAGIAN 1: LOGIKA FORMULIR PENDAFTARAN (daftar.html)
   ========================================================================= */
function initRegistrationForm() {
  const form = document.getElementById("spmb-form");
  const steps = Array.from(document.querySelectorAll(".form-step"));
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnSubmit = document.getElementById("btn-submit");
  const btnSubmitText = document.getElementById("btn-submit-text");
  const progressBar = document.getElementById("progress-bar");
  const stepIndicatorText = document.getElementById("step-indicator-text");
  const stepPercentage = document.getElementById("step-percentage");
  const alertBox = document.getElementById("form-alert");
  const alertText = document.getElementById("form-alert-text");

  const stepTitles = [
    "Langkah 1 dari 4: Pilihan Pendaftaran",
    "Langkah 2 dari 4: Biodata Calon Murid",
    "Langkah 3 dari 4: Data Orang Tua & Domisili",
    "Langkah 4 dari 4: Unggah Berkas"
  ];

  let currentStep = 0;

  // Auto-select jenjang dari parameter URL (?jenjang=SMP%20IT)
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedJenjang = urlParams.get("jenjang");
  const jenjangSelect = document.getElementById("jenjang");
  if (preselectedJenjang && jenjangSelect) {
    const exists = Array.from(jenjangSelect.options).some(
      (opt) => opt.value === preselectedJenjang
    );
    if (exists) {
      jenjangSelect.value = preselectedJenjang;
    }
  }

  // Toggle opsi "Berkas Menyusul via WhatsApp"
  const berkasMenyusulCheckbox = document.getElementById("berkas_menyusul");
  const uploadFields = document.getElementById("upload-fields");
  if (berkasMenyusulCheckbox && uploadFields) {
    berkasMenyusulCheckbox.addEventListener("change", () => {
      if (berkasMenyusulCheckbox.checked) {
        uploadFields.classList.add("opacity-50", "pointer-events-none");
        document.getElementById("file_bukti_transfer").value = "";
        document.getElementById("file_kk").value = "";
      } else {
        uploadFields.classList.remove("opacity-50", "pointer-events-none");
      }
    });
  }

  function showAlert(message) {
    alertText.textContent = message;
    alertBox.classList.remove("hidden");
    alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideAlert() {
    alertBox.classList.add("hidden");
  }

  function updateStepUI() {
    steps.forEach((stepEl, index) => {
      stepEl.classList.toggle("hidden", index !== currentStep);
    });

    const percent = Math.round(((currentStep + 1) / steps.length) * 100);
    progressBar.style.width = `${percent}%`;
    stepIndicatorText.textContent = stepTitles[currentStep];
    stepPercentage.textContent = `${percent}%`;

    btnPrev.classList.toggle("hidden", currentStep === 0);
    btnNext.classList.toggle("hidden", currentStep === steps.length - 1);
    btnSubmit.classList.toggle("hidden", currentStep !== steps.length - 1);

    hideAlert();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateCurrentStep() {
    hideAlert();
    const activeStepEl = steps[currentStep];
    const requiredInputs = activeStepEl.querySelectorAll("[required]");
    let isValid = true;
    let errorMessage = "Mohon lengkapi semua kolom yang bertanda wajib (*).";

    requiredInputs.forEach((input) => {
      input.classList.remove("input-error");
      if (!input.value.trim()) {
        input.classList.add("input-error");
        isValid = false;
      }
    });

    // Validasi khusus Step 2: NIK harus 16 digit angka
    if (currentStep === 1) {
      const nikInput = document.getElementById("nik");
      const nikVal = nikInput.value.trim();
      if (!/^\d{16}$/.test(nikVal)) {
        nikInput.classList.add("input-error");
        isValid = false;
        errorMessage = "NIK Calon Murid harus terdiri dari tepat 16 digit angka.";
      }
    }

    // Validasi khusus Step 3: Nomor WhatsApp valid
    if (currentStep === 2) {
      const waInput = document.getElementById("no_wa");
      const waClean = waInput.value.replace(/[^0-9]/g, "");
      if (waClean.length < 10 || waClean.length > 15) {
        waInput.classList.add("input-error");
        isValid = false;
        errorMessage = "Masukkan Nomor WhatsApp aktif yang valid (minimal 10 digit).";
      }
    }

    if (!isValid) {
      showAlert(errorMessage);
    }
    return isValid;
  }

  btnNext.addEventListener("click", () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      currentStep++;
      updateStepUI();
    }
  });

  btnPrev.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      updateStepUI();
    }
  });

  // Submit Formulir ke Google Apps Script
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    if (GAS_WEB_APP_URL.includes("PASTE_URL_WEB_APP")) {
      showAlert(
        "URL Google Apps Script belum dipasang di file assets/js/form.js. Silakan deploy Code.gs terlebih dahulu."
      );
      return;
    }

    const fileTransferInput = document.getElementById("file_bukti_transfer");
    const fileKkInput = document.getElementById("file_kk");
    const isMenyusul = berkasMenyusulCheckbox.checked;

    // Validasi file jika ada yang diunggah
    let buktiTransferData = null;
    let kkData = null;

    try {
      if (!isMenyusul && fileTransferInput.files[0]) {
        buktiTransferData = await readFileAsBase64(fileTransferInput.files[0]);
      }
      if (!isMenyusul && fileKkInput.files[0]) {
        kkData = await readFileAsBase64(fileKkInput.files[0]);
      }
    } catch (fileErr) {
      showAlert(fileErr.message);
      return;
    }

    // Disable tombol saat mengirim
    btnSubmit.disabled = true;
    btnSubmitText.textContent = "Mengirim Data...";

    const payload = {
      jenjang: document.getElementById("jenjang").value,
      gelombang: document.getElementById("gelombang").value,
      jalur: document.getElementById("jalur").value,
      nama_lengkap: document.getElementById("nama_lengkap").value.trim(),
      nik: document.getElementById("nik").value.trim(),
      tempat_lahir: document.getElementById("tempat_lahir").value.trim(),
      tanggal_lahir: document.getElementById("tanggal_lahir").value,
      jenis_kelamin: document.getElementById("jenis_kelamin").value,
      anak_ke: document.getElementById("anak_ke").value,
      asal_sekolah: document.getElementById("asal_sekolah").value.trim() || "-",
      riwayat_kesehatan: document.getElementById("riwayat_kesehatan").value.trim() || "Tidak ada",
      nama_ayah: document.getElementById("nama_ayah").value.trim(),
      nama_ibu: document.getElementById("nama_ibu").value.trim(),
      no_wa: normalizePhone(document.getElementById("no_wa").value),
      pekerjaan_ortu: document.getElementById("pekerjaan_ortu").value.trim(),
      alamat: document.getElementById("alamat").value.trim(),
      berkas_menyusul: isMenyusul ? "Ya (Menyusul via WA)" : "Tidak",
      file_bukti_transfer: buktiTransferData,
      file_kk: kkData
    };

    try {
      // Menggunakan text/plain agar terhindar dari CORS preflight di Google Apps Script
      const response = await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === "success") {
        renderSuccessReceipt(result.data, payload);
      } else {
        throw new Error(result.message || "Terjadi kesalahan saat menyimpan data.");
      }
    } catch (err) {
      showAlert(`Gagal mengirim pendaftaran: ${err.message}. Pastikan koneksi internet stabil dan coba lagi.`);
      btnSubmit.disabled = false;
      btnSubmitText.textContent = "Kirim Pendaftaran";
    }
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(new Error(`Ukuran file "${file.name}" melebihi batas maksimal 2 MB.`));
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      reject(new Error(`Format file "${file.name}" tidak didukung. Gunakan JPG, PNG, atau PDF.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve({
        name: file.name,
        mimeType: file.type,
        base64: base64String
      });
    };
    reader.onerror = () => reject(new Error("Gagal membaca file yang dipilih."));
    reader.readAsDataURL(file);
  });
}

function renderSuccessReceipt(serverData, payload) {
  document.getElementById("registration-container").classList.add("hidden");
  document.getElementById("form-header").classList.add("hidden");

  const successCard = document.getElementById("success-card");
  successCard.classList.remove("hidden");

  document.getElementById("res-no-reg").textContent = serverData.no_registrasi;
  document.getElementById("res-nama").textContent = payload.nama_lengkap;
  document.getElementById("res-jenjang").textContent = payload.jenjang;
  document.getElementById("res-jalur").textContent = `${payload.gelombang} • Jalur ${payload.jalur}`;
  document.getElementById("res-tanggal").textContent = serverData.tanggal_daftar;
  document.getElementById("res-wa").textContent = payload.no_wa;

  // Siapkan tombol Konfirmasi WhatsApp sesuai admin jenjang yang dipilih
  const adminInfo =
    (window.SPMB_ADMINS && window.SPMB_ADMINS[payload.jenjang]) ||
    { phone: "6282281226345" };

  const waMessage = encodeURIComponent(
    `Assalamu'alaikum Admin SPMB ${payload.jenjang} SIT AL-KAUTSAR MUKOMUKO.\n\n` +
    `Saya telah mendaftar secara online dengan data berikut:\n` +
    `• No. Registrasi: *${serverData.no_registrasi}*\n` +
    `• Nama Calon Murid: *${payload.nama_lengkap}*\n` +
    `• Jenjang: *${payload.jenjang}*\n` +
    `• Jalur: ${payload.jalur}\n` +
    `• Status Berkas: ${payload.berkas_menyusul === "Ya (Menyusul via WA)" ? "Menyusul via WA" : "Sudah Diunggah"}\n\n` +
    `Mohon arahan untuk tahap selanjutnya. Terima kasih.`
  );

  const btnWaConfirm = document.getElementById("btn-wa-confirm");
  btnWaConfirm.href = `https://wa.me/${adminInfo.phone}?text=${waMessage}`;

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================================
   BAGIAN 2: LOGIKA CEK STATUS PENDAFTARAN (cek-status.html)
   ========================================================================= */
function initStatusSearch() {
  const form = document.getElementById("status-search-form");
  const input = document.getElementById("search-query");
  const btnSearch = document.getElementById("btn-search-status");
  const btnText = document.getElementById("btn-search-text");
  const errorBox = document.getElementById("status-error");
  const errorText = document.getElementById("status-error-text");
  const resultContainer = document.getElementById("status-result-container");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    errorBox.classList.add("hidden");
    resultContainer.classList.add("hidden");
    resultContainer.innerHTML = "";

    if (GAS_WEB_APP_URL.includes("PASTE_URL_WEB_APP")) {
      errorText.textContent =
        "URL Google Apps Script belum dikonfigurasi di file assets/js/form.js.";
      errorBox.classList.remove("hidden");
      return;
    }

    btnSearch.disabled = true;
    btnText.textContent = "Mencari Data...";

    try {
      const url = `${GAS_WEB_APP_URL}?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { method: "GET" });
      const result = await response.json();

      if (result.status === "success" && result.data && result.data.length > 0) {
        renderStatusCards(result.data, resultContainer);
        resultContainer.classList.remove("hidden");
      } else {
        errorText.textContent =
          "Data pendaftaran tidak ditemukan. Pastikan Nomor Registrasi atau Nomor WhatsApp sesuai dengan saat mendaftar.";
        errorBox.classList.remove("hidden");
      }
    } catch (err) {
      errorText.textContent =
        "Gagal terhubung ke server pendaftaran. Silakan periksa koneksi internet Anda dan coba lagi.";
      errorBox.classList.remove("hidden");
    } finally {
      btnSearch.disabled = false;
      btnText.textContent = "Cek Status Sekarang";
    }
  });
}

function renderStatusCards(records, container) {
  container.innerHTML = records
    .map((item) => {
      const badgeStyle = getStatusBadgeClass(item.status_pendaftaran);
      const adminInfo =
        (window.SPMB_ADMINS && window.SPMB_ADMINS[item.jenjang]) ||
        { phone: "6282281226345" };
      const waLink = `https://wa.me/${adminInfo.phone}?text=${encodeURIComponent(
        `Assalamu'alaikum Admin, saya ingin menanyakan progres pendaftaran atas nama ${item.nama_lengkap} (${item.no_registrasi}).`
      )}`;

      return `
        <div class="rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6 space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <span class="text-xs font-bold text-slate-500 block">Nomor Registrasi</span>
              <span class="text-lg font-extrabold text-emeraldPrimary">${escapeHtml(item.no_registrasi)}</span>
            </div>
            <span class="px-3.5 py-1.5 rounded-full text-xs font-bold ${badgeStyle}">
              ${escapeHtml(item.status_pendaftaran)}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-xs text-slate-500 block">Nama Calon Murid</span>
              <strong class="text-slate-900">${escapeHtml(item.nama_lengkap)}</strong>
            </div>
            <div>
              <span class="text-xs text-slate-500 block">Jenjang / Jalur</span>
              <strong class="text-slate-900">${escapeHtml(item.jenjang)} (${escapeHtml(item.jalur)})</strong>
            </div>
            <div>
              <span class="text-xs text-slate-500 block">Gelombang</span>
              <span class="text-slate-700 font-medium">${escapeHtml(item.gelombang)}</span>
            </div>
            <div>
              <span class="text-xs text-slate-500 block">Tanggal Daftar</span>
              <span class="text-slate-700 font-medium">${escapeHtml(item.tanggal_daftar)}</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white border border-slate-200 text-sm">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Catatan dari Panitia</span>
            <p class="text-slate-700 leading-relaxed">
              ${escapeHtml(item.catatan_panitia || "Berkas sedang dalam antrean verifikasi panitia. Mohon pantau secara berkala.")}
            </p>
          </div>

          <div class="pt-1 flex justify-end">
            <a href="${waLink}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">
              <span>Hubungi Admin ${escapeHtml(item.jenjang)}</span>
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

function getStatusBadgeClass(statusText) {
  const s = (statusText || "").toLowerCase();
  if (s.includes("lulus") && !s.includes("belum")) {
    return "bg-emerald-100 text-emerald-800 border border-emerald-300";
  }
  if (s.includes("terverifikasi") || s.includes("observasi")) {
    return "bg-blue-100 text-blue-800 border border-blue-300";
  }
  if (s.includes("ditolak") || s.includes("belum lulus")) {
    return "bg-red-100 text-red-800 border border-red-300";
  }
  return "bg-amber-100 text-amber-800 border border-amber-300";
}

function normalizePhone(phone) {
  let cleaned = String(phone).replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
