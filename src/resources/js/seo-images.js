// SEO Images JavaScript
console.log('🔵 SEO Images JavaScript dosyası yüklendi!');

(function () {
    'use strict';

    console.log('🔵 SEO Images IIFE başlatıldı!');

    const API_BASE = '/seo-images/images';
    let selectedImagePath = null;
    let currentInputName = null;
    let currentMultipleMode = false;
    let selectedImages = []; // Çoklu seçim için
    let uploadAreaInitialized = false;
    let allImages = []; // Tüm resimler (client-side filtering için)
    let displayedImages = []; // Gösterilen resimler
    let currentPage = 1;
    let perPage = 12;
    let searchQuery = '';
    let isLoadingMore = false;

    // Loglama fonksiyonu
    function log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[SEO Images ${timestamp}] [${level}] ${message}`;

        switch (level) {
            case 'ERROR':
                console.error(logMessage, data || '');
                break;
            case 'WARN':
                console.warn(logMessage, data || '');
                break;
            case 'INFO':
                console.info(logMessage, data || '');
                break;
            case 'DEBUG':
                console.log(logMessage, data || '');
                break;
            default:
                console.log(logMessage, data || '');
        }
    }

    // DOM yüklendiğinde başlat
    console.log('🔵 Script başlatılıyor...');
    log('INFO', 'Script başlatılıyor...');
    if (document.readyState === 'loading') {
        log('DEBUG', 'DOM henüz yükleniyor, DOMContentLoaded bekleniyor');
        document.addEventListener('DOMContentLoaded', function () {
            log('INFO', 'DOMContentLoaded event tetiklendi');
            initializeModal();
        });
    } else {
        log('INFO', 'DOM zaten yüklü, direkt başlatılıyor');
        initializeModal();
    }

    // Modal açıldığında
    function initializeModal() {
        log('INFO', 'initializeModal çağrıldı');
        const modal = document.getElementById('seoImageModal');
        if (modal) {
            log('INFO', 'Modal elementi bulundu', {
                id: modal.id
            });
            modal.addEventListener('show.bs.modal', function (e) {
                log('INFO', 'Modal açılıyor (show.bs.modal event)');

                // Modal'ı açan butonu bul (trigger button)
                const triggerButton = e.relatedTarget || document.querySelector('.seo-image-select-btn:not([data-bs-dismiss])');
                let inputWrapper = null;

                if (triggerButton) {
                    // Butonun parent wrapper'ını bul
                    inputWrapper = triggerButton.closest('.seo-image-input-wrapper');
                    log('DEBUG', 'Trigger button bulundu', {
                        button: triggerButton,
                        wrapper: inputWrapper
                    });
                }

                // Eğer wrapper bulunamadıysa, ilk wrapper'ı kullan
                if (!inputWrapper) {
                    inputWrapper = document.querySelector('.seo-image-input-wrapper');
                    log('WARN', 'Trigger button\'dan wrapper bulunamadı, ilk wrapper kullanılıyor');
                }

                if (inputWrapper) {
                    currentInputName = inputWrapper.dataset.name;
                    currentMultipleMode = inputWrapper.dataset.multiple === 'true';
                    log('INFO', 'Input wrapper bulundu', {
                        name: currentInputName,
                        multiple: currentMultipleMode,
                        multipleData: inputWrapper.dataset.multiple
                    });

                    // Çoklu seçim modunu ayarla
                    updateMultipleModeUI();
                } else {
                    log('ERROR', 'Input wrapper bulunamadı!');
                    currentMultipleMode = false;
                }
                // Tüm seçimleri ve durumları temizle
                selectedImages = []; // Çoklu seçim listesini temizle
                selectedImagePath = null; // Tekli seçim yolunu temizle
                currentPage = 1;
                searchQuery = '';
                const searchInput = document.getElementById('imageSearchInput');
                if (searchInput) {
                    searchInput.value = '';
                }

                // Popover'ı kapat (modal açıldığında)
                DeletePopoverManager.hide();

                // Sağ paneli gizle (modal açıldığında - her açılışta)
                const panel = document.getElementById('imageDetailsPanel');
                if (panel) {
                    panel.style.display = 'none';
                    panel.style.visibility = 'hidden';
                    panel.classList.remove('d-block');
                    panel.classList.add('d-none');
                }
                const selectBtn = document.getElementById('selectImageBtn');
                if (selectBtn) {
                    selectBtn.style.display = 'none';
                }
                
                // Tüm resim seçimlerini temizle
                document.querySelectorAll('.image-item').forEach(item => {
                    item.classList.remove('selected');
                    const checkbox = item.querySelector('.image-checkbox');
                    if (checkbox) {
                        checkbox.checked = false;
                    }
                });
                
                // Seçim sayısını sıfırla
                const selectedCount = document.getElementById('selectedCount');
                const multipleCount = document.getElementById('multipleCount');
                if (selectedCount) {
                    selectedCount.textContent = '0 seçili';
                    selectedCount.style.display = 'none';
                }
                if (multipleCount) {
                    multipleCount.textContent = '0';
                }
                
                // Format bilgilerini gizle
                const formatInfo = document.getElementById('imageFormatInfo');
                if (formatInfo) {
                    formatInfo.style.display = 'none';
                }

                loadImages(true);
                // Upload area'yı modal açıldığında başlat (kısa bir gecikme ile)
                setTimeout(() => {
                    log('DEBUG', 'Upload area başlatılıyor (setTimeout)');
                    initializeUploadArea();
                    // File input change event'ini direkt bağla
                    attachFileInputListener();
                    // Arama ve daha fazla yükleme event listener'larını bağla
                    initializeSearchAndPagination();
                }, 100);
            });

            modal.addEventListener('hidden.bs.modal', function () {
                log('INFO', 'Modal kapatıldı (hidden.bs.modal event)');

                // Popover'ı kapat (modal kapatıldığında)
                DeletePopoverManager.hide();

                // Sağ paneli gizle
                const panel = document.getElementById('imageDetailsPanel');
                if (panel) {
                    panel.style.display = 'none';
                    panel.style.visibility = 'hidden';
                }
                const selectBtn = document.getElementById('selectImageBtn');
                if (selectBtn) {
                    selectBtn.style.display = 'none';
                }

                // Seçimi temizle
                document.querySelectorAll('.image-item').forEach(item => {
                    item.classList.remove('selected');
                });

                // ÖNEMLİ: Sadece resim seçildiyse (çift tıklama veya "Seç" butonu ile) input'a yaz
                // Eğer resim seçilmeden modal kapatıldıysa, input'a hiçbir şey yazma
                if (selectedImagePath && currentInputName) {
                    log('INFO', 'Modal kapandı, resim seçilmiş - preview ve SEO picture güncelleniyor', {
                        path: selectedImagePath,
                        inputName: currentInputName
                    });
                    const input = document.getElementById(currentInputName);
                    const preview = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-preview img');
                    const removeBtn = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-remove-btn');

                    // Input'a yaz (sadece seçilmişse)
                    if (input) {
                        input.value = selectedImagePath;
                        log('INFO', 'Input değeri güncellendi', {
                            value: selectedImagePath
                        });
                    }

                    if (preview) {
                        const previewUrl = `/storage/${selectedImagePath}/${selectedImagePath.split('/').pop()}.jpg`;
                        preview.src = previewUrl;
                        preview.closest('.seo-image-preview').style.display = 'block';
                        log('INFO', 'Preview güncellendi', {
                            url: previewUrl
                        });
                    }
                    if (removeBtn) {
                        removeBtn.style.display = 'inline-block';
                        log('DEBUG', 'Remove butonu gösterildi');
                    }

                    // SEO Picture preview'ı güncelle
                    updateSeoPicturePreview(selectedImagePath);
                } else {
                    log('DEBUG', 'Resim seçilmeden modal kapatıldı - input güncellenmedi', {
                        selectedImagePath: selectedImagePath,
                        currentInputName: currentInputName
                    });
                }
                
                // Her durumda seçim durumunu temizle
                selectedImagePath = null;
            });
        } else {
            log('ERROR', 'Modal elementi bulunamadı!');
        }
    }

    // Resimleri yükle
    function loadImages(reset = true) {
        log('INFO', 'loadImages çağrıldı', {
            reset,
            searchQuery,
            currentPage
        });
        const grid = document.getElementById('imageGrid');
        if (!grid) {
            log('ERROR', 'Image grid elementi bulunamadı!');
            return;
        }

        if (reset) {
            currentPage = 1;
            allImages = [];
            displayedImages = [];
            grid.innerHTML = '<div class="loading">Yükleniyor...</div>';
        }

        const url = new URL(API_BASE, window.location.origin);
        url.searchParams.set('page', currentPage);
        url.searchParams.set('per_page', perPage);
        if (searchQuery) {
            url.searchParams.set('search', searchQuery);
        }

        log('INFO', 'API çağrısı yapılıyor', {
            url: url.toString()
        });

        fetch(url.toString())
            .then(response => {
                log('INFO', 'API yanıtı alındı', {
                    status: response.status,
                    ok: response.ok
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                log('INFO', 'API yanıtı parse edildi', {
                    success: data.success,
                    dataLength: data.data ? data.data.length : 0,
                    pagination: data.pagination
                });
                if (data.success) {
                    if (reset) {
                        allImages = data.data;
                        displayedImages = data.data;
                    } else {
                        // Daha fazla yükleme
                        allImages = [...allImages, ...data.data];
                        displayedImages = [...displayedImages, ...data.data];
                    }

                    log('INFO', 'Resimler render ediliyor', {
                        count: displayedImages.length,
                        total: data.pagination?.total || displayedImages.length
                    });
                    renderImages(displayedImages);
                    updateLoadMoreButton(data.pagination);
                } else {
                    log('WARN', 'API başarısız yanıt döndü', data);
                    grid.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </div>
                            <h5 class="empty-state-title">Resim bulunamadı</h5>
                            <p class="empty-state-text">Arama kriterlerinize uygun resim bulunamadı. Farklı bir arama terimi deneyin.</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                log('ERROR', 'Resimler yüklenirken hata oluştu', error);
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon" style="color: #dc3545;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h5 class="empty-state-title" style="color: #dc3545;">Hata oluştu</h5>
                        <p class="empty-state-text">${error.message || 'Resimler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.'}</p>
                    </div>
                `;
            });
    }

    // Daha fazla yükle butonunu güncelle
    function updateLoadMoreButton(pagination) {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (!pagination || !loadMoreContainer || !loadMoreBtn) {
            return;
        }

        if (pagination.has_more) {
            const remaining = pagination.total - displayedImages.length;
            loadMoreBtn.textContent = `Daha Fazla Göster (${Math.min(remaining, perPage)})`;
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    // Arama ve sayfalama event listener'larını başlat
    function initializeSearchAndPagination() {
        // Arama input
        const searchInput = document.getElementById('imageSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function (e) {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();

                if (query.length > 0) {
                    if (clearSearchBtn) {
                        clearSearchBtn.style.display = 'block';
                    }
                } else {
                    if (clearSearchBtn) {
                        clearSearchBtn.style.display = 'none';
                    }
                }

                // Debounce: 500ms bekle
                searchTimeout = setTimeout(() => {
                    searchQuery = query;
                    currentPage = 1;
                    loadImages(true);
                }, 500);
            });

            // Enter tuşu ile arama
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(searchTimeout);
                    searchQuery = e.target.value.trim();
                    currentPage = 1;
                    loadImages(true);
                }
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function () {
                if (searchInput) {
                    searchInput.value = '';
                    searchQuery = '';
                    currentPage = 1;
                    loadImages(true);
                }
                clearSearchBtn.style.display = 'none';
            });
        }

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function () {
                if (isLoadingMore) {
                    return;
                }
                isLoadingMore = true;
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Yükleniyor...';

                currentPage++;
                loadImages(false);

                setTimeout(() => {
                    isLoadingMore = false;
                    loadMoreBtn.disabled = false;
                }, 1000);
            });
        }
    }

    // Resimleri render et
    function renderImages(images) {
        log('INFO', 'renderImages çağrıldı', {
            imageCount: images.length
        });
        const grid = document.getElementById('imageGrid');
        if (!grid) {
            log('ERROR', 'Image grid elementi bulunamadı!');
            return;
        }

        if (images.length === 0) {
            log('INFO', 'Gösterilecek resim yok');
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                    <h5 class="empty-state-title">Henüz resim eklenmemiş</h5>
                    <p class="empty-state-text">Resim eklemek için yukarıdaki yükleme alanını kullanın veya resimleri sürükleyip bırakın.</p>
                </div>
            `;
            return;
        }
        log('DEBUG', 'Resimler render ediliyor', {
            count: images.length
        });

        grid.innerHTML = images.map(image => {
            const safeAlt = (image.alt_text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const safeTitle = (image.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const isSelected = selectedImages.some(img => img.id == image.id);
            const multipleClass = currentMultipleMode ? 'multiple-mode' : '';
            const selectedClass = currentMultipleMode && isSelected ? 'selected' : '';
            const checkbox = currentMultipleMode ? `
                <input type="checkbox" class="image-checkbox" 
                       data-id="${image.id}" 
                       data-path="${image.folder_path}"
                       ${isSelected ? 'checked' : ''}>
            ` : '';
            // Picture etiketi için URL'leri hazırla
            const fileName = image.folder_path.split('/').pop();
            const basePath = `/storage/${image.folder_path}`;
            const width = image.width || 0;
            const height = image.height || 0;
            
            // AVIF URL
            const avifUrl = image.avif_url || `${basePath}/${fileName}.avif`;
            // WebP URL
            const webpUrl = image.webp_url || `${basePath}/${fileName}.webp`;
            // JPG URL (fallback)
            const jpgUrl = image.url || `${basePath}/${fileName}.jpg`;
            
            // Srcset genişliklerini hesapla
            const srcsetWidths = width > 0 ? calculateSrcsetWidths(width) : [];
            const sizes = width > 0 ? calculateSizes(width) : null;
            
            // Srcset oluştur
            const buildSrcset = (extension, widths, originalWidth) => {
                return widths.map(w => {
                    const suffix = (w === originalWidth) ? '' : `-${w}`;
                    return `${basePath}/${fileName}${suffix}.${extension} ${w}w`;
                }).join(', ');
            };
            
            const avifSrcset = srcsetWidths.length > 0 ? buildSrcset('avif', srcsetWidths, width) : '';
            const webpSrcset = srcsetWidths.length > 0 ? buildSrcset('webp', srcsetWidths, width) : '';
            const jpgSrcset = srcsetWidths.length > 0 ? buildSrcset('jpg', srcsetWidths, width) : '';
            
            // Picture etiketi oluştur
            let pictureHtml = '<picture class="image-item-picture">';
            
            // AVIF source (eğer srcset varsa)
            if (avifSrcset && width > 0) {
                pictureHtml += `<source srcset="${avifSrcset}" type="image/avif"`;
                if (sizes) pictureHtml += ` sizes="${sizes}"`;
                if (width > 0) pictureHtml += ` width="${width}" height="${height}"`;
                pictureHtml += '>';
            } else if (width > 0) {
                // Srcset yoksa tek AVIF
                pictureHtml += `<source srcset="${avifUrl}" type="image/avif" width="${width}" height="${height}">`;
            }
            
            // WebP source (eğer srcset varsa)
            if (webpSrcset && width > 0) {
                pictureHtml += `<source srcset="${webpSrcset}" type="image/webp"`;
                if (sizes) pictureHtml += ` sizes="${sizes}"`;
                if (width > 0) pictureHtml += ` width="${width}" height="${height}"`;
                pictureHtml += '>';
            } else if (width > 0) {
                // Srcset yoksa tek WebP
                pictureHtml += `<source srcset="${webpUrl}" type="image/webp" width="${width}" height="${height}">`;
            }
            
            // JPG fallback img
            pictureHtml += `<img src="${jpgUrl}"`;
            if (jpgSrcset && width > 0) {
                pictureHtml += ` srcset="${jpgSrcset}"`;
                if (sizes) pictureHtml += ` sizes="${sizes}"`;
            }
            if (width > 0) pictureHtml += ` width="${width}" height="${height}"`;
            pictureHtml += ` alt="${safeAlt}" loading="lazy" decoding="async" fetchpriority="low">`;
            pictureHtml += '</picture>';
            
            return `
            <div class="image-item ${multipleClass} ${selectedClass}" 
                 data-path="${image.folder_path}" 
                 data-id="${image.id}" 
                 data-alt="${safeAlt}" 
                 data-title="${safeTitle}"
                 data-url="${image.url}"
                 data-webp-url="${image.webp_url || ''}"
                 data-avif-url="${image.avif_url || ''}"
                 data-width="${image.width || ''}"
                 data-height="${image.height || ''}">
                ${checkbox}
                ${pictureHtml}
                <button class="image-item-delete" onclick="event.stopPropagation(); deleteImageFromGrid(${image.id}, event)" title="Resmi Sil">×</button>
                <div class="image-item-info">
                    ${image.alt_text || 'Alt etiketi yok'}
                </div>
            </div>
        `;
        }).join('');

        // Çoklu seçim modunda checkbox event'lerini bağla
        if (currentMultipleMode) {
            grid.querySelectorAll('.image-checkbox').forEach(checkbox => {
                // Mevcut event listener'ı kaldır (varsa) - clone ile temiz başlangıç
                const newCheckbox = checkbox.cloneNode(true);
                checkbox.parentNode.replaceChild(newCheckbox, checkbox);

                // Change event - checkbox durumu değiştiğinde
                newCheckbox.addEventListener('change', function (e) {
                    e.stopPropagation(); // Resim item click event'ini engelleme
                    handleImageCheckboxChange(this, e);
                });

                // Click event - checkbox'a tıklandığında
                newCheckbox.addEventListener('click', function (e) {
                    e.stopPropagation(); // Resim item click event'ini engelleme
                });
            });
        }

        // Resim seçme - tüm modlarda sağ paneli göster
        const imageItems = grid.querySelectorAll('.image-item');
        log('DEBUG', 'Resim item\'larına click event\'leri ekleniyor', {
            count: imageItems.length,
            multipleMode: currentMultipleMode
        });

        // Her resim için click timer'ı sakla (sadece tekli mod için)
        const clickTimers = new Map();

        imageItems.forEach((item, index) => {
            item.addEventListener('click', function (e) {
                // Silme butonuna veya checkbox'a tıklanmadıysa
                if (!e.target.closest('.image-item-delete') && !e.target.closest('.image-checkbox')) {
                    const itemId = this.dataset.id;
                    const itemPath = this.dataset.path;
                    const itemData = {
                        id: this.dataset.id,
                        path: this.dataset.path,
                        alt: this.dataset.alt,
                        title: this.dataset.title,
                        url: this.dataset.url,
                        webp_url: this.dataset.webpUrl || this.dataset.url,
                        avif_url: this.dataset.avifUrl || '',
                        width: this.dataset.width,
                        height: this.dataset.height
                    };

                    // Çoklu seçim modunda: Sadece sağ paneli göster (hemen, timeout olmadan)
                    if (currentMultipleMode) {
                        log('INFO', 'Çoklu seçim modunda resim tıklandı - sağ panel gösteriliyor', {
                            path: itemPath,
                            id: itemId,
                            itemData: itemData
                        });

                        // Seçili class'ı güncelle (checkbox durumuna göre)
                        grid.querySelectorAll('.image-item').forEach(i => i.classList.remove('selected'));
                        const clickedItem = document.querySelector(`.image-item[data-id="${itemId}"]`);
                        if (clickedItem) {
                            const checkbox = clickedItem.querySelector('.image-checkbox');
                            if (checkbox && checkbox.checked) {
                                clickedItem.classList.add('selected');
                            }
                        }

                        // Sağ paneli göster ve bilgileri doldur (hemen, gecikme olmadan)
                        showImageDetails(itemData);
                        log('DEBUG', 'showImageDetails çağrıldı, panel kontrol ediliyor');
                        return;
                    }

                    // Tekli seçim modunda: Çift tıklama kontrolü
                    if (!clickTimers.has(itemId)) {
                        // İlk tıklama - sadece sağ paneli göster (SEÇİM YAPMA!)
                        const timer = setTimeout(() => {
                            log('INFO', 'Resim tıklandı (tek tıklama) - sadece sağ panel gösteriliyor', {
                                path: itemPath,
                                id: itemId
                            });
                            grid.querySelectorAll('.image-item').forEach(i => i.classList.remove('selected'));
                            const clickedItem = document.querySelector(`.image-item[data-id="${itemId}"]`);
                            if (clickedItem) {
                                clickedItem.classList.add('selected');
                            }
                            
                            // ÖNEMLİ: Tek tıklamada selectedImagePath AYARLANMAMALI
                            // Sadece sağ paneli göster, seçim yapma
                            // selectedImagePath sadece çift tıklama veya "Seç" butonunda ayarlanacak

                            // Sağ paneli göster ve bilgileri doldur
                            showImageDetails(itemData);

                            log('DEBUG', 'Sağ panel gösterildi (seçim yapılmadı)', {
                                path: itemPath
                            });
                            clickTimers.delete(itemId);
                        }, 300); // 300ms içinde ikinci tıklama gelirse çift tıklama

                        clickTimers.set(itemId, timer);
                    } else {
                        // Çift tıklama - resmi seç ve modal'ı kapat
                        clearTimeout(clickTimers.get(itemId));
                        clickTimers.delete(itemId);

                        log('INFO', 'Resim çift tıklandı - seçiliyor ve modal kapatılıyor', {
                            path: itemPath
                        });
                        // Çift tıklamada seçim yap
                        selectedImagePath = itemPath;

                        // Input'a yaz
                        if (currentInputName) {
                            const input = document.getElementById(currentInputName);
                            if (input) {
                                input.value = selectedImagePath;
                                log('INFO', 'Input değeri güncellendi', {
                                    value: selectedImagePath
                                });

                                // Preview'ı güncelle
                                const preview = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-preview img');
                                const removeBtn = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-remove-btn');

                                if (preview) {
                                    const previewUrl = `/storage/${selectedImagePath}/${selectedImagePath.split('/').pop()}.jpg`;
                                    preview.src = previewUrl;
                                    preview.closest('.seo-image-preview').style.display = 'block';
                                    log('INFO', 'Preview güncellendi', {
                                        url: previewUrl
                                    });
                                }
                                if (removeBtn) {
                                    removeBtn.style.display = 'inline-block';
                                }

                                // SEO Picture preview'ı güncelle
                                updateSeoPicturePreview(selectedImagePath);
                            }
                        }

                        // Modal'ı kapat
                        const modal = bootstrap.Modal.getInstance(document.getElementById('seoImageModal'));
                        if (modal) {
                            modal.hide();
                        }
                    }
                }
            });
        });
        log('INFO', 'Resimler başarıyla render edildi');
    }

    // Çoklu seçim modu UI'ını güncelle
    function updateMultipleModeUI() {
        const selectBtn = document.getElementById('selectImageBtn');
        const multipleBtn = document.getElementById('selectMultipleImagesBtn');
        const selectedCount = document.getElementById('selectedCount');
        const multipleCount = document.getElementById('multipleCount');

        if (currentMultipleMode) {
            if (selectBtn) selectBtn.style.display = 'none';
            if (multipleBtn) multipleBtn.style.display = 'inline-block';
            if (selectedCount) {
                selectedCount.style.display = 'inline-block';
                selectedCount.textContent = '0 seçili';
            }
        } else {
            if (selectBtn) selectBtn.style.display = 'none';
            if (multipleBtn) multipleBtn.style.display = 'none';
            if (selectedCount) selectedCount.style.display = 'none';
        }
    }

    // Checkbox değişikliğini işle
    window.handleImageCheckboxChange = function (checkbox, event) {
        // Event varsa propagation'ı durdur
        if (event) {
            event.stopPropagation();
        }

        const imageId = checkbox.dataset.id;
        const imagePath = checkbox.dataset.path;
        const imageItem = document.querySelector(`.image-item[data-id="${imageId}"]`);

        if (!imageItem) {
            log('WARN', 'Image item bulunamadı', {
                id: imageId
            });
            return;
        }

        const imageData = {
            id: imageId,
            path: imagePath,
            alt: imageItem?.dataset.alt || '',
            title: imageItem?.dataset.title || '',
            url: imageItem?.dataset.url || '',
            width: imageItem?.dataset.width || '',
            height: imageItem?.dataset.height || ''
        };

        if (checkbox.checked) {
            // Resmi seçili listeye ekle (sıraya ekle)
            if (!selectedImages.some(img => img.id == imageId)) {
                selectedImages.push(imageData);
                imageItem.classList.add('selected');
                log('INFO', 'Resim seçime eklendi', {
                    id: imageId
                });
            }
        } else {
            // Resmi seçili listeden çıkar
            selectedImages = selectedImages.filter(img => img.id != imageId);
            imageItem.classList.remove('selected');
            log('INFO', 'Resim seçimden kaldırıldı', {
                id: imageId
            });
        }

        // Seçim sayısını güncelle
        updateSelectedCount();

        // Checkbox tıklandığında da sağ paneli göster (resim bilgilerini görmek için)
        showImageDetails(imageData);
    };

    // Seçim sayısını güncelle
    function updateSelectedCount() {
        const selectedCount = document.getElementById('selectedCount');
        const multipleCount = document.getElementById('multipleCount');
        const count = selectedImages.length;

        if (selectedCount) {
            selectedCount.textContent = `${count} seçili`;
            selectedCount.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (multipleCount) {
            multipleCount.textContent = count;
        }
    }

    // Çoklu seçilen resimleri input'lara ekle
    function addMultipleImagesToInput() {
        if (!currentMultipleMode || selectedImages.length === 0) {
            return;
        }

        const inputWrapper = document.querySelector(`.seo-image-input-wrapper[data-name="${currentInputName}"]`);
        if (!inputWrapper) {
            log('ERROR', 'Input wrapper bulunamadı');
            return;
        }

        const multipleInputsDiv = inputWrapper.querySelector('.seo-image-multiple-inputs');
        const selectedListDiv = inputWrapper.querySelector('.seo-image-selected-list');
        const selectedSortable = inputWrapper.querySelector('.selected-images-sortable');
        const clearBtn = inputWrapper.querySelector('.seo-image-clear-all-btn');

        if (!multipleInputsDiv || !selectedSortable) {
            log('ERROR', 'Multiple input elementleri bulunamadı');
            return;
        }

        // Mevcut input'ları temizle
        multipleInputsDiv.innerHTML = '';
        selectedSortable.innerHTML = '';

        // Her seçili resim için input oluştur (sıralı)
        const namePattern = inputWrapper.dataset.namePattern || 'images[]';
        selectedImages.forEach((image, index) => {
            // Hidden input oluştur - array formatında
            const input = document.createElement('input');
            input.type = 'hidden';
            // Eğer name pattern'de [] varsa, index ile değiştir
            if (namePattern.includes('[]')) {
                input.name = namePattern.replace('[]', `[${index}]`);
            } else {
                // Eğer [] yoksa, index ekle
                input.name = `${namePattern}[${index}]`;
            }
            input.value = image.path;
            input.dataset.imageId = image.id;
            input.dataset.index = index;
            multipleInputsDiv.appendChild(input);

            // Preview item oluştur (sıralanabilir)
            const previewItem = document.createElement('div');
            previewItem.className = 'selected-image-item';
            previewItem.dataset.imageId = image.id;
            previewItem.dataset.index = index;
            previewItem.draggable = true;
            const previewUrl = `/storage/${image.path}/${image.path.split('/').pop()}.jpg`;
            previewItem.innerHTML = `
                <span class="drag-handle" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; cursor: move;">⋮⋮</span>
                <img src="${previewUrl}" alt="${image.alt}" style="width: 100%; height: 120px; object-fit: cover;">
                <button type="button" class="remove-btn" onclick="removeSelectedImage('${image.id}')" title="Kaldır">×</button>
            `;
            selectedSortable.appendChild(previewItem);
        });

        // Drag & drop event'lerini bağla
        initializeSortable();

        // Seçili listeyi göster
        if (selectedListDiv) {
            selectedListDiv.style.display = 'block';
        }
        if (clearBtn) {
            clearBtn.style.display = 'inline-block';
        }

        log('INFO', 'Çoklu resimler input\'a eklendi', {
            count: selectedImages.length
        });
    }

    // Sıralanabilir (drag & drop) özelliğini başlat
    function initializeSortable() {
        const sortableContainer = document.querySelector('.selected-images-sortable');
        if (!sortableContainer) return;

        const items = sortableContainer.querySelectorAll('.selected-image-item');
        items.forEach(item => {
            item.addEventListener('dragstart', function (e) {
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.outerHTML);
                e.dataTransfer.setData('text/plain', this.dataset.imageId);
            });

            item.addEventListener('dragend', function () {
                this.classList.remove('dragging');
            });

            item.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.classList.add('drag-over');
            });

            item.addEventListener('dragleave', function () {
                this.classList.remove('drag-over');
            });

            item.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedItem = document.querySelector(`.selected-image-item[data-image-id="${draggedId}"]`);
                const draggedIndex = parseInt(draggedItem?.dataset.index || '0');
                const targetIndex = parseInt(this.dataset.index || '0');

                if (draggedItem && draggedIndex !== targetIndex) {
                    // Array'de sıralamayı değiştir
                    const draggedImage = selectedImages[draggedIndex];
                    selectedImages.splice(draggedIndex, 1);
                    selectedImages.splice(targetIndex, 0, draggedImage);

                    // Input'ları ve preview'ları yeniden oluştur
                    addMultipleImagesToInput();

                    log('INFO', 'Resim sırası değiştirildi', {
                        from: draggedIndex,
                        to: targetIndex
                    });
                }
            });
        });
    }

    // Seçili resmi listeden kaldır
    window.removeSelectedImage = function (imageId) {
        selectedImages = selectedImages.filter(img => img.id != imageId);

        // Grid'deki seçimi kaldır
        const imageItem = document.querySelector(`.image-item[data-id="${imageId}"]`);
        if (imageItem) {
            imageItem.classList.remove('selected');
        }

        // Input'ları güncelle
        addMultipleImagesToInput();
        updateSelectedCount();
    };

    // Tüm seçimleri temizle
    window.clearAllSelectedImages = function () {
        selectedImages = [];

        // Tüm seçili class'ları kaldır
        document.querySelectorAll('.image-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // Input'ları temizle
        const inputWrapper = document.querySelector(`.seo-image-input-wrapper[data-name="${currentInputName}"]`);
        if (inputWrapper) {
            const multipleInputsDiv = inputWrapper.querySelector('.seo-image-multiple-inputs');
            const selectedListDiv = inputWrapper.querySelector('.seo-image-selected-list');
            const clearBtn = inputWrapper.querySelector('.seo-image-clear-all-btn');

            if (multipleInputsDiv) multipleInputsDiv.innerHTML = '';
            if (selectedListDiv) selectedListDiv.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
        }

        updateSelectedCount();
    };

    // Resim yükleme alanını başlat
    function initializeUploadArea() {
        log('INFO', 'initializeUploadArea çağrıldı');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageUpload');

        if (!uploadArea) {
            log('ERROR', 'Upload area elementi bulunamadı!');
            return;
        }
        if (!fileInput) {
            log('ERROR', 'File input elementi bulunamadı!');
            return;
        }
        log('INFO', 'Upload area ve file input bulundu');

        // Eğer zaten başlatılmışsa, önceki listener'ları kaldır ve yeniden başlat
        if (uploadArea.dataset.initialized === 'true') {
            log('DEBUG', 'Upload area zaten başlatılmış, yeniden başlatılıyor');
            // Clone ile event listener'ları temizle
            const newUploadArea = uploadArea.cloneNode(true);
            uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
            const newFileInput = document.getElementById('imageUpload');
            if (!newFileInput) {
                log('ERROR', 'Yeni file input bulunamadı!');
                return;
            }
            // Yeni elementlerle devam et
            setupUploadEvents(newUploadArea, newFileInput);
            return;
        }

        log('INFO', 'Upload area ilk kez başlatılıyor');
        setupUploadEvents(uploadArea, fileInput);
        uploadArea.dataset.initialized = 'true';
        uploadAreaInitialized = true;
        log('INFO', 'Upload area başarıyla başlatıldı');
    }

    // Upload event'lerini kur
    function setupUploadEvents(uploadArea, fileInput) {
        log('INFO', 'setupUploadEvents çağrıldı');
        if (!uploadArea || !fileInput) {
            log('ERROR', 'Upload area veya file input bulunamadı!', {
                uploadArea: !!uploadArea,
                fileInput: !!fileInput
            });
            return;
        }

        // File input'u upload area'nın üzerine yerleştir (zaten modal'da yapıldı)
        // Sadece drag & drop event'lerini ekle, click için file input zaten hazır

        // Drag over event
        uploadArea.addEventListener('dragover', function (e) {
            log('DEBUG', 'Drag over event tetiklendi');
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        }, false);

        // Drag leave event
        uploadArea.addEventListener('dragleave', function (e) {
            log('DEBUG', 'Drag leave event tetiklendi');
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        }, false);

        // Drop event
        uploadArea.addEventListener('drop', function (e) {
            log('INFO', 'Drop event tetiklendi');
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            log('INFO', 'Dropped files', {
                count: files ? files.length : 0
            });
            if (files && files.length > 0) {
                handleFiles(files);
            } else {
                log('WARN', 'Drop edilen dosya yok');
            }
        }, false);
        log('INFO', 'Drag & drop event\'leri başarıyla eklendi');

        // File input change event - burada bağlama, ayrı fonksiyonda bağlayacağız
    }

    // File input change event'ini bağla
    function attachFileInputListener() {
        log('INFO', 'attachFileInputListener çağrıldı');
        const fileInput = document.getElementById('imageUpload');
        if (!fileInput) {
            log('WARN', 'File input bulunamadı, 100ms sonra tekrar deneniyor');
            // Birkaç milisaniye sonra tekrar dene
            setTimeout(() => {
                attachFileInputListener();
            }, 100);
            return;
        }
        log('INFO', 'File input bulundu', {
            id: fileInput.id,
            type: fileInput.type
        });

        // Eğer zaten listener varsa, önce kaldır
        if (fileInput.dataset.listenerAttached === 'true') {
            log('DEBUG', 'File input zaten listener\'a sahip, yeniden bağlanıyor');
            // Clone ile temizle
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            newFileInput.id = 'imageUpload';
            newFileInput.style.position = 'absolute';
            newFileInput.style.top = '0';
            newFileInput.style.left = '0';
            newFileInput.style.width = '100%';
            newFileInput.style.height = '100%';
            newFileInput.style.opacity = '0';
            newFileInput.style.cursor = 'pointer';
            newFileInput.style.zIndex = '10';
            log('DEBUG', 'File input clone edildi ve style\'lar ayarlandı');

            // Yeni listener ekle
            newFileInput.addEventListener('change', function (e) {
                log('INFO', 'File input change event tetiklendi!', {
                    files: e.target.files ? e.target.files.length : 0
                });
                const files = e.target.files;
                if (files && files.length > 0) {
                    log('INFO', 'Dosyalar seçildi', {
                        count: files.length,
                        files: Array.from(files).map(f => ({
                            name: f.name,
                            type: f.type,
                            size: f.size
                        }))
                    });
                    handleFiles(files);
                } else {
                    log('WARN', 'Dosya seçilmedi veya dosya yok');
                }
            }, false);

            newFileInput.dataset.listenerAttached = 'true';
            log('INFO', 'File input listener yeniden bağlandı');
            return;
        }

        // İlk kez listener ekleniyor
        log('INFO', 'File input\'a ilk kez listener ekleniyor');
        fileInput.addEventListener('change', function (e) {
            log('INFO', 'File input change event tetiklendi!', {
                files: e.target.files ? e.target.files.length : 0
            });
            const files = e.target.files;
            if (files && files.length > 0) {
                log('INFO', 'Dosyalar seçildi', {
                    count: files.length,
                    files: Array.from(files).map(f => ({
                        name: f.name,
                        type: f.type,
                        size: f.size
                    }))
                });
                handleFiles(files);
            } else {
                log('WARN', 'Dosya seçilmedi veya dosya yok');
            }
        }, false);

        fileInput.dataset.listenerAttached = 'true';
        log('INFO', 'File input listener başarıyla bağlandı');
    }

    function handleFiles(files) {
        log('INFO', 'handleFiles çağrıldı', {
            fileCount: files.length
        });
        const fileArray = Array.from(files);
        log('DEBUG', 'Dosya listesi', fileArray.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
        })));

        // Yükleme alanını gizle ve yükleme grid'ini göster
        const uploadArea = document.getElementById('uploadArea');
        const imageGrid = document.getElementById('imageGrid');

        if (uploadArea) {
            uploadArea.style.display = 'none';
        }

        // Yükleme grid'ini oluştur
        if (imageGrid) {
            imageGrid.innerHTML = '<div class="upload-progress-container"></div>';
        }

        fileArray.forEach((file, index) => {
            log('INFO', `Dosya işleniyor (${index + 1}/${fileArray.length})`, {
                name: file.name,
                type: file.type,
                size: file.size
            });
            if (file.type.startsWith('image/')) {
                log('INFO', 'Dosya resim formatında, yükleme başlatılıyor', {
                    name: file.name
                });
                uploadImage(file, index);
            } else {
                log('WARN', 'Dosya resim formatında değil', {
                    name: file.name,
                    type: file.type
                });
                showNotification('Sadece resim dosyaları yüklenebilir: ' + file.name, 'error');
            }
        });
    }

    function uploadImage(file, index = 0) {
        log('INFO', 'uploadImage çağrıldı', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            index: index
        });

        // Önizleme oluştur
        const imageGrid = document.getElementById('imageGrid');
        const progressContainer = imageGrid?.querySelector('.upload-progress-container');

        if (!progressContainer) {
            log('ERROR', 'Progress container bulunamadı');
            return;
        }

        // Her resim için yükleme kartı oluştur
        const uploadItemId = `upload-item-${Date.now()}-${index}`;
        const uploadItem = document.createElement('div');
        uploadItem.id = uploadItemId;
        uploadItem.className = 'upload-progress-item';

        // Önizleme oluştur
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadItem.innerHTML = `
                <div class="upload-preview">
                    <img src="${e.target.result}" alt="${file.name}">
                </div>
                <div class="upload-info">
                    <div class="upload-filename">${file.name}</div>
                    <div class="upload-progress-bar">
                        <div class="upload-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="upload-status">Yükleniyor...</div>
                </div>
            `;
        };
        reader.readAsDataURL(file);

        progressContainer.appendChild(uploadItem);

        const formData = new FormData();
        formData.append('image', file);
        log('DEBUG', 'FormData oluşturuldu', {
            hasImage: formData.has('image')
        });

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ||
            document.querySelector('input[name="_token"]')?.value || '';
        log('DEBUG', 'CSRF token alındı', {
            hasToken: !!csrfToken,
            tokenLength: csrfToken.length
        });

        log('INFO', 'API çağrısı yapılıyor', {
            url: API_BASE,
            method: 'POST'
        });

        // XMLHttpRequest kullanarak progress takibi
        const xhr = new XMLHttpRequest();
        const progressFill = uploadItem.querySelector('.upload-progress-fill');
        const uploadStatus = uploadItem.querySelector('.upload-status');

        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                if (progressFill) {
                    progressFill.style.width = percentComplete + '%';
                }
                if (uploadStatus) {
                    uploadStatus.textContent = `Yükleniyor... ${Math.round(percentComplete)}%`;
                }
            }
        });

        xhr.addEventListener('load', function () {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    log('INFO', 'API yanıtı parse edildi', {
                        success: data.success,
                        message: data.message
                    });

                    if (data.success) {
                        // Başarılı
                        if (progressFill) {
                            progressFill.style.width = '100%';
                            progressFill.style.backgroundColor = 'var(--seo-images-success, #28a745)';
                        }
                        if (uploadStatus) {
                            uploadStatus.textContent = 'Yükleme tamamlandı!';
                            uploadStatus.style.color = 'var(--seo-images-success, #28a745)';
                        }
                        uploadItem.classList.add('upload-complete');

                        // Kısa bir gecikme sonrası kaldır ve resimleri yenile
                        setTimeout(() => {
                            uploadItem.remove();
                            // Tüm yüklemeler tamamlandı mı kontrol et
                            const remainingItems = progressContainer.querySelectorAll('.upload-progress-item:not(.upload-complete)');
                            if (remainingItems.length === 0) {
                                // Tüm yüklemeler tamamlandı, resimleri yenile
                                loadImages(true);
                                // Upload area'yı geri göster
                                const uploadArea = document.getElementById('uploadArea');
                                if (uploadArea) {
                                    uploadArea.style.display = 'block';
                                }
                            }
                        }, 1000);

                        showNotification('Resim başarıyla yüklendi: ' + file.name, 'success');
                    } else {
                        // Hata
                        if (uploadStatus) {
                            uploadStatus.textContent = 'Hata: ' + (data.message || 'Bilinmeyen hata');
                            uploadStatus.style.color = 'var(--seo-images-danger, #dc3545)';
                        }
                        uploadItem.classList.add('upload-error');
                        showNotification(data.message || 'Resim yüklenirken hata oluştu', 'error');
                    }
                } catch (e) {
                    log('ERROR', 'JSON parse hatası', e);
                    if (uploadStatus) {
                        uploadStatus.textContent = 'Hata: Yanıt parse edilemedi';
                        uploadStatus.style.color = 'var(--seo-images-danger, #dc3545)';
                    }
                    uploadItem.classList.add('upload-error');
                }
            } else {
                // HTTP hatası
                if (uploadStatus) {
                    uploadStatus.textContent = 'Hata: ' + xhr.statusText;
                    uploadStatus.style.color = 'var(--seo-images-danger, #dc3545)';
                }
                uploadItem.classList.add('upload-error');
                showNotification('Resim yüklenirken hata oluştu: ' + xhr.statusText, 'error');
            }
        });

        xhr.addEventListener('error', function () {
            log('ERROR', 'XHR error event');
            if (uploadStatus) {
                uploadStatus.textContent = 'Bağlantı hatası';
                uploadStatus.style.color = 'var(--seo-images-danger, #dc3545)';
            }
            uploadItem.classList.add('upload-error');
            showNotification('Resim yüklenirken bağlantı hatası oluştu', 'error');
        });

        xhr.open('POST', API_BASE);
        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(formData);

        // File input'u temizle
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) {
            fileInput.value = '';
            log('DEBUG', 'File input temizlendi');
        }
    }

    // Resim detaylarını sağ panelde göster
    function showImageDetails(imageData) {
        log('INFO', 'showImageDetails çağrıldı', {
            imageData,
            multipleMode: currentMultipleMode
        });

        const panel = document.getElementById('imageDetailsPanel');
        const selectBtn = document.getElementById('selectImageBtn');

        if (!panel) {
            log('ERROR', 'Image details panel bulunamadı!');
            return;
        }

        // Panel elementlerini güvenli şekilde al
        const imageIdInput = document.getElementById('selectedImageId');
        const altTextInput = document.getElementById('selectedImageAltText');
        const titleInput = document.getElementById('selectedImageTitle');
        const pathInput = document.getElementById('selectedImagePath');
        const dimensionsInput = document.getElementById('selectedImageDimensions');
        const previewPicture = document.getElementById('selectedImagePreviewPicture');
        const previewAvif = document.getElementById('selectedImagePreviewAvif');
        const previewWebp = document.getElementById('selectedImagePreviewWebp');
        const preview = document.getElementById('selectedImagePreview');

        // Panel bilgilerini doldur (null check ile)
        if (imageIdInput) imageIdInput.value = imageData.id || '';
        if (altTextInput) altTextInput.value = imageData.alt || '';
        if (titleInput) titleInput.value = imageData.title || '';
        if (pathInput) pathInput.value = imageData.path || '';
        if (dimensionsInput) {
            dimensionsInput.value = (imageData.width && imageData.height) ?
                `${imageData.width} x ${imageData.height} px` :
                'Bilinmiyor';
        }
        
        // Panel'e image ID'yi data attribute olarak ekle (silme için)
        if (panel && imageData.id) {
            panel.dataset.imageId = imageData.id;
        }

        // Picture etiketi ile 3 format göster
        if (previewPicture && imageData.path) {
            const fileName = imageData.path.split('/').pop();
            const basePath = `/storage/${imageData.path}`;
            const width = imageData.width || 0;
            
            // AVIF URL'i oluştur
            let avifUrl = '';
            if (imageData.avif_url) {
                avifUrl = imageData.avif_url;
            } else {
                avifUrl = `${basePath}/${fileName}.avif`;
            }
            
            // WebP URL'i oluştur
            let webpUrl = '';
            if (imageData.webp_url) {
                webpUrl = imageData.webp_url;
            } else {
                webpUrl = `${basePath}/${fileName}.webp`;
            }
            
            // JPG URL'i oluştur
            let jpgUrl = '';
            if (imageData.url) {
                jpgUrl = imageData.url;
            } else {
                jpgUrl = `${basePath}/${fileName}.jpg`;
            }
            
            // Srcset genişliklerini hesapla
            const srcsetWidths = width > 0 ? calculateSrcsetWidths(width) : [];
            const sizes = width > 0 ? calculateSizes(width) : null;
            
            // Srcset oluştur
            const buildSrcset = (extension, widths, originalWidth) => {
                return widths.map(w => {
                    const suffix = (w === originalWidth) ? '' : `-${w}`;
                    return `${basePath}/${fileName}${suffix}.${extension} ${w}w`;
                }).join(', ');
            };
            
            const avifSrcset = srcsetWidths.length > 0 ? buildSrcset('avif', srcsetWidths, width) : avifUrl;
            const webpSrcset = srcsetWidths.length > 0 ? buildSrcset('webp', srcsetWidths, width) : webpUrl;
            const jpgSrcset = srcsetWidths.length > 0 ? buildSrcset('jpg', srcsetWidths, width) : jpgUrl;
            
            // AVIF source - srcset ile
            if (previewAvif) {
                previewAvif.srcset = avifSrcset;
                previewAvif.setAttribute('srcset', avifSrcset);
                if (sizes) {
                    previewAvif.setAttribute('sizes', sizes);
                }
                if (width > 0) {
                    previewAvif.setAttribute('width', width);
                    previewAvif.setAttribute('height', imageData.height || 0);
                }
            }
            
            // WebP source - srcset ile
            if (previewWebp) {
                previewWebp.srcset = webpSrcset;
                previewWebp.setAttribute('srcset', webpSrcset);
                if (sizes) {
                    previewWebp.setAttribute('sizes', sizes);
                }
                if (width > 0) {
                    previewWebp.setAttribute('width', width);
                    previewWebp.setAttribute('height', imageData.height || 0);
                }
            }
            
            // JPG fallback - srcset ile
            if (preview) {
                preview.src = jpgUrl;
                preview.setAttribute('src', jpgUrl);
                if (jpgSrcset !== jpgUrl) {
                    preview.setAttribute('srcset', jpgSrcset);
                }
                if (sizes) {
                    preview.setAttribute('sizes', sizes);
                }
                preview.alt = imageData.alt || 'Resim önizlemesi';
                preview.setAttribute('alt', imageData.alt || 'Resim önizlemesi');
                if (width > 0) {
                    preview.setAttribute('width', width);
                    preview.setAttribute('height', imageData.height || 0);
                }
                preview.setAttribute('loading', 'lazy');
                preview.setAttribute('decoding', 'async');
                preview.setAttribute('fetchpriority', 'low');
            }
            
            // Format ve boyut bilgilerini göster (tüm formatlar ve boyutlar)
            const formatInfo = document.getElementById('imageFormatInfo');
            if (formatInfo && width > 0) {
                formatInfo.style.display = 'block';
                
                // Srcset genişliklerini hesapla
                const srcsetWidths = calculateSrcsetWidths(width);
                
                // Format container'ları oluştur
                let formatHtml = '<small class="text-muted d-block mb-2"><strong>Formatlar ve Boyutlar:</strong></small>';
                
                // AVIF formatı
                formatHtml += '<div class="mb-2"><small class="text-muted d-block mb-1"><strong>AVIF:</strong></small><div class="d-flex gap-1 flex-wrap">';
                srcsetWidths.forEach(w => {
                    const suffix = (w === width) ? '' : `-${w}`;
                    const fileUrl = `${basePath}/${fileName}${suffix}.avif`;
                    formatHtml += `<a href="${fileUrl}" target="_blank" class="btn btn-sm btn-info" style="font-size: 11px; padding: 2px 8px; text-decoration: none;" title="AVIF ${w}w - Yeni sekmede aç">${w}w</a>`;
                });
                formatHtml += '</div></div>';
                
                // WebP formatı
                formatHtml += '<div class="mb-2"><small class="text-muted d-block mb-1"><strong>WebP:</strong></small><div class="d-flex gap-1 flex-wrap">';
                srcsetWidths.forEach(w => {
                    const suffix = (w === width) ? '' : `-${w}`;
                    const fileUrl = `${basePath}/${fileName}${suffix}.webp`;
                    formatHtml += `<a href="${fileUrl}" target="_blank" class="btn btn-sm btn-success" style="font-size: 11px; padding: 2px 8px; text-decoration: none;" title="WebP ${w}w - Yeni sekmede aç">${w}w</a>`;
                });
                formatHtml += '</div></div>';
                
                // JPG formatı
                formatHtml += '<div class="mb-2"><small class="text-muted d-block mb-1"><strong>JPG:</strong></small><div class="d-flex gap-1 flex-wrap">';
                srcsetWidths.forEach(w => {
                    const suffix = (w === width) ? '' : `-${w}`;
                    const fileUrl = `${basePath}/${fileName}${suffix}.jpg`;
                    formatHtml += `<a href="${fileUrl}" target="_blank" class="btn btn-sm btn-warning text-dark" style="font-size: 11px; padding: 2px 8px; text-decoration: none;" title="JPG ${w}w - Yeni sekmede aç">${w}w</a>`;
                });
                formatHtml += '</div></div>';
                
                formatInfo.innerHTML = formatHtml;
            } else if (formatInfo) {
                // Width bilgisi yoksa format bilgisini gizle
                formatInfo.style.display = 'none';
            }
            
            // Picture etiketini göster
            previewPicture.style.display = 'block';
            previewPicture.style.visibility = 'visible';
            
            log('DEBUG', 'Preview picture güncellendi', {
                avif: avifUrl,
                webp: webpUrl,
                jpg: jpgUrl,
                path: imageData.path,
                fileName: fileName
            });
        } else {
            log('WARN', 'Preview picture elementi bulunamadı veya path yok', {
                previewPicture: !!previewPicture,
                path: imageData.path
            });
        }

        // Panel'i göster - önemli: display block yap ve visibility ayarla
        // Bootstrap class'larını da kontrol et
        panel.style.display = 'block';
        panel.style.visibility = 'visible';
        panel.classList.remove('d-none');
        panel.classList.add('d-block');

        // Tekli seçim modunda select butonunu göster, çoklu modda gösterme
        if (selectBtn) {
            if (currentMultipleMode) {
                selectBtn.style.display = 'none';
            } else {
                selectBtn.style.display = 'inline-block';
            }
        }

        // Panel görünürlüğünü zorla ayarla (çoklu seçim modunda da çalışsın)
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(panel);
            if (computedStyle.display === 'none' || panel.offsetHeight === 0) {
                log('WARN', 'Panel görünmüyor, zorla gösteriliyor', {
                    display: panel.style.display,
                    computedDisplay: computedStyle.display,
                    offsetHeight: panel.offsetHeight
                });
                panel.style.setProperty('display', 'block', 'important');
                panel.style.visibility = 'visible';
                panel.style.opacity = '1';
                panel.classList.remove('d-none');
                panel.classList.add('d-block');
            }
        }, 50);

        log('INFO', 'Image details panel gösterildi', {
            multipleMode: currentMultipleMode,
            panelDisplay: panel.style.display,
            panelVisibility: panel.style.visibility,
            panelOffsetHeight: panel.offsetHeight,
            panelComputedStyle: window.getComputedStyle(panel).display,
            panelClasses: panel.className
        });
    }

    // Resim düzenleme (eski fonksiyon - geriye uyumluluk için)
    window.editImage = function (id, folderPath, altText, title) {
        log('INFO', 'editImage çağrıldı (deprecated)', {
            id,
            folderPath,
            altText,
            title
        });
        // Grid'den resmi bul
        const imageItem = document.querySelector(`.image-item[data-id="${id}"]`);
        if (imageItem) {
            imageItem.click();
        } else {
            showImageDetails({
                id: id,
                path: folderPath,
                alt: altText || '',
                title: title || '',
                url: '',
                width: '',
                height: ''
            });
        }
    };

    // Resim güncelleme (sağ panelden)
    const updateImageBtn = document.getElementById('updateImageBtn');
    if (updateImageBtn) {
        log('INFO', 'Update image butonu bulundu, event listener ekleniyor');
        updateImageBtn.addEventListener('click', function () {
            log('INFO', 'Update image butonuna tıklandı');
            const id = document.getElementById('selectedImageId').value;
            const altText = document.getElementById('selectedImageAltText').value;
            const title = document.getElementById('selectedImageTitle').value;
            log('DEBUG', 'Form verileri alındı', {
                id,
                altText,
                title
            });

            if (!id) {
                log('WARN', 'Resim ID bulunamadı');
                showNotification('Resim seçilmedi', 'error');
                return;
            }

            log('INFO', 'Resim güncelleme API çağrısı yapılıyor', {
                id,
                url: `${API_BASE}/${id}`
            });
            fetch(`${API_BASE}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                    },
                    body: JSON.stringify({
                        alt_text: altText,
                        title: title
                    })
                })
                .then(response => {
                    log('INFO', 'Güncelleme API yanıtı alındı', {
                        status: response.status,
                        ok: response.ok
                    });
                    return response.json();
                })
                .then(data => {
                    log('INFO', 'Güncelleme API yanıtı parse edildi', {
                        success: data.success,
                        message: data.message
                    });
                    if (data.success) {
                        log('INFO', 'Resim başarıyla güncellendi, liste yenileniyor');
                        loadImages();
                        showNotification('Resim başarıyla güncellendi', 'success');
                    } else {
                        log('ERROR', 'Resim güncelleme başarısız', data);
                        showNotification(data.message || 'Resim güncellenirken hata oluştu', 'error');
                    }
                })
                .catch(error => {
                    log('ERROR', 'Resim güncellenirken hata oluştu', error);
                    showNotification('Resim güncellenirken hata oluştu', 'error');
                });
        });
    }

    // Seç butonu (sağ panelden)
    const selectImageBtn = document.getElementById('selectImageBtn');
    if (selectImageBtn) {
        // Çoklu seçim butonu
        const selectMultipleBtn = document.getElementById('selectMultipleImagesBtn');
        if (selectMultipleBtn) {
            selectMultipleBtn.addEventListener('click', function () {
                if (selectedImages.length === 0) {
                    showNotification('Lütfen en az bir resim seçin', 'warning');
                    return;
                }

                addMultipleImagesToInput();

                // Modal'ı kapat
                const modal = bootstrap.Modal.getInstance(document.getElementById('seoImageModal'));
                if (modal) {
                    modal.hide();
                }

                showNotification(`${selectedImages.length} resim seçildi`, 'success');
            });
        }

        // Tekli seçim butonu
        selectImageBtn.addEventListener('click', function () {
            log('INFO', 'Select image butonuna tıklandı');
            
            // Sağ panelden seçili resmi al
            const selectedImageId = document.getElementById('selectedImageId')?.value;
            if (!selectedImageId) {
                showNotification('Lütfen bir resim seçin', 'warning');
                return;
            }
            
            // Seçili resmin path'ini bul
            const selectedItem = document.querySelector(`.image-item[data-id="${selectedImageId}"]`);
            if (!selectedItem) {
                showNotification('Seçili resim bulunamadı', 'error');
                return;
            }
            
            const imagePath = selectedItem.dataset.path;
            if (!imagePath) {
                showNotification('Resim yolu bulunamadı', 'error');
                return;
            }
            
            // Şimdi seçimi yap
            selectedImagePath = imagePath;
            
            if (currentInputName) {
                const input = document.getElementById(currentInputName);
                if (input) {
                    input.value = selectedImagePath;
                    log('INFO', 'Input değeri güncellendi (Seç butonu ile)', {
                        value: selectedImagePath
                    });

                    // Preview'ı güncelle
                    const preview = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-preview img');
                    const removeBtn = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-remove-btn');

                    if (preview) {
                        const previewUrl = `/storage/${selectedImagePath}/${selectedImagePath.split('/').pop()}.jpg`;
                        preview.src = previewUrl;
                        preview.closest('.seo-image-preview').style.display = 'block';
                    }
                    if (removeBtn) {
                        removeBtn.style.display = 'inline-block';
                    }

                    // SEO Picture preview'ı güncelle
                    updateSeoPicturePreview(selectedImagePath);
                }
            }
            
            // Modal'ı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('seoImageModal'));
            if (modal) {
                modal.hide();
            }
            
            showNotification('Resim seçildi', 'success');
        });
    }

    // Srcset genişliklerini hesapla
    function calculateSrcsetWidths(width) {
        if (!width || width <= 0) {
            return [];
        }

        const widths = [];
        const breakpoints = [480, 768, 1200];

        breakpoints.forEach(bp => {
            if (bp <= width) {
                widths.push(bp);
            }
        });

        if (!widths.includes(width)) {
            widths.push(width);
        }

        if (width > 1200) {
            widths.push(1920);
        }

        return [...new Set(widths)].sort((a, b) => a - b);
    }

    // Sizes attribute hesapla
    function calculateSizes(width) {
        if (!width || width <= 0) {
            return null;
        }

        if (width <= 480) {
            return '100vw';
        } else if (width <= 768) {
            return `(max-width: 768px) 100vw, ${width}px`;
        } else if (width <= 1200) {
            return `(max-width: 768px) 100vw, (max-width: 1200px) 768px, ${width}px`;
        } else {
            return '(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1200px';
        }
    }

    // SEO Picture preview'ı güncelle
    function updateSeoPicturePreview(folderPath) {
        log('INFO', 'SEO Picture preview güncelleniyor', {
            path: folderPath
        });
        const previewDiv = document.getElementById('seoPicturePreview');
        if (!previewDiv) {
            log('WARN', 'SEO Picture preview div bulunamadı');
            return;
        }

        if (!folderPath) {
            previewDiv.innerHTML = '<p class="text-muted">Resim seçmek için yukarıdaki formu kullanın.</p>';
            return;
        }

        // API'den resim bilgilerini al
        fetch(API_BASE)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const image = data.data.find(img => img.folder_path === folderPath);
                    if (image) {
                        const alt = image.alt_text || '';
                        const baseUrl = `/storage/${image.folder_path}`;
                        const fileName = image.folder_path.split('/').pop();

                        // SEO uyumlu picture etiketi oluştur (Google'ın sevdiği format)
                        const width = image.width || 0;
                        const height = image.height || 0;
                        const safeAlt = alt.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

                        // Srcset genişliklerini hesapla
                        const srcsetWidths = calculateSrcsetWidths(width);
                        const sizes = calculateSizes(width);

                        // Srcset oluştur - orijinal genişlik için suffix ekleme
                        const buildSrcset = (extension, widths, originalWidth) => {
                            return widths.map(w => {
                                if (w === originalWidth) {
                                    return `${baseUrl}/${fileName}.${extension} ${w}w`;
                                } else {
                                    return `${baseUrl}/${fileName}-${w}.${extension} ${w}w`;
                                }
                            }).join(', ');
                        };

                        // AVIF srcset
                        const avifSrcset = buildSrcset('avif', srcsetWidths, width);
                        // WebP srcset
                        const webpSrcset = buildSrcset('webp', srcsetWidths, width);
                        // JPG srcset
                        const jpgSrcset = buildSrcset('jpg', srcsetWidths, width);

                        previewDiv.innerHTML = `
                            <picture>
                                <source srcset="${avifSrcset}" type="image/avif" ${sizes ? `sizes="${sizes}"` : ''} ${width ? `width="${width}" height="${height}"` : ''}>
                                <source srcset="${webpSrcset}" type="image/webp" ${sizes ? `sizes="${sizes}"` : ''} ${width ? `width="${width}" height="${height}"` : ''}>
                                <img src="${baseUrl}/${fileName}.jpg" 
                                     srcset="${jpgSrcset}"
                                     ${sizes ? `sizes="${sizes}"` : ''}
                                     alt="${safeAlt}" 
                                     ${width ? `width="${width}"` : ''} 
                                     ${height ? `height="${height}"` : ''} 
                                     loading="lazy"
                                     decoding="async"
                                     fetchpriority="low"
                                     class="img-fluid rounded">
                            </picture>
                            <p class="mt-2 text-muted"><small>Klasör yolu: ${folderPath}</small></p>
                        `;
                        log('INFO', 'SEO Picture preview güncellendi');
                    } else {
                        previewDiv.innerHTML = '<p class="text-danger">Resim bulunamadı.</p>';
                    }
                }
            })
            .catch(error => {
                log('ERROR', 'SEO Picture preview güncellenirken hata', error);
                previewDiv.innerHTML = '<p class="text-danger">Preview yüklenirken hata oluştu.</p>';
            });
    }

    // Input değiştiğinde SEO picture'ı güncelle (delegation ile)
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('seo-image-input')) {
            log('INFO', 'Image input değişti', {
                value: e.target.value
            });
            if (e.target.value) {
                updateSeoPicturePreview(e.target.value);
            } else {
                const previewDiv = document.getElementById('seoPicturePreview');
                if (previewDiv) {
                    previewDiv.innerHTML = '<p class="text-muted">Resim seçmek için yukarıdaki formu kullanın.</p>';
                }
            }
        }
    });

    // Clear all butonuna event listener ekle (delegation ile)
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('seo-image-clear-all-btn')) {
            clearAllSelectedImages();
            showNotification('Tüm seçimler temizlendi', 'info');
        }
    });

    // ============================================
    // OPTİMİZE SİLME POPOVER YÖNETİMİ
    // ============================================
    
    // Popover yönetimi için singleton
    const DeletePopoverManager = {
        currentImageId: null,
        currentEvent: null,
        outsideClickHandler: null,
        isInitialized: false,
        
        // Popover'ı başlat (sadece bir kez)
        init: function() {
            if (this.isInitialized) return;
            
            const popover = document.getElementById('deleteConfirmPopover');
            if (!popover) {
                log('ERROR', 'Delete confirm popover bulunamadı');
                return;
            }
            
            // Event delegation ile butonları yönet (dinamik elementler için)
            // İptal ve onay butonları için event delegation kullan
            document.addEventListener('click', (e) => {
                // İptal butonu
                if (e.target.id === 'cancelDeleteBtn' || e.target.closest('#cancelDeleteBtn')) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.hide();
                }
                
                // Onay butonu
                if (e.target.id === 'confirmDeleteBtn' || e.target.closest('#confirmDeleteBtn')) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // ID'yi kontrol et - önce currentImageId, sonra popover'dan, sonra selectedImageId input'undan
                    let imageId = this.currentImageId;
                    
                    if (!imageId) {
                        const popoverEl = document.getElementById('deleteConfirmPopover');
                        if (popoverEl && popoverEl.dataset.imageId) {
                            imageId = popoverEl.dataset.imageId;
                        }
                    }
                    
                    if (!imageId) {
                        const selectedImageIdInput = document.getElementById('selectedImageId');
                        if (selectedImageIdInput && selectedImageIdInput.value) {
                            imageId = selectedImageIdInput.value;
                        }
                    }
                    
                    // Hala yoksa, imageDetailsPanel'den al
                    if (!imageId) {
                        const imageDetailsPanel = document.getElementById('imageDetailsPanel');
                        if (imageDetailsPanel && imageDetailsPanel.dataset.imageId) {
                            imageId = imageDetailsPanel.dataset.imageId;
                        }
                    }
                    
                    // Son çare: seçili image item'dan al
                    if (!imageId) {
                        const selectedItem = document.querySelector('.image-item.selected');
                        if (selectedItem && selectedItem.dataset.id) {
                            imageId = selectedItem.dataset.id;
                        }
                    }
                    
                    if (imageId) {
                        log('INFO', 'Silme onaylandı', { imageId });
                        this.hide();
                        performDelete(imageId);
                    } else {
                        log('ERROR', 'Silme için ID bulunamadı', {
                            currentImageId: this.currentImageId,
                            popoverDataset: document.getElementById('deleteConfirmPopover')?.dataset.imageId,
                            selectedImageIdInput: document.getElementById('selectedImageId')?.value,
                            imageDetailsPanel: document.getElementById('imageDetailsPanel')?.dataset.imageId
                        });
                        showNotification('Resim ID bulunamadı', 'error');
                        this.hide();
                    }
                }
                
                // Sağ panelden silme butonu
                if (e.target.id === 'deleteSelectedImageBtn' || e.target.closest('#deleteSelectedImageBtn')) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // ID'yi birden fazla kaynaktan kontrol et
                    let imageId = null;
                    
                    // 1. selectedImageId input'undan
                    const selectedImageIdInput = document.getElementById('selectedImageId');
                    if (selectedImageIdInput && selectedImageIdInput.value) {
                        imageId = selectedImageIdInput.value;
                    }
                    
                    // 2. imageDetailsPanel'den
                    if (!imageId) {
                        const imageDetailsPanel = document.getElementById('imageDetailsPanel');
                        if (imageDetailsPanel && imageDetailsPanel.dataset.imageId) {
                            imageId = imageDetailsPanel.dataset.imageId;
                        }
                    }
                    
                    // 3. Seçili image item'dan
                    if (!imageId) {
                        const selectedItem = document.querySelector('.image-item.selected');
                        if (selectedItem && selectedItem.dataset.id) {
                            imageId = selectedItem.dataset.id;
                        }
                    }
                    
                    if (imageId) {
                        log('INFO', 'Sağ panelden silme butonuna tıklandı', { imageId });
                        this.show(imageId, e);
                    } else {
                        log('ERROR', 'Sağ panelden silme: Resim ID bulunamadı');
                        showNotification('Resim seçilmedi veya ID bulunamadı', 'warning');
                    }
                }
            });
            
            this.isInitialized = true;
            log('INFO', 'Delete popover manager başlatıldı');
        },
        
        // Popover'ı göster
        show: function(imageId, event) {
            const popover = document.getElementById('deleteConfirmPopover');
            if (!popover) {
                log('ERROR', 'Delete confirm popover bulunamadı');
                // Fallback: eski confirm kullan
                if (confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
                    performDelete(imageId);
                }
                return;
            }
            
            // Önceki event listener'ı temizle
            this.hide();
            
            // Yeni değerleri kaydet
            this.currentImageId = imageId;
            this.currentEvent = event;
            
            // Popover'ı sabit konuma yerleştir (en üstte ortada veya en altta sağda)
            this.positionPopover(event);
            
            // Popover'ı göster
            popover.style.display = 'block';
            popover.style.visibility = 'visible';
            popover.style.opacity = '1';
            popover.dataset.imageId = imageId;
            popover.classList.remove('d-none');
            popover.classList.add('d-block');
            
            // Dışarı tıklanınca kapat (event listener'ı kaydet)
            setTimeout(() => {
                this.attachOutsideClickHandler();
            }, 50);
            
            log('INFO', 'Delete popover gösterildi', { imageId });
        },
        
        // Popover'ı gizle
        hide: function() {
            const popover = document.getElementById('deleteConfirmPopover');
            if (popover) {
                popover.style.display = 'none';
                popover.style.visibility = 'hidden';
                popover.style.opacity = '0';
                popover.classList.remove('d-block');
                popover.classList.add('d-none');
                delete popover.dataset.imageId;
            }
            
            // Event listener'ı temizle
            if (this.outsideClickHandler) {
                document.removeEventListener('click', this.outsideClickHandler);
                this.outsideClickHandler = null;
            }
            
            // Değerleri temizle
            this.currentImageId = null;
            this.currentEvent = null;
            
            log('DEBUG', 'Delete popover gizlendi');
        },
        
        // Popover'ı konumlandır (sabit konum: en üstte ortada)
        positionPopover: function(event) {
            const popover = document.getElementById('deleteConfirmPopover');
            if (!popover) return;
            
            const modalContent = document.querySelector('#seoImageModal .modal-content');
            const modalRect = modalContent?.getBoundingClientRect();
            
            if (modalRect) {
                // Modal içinde - en üstte ortada
                popover.style.position = 'fixed';
                popover.style.top = '20px'; // En üstten 20px
                popover.style.left = '50%'; // Ortadan başla
                popover.style.transform = 'translateX(-50%)'; // Tam ortala
                popover.style.zIndex = '1070'; // Modal'ın üstünde
                popover.style.maxWidth = '400px';
                popover.style.width = 'auto';
            } else {
                // Modal dışında (sağ panelden) - en altta sağda
                popover.style.position = 'fixed';
                popover.style.bottom = '20px'; // En alttan 20px
                popover.style.right = '20px'; // Sağdan 20px
                popover.style.top = 'auto'; // Top'u sıfırla
                popover.style.left = 'auto'; // Left'i sıfırla
                popover.style.transform = 'none'; // Transform'u kaldır
                popover.style.zIndex = '1070';
                popover.style.maxWidth = '400px';
                popover.style.width = 'auto';
            }
        },
        
        // Dışarı tıklanınca kapat handler'ı ekle
        attachOutsideClickHandler: function() {
            // Önceki handler'ı temizle
            if (this.outsideClickHandler) {
                document.removeEventListener('click', this.outsideClickHandler);
            }
            
            const popover = document.getElementById('deleteConfirmPopover');
            if (!popover) return;
            
            this.outsideClickHandler = (e) => {
                // Popover içine veya silme butonuna tıklanmadıysa kapat
                if (!popover.contains(e.target) && 
                    !e.target.closest('.image-item-delete') && 
                    !e.target.closest('#deleteSelectedImageBtn')) {
                    this.hide();
                }
            };
            
            // Event listener'ı ekle (capture phase'de)
            setTimeout(() => {
                document.addEventListener('click', this.outsideClickHandler, true);
            }, 10);
        }
    };
    
    // Popover manager'ı başlat
    DeletePopoverManager.init();
    
    // Resim silme (grid'den)
    window.deleteImageFromGrid = function (id, event) {
        log('INFO', 'deleteImageFromGrid çağrıldı', { id });

        // Event'i durdur
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        // Popover manager ile göster
        DeletePopoverManager.show(id, event);
    };
    
    // Silme onay popover'ını göster (geriye uyumluluk için)
    function showDeleteConfirmPopover(imageId, event) {
        DeletePopoverManager.show(imageId, event);
    }

    // Silme işlemini gerçekleştir (optimize edilmiş)
    function performDelete(id) {
        if (!id) {
            log('ERROR', 'performDelete: ID bulunamadı');
            showNotification('Resim ID bulunamadı', 'error');
            return;
        }
        
        log('INFO', 'performDelete çağrıldı', { id });
        
        // Popover'ı kapat
        DeletePopoverManager.hide();
        
        // Loading state göster
        showNotification('Resim siliniyor...', 'info');
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
        if (!csrfToken) {
            log('ERROR', 'CSRF token bulunamadı');
            showNotification('Güvenlik hatası: CSRF token bulunamadı', 'error');
            return;
        }

        log('INFO', 'Resim silme API çağrısı yapılıyor', {
            id,
            url: `${API_BASE}/${id}`
        });
        
        fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                log('INFO', 'Silme API yanıtı alındı', {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response.json();
            })
            .then(data => {
                log('INFO', 'Silme API yanıtı parse edildi', {
                    success: data.success,
                    message: data.message
                });
                
                if (data.success) {
                    log('INFO', 'Resim başarıyla silindi, liste yenileniyor');
                    
                    // Sağ paneli gizle
                    const panel = document.getElementById('imageDetailsPanel');
                    if (panel) {
                        panel.style.display = 'none';
                        panel.style.visibility = 'hidden';
                    }
                    const selectBtn = document.getElementById('selectImageBtn');
                    if (selectBtn) {
                        selectBtn.style.display = 'none';
                    }
                    
                    // Seçim durumunu temizle
                    selectedImagePath = null;
                    
                    // Çoklu seçimden de kaldır (varsa)
                    selectedImages = selectedImages.filter(img => img.id != id);
                    updateSelectedCount();
                    
                    // Liste yenile
                    loadImages(true);
                    
                    showNotification('Resim başarıyla silindi', 'success');
                } else {
                    log('ERROR', 'Resim silme başarısız', data);
                    showNotification(data.message || 'Resim silinirken hata oluştu', 'error');
                }
            })
            .catch(error => {
                log('ERROR', 'Resim silinirken hata oluştu', {
                    error: error.message,
                    stack: error.stack
                });
                showNotification('Resim silinirken hata oluştu: ' + error.message, 'error');
            });
    }

    // Resim silme (sağ panelden) - Event delegation ile (zaten yukarıda tanımlı)
    // Bu kod artık gerekli değil, event delegation kullanılıyor

    // Eski deleteImage fonksiyonu (geriye uyumluluk için)
    window.deleteImage = function (id) {
        deleteImageFromGrid(id);
    };


    // Resim kaldırma butonu
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('seo-image-remove-btn')) {
            const wrapper = e.target.closest('.seo-image-input-wrapper');
            const input = wrapper.querySelector('.seo-image-input');
            const preview = wrapper.querySelector('.seo-image-preview');

            input.value = '';
            if (preview) {
                preview.style.display = 'none';
            }
            e.target.style.display = 'none';
        }
    });

    // Bildirim göster
    function showNotification(message, type) {
        // Basit bir bildirim sistemi (toastr veya başka bir kütüphane kullanılabilir)
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Modal'ı seç butonuna bağla
    const selectBtn = document.querySelector('.seo-image-select-btn');
    if (selectBtn) {
        selectBtn.addEventListener('click', function () {
            const modal = new bootstrap.Modal(document.getElementById('seoImageModal'));
            modal.show();
        });
    }

    // Modal kapatıldığında backdrop'u temizle
    const modalElement = document.getElementById('seoImageModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Backdrop'u manuel olarak temizle
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            // Body'den modal-open class'ını kaldır
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }
})();
