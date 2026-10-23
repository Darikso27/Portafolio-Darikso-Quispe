// uploader.js - Gestor de subida de imágenes optimizado para celular y navegador
(function () {
  const DB_NAME = "PortafolioDariksoDB";
  const STORE_NAME = "project_images";
  const DB_VERSION = 1;

  let db = null;

  // Inicializar IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };

      request.onerror = (e) => {
        console.error("Error abriendo IndexedDB:", e);
        reject(e);
      };
    });
  }

  // Guardar imagen en IndexedDB
  function saveImage(record) {
    return new Promise((resolve, reject) => {
      if (!db) return reject("BD no inicializada");
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e);
    });
  }

  // Obtener todas las imágenes
  function getAllImages() {
    return new Promise((resolve, reject) => {
      if (!db) return reject("BD no inicializada");
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e);
    });
  }

  // Eliminar imagen
  function deleteImage(id) {
    return new Promise((resolve, reject) => {
      if (!db) return reject("BD no inicializada");
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });
  }

  // Borrar todas
  function clearAllImages() {
    return new Promise((resolve, reject) => {
      if (!db) return reject("BD no inicializada");
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });
  }

  // Formatear tamaño de archivo
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Notificación tipo toast
  function showToast(message, isSuccess = true) {
    let toast = document.getElementById("uploaderToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "uploaderToast";
      toast.className = "uploader-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.borderColor = isSuccess ? "var(--cyan)" : "#ef4444";
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  // Redimensionar imagen para optimizar carga en celular sin perder nitidez
  function processFile(file, category, customName) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        return reject("El archivo no es una imagen válida.");
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Mantener PNG transparente si es PNG, de lo contrario JPEG de alta calidad
          const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outType, 0.88);

          // Calcular tamaño aproximado
          const head = "data:" + outType + ";base64,";
          const approxBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);

          // Nombre de archivo limpio
          let ext = outType === "image/png" ? ".png" : ".jpg";
          let baseName = customName && customName.trim().length > 0 
            ? customName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") 
            : file.name.substring(0, file.name.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9_-]/g, "-");
          if (!baseName) baseName = "captura-" + Date.now();
          const fullName = baseName + ext;
          const finalPath = category + fullName;

          const record = {
            id: "img_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
            name: fullName,
            category: category,
            path: finalPath,
            width: width,
            height: height,
            size: approxBytes,
            sizeText: formatSize(approxBytes),
            dataUrl: dataUrl,
            createdAt: new Date().toLocaleString()
          };

          resolve(record);
        };
        img.onerror = () => reject("Error procesando imagen");
        img.src = e.target.result;
      };
      reader.onerror = () => reject("Error leyendo archivo");
      reader.readAsDataURL(file);
    });
  }

  // Renderizar galería de fotos subidas
  async function renderGallery() {
    const galleryEl = document.getElementById("uploadedGallery");
    const countEl = document.getElementById("savedCount");
    const clearBtn = document.getElementById("clearAllBtn");
    if (!galleryEl) return;

    try {
      const items = await getAllImages();
      // Ordenar por fecha descendente
      items.sort((a, b) => b.id.localeCompare(a.id));

      if (countEl) countEl.textContent = items.length;
      if (clearBtn) clearBtn.style.display = items.length > 0 ? "inline-block" : "none";

      galleryEl.replaceChildren();

      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "gallery-empty card";
        empty.innerHTML = `
          <div class="empty-icon">📱</div>
          <h3>Aún no has subido imágenes</h3>
          <p>Toma una foto con tu teléfono o selecciona capturas de tu galería arriba para guardarlas y gestionarlas aquí.</p>
        `;
        galleryEl.appendChild(empty);
        return;
      }

      items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "card uploaded-card reveal visible";

        const thumb = document.createElement("div");
        thumb.className = "uploaded-thumb";
        const img = document.createElement("img");
        img.src = item.dataUrl;
        img.alt = item.name;
        img.loading = "lazy";
        thumb.appendChild(img);

        // Clic en miniatura abre visor lightbox
        thumb.addEventListener("click", () => openLightbox(item));

        const body = document.createElement("div");
        body.className = "uploaded-body";

        const meta = document.createElement("div");
        meta.className = "uploaded-meta mono";
        meta.innerHTML = `<span class="badge">${item.category}</span> <span>${item.sizeText}</span>`;

        const title = document.createElement("h4");
        title.className = "uploaded-title";
        title.textContent = item.name;
        title.title = item.name;

        const date = document.createElement("p");
        date.className = "uploaded-date mono";
        date.textContent = item.createdAt;

        const pathCode = document.createElement("div");
        pathCode.className = "uploaded-path-box mono";
        pathCode.innerHTML = `<code>${item.path}</code>`;

        const actions = document.createElement("div");
        actions.className = "uploaded-actions";

        // Botón copiar ruta
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-icon";
        copyBtn.type = "button";
        copyBtn.title = "Copiar ruta para projects.js";
        copyBtn.innerHTML = "📋 Copiar ruta";
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(item.path).then(() => {
            showToast(`¡Ruta "${item.path}" copiada!`);
          }).catch(() => {
            // Fallback
            prompt("Copia la ruta de la imagen:", item.path);
          });
        });

        // Botón descargar
        const downloadBtn = document.createElement("a");
        downloadBtn.className = "btn-icon";
        downloadBtn.title = "Descargar a tu celular/PC";
        downloadBtn.innerHTML = "💾 Guardar";
        downloadBtn.href = item.dataUrl;
        downloadBtn.download = item.name;

        // Botón ver grande
        const viewBtn = document.createElement("button");
        viewBtn.className = "btn-icon";
        viewBtn.type = "button";
        viewBtn.title = "Ver tamaño completo";
        viewBtn.innerHTML = "🔍 Ver";
        viewBtn.addEventListener("click", () => openLightbox(item));

        // Botón borrar
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-icon btn-danger";
        deleteBtn.type = "button";
        deleteBtn.title = "Eliminar de la lista";
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm(`¿Eliminar la imagen "${item.name}"?`)) {
            await deleteImage(item.id);
            showToast(`Imagen eliminada`);
            renderGallery();
          }
        });

        actions.append(copyBtn, downloadBtn, viewBtn, deleteBtn);
        body.append(meta, title, date, pathCode, actions);
        card.append(thumb, body);
        galleryEl.appendChild(card);
      });
    } catch (err) {
      console.error("Error renderizando galería:", err);
    }
  }

  // Visor Lightbox
  function openLightbox(item) {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const title = document.getElementById("lightboxTitle");
    const info = document.getElementById("lightboxInfo");

    if (!lightbox || !lightboxImg) return;

    lightboxImg.src = item.dataUrl;
    if (title) title.textContent = item.name;
    if (info) info.textContent = `${item.path} · ${item.width}x${item.height}px · ${item.sizeText}`;

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const lightbox = document.getElementById("imageLightbox");
    if (!lightbox) return;
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Manejar lista de archivos subidos
  async function handleFiles(files) {
    if (!files || files.length === 0) return;

    const categorySelect = document.getElementById("imgCategory");
    const customNameInput = document.getElementById("customImgName");
    const statusEl = document.getElementById("uploadStatus");

    const category = categorySelect ? categorySelect.value : "img/movil/";
    const customName = customNameInput ? customNameInput.value.trim() : "";

    let successCount = 0;
    if (statusEl) {
      statusEl.textContent = `Procesando ${files.length} archivo(s)...`;
      statusEl.className = "upload-status active";
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const item = await processFile(file, category, files.length === 1 ? customName : "");
        await saveImage(item);
        successCount++;
      } catch (err) {
        console.error("Error al procesar archivo:", file.name, err);
      }
    }

    if (customNameInput) customNameInput.value = "";
    if (statusEl) {
      statusEl.textContent = `¡Listo! Se guardaron ${successCount} imagen(es) con éxito.`;
      setTimeout(() => {
        statusEl.className = "upload-status";
        statusEl.textContent = "";
      }, 4000);
    }

    showToast(`📸 ${successCount} imagen(es) subida(s) correctamente`);
    renderGallery();
  }

  // Event Listeners y configuración inicial
  async function init() {
    try {
      await initDB();
    } catch (e) {
      console.warn("No se pudo iniciar IndexedDB:", e);
    }

    const cameraInput = document.getElementById("cameraInput");
    const galleryInput = document.getElementById("galleryInput");
    const dropzone = document.getElementById("dropzone");
    const clearAllBtn = document.getElementById("clearAllBtn");

    if (cameraInput) {
      cameraInput.addEventListener("change", (e) => {
        handleFiles(e.target.files);
        cameraInput.value = "";
      });
    }

    if (galleryInput) {
      galleryInput.addEventListener("change", (e) => {
        handleFiles(e.target.files);
        galleryInput.value = "";
      });
    }

    // Drag and drop
    if (dropzone) {
      ["dragenter", "dragover"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add("dragover");
        });
      });

      ["dragleave", "drop"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove("dragover");
        });
      });

      dropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) {
          handleFiles(dt.files);
        }
      });
    }

    // Borrar todas
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", async () => {
        if (confirm("¿Estás seguro de que deseas borrar todas las imágenes guardadas en este dispositivo?")) {
          await clearAllImages();
          showToast("Todas las imágenes fueron eliminadas");
          renderGallery();
        }
      });
    }

    // Lightbox modal listeners
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxOverlay = document.getElementById("lightboxOverlay");
    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxOverlay) lightboxOverlay.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });

    // Render inicial de fotos ya almacenadas
    renderGallery();
  }

  // Ejecutar al cargar DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
