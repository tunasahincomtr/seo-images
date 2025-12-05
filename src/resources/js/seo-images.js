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
                selectedImages = []; // Seçimleri temizle
                currentPage = 1;
                searchQuery = '';
                const searchInput = document.getElementById('imageSearchInput');
                if (searchInput) {
                    searchInput.value = '';
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

                // Sağ paneli gizle
                const panel = document.getElementById('imageDetailsPanel');
                if (panel) {
                    panel.style.display = 'none';
                }
                const selectBtn = document.getElementById('selectImageBtn');
                if (selectBtn) {
                    selectBtn.style.display = 'none';
                }

                // Seçimi temizle
                document.querySelectorAll('.image-item').forEach(item => {
                    item.classList.remove('selected');
                });

                // Input değeri zaten güncellenmiş olabilir (çift tıklama ile)
                // Sadece preview ve SEO picture'ı güncelle
                if (selectedImagePath && currentInputName) {
                    log('INFO', 'Modal kapandı, preview ve SEO picture güncelleniyor', {
                        path: selectedImagePath,
                        inputName: currentInputName
                    });
                    const input = document.getElementById(currentInputName);
                    const preview = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-preview img');
                    const removeBtn = input?.closest('.seo-image-input-wrapper')?.querySelector('.seo-image-remove-btn');

                    if (input && !input.value) {
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

                    selectedImagePath = null;
                } else {
                    log('DEBUG', 'Seçilen resim yok veya input name yok');
                }
            });
        } else {
            log('ERROR', 'Modal elementi bulunamadı!');
        }
    }

    // Resimleri yükle
    function loadImages(reset = true) {
        log('INFO', 'loadImages çağrıldı', { reset, searchQuery, currentPage });
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

        log('INFO', 'API çağrısı yapılıyor', { url: url.toString() });

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
                    grid.innerHTML = '<div class="loading">Resim bulunamadı</div>';
                }
            })
            .catch(error => {
                log('ERROR', 'Resimler yüklenirken hata oluştu', error);
                grid.innerHTML = '<div class="loading">Hata oluştu: ' + error.message + '</div>';
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
            searchInput.addEventListener('input', function(e) {
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
            searchInput.addEventListener('keypress', function(e) {
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
            clearSearchBtn.addEventListener('click', function() {
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
            loadMoreBtn.addEventListener('click', function() {
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
            grid.innerHTML = '<div class="loading">Henüz resim yüklenmemiş</div>';
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
                       ${isSelected ? 'checked' : ''}
                       onchange="handleImageCheckboxChange(this)">
            ` : '';
            return `
            <div class="image-item ${multipleClass} ${selectedClass}" 
                 data-path="${image.folder_path}" 
                 data-id="${image.id}" 
                 data-alt="${safeAlt}" 
                 data-title="${safeTitle}"
                 data-url="${image.url}"
                 data-width="${image.width || ''}"
                 data-height="${image.height || ''}">
                ${checkbox}
                <img src="${image.url}" alt="${image.alt_text || ''}" loading="lazy">
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
                checkbox.addEventListener('change', function() {
                    handleImageCheckboxChange(this);
                });
            });
        }

        // Resim seçme - tek tıklama: sağ panel, çift tıklama: seç ve kapat (sadece tekli modda)
        if (!currentMultipleMode) {
            const imageItems = grid.querySelectorAll('.image-item');
            log('DEBUG', 'Resim item\'larına click event\'leri ekleniyor', {
                count: imageItems.length
            });

            // Her resim için click timer'ı sakla
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
                        width: this.dataset.width,
                        height: this.dataset.height
                    };

                    // Çift tıklama kontrolü
                    if (!clickTimers.has(itemId)) {
                        // İlk tıklama - sağ paneli göster
                        const timer = setTimeout(() => {
                            log('INFO', 'Resim seçildi (tek tıklama)', {
                                path: itemPath,
                                id: itemId
                            });
                            grid.querySelectorAll('.image-item').forEach(i => i.classList.remove('selected'));
                            const clickedItem = document.querySelector(`.image-item[data-id="${itemId}"]`);
                            if (clickedItem) {
                                clickedItem.classList.add('selected');
                            }
                            selectedImagePath = itemPath;

                            // Sağ paneli göster ve bilgileri doldur
                            showImageDetails(itemData);

                            log('DEBUG', 'Seçilen resim yolu güncellendi', {
                                path: selectedImagePath
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
        }
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
    window.handleImageCheckboxChange = function(checkbox) {
        const imageId = checkbox.dataset.id;
        const imagePath = checkbox.dataset.path;
        const imageItem = document.querySelector(`.image-item[data-id="${imageId}"]`);
        
        if (checkbox.checked) {
            // Resmi seçili listeye ekle (sıraya ekle)
            if (!selectedImages.some(img => img.id == imageId)) {
                const imageData = {
                    id: imageId,
                    path: imagePath,
                    alt: imageItem?.dataset.alt || '',
                    title: imageItem?.dataset.title || '',
                    url: imageItem?.dataset.url || '',
                    width: imageItem?.dataset.width || '',
                    height: imageItem?.dataset.height || ''
                };
                selectedImages.push(imageData);
                imageItem?.classList.add('selected');
                log('INFO', 'Resim seçime eklendi', { id: imageId });
            }
        } else {
            // Resmi seçili listeden çıkar
            selectedImages = selectedImages.filter(img => img.id != imageId);
            imageItem?.classList.remove('selected');
            log('INFO', 'Resim seçimden kaldırıldı', { id: imageId });
        }
        
        // Seçim sayısını güncelle
        updateSelectedCount();
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
            item.addEventListener('dragstart', function(e) {
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.outerHTML);
                e.dataTransfer.setData('text/plain', this.dataset.imageId);
            });
            
            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.classList.add('drag-over');
            });
            
            item.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', function(e) {
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
    window.removeSelectedImage = function(imageId) {
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
    window.clearAllSelectedImages = function() {
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
        reader.onload = function(e) {
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

        xhr.upload.addEventListener('progress', function(e) {
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

        xhr.addEventListener('load', function() {
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

        xhr.addEventListener('error', function() {
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
        log('INFO', 'showImageDetails çağrıldı', imageData);
        const panel = document.getElementById('imageDetailsPanel');
        const selectBtn = document.getElementById('selectImageBtn');

        if (!panel) {
            log('ERROR', 'Image details panel bulunamadı!');
            return;
        }

        // Panel bilgilerini doldur
        document.getElementById('selectedImageId').value = imageData.id;
        document.getElementById('selectedImageAltText').value = imageData.alt || '';
        document.getElementById('selectedImageTitle').value = imageData.title || '';
        document.getElementById('selectedImagePath').value = imageData.path || '';
        document.getElementById('selectedImageDimensions').value =
            (imageData.width && imageData.height) ? `${imageData.width} x ${imageData.height} px` : 'Bilinmiyor';

        const preview = document.getElementById('selectedImagePreview');
        if (preview && imageData.url) {
            preview.src = imageData.url;
        }

        // Panel'i göster
        panel.style.display = 'block';
        if (selectBtn) {
            selectBtn.style.display = 'inline-block';
        }

        log('INFO', 'Image details panel gösterildi');
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
            if (selectedImagePath && currentInputName) {
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
                    }
                    if (removeBtn) {
                        removeBtn.style.display = 'inline-block';
                    }

                    // SEO Picture preview'ı güncelle
                    updateSeoPicturePreview(selectedImagePath);
                }
                // Modal'ı kapat
                const modal = bootstrap.Modal.getInstance(document.getElementById('seoImageModal'));
                if (modal) {
                    modal.hide();
                }
            }
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

    // Resim silme (grid'den)
    window.deleteImageFromGrid = function (id, event) {
        log('INFO', 'deleteImageFromGrid çağrıldı', {
            id
        });
        
        // Event'i durdur
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        // Popover'ı göster
        showDeleteConfirmPopover(id, event);
    };
    
    // Silme onay popover'ını göster
    function showDeleteConfirmPopover(imageId, event) {
        const popover = document.getElementById('deleteConfirmPopover');
        if (!popover) {
            log('ERROR', 'Delete confirm popover bulunamadı');
            // Fallback: eski confirm kullan
            if (confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
                performDelete(imageId);
            }
            return;
        }
        
        // Popover'ı butonun yanına yerleştir
        if (event && event.target) {
            const button = event.target.closest('.image-item-delete');
            if (button) {
                const rect = button.getBoundingClientRect();
                const modalContent = document.querySelector('#seoImageModal .modal-content');
                const modalRect = modalContent?.getBoundingClientRect();
                
                if (modalRect) {
                    popover.style.top = (rect.top - modalRect.top + rect.height + 5) + 'px';
                    popover.style.left = (rect.left - modalRect.left) + 'px';
                } else {
                    popover.style.top = (rect.top + rect.height + 5) + 'px';
                    popover.style.left = rect.left + 'px';
                }
            }
        }
        
        // Popover'ı göster
        popover.style.display = 'block';
        popover.dataset.imageId = imageId;
        
        // İptal butonu
        const cancelBtn = document.getElementById('cancelDeleteBtn');
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                popover.style.display = 'none';
            };
        }
        
        // Onay butonu
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (confirmBtn) {
            confirmBtn.onclick = function() {
                popover.style.display = 'none';
                performDelete(imageId);
            };
        }
        
        // Dışarı tıklanınca kapat
        setTimeout(() => {
            const closeOnClickOutside = function(e) {
                if (!popover.contains(e.target) && !e.target.closest('.image-item-delete')) {
                    popover.style.display = 'none';
                    document.removeEventListener('click', closeOnClickOutside);
                }
            };
            document.addEventListener('click', closeOnClickOutside);
        }, 100);
    }
    
    // Silme işlemini gerçekleştir
    function performDelete(id) {
        log('INFO', 'performDelete çağrıldı', { id });
        
        log('INFO', 'Resim silme API çağrısı yapılıyor', {
            id,
            url: `${API_BASE}/${id}`
        });
        fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                }
            })
            .then(response => {
                log('INFO', 'Silme API yanıtı alındı', {
                    status: response.status,
                    ok: response.ok
                });
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
                    }
                    const selectBtn = document.getElementById('selectImageBtn');
                    if (selectBtn) {
                        selectBtn.style.display = 'none';
                    }
                    selectedImagePath = null;
                    loadImages(true);
                    showNotification('Resim başarıyla silindi', 'success');
                } else {
                    log('ERROR', 'Resim silme başarısız', data);
                    showNotification(data.message || 'Resim silinirken hata oluştu', 'error');
                }
            })
            .catch(error => {
                log('ERROR', 'Resim silinirken hata oluştu', error);
                showNotification('Resim silinirken hata oluştu', 'error');
            });
    }

    // Resim silme (sağ panelden)
    const deleteSelectedImageBtn = document.getElementById('deleteSelectedImageBtn');
    if (deleteSelectedImageBtn) {
        deleteSelectedImageBtn.addEventListener('click', function (e) {
            const id = document.getElementById('selectedImageId').value;
            if (id) {
                showDeleteConfirmPopover(id, e);
            } else {
                showNotification('Resim seçilmedi', 'error');
            }
        });
    }

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
