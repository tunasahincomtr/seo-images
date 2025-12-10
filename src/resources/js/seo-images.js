/**
 * SEO Images - Tamamen Bağımsız Resim Yönetim Sistemi
 * 
 * Bootstrap eklentilerine bağımlı değil - Kendi yazdığımız basit çözümler
 * - Kendi modal sistemi
 * - Basit notification sistemi
 * - Native confirm() ile silme onayı
 * - Event delegation ile dinamik elementler
 * 
 * @requires jQuery (sadece DOM manipülasyonu için)
 */

(function ($) {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        API_BASE: '/seo-images/images',
        PER_PAGE: 12,
        SEARCH_DELAY: 300,
        NOTIFICATION_DURATION: 3000
    };

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const State = {
        isModalOpen: false,
        currentInputName: null,
        currentMultipleMode: false,
        selectedImages: [],
        selectedImagePath: null,
        selectedImageId: null,
        allImages: [],
        currentPage: 1,
        hasMore: false,
        isLoading: false,
        searchQuery: ''
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    const Utils = {
        /**
         * Escape HTML
         */
        escapeHtml: function (text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Get CSRF token
         */
        getCsrfToken: function () {
            return $('meta[name="csrf-token"]').attr('content') || '';
        },

        /**
         * Show notification (kendi yazdığımız basit sistem)
         */
        showNotification: function (message, type) {
            type = type || 'info';
            const colors = {
                'success': '#28a745',
                'error': '#dc3545',
                'warning': '#ffc107',
                'info': '#17a2b8'
            };
            const color = colors[type] || colors.info;

            const $notification = $('<div>', {
                class: 'seo-image-notification',
                css: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: color,
                    color: '#fff',
                    padding: '15px 20px',
                    borderRadius: '5px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 10000,
                    minWidth: '300px',
                    maxWidth: '400px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                },
                text: message
            });

            $('body').append($notification);

            // Fade in
            $notification.hide().fadeIn(300);

            // Auto remove
            setTimeout(function () {
                $notification.fadeOut(300, function () {
                    $(this).remove();
                });
            }, CONFIG.NOTIFICATION_DURATION);
        },

        /**
         * Confirm dialog (native confirm kullanıyoruz)
         */
        confirm: function (message) {
            return window.confirm(message);
        }
    };

    // ============================================
    // MODAL SYSTEM (Kendi yazdığımız)
    // ============================================
    const Modal = {
        /**
         * Show modal
         */
        show: function () {
            const $modal = $('#seoImageModal');
            const $backdrop = $('<div>', {
                class: 'seo-image-modal-backdrop',
                css: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1040
                }
            });

            $('body').append($backdrop);
            $modal.css({
                display: 'block',
                zIndex: 1050
            }).addClass('show');

            // Fade in
            $backdrop.hide().fadeIn(200);
            $modal.hide().fadeIn(200);

            // Body scroll lock
            $('body').css('overflow', 'hidden');

            State.isModalOpen = true;
        },

        /**
         * Hide modal
         */
        hide: function () {
            const $modal = $('#seoImageModal');
            const $backdrop = $('.seo-image-modal-backdrop');

            $modal.fadeOut(200, function () {
                $(this).removeClass('show').css('display', 'none');
            });

            $backdrop.fadeOut(200, function () {
                $(this).remove();
            });

            $('body').css('overflow', '');
            State.isModalOpen = false;
        },

        /**
         * Initialize modal
         */
        init: function () {
            const self = this;

            // Close button
            $(document).on('click', '#seoImageModal .btn-close, #seoImageModal [data-dismiss="modal"]', function () {
                self.hide();
            });

            // Backdrop click
            $(document).on('click', '.seo-image-modal-backdrop', function () {
                self.hide();
            });

            // ESC key
            $(document).on('keydown', function (e) {
                if (e.key === 'Escape' && State.isModalOpen) {
                    self.hide();
                }
            });
        }
    };

    // ============================================
    // MODAL MANAGER
    // ============================================
    const ModalManager = {
        /**
         * Initialize
         */
        init: function () {
            const self = this;

            // Select button click - Event delegation
            $(document).on('click', '.seo-image-select-btn', function (e) {
                e.preventDefault();
                self.openModal($(this));
            });
        },

        /**
         * Open modal
         */
        openModal: function ($triggerBtn) {
            // Wrapper'ı bul
            const $wrapper = $triggerBtn.closest('.seo-image-input-wrapper');
            
            if ($wrapper.length === 0) {
                $wrapper = $('.seo-image-input-wrapper').first();
            }

            if ($wrapper.length > 0) {
                State.currentInputName = $wrapper.data('name');
                const multiple = $wrapper.data('multiple');
                State.currentMultipleMode = multiple === true || multiple === 'true';
            } else {
                State.currentMultipleMode = false;
                State.currentInputName = null;
            }

            // State'i temizle
            this.resetState();

            // UI'ı güncelle
            this.updateUI();
            this.clearSelections();

            // Resimleri yükle
            ImageManager.loadImages(true);

            // Modal'ı göster
            Modal.show();
        },

        /**
         * Reset state
         */
        resetState: function () {
            State.selectedImages = [];
            State.selectedImagePath = null;
            State.selectedImageId = null;
            State.currentPage = 1;
            State.searchQuery = '';
            State.hasMore = false;
        },

        /**
         * Update UI
         */
        updateUI: function () {
            if (State.currentMultipleMode) {
                $('#selectImageBtn').hide();
                $('#selectMultipleImagesBtn').show();
                $('#selectedCount').show();
            } else {
                $('#selectImageBtn').show();
                $('#selectMultipleImagesBtn').hide();
                $('#selectedCount').hide();
            }
            this.updateSelectedCount();
        },

        /**
         * Clear selections
         */
        clearSelections: function () {
            $('.image-item').removeClass('selected');
            $('.image-checkbox').prop('checked', false);
            $('#imageSearchInput').val('');
            $('#clearSearchBtn').hide();
            this.updateSelectedCount();
        },

        /**
         * Update selected count
         */
        updateSelectedCount: function () {
            const count = State.selectedImages.length;
            $('#selectedCount').text(count + ' seçili');
            $('#multipleCount').text(count);
            
            if (count > 0 && State.currentMultipleMode) {
                $('#selectedCount').show();
            } else {
                $('#selectedCount').hide();
            }
        },

        /**
         * Show details panel
         */
        showDetailsPanel: function () {
            $('#imageDetailsPanel').show();
        },

        /**
         * Hide details panel
         */
        hideDetailsPanel: function () {
            $('#imageDetailsPanel').hide();
        }
    };

    // ============================================
    // IMAGE MANAGER
    // ============================================
    const ImageManager = {
        /**
         * Load images
         */
        loadImages: function (reset) {
            if (State.isLoading) return;

            if (reset) {
                State.currentPage = 1;
                State.allImages = [];
                $('#imageGrid').html('<div class="loading">Yükleniyor...</div>');
            }

            State.isLoading = true;
            const self = this;

            $.ajax({
                url: CONFIG.API_BASE,
                method: 'GET',
                data: {
                    page: State.currentPage,
                    per_page: CONFIG.PER_PAGE,
                    search: State.searchQuery
                },
                success: function (response) {
                    State.isLoading = false;

                    if (response.success && response.data) {
                        if (reset) {
                            State.allImages = response.data;
                        } else {
                            State.allImages = State.allImages.concat(response.data);
                        }

                        State.hasMore = response.pagination && response.pagination.has_more;
                        self.renderImages();
                        self.updateLoadMoreButton();
                    } else {
                        Utils.showNotification('Resimler yüklenirken hata oluştu', 'error');
                        $('#imageGrid').html('<div class="empty-state"><p>Resim yüklenirken hata oluştu.</p></div>');
                    }
                },
                error: function (xhr) {
                    State.isLoading = false;
                    Utils.showNotification('Resimler yüklenirken hata oluştu', 'error');
                    $('#imageGrid').html('<div class="empty-state"><p>Resim yüklenirken hata oluştu.</p></div>');
                }
            });
        },

        /**
         * Render images
         */
        renderImages: function () {
            const $grid = $('#imageGrid');

            if (State.allImages.length === 0) {
                $grid.html('<div class="empty-state"><p>Henüz resim yok. Yüklemek için yukarıdaki alanı kullanın.</p></div>');
                return;
            }

            let html = '';
            State.allImages.forEach(function (image) {
                const isSelected = State.selectedImages.some(function (img) {
                    return img.id == image.id;
                });
                const multipleClass = State.currentMultipleMode ? 'multiple-mode' : '';
                const selectedClass = isSelected ? 'selected' : '';
                const checkbox = State.currentMultipleMode ? `
                    <input type="checkbox" class="image-checkbox" 
                           data-id="${image.id}" 
                           data-path="${image.folder_path}"
                           ${isSelected ? 'checked' : ''}>
                ` : '';

                const fileName = image.folder_path.split('/').pop();
                const basePath = `/storage/${image.folder_path}`;
                const width = image.width || 0;
                const height = image.height || 0;
                const safeAlt = Utils.escapeHtml(image.alt_text || '');
                const safeTitle = Utils.escapeHtml(image.title || '');

                const avifUrl = image.avif_url || `${basePath}/${fileName}.avif`;
                const webpUrl = image.webp_url || `${basePath}/${fileName}.webp`;
                const jpgUrl = image.url || `${basePath}/${fileName}.jpg`;

                html += `
                    <div class="image-item ${multipleClass} ${selectedClass}" 
                         data-id="${image.id}"
                         data-path="${image.folder_path}"
                         data-alt="${safeAlt}"
                         data-title="${safeTitle}"
                         data-url="${image.url || ''}"
                         data-webp-url="${image.webp_url || ''}"
                         data-avif-url="${image.avif_url || ''}"
                         data-width="${width}"
                         data-height="${height}">
                        ${checkbox}
                        <picture class="image-item-picture">
                            ${width > 0 ? `<source srcset="${avifUrl}" type="image/avif" width="${width}" height="${height}">` : ''}
                            ${width > 0 ? `<source srcset="${webpUrl}" type="image/webp" width="${width}" height="${height}">` : ''}
                            <img src="${jpgUrl}" 
                                 alt="${safeAlt}" 
                                 ${width > 0 ? `width="${width}" height="${height}"` : ''}
                                 loading="lazy" 
                                 decoding="async">
                        </picture>
                        <button class="image-item-delete" data-id="${image.id}" title="Resmi Sil" type="button">×</button>
                        <div class="image-item-info">${safeAlt || 'Alt etiketi yok'}</div>
                    </div>
                `;
            });

            $grid.html(html);
        },

        /**
         * Show image details
         */
        showImageDetails: function (imageData) {
            State.selectedImageId = imageData.id;

            const fileName = imageData.path.split('/').pop();
            const basePath = `/storage/${imageData.path}`;
            
            $('#selectedImagePreview').attr('src', `${basePath}/${fileName}.jpg`);
            $('#selectedImagePreviewAvif').attr('srcset', `${basePath}/${fileName}.avif`);
            $('#selectedImagePreviewWebp').attr('srcset', `${basePath}/${fileName}.webp`);
            $('#selectedImagePreviewPicture').show();

            $('#selectedImageId').val(imageData.id);
            $('#selectedImageAltText').val(imageData.alt);
            $('#selectedImageTitle').val(imageData.title);
            $('#selectedImagePath').val(imageData.path);
            $('#selectedImageDimensions').val(`${imageData.width || 0} x ${imageData.height || 0}`);

            let formatInfo = '<div class="small text-muted">';
            formatInfo += '<strong>Formatlar:</strong> JPG, WebP, AVIF<br>';
            if (imageData.width && imageData.height) {
                formatInfo += `<strong>Boyut:</strong> ${imageData.width} x ${imageData.height} px`;
            }
            formatInfo += '</div>';
            $('#imageFormatInfo').html(formatInfo).show();

            ModalManager.showDetailsPanel();
        },

        /**
         * Update image
         */
        updateImage: function () {
            const imageId = $('#selectedImageId').val();
            if (!imageId) {
                Utils.showNotification('Resim seçilmedi', 'warning');
                return;
            }

            const data = {
                alt_text: $('#selectedImageAltText').val(),
                title: $('#selectedImageTitle').val()
            };

            $.ajax({
                url: `${CONFIG.API_BASE}/${imageId}`,
                method: 'PUT',
                data: data,
                headers: {
                    'X-CSRF-TOKEN': Utils.getCsrfToken()
                },
                success: function (response) {
                    if (response.success) {
                        Utils.showNotification('Resim başarıyla güncellendi', 'success');
                        ImageManager.loadImages(true);
                    } else {
                        Utils.showNotification(response.message || 'Güncelleme başarısız', 'error');
                    }
                },
                error: function (xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message 
                        ? xhr.responseJSON.message 
                        : 'Resim güncellenirken hata oluştu';
                    Utils.showNotification(message, 'error');
                }
            });
        },

        /**
         * Delete image
         */
        deleteImage: function (imageId) {
            $.ajax({
                url: `${CONFIG.API_BASE}/${imageId}`,
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': Utils.getCsrfToken()
                },
                success: function (response) {
                    if (response.success) {
                        Utils.showNotification('Resim başarıyla silindi', 'success');
                        State.selectedImages = State.selectedImages.filter(function (img) {
                            return img.id != imageId;
                        });
                        if (State.selectedImageId == imageId) {
                            State.selectedImageId = null;
                            ModalManager.hideDetailsPanel();
                        }
                        ImageManager.loadImages(true);
                        ModalManager.updateSelectedCount();
                    } else {
                        Utils.showNotification(response.message || 'Silme başarısız', 'error');
                    }
                },
                error: function (xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message 
                        ? xhr.responseJSON.message 
                        : 'Resim silinirken hata oluştu';
                    Utils.showNotification(message, 'error');
                }
            });
        },

        /**
         * Update load more button
         */
        updateLoadMoreButton: function () {
            if (State.hasMore) {
                $('#loadMoreContainer').show();
                const remaining = State.allImages.length;
                $('#loadMoreBtn').text(`Daha Fazla Göster (${remaining})`);
            } else {
                $('#loadMoreContainer').hide();
            }
        }
    };

    // ============================================
    // UPLOAD MANAGER
    // ============================================
    const UploadManager = {
        /**
         * Initialize
         */
        init: function () {
            const self = this;
            const $uploadArea = $('#uploadArea');
            const $fileInput = $('#imageUpload');

            $uploadArea.on('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('dragover');
            });

            $uploadArea.on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('dragover');
            });

            $uploadArea.on('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('dragover');
                const files = e.originalEvent.dataTransfer.files;
                if (files.length > 0) {
                    self.handleFiles(files);
                }
            });

            $fileInput.on('change', function () {
                if (this.files.length > 0) {
                    self.handleFiles(this.files);
                }
            });

            $uploadArea.on('click', function (e) {
                if (!$(e.target).is('input')) {
                    $fileInput.click();
                }
            });
        },

        /**
         * Handle files
         */
        handleFiles: function (files) {
            const self = this;
            Array.from(files).forEach(function (file) {
                if (file.type.startsWith('image/')) {
                    self.uploadFile(file);
                } else {
                    Utils.showNotification(`${file.name} bir resim dosyası değil`, 'warning');
                }
            });
        },

        /**
         * Upload file
         */
        uploadFile: function (file) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('alt_text', '');
            formData.append('title', '');

            $.ajax({
                url: CONFIG.API_BASE,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-CSRF-TOKEN': Utils.getCsrfToken()
                },
                success: function (response) {
                    if (response.success) {
                        Utils.showNotification('Resim başarıyla yüklendi', 'success');
                        ImageManager.loadImages(true);
                    } else {
                        Utils.showNotification(response.message || 'Yükleme başarısız', 'error');
                    }
                },
                error: function (xhr) {
                    const message = xhr.responseJSON && xhr.responseJSON.message 
                        ? xhr.responseJSON.message 
                        : 'Resim yüklenirken hata oluştu';
                    Utils.showNotification(message, 'error');
                }
            });
        }
    };

    // ============================================
    // SEARCH MANAGER
    // ============================================
    const SearchManager = {
        /**
         * Initialize
         */
        init: function () {
            let searchTimeout;

            $('#imageSearchInput').on('input', function () {
                const query = $(this).val().trim();
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function () {
                    State.searchQuery = query;
                    State.currentPage = 1;
                    $('#clearSearchBtn').toggle(query.length > 0);
                    ImageManager.loadImages(true);
                }, CONFIG.SEARCH_DELAY);
            });

            $('#clearSearchBtn').on('click', function () {
                $('#imageSearchInput').val('');
                State.searchQuery = '';
                State.currentPage = 1;
                $(this).hide();
                ImageManager.loadImages(true);
            });
        }
    };

    // ============================================
    // SELECTION MANAGER
    // ============================================
    const SelectionManager = {
        /**
         * Select single image
         */
        selectSingleImage: function () {
            if (!State.selectedImagePath) {
                Utils.showNotification('Lütfen bir resim seçin', 'warning');
                return;
            }

            const $wrapper = $(`.seo-image-input-wrapper[data-name="${State.currentInputName}"]`);
            if ($wrapper.length === 0) {
                Utils.showNotification('Input wrapper bulunamadı', 'error');
                return;
            }

            const $input = $wrapper.find('.seo-image-input');
            if ($input.length > 0) {
                $input.val(State.selectedImagePath);
                
                const $preview = $wrapper.find('.seo-image-preview');
                const $previewImg = $preview.find('img');
                const fileName = State.selectedImagePath.split('/').pop();
                $previewImg.attr('src', `/storage/${State.selectedImagePath}/${fileName}.jpg`);
                $preview.show();
                
                $wrapper.find('.seo-image-remove-btn').show();
            }

            Modal.hide();
            Utils.showNotification('Resim seçildi', 'success');
        },

        /**
         * Select multiple images
         */
        selectMultipleImages: function () {
            if (State.selectedImages.length === 0) {
                Utils.showNotification('Lütfen en az bir resim seçin', 'warning');
                return;
            }

            const $wrapper = $(`.seo-image-input-wrapper[data-name="${State.currentInputName}"]`);
            if ($wrapper.length === 0) {
                Utils.showNotification('Input wrapper bulunamadı', 'error');
                return;
            }

            const $inputsDiv = $wrapper.find('.seo-image-multiple-inputs');
            const $selectedList = $wrapper.find('.seo-image-selected-list');
            const $sortable = $wrapper.find('.selected-images-sortable');
            const $clearBtn = $wrapper.find('.seo-image-clear-all-btn');

            $inputsDiv.empty();
            $sortable.empty();

            State.selectedImages.forEach(function (image, index) {
                const $input = $('<input>', {
                    type: 'hidden',
                    name: `${State.currentInputName}[${index}]`,
                    value: image.path,
                    'data-image-id': image.id,
                    'data-index': index
                });
                $inputsDiv.append($input);

                const fileName = image.path.split('/').pop();
                const previewUrl = `/storage/${image.path}/${fileName}.jpg`;
                const $previewItem = $(`
                    <div class="selected-image-item" data-image-id="${image.id}" data-index="${index}" draggable="true">
                        <span class="drag-handle" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; cursor: move;">⋮⋮</span>
                        <img src="${previewUrl}" alt="${Utils.escapeHtml(image.alt)}" style="width: 100%; height: 120px; object-fit: cover;">
                        <button type="button" class="remove-btn" data-image-id="${image.id}" title="Kaldır">×</button>
                    </div>
                `);
                $sortable.append($previewItem);
            });

            SortableManager.init($sortable[0]);

            $sortable.off('click', '.remove-btn').on('click', '.remove-btn', function () {
                const imageId = $(this).data('image-id');
                SelectionManager.removeSelectedImage(imageId);
            });

            $selectedList.show();
            $clearBtn.show();

            Modal.hide();
            Utils.showNotification(`${State.selectedImages.length} resim seçildi`, 'success');
        },

        /**
         * Remove selected image
         */
        removeSelectedImage: function (imageId) {
            State.selectedImages = State.selectedImages.filter(function (img) {
                return img.id != imageId;
            });
            
            $(`.image-item[data-id="${imageId}"]`).removeClass('selected');
            $(`.image-checkbox[data-id="${imageId}"]`).prop('checked', false);
            
            if (State.currentMultipleMode) {
                const $wrapper = $(`.seo-image-input-wrapper[data-name="${State.currentInputName}"]`);
                if ($wrapper.length > 0) {
                    const $inputsDiv = $wrapper.find('.seo-image-multiple-inputs');
                    const $sortable = $wrapper.find('.selected-images-sortable');
                    
                    $inputsDiv.empty();
                    $sortable.empty();
                    
                    if (State.selectedImages.length > 0) {
                        this.selectMultipleImages();
                    } else {
                        $wrapper.find('.seo-image-selected-list').hide();
                        $wrapper.find('.seo-image-clear-all-btn').hide();
                    }
                }
            }
            
            ModalManager.updateSelectedCount();
        },

        /**
         * Clear all selected
         */
        clearAllSelected: function () {
            State.selectedImages = [];
            $('.image-item').removeClass('selected');
            $('.image-checkbox').prop('checked', false);
            
            const $wrapper = $(`.seo-image-input-wrapper[data-name="${State.currentInputName}"]`);
            if ($wrapper.length > 0) {
                $wrapper.find('.seo-image-multiple-inputs').empty();
                $wrapper.find('.selected-images-sortable').empty();
                $wrapper.find('.seo-image-selected-list').hide();
                $wrapper.find('.seo-image-clear-all-btn').hide();
            }
            
            ModalManager.updateSelectedCount();
            Utils.showNotification('Tüm seçimler temizlendi', 'info');
        }
    };

    // ============================================
    // SORTABLE MANAGER
    // ============================================
    const SortableManager = {
        /**
         * Initialize sortable
         */
        init: function (container) {
            if (!container) return;
            
            const $container = $(container);
            const items = $container.find('.selected-image-item');
            
            items.each(function () {
                const $item = $(this);
                
                $item.off('dragstart dragend dragover dragleave drop');
                
                $item.on('dragstart', function (e) {
                    $(this).addClass('dragging');
                    e.originalEvent.dataTransfer.effectAllowed = 'move';
                    e.originalEvent.dataTransfer.setData('text/plain', $(this).data('image-id'));
                });
                
                $item.on('dragend', function () {
                    $(this).removeClass('dragging');
                });
                
                $item.on('dragover', function (e) {
                    e.preventDefault();
                    e.originalEvent.dataTransfer.dropEffect = 'move';
                    $(this).addClass('drag-over');
                });
                
                $item.on('dragleave', function () {
                    $(this).removeClass('drag-over');
                });
                
                $item.on('drop', function (e) {
                    e.preventDefault();
                    $(this).removeClass('drag-over');
                    
                    const draggedId = e.originalEvent.dataTransfer.getData('text/plain');
                    const $draggedItem = $container.find(`[data-image-id="${draggedId}"]`);
                    const draggedIndex = parseInt($draggedItem.data('index') || 0);
                    const targetIndex = parseInt($(this).data('index') || 0);
                    
                    if ($draggedItem.length && draggedIndex !== targetIndex) {
                        const draggedImage = State.selectedImages[draggedIndex];
                        State.selectedImages.splice(draggedIndex, 1);
                        State.selectedImages.splice(targetIndex, 0, draggedImage);
                        
                        SelectionManager.selectMultipleImages();
                    }
                });
            });
        }
    };

    // ============================================
    // EVENT HANDLERS
    // ============================================
    const EventHandlers = {
        /**
         * Initialize all event handlers
         */
        init: function () {
            const self = this;

            // Load More
            $('#loadMoreBtn').on('click', function () {
                State.currentPage++;
                ImageManager.loadImages(false);
            });

            // Select Buttons
            $('#selectImageBtn').on('click', function () {
                SelectionManager.selectSingleImage();
            });

            $('#selectMultipleImagesBtn').on('click', function () {
                SelectionManager.selectMultipleImages();
            });

            // Update Image
            $('#updateImageBtn').on('click', function () {
                ImageManager.updateImage();
            });

            // Delete Image - Native confirm kullanıyoruz
            $('#deleteSelectedImageBtn').on('click', function () {
                const imageId = $('#selectedImageId').val();
                if (imageId) {
                    if (Utils.confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
                        ImageManager.deleteImage(imageId);
                    }
                }
            });

            // Image item click - Event delegation
            $(document).on('click', '.image-item', function (e) {
                if ($(e.target).closest('.image-item-delete, .image-checkbox').length) {
                    return;
                }

                const $item = $(this);
                const imageData = {
                    id: $item.data('id'),
                    path: $item.data('path'),
                    alt: $item.data('alt') || '',
                    title: $item.data('title') || '',
                    url: $item.data('url') || '',
                    webp_url: $item.data('webp-url') || '',
                    avif_url: $item.data('avif-url') || '',
                    width: $item.data('width') || '',
                    height: $item.data('height') || ''
                };

                if (State.currentMultipleMode) {
                    ImageManager.showImageDetails(imageData);
                } else {
                    $('.image-item').removeClass('selected');
                    $item.addClass('selected');
                    State.selectedImageId = imageData.id;
                    State.selectedImagePath = imageData.path;
                    ImageManager.showImageDetails(imageData);
                    $('#selectImageBtn').show();
                }
            });

            // Checkbox change - Event delegation
            $(document).on('change', '.image-checkbox', function () {
                if (!State.currentMultipleMode) {
                    $(this).prop('checked', false);
                    return;
                }

                const $checkbox = $(this);
                const imageId = $checkbox.data('id');
                const imagePath = $checkbox.data('path');
                const $item = $checkbox.closest('.image-item');
                
                const imageData = {
                    id: imageId,
                    path: imagePath,
                    alt: $item.data('alt') || '',
                    title: $item.data('title') || '',
                    url: $item.data('url') || '',
                    webp_url: $item.data('webp-url') || '',
                    avif_url: $item.data('avif-url') || '',
                    width: $item.data('width') || '',
                    height: $item.data('height') || ''
                };

                if ($checkbox.is(':checked')) {
                    if (!State.selectedImages.some(function (img) { return img.id == imageId; })) {
                        State.selectedImages.push(imageData);
                        $item.addClass('selected');
                    }
                } else {
                    State.selectedImages = State.selectedImages.filter(function (img) {
                        return img.id != imageId;
                    });
                    $item.removeClass('selected');
                }

                ModalManager.updateSelectedCount();
            });

            // Delete button - Event delegation
            $(document).on('click', '.image-item-delete', function (e) {
                e.stopPropagation();
                const imageId = $(this).data('id');
                if (Utils.confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
                    ImageManager.deleteImage(imageId);
                }
            });

            // Clear All - Event delegation
            $(document).on('click', '.seo-image-clear-all-btn', function () {
                SelectionManager.clearAllSelected();
            });

            // Remove Single Image - Event delegation
            $(document).on('click', '.seo-image-remove-btn', function () {
                const $wrapper = $(this).closest('.seo-image-input-wrapper');
                const $input = $wrapper.find('.seo-image-input');
                $input.val('');
                $wrapper.find('.seo-image-preview').hide();
                $(this).hide();
            });
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    $(document).ready(function () {
        // jQuery kontrolü
        if (typeof $ === 'undefined') {
            console.error('SEO Images: jQuery yüklenmemiş!');
            return;
        }

        // Manager'ları başlat
        Modal.init();
        ModalManager.init();
        UploadManager.init();
        SearchManager.init();
        EventHandlers.init();
    });

})(jQuery);
