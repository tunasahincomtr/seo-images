/**
 * SeoImagesManager - Laravel SEO Images Package
 * Tam çalışan, eksiksiz frontend yönetim sistemi
 */
(function(window, $) {
    'use strict';

    window.SeoImagesManager = {
        // State
        currentInputName: null,
        currentMode: 'single',
        selectedImageId: null,
        selectedImageIds: [],
        currentPage: 1,
        isLoading: false,
        modal: null,
        currentImageDetail: null,

        /**
         * Initialize the manager
         */
        init: function() {
            var self = this;

            // Check if jQuery is loaded
            if (typeof $ === 'undefined') {
                console.error('SeoImagesManager: jQuery is required');
                return;
            }

            // Check if Bootstrap is loaded
            if (typeof bootstrap === 'undefined') {
                console.error('SeoImagesManager: Bootstrap 5 is required');
                return;
            }

            // Wait for DOM ready
            $(document).ready(function() {
                // Check if modal exists
                var modalElement = document.getElementById('seo-images-modal');
                if (!modalElement) {
                    console.error('SeoImagesManager: Modal element not found. Make sure to include the modal view.');
                    return;
                }

                // Initialize Bootstrap modal
                self.modal = new bootstrap.Modal(modalElement, {
                    backdrop: true,
                    keyboard: true
                });

                // Bind events (delegated)
                self.bindEvents();

                // Initialize dropzone
                self.initDropzone();

                console.log('SeoImagesManager initialized');
            });
        },

        /**
         * Bind all events
         */
        bindEvents: function() {
            var self = this;

            // Open modal button (delegated)
            $(document).on('click', '[data-seoinput-open]', function(e) {
                e.preventDefault();
                var $btn = $(this);
                self.currentInputName = $btn.data('input-name');
                self.currentMode = $btn.data('mode') || 'single';
                
                // Load current value from hidden input
                var $hiddenInput = $('input[name="' + self.currentInputName + '"]');
                if (self.currentMode === 'multiple') {
                    try {
                        var value = $hiddenInput.val();
                        self.selectedImageIds = value ? JSON.parse(value) : [];
                    } catch (e) {
                        self.selectedImageIds = [];
                    }
                } else {
                    var value = $hiddenInput.val();
                    self.selectedImageId = value || null;
                }

                // Reset selection
                self.selectedImageId = null;
                if (self.currentMode === 'single') {
                    self.selectedImageIds = [];
                }

                // Open modal
                self.openModal();
            });

            // Image selection (single mode - double click - immediate apply)
            $(document).on('dblclick', '#seo-images-grid .seo-image-item', function() {
                if (self.currentMode === 'single') {
                    var imageId = $(this).data('image-id');
                    self.selectImage(imageId);
                    self.applySelection();
                }
            });

            // Image selection (single mode - single click - select and show detail)
            $(document).on('click', '#seo-images-grid .seo-image-item', function() {
                if (self.currentMode === 'single') {
                    var imageId = $(this).data('image-id');
                    self.selectImage(imageId);
                    self.showImageDetail(imageId);
                } else {
                    // Multiple mode - just show detail
                    var imageId = $(this).data('image-id');
                    self.showImageDetail(imageId);
                }
            });

            // Checkbox selection (multiple mode)
            $(document).on('change', '#seo-images-grid .seo-image-checkbox', function() {
                var imageId = parseInt($(this).val());
                var isChecked = $(this).is(':checked');
                
                if (isChecked) {
                    if (self.selectedImageIds.indexOf(imageId) === -1) {
                        self.selectedImageIds.push(imageId);
                    }
                } else {
                    self.selectedImageIds = self.selectedImageIds.filter(function(id) {
                        return id !== imageId;
                    });
                }
                
                self.updateSelectionUI();
            });

            // Apply selection button
            $(document).on('click', '#seo-images-apply-selection', function() {
                self.applySelection();
            });

            // Upload button
            $(document).on('click', '#seo-images-upload-btn', function() {
                $('#seo-images-file-input').click();
            });

            // File input change
            $(document).on('change', '#seo-images-file-input', function() {
                var files = this.files;
                if (files.length > 0) {
                    // Upload all selected files
                    self.uploadFiles(Array.from(files));
                }
            });

            // Add selected button (single mode)
            $(document).on('click', '#seo-images-add-selected', function() {
                if (self.currentMode === 'single' && self.selectedImageId) {
                    self.applySelection();
                }
            });

            // Save meta button
            $(document).on('click', '#seo-images-save-meta', function() {
                self.saveMeta();
            });

            // Delete image button
            $(document).on('click', '#seo-images-delete-btn', function() {
                if (confirm('Bu görseli silmek istediğinize emin misiniz?')) {
                    self.deleteImage();
                }
            });

            // Pagination
            $(document).on('click', '#seo-images-pagination .seo-page-btn', function(e) {
                e.preventDefault();
                var page = $(this).data('page');
                if (page) {
                    self.loadPage(page);
                }
            });

            // Search
            $(document).on('keyup', '#seo-images-search', function() {
                var searchTerm = $(this).val();
                clearTimeout(self.searchTimeout);
                self.searchTimeout = setTimeout(function() {
                    self.currentPage = 1;
                    self.loadPage(1, searchTerm);
                }, 500);
            });

            // Modal events
            $('#seo-images-modal').on('hidden.bs.modal', function() {
                self.resetState();
            });

            // Tab switching
            $(document).on('click', '#seo-images-modal .nav-link', function() {
                var tab = $(this).data('tab');
                if (tab === 'upload') {
                    // Reset file input when switching to upload tab
                    $('#seo-images-file-input').val('');
                }
            });

            // Remove gallery item
            $(document).on('click', '.seo-remove-gallery-item', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var $button = $(this);
                var $item = $button.closest('.seo-gallery-item');
                var folderPath = $button.data('folder-path');
                
                if (!folderPath) {
                    console.error('Folder path not found');
                    return;
                }
                
                // Find the input
                var $hiddenInput = null;
                var $wrapper = $item.closest('.seo-input-wrapper');
                
                if ($wrapper.length > 0) {
                    // Find input in the same wrapper
                    var inputName = $wrapper.data('input-name');
                    if (inputName) {
                        $hiddenInput = $('input[name="' + inputName + '"]');
                    } else {
                        $hiddenInput = $wrapper.find('input[type="hidden"]').first();
                    }
                }
                
                // Fallback: try currentInputName
                if (($hiddenInput.length === 0 || !$hiddenInput.val()) && self.currentInputName) {
                    $hiddenInput = $('input[name="' + self.currentInputName + '"]');
                }
                
                if ($hiddenInput.length === 0) {
                    console.error('Hidden input not found for removal');
                    return;
                }
                
                try {
                    var currentValue = $hiddenInput.val() || '[]';
                    var folderPaths = JSON.parse(currentValue);
                    
                    if (!Array.isArray(folderPaths)) {
                        folderPaths = [];
                    }
                    
                    // Remove the folder path
                    folderPaths = folderPaths.filter(function(path) {
                        return path !== folderPath;
                    });
                    
                    // Update hidden input
                    $hiddenInput.val(JSON.stringify(folderPaths));
                    
                    // Remove item from DOM
                    $item.fadeOut(200, function() {
                        $(this).remove();
                    });
                } catch (e) {
                    console.error('Error removing gallery item:', e);
                    alert('Görsel silinirken bir hata oluştu.');
                }
            });
        },

        /**
         * Initialize dropzone
         */
        initDropzone: function() {
            var self = this;
            var dropzone = document.getElementById('seo-images-dropzone');

            if (!dropzone) return;

            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
                dropzone.addEventListener(eventName, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            // Highlight dropzone
            ['dragenter', 'dragover'].forEach(function(eventName) {
                dropzone.addEventListener(eventName, function() {
                    dropzone.classList.add('seo-dropzone-active');
                });
            });

            ['dragleave', 'drop'].forEach(function(eventName) {
                dropzone.addEventListener(eventName, function() {
                    dropzone.classList.remove('seo-dropzone-active');
                });
            });

            // Handle drop
            dropzone.addEventListener('drop', function(e) {
                var files = e.dataTransfer.files;
                if (files.length > 0) {
                    // Upload all dropped files
                    self.uploadFiles(Array.from(files));
                }
            });
        },

        /**
         * Open modal
         */
        openModal: function() {
            var self = this;
            
            if (!self.modal) {
                console.error('Modal not initialized');
                return;
            }

            // Reset UI
            $('#seo-images-grid').html('<div class="text-center p-4"><div class="spinner-border" role="status"></div></div>');
            $('#seo-images-detail-panel').html('');
            $('#seo-images-apply-selection').prop('disabled', true);

            // Load first page
            self.loadPage(1);

            // Show modal
            self.modal.show();
        },

        /**
         * Load page
         */
        loadPage: function(page, search) {
            var self = this;
            self.currentPage = page;
            self.isLoading = true;

            $.ajax({
                url: '/seo-images/list',
                method: 'GET',
                data: {
                    page: page,
                    per_page: 9,
                    search: search || ''
                },
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function(response) {
                    self.renderGrid(response.data);
                    self.renderPagination(response.meta);
                    self.updateSelectionUI();
                    self.isLoading = false;
                },
                error: function(xhr) {
                    console.error('Error loading images:', xhr);
                    $('#seo-images-grid').html('<div class="alert alert-danger">Görseller yüklenirken bir hata oluştu.</div>');
                    self.isLoading = false;
                }
            });
        },

        /**
         * Render image grid
         */
        renderGrid: function(images) {
            var self = this;
            var html = '<div class="row g-3">';

            if (images.length === 0) {
                html = '<div class="col-12 text-center p-4">Görsel bulunamadı.</div>';
            } else {
                images.forEach(function(image) {
                    var isSelected = false;
                    if (self.currentMode === 'single') {
                        isSelected = self.selectedImageId === image.id;
                    } else {
                        isSelected = self.selectedImageIds.indexOf(image.id) !== -1;
                    }

                    html += '<div class="col-md-4">';
                    html += '<div class="seo-image-item card h-100' + (isSelected ? ' selected' : '') + '" data-image-id="' + image.id + '">';
                    
                    if (self.currentMode === 'multiple') {
                        html += '<div class="form-check position-absolute top-0 start-0 m-2">';
                        html += '<input class="form-check-input seo-image-checkbox" type="checkbox" value="' + image.id + '" ' + (isSelected ? 'checked' : '') + '>';
                        html += '</div>';
                    }
                    
                    html += '<img src="' + image.preview_url + '" class="card-img-top" alt="' + (image.alt || '') + '">';
                    html += '<div class="card-body p-2">';
                    html += '<small class="text-muted">' + (image.basename || '') + '</small>';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                });
            }

            html += '</div>';
            $('#seo-images-grid').html(html);
        },

        /**
         * Render pagination (simplified)
         */
        renderPagination: function(meta) {
            if (meta.last_page <= 1) {
                $('#seo-images-pagination').html('');
                return;
            }
            
            var html = '<div class="d-flex justify-content-center align-items-center gap-2 mt-3">';
            
            // Previous button
            if (meta.current_page > 1) {
                html += '<button type="button" class="btn btn-sm btn-outline-secondary seo-page-btn" data-page="' + (meta.current_page - 1) + '">';
                html += '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';
                html += '</button>';
            } else {
                html += '<button type="button" class="btn btn-sm btn-outline-secondary" disabled>';
                html += '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';
                html += '</button>';
            }
            
            // Page info (simplified)
            html += '<span class="text-muted small">Sayfa <strong>' + meta.current_page + '</strong> / ' + meta.last_page + '</span>';
            
            // Next button
            if (meta.current_page < meta.last_page) {
                html += '<button type="button" class="btn btn-sm btn-outline-secondary seo-page-btn" data-page="' + (meta.current_page + 1) + '">';
                html += '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';
                html += '</button>';
            } else {
                html += '<button type="button" class="btn btn-sm btn-outline-secondary" disabled>';
                html += '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';
                html += '</button>';
            }
            
            html += '</div>';
            $('#seo-images-pagination').html(html);
        },

        /**
         * Show image detail
         */
        showImageDetail: function(imageId) {
            var self = this;
            
            // Find image in current grid
            var $item = $('#seo-images-grid .seo-image-item[data-image-id="' + imageId + '"]');
            if ($item.length === 0) {
                // Load from API
                $.ajax({
                    url: '/seo-images/list',
                    method: 'GET',
                    data: { per_page: 100 },
                    success: function(response) {
                        var image = response.data.find(function(img) {
                            return img.id === imageId;
                        });
                        if (image) {
                            self.renderImageDetail(image);
                        }
                    }
                });
                return;
            }

            // Get image data from list
            self.loadPage(self.currentPage);
            
            // For now, we'll load from the list endpoint
            $.ajax({
                url: '/seo-images/list',
                method: 'GET',
                data: { per_page: 100 },
                success: function(response) {
                    var image = response.data.find(function(img) {
                        return img.id === imageId;
                    });
                    if (image) {
                        self.renderImageDetail(image);
                        self.currentImageDetail = image;
                    }
                }
            });
        },

        /**
         * Render image detail panel
         */
        renderImageDetail: function(image) {
            var html = '<div class="seo-image-detail">';
            
            // Preview image
            html += '<div class="mb-3 text-center">';
            html += '<img src="' + image.preview_url + '" class="img-fluid rounded shadow-sm" alt="' + (image.alt || '') + '" style="max-height: 300px;">';
            html += '</div>';
            
            // Meta fields
            html += '<div class="mb-3">';
            html += '<label class="form-label fw-bold">Alt Text</label>';
            html += '<input type="text" class="form-control" id="seo-image-alt" value="' + (image.alt || '') + '" placeholder="Görsel açıklaması">';
            html += '</div>';
            html += '<div class="mb-3">';
            html += '<label class="form-label fw-bold">Title</label>';
            html += '<input type="text" class="form-control" id="seo-image-title" value="' + (image.title || '') + '" placeholder="Görsel başlığı">';
            html += '</div>';
            
            // Image info
            html += '<div class="mb-3 p-2 bg-light rounded">';
            html += '<small class="text-muted d-block">Boyut: <strong>' + (image.width || 0) + ' x ' + (image.height || 0) + ' px</strong></small>';
            html += '<small class="text-muted d-block">Dosya: <strong>' + (image.basename || '') + '</strong></small>';
            html += '</div>';
            
            // Formats and variations
            if (image.formats && image.formats.length > 0) {
                html += '<div class="mb-3">';
                html += '<label class="form-label fw-bold mb-2">Formatlar ve Varyasyonlar</label>';
                html += '<div class="seo-formats-container">';
                
                image.formats.forEach(function(formatData) {
                    if (!formatData.original.exists && formatData.sizes.length === 0) {
                        return; // Skip if format doesn't exist
                    }
                    
                    html += '<div class="seo-format-group mb-3 p-3 border rounded">';
                    html += '<div class="d-flex align-items-center mb-2">';
                    html += '<span class="badge bg-secondary me-2">' + formatData.format.toUpperCase() + '</span>';
                    if (formatData.original.exists) {
                        var sizeKB = formatData.original.size ? (formatData.original.size / 1024).toFixed(1) : '?';
                        html += '<small class="text-muted">Orijinal: ' + sizeKB + ' KB</small>';
                    }
                    html += '</div>';
                    
                    // Original
                    if (formatData.original.exists) {
                        html += '<div class="seo-format-item mb-2">';
                        html += '<a href="' + formatData.original.url + '" target="_blank" class="text-decoration-none">';
                        html += '<div class="d-flex align-items-center p-2 bg-white rounded border">';
                        html += '<img src="' + formatData.original.url + '" class="seo-format-thumb me-2" alt="Original ' + formatData.format + '">';
                        html += '<div class="flex-grow-1">';
                        html += '<div class="fw-semibold">Orijinal</div>';
                        html += '<small class="text-muted">' + (image.width || 0) + ' x ' + (image.height || 0) + ' px</small>';
                        html += '</div>';
                        html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>';
                        html += '</div>';
                        html += '</a>';
                        html += '</div>';
                    }
                    
                    // Sizes
                    if (formatData.sizes.length > 0) {
                        formatData.sizes.forEach(function(sizeData) {
                            html += '<div class="seo-format-item mb-2">';
                            html += '<a href="' + sizeData.url + '" target="_blank" class="text-decoration-none">';
                            html += '<div class="d-flex align-items-center p-2 bg-white rounded border">';
                            html += '<img src="' + sizeData.url + '" class="seo-format-thumb me-2" alt="' + sizeData.width + 'px ' + formatData.format + '">';
                            html += '<div class="flex-grow-1">';
                            html += '<div class="fw-semibold">' + sizeData.width + 'px</div>';
                            html += '<small class="text-muted">Genişlik</small>';
                            html += '</div>';
                            html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>';
                            html += '</div>';
                            html += '</a>';
                            html += '</div>';
                        });
                    }
                    
                    html += '</div>';
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            // Action buttons with SVG icons
            html += '<div class="d-grid gap-2">';
            
            // Add button (only in single mode)
            if (self.currentMode === 'single') {
                var isSelected = self.selectedImageId === image.id;
                html += '<button type="button" class="btn btn-success d-flex align-items-center justify-content-center" id="seo-images-add-selected" ' + (isSelected ? '' : 'disabled') + '>';
                html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="me-2"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>';
                html += 'Ekle';
                html += '</button>';
            }
            
            html += '<button type="button" class="btn btn-primary d-flex align-items-center justify-content-center" id="seo-images-save-meta">';
            html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="me-2"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>';
            html += 'Kaydet';
            html += '</button>';
            html += '<button type="button" class="btn btn-danger d-flex align-items-center justify-content-center" id="seo-images-delete-btn" data-image-id="' + image.id + '">';
            html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="me-2"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
            html += 'Sil';
            html += '</button>';
            html += '</div>';
            html += '</div>';
            
            $('#seo-images-detail-panel').html(html);
            this.currentImageDetail = image;
        },

        /**
         * Select image (single mode)
         */
        selectImage: function(imageId) {
            this.selectedImageId = imageId;
            this.updateSelectionUI();
            
            // Update add button state in detail panel
            var $addBtn = $('#seo-images-add-selected');
            if ($addBtn.length > 0) {
                $addBtn.prop('disabled', false);
            }
        },

        /**
         * Update selection UI
         */
        updateSelectionUI: function() {
            var self = this;

            // Update grid selection
            $('#seo-images-grid .seo-image-item').removeClass('selected');
            if (self.currentMode === 'single') {
                if (self.selectedImageId) {
                    $('#seo-images-grid .seo-image-item[data-image-id="' + self.selectedImageId + '"]').addClass('selected');
                }
            } else {
                self.selectedImageIds.forEach(function(id) {
                    $('#seo-images-grid .seo-image-item[data-image-id="' + id + '"]').addClass('selected');
                });
            }

            // Update apply button (footer)
            var hasSelection = false;
            if (self.currentMode === 'single') {
                hasSelection = self.selectedImageId !== null;
            } else {
                hasSelection = self.selectedImageIds.length > 0;
            }

            $('#seo-images-apply-selection').prop('disabled', !hasSelection);
            
            // Update add button in detail panel (single mode)
            if (self.currentMode === 'single') {
                var $addBtn = $('#seo-images-add-selected');
                if ($addBtn.length > 0) {
                    $addBtn.prop('disabled', !hasSelection);
                }
            }
        },

        /**
         * Apply selection
         */
        applySelection: function() {
            var self = this;
            if (!self.currentInputName) return;
            
            var $hiddenInput = $('input[name="' + self.currentInputName + '"]');
            if ($hiddenInput.length === 0) return;

            if (self.currentMode === 'single') {
                if (self.selectedImageId) {
                    // Get folder_path from selected image
                    var $selectedItem = $('#seo-images-grid .seo-image-item[data-image-id="' + self.selectedImageId + '"]');
                    // We need to get folder_path from the API
                    $.ajax({
                        url: '/seo-images/list',
                        method: 'GET',
                        data: { per_page: 100 },
                        success: function(response) {
                            var image = response.data.find(function(img) {
                                return img.id === self.selectedImageId;
                            });
                            if (image) {
                                $hiddenInput.val(image.folder_path);
                                self.updatePreview();
                                self.modal.hide();
                            }
                        }
                    });
                }
            } else {
                // Multiple mode
                if (self.selectedImageIds.length > 0) {
                    $.ajax({
                        url: '/seo-images/list',
                        method: 'GET',
                        data: { per_page: 100 },
                        success: function(response) {
                            var folderPaths = [];
                            self.selectedImageIds.forEach(function(id) {
                                var image = response.data.find(function(img) {
                                    return img.id === id;
                                });
                                if (image) {
                                    folderPaths.push(image.folder_path);
                                }
                            });
                            $hiddenInput.val(JSON.stringify(folderPaths));
                            self.updatePreview();
                            self.modal.hide();
                        }
                    });
                }
            }
        },

        /**
         * Update preview
         */
        updatePreview: function() {
            var self = this;
            if (!self.currentInputName) return;
            
            var $hiddenInput = $('input[name="' + self.currentInputName + '"]');
            var previewId = 'seo-preview-' + self.currentInputName.replace(/[\[\]]/g, '-');
            var $preview = $('#' + previewId);
            
            if ($preview.length === 0) return;
            
            if (self.currentMode === 'single') {
                var folderPath = $hiddenInput.val();
                if (folderPath) {
                    // Use @seoimages directive via API
                    self.renderImagePreview(folderPath, {
                        class: 'img-thumbnail',
                        style: 'max-width: 200px; height: auto;'
                    }, function(html) {
                        $preview.find('.seo-single-preview').html(html);
                    });
                } else {
                    $preview.find('.seo-single-preview').html('<span class="seo-no-image">Resim seçilmedi</span>');
                }
            } else {
                // Multiple mode - use @seoimages directive for each image
                try {
                    var folderPaths = JSON.parse($hiddenInput.val() || '[]');
                    if (folderPaths.length === 0) {
                        $preview.find('.seo-gallery-preview').html('');
                        return;
                    }
                    
                    // Show loading state
                    $preview.find('.seo-gallery-preview').html('<div class="text-center p-2"><div class="spinner-border spinner-border-sm" role="status"></div></div>');
                    
                    var html = '<div class="seo-gallery-preview d-flex flex-wrap gap-2">';
                    var renderedItems = [];
                    var renderedCount = 0;
                    var totalCount = folderPaths.length;
                    
                    folderPaths.forEach(function(folderPath, index) {
                        self.renderImagePreview(folderPath, {
                            class: 'img-thumbnail',
                            style: 'max-width: 100px; height: auto;'
                        }, function(imageHtml) {
                            renderedItems[index] = '<div class="seo-gallery-item position-relative" data-folder-path="' + folderPath + '">' +
                                imageHtml +
                                '<button type="button" class="btn btn-sm btn-danger seo-remove-gallery-item position-absolute top-0 end-0" style="transform: translate(50%, -50%); z-index: 10; width: 20px; height: 20px; padding: 0; line-height: 18px; font-size: 14px;" data-folder-path="' + folderPath + '" title="Sil">×</button>' +
                                '</div>';
                            
                            renderedCount++;
                            if (renderedCount === totalCount) {
                                // All images rendered, combine in order
                                renderedItems.forEach(function(item) {
                                    html += item;
                                });
                                html += '</div>';
                                $preview.find('.seo-gallery-preview').html(html);
                            }
                        });
                    });
                } catch (e) {
                    console.error('Error parsing gallery paths:', e);
                    $preview.find('.seo-gallery-preview').html('');
                }
            }
        },

        /**
         * Upload multiple files
         */
        uploadFiles: function(files) {
            var self = this;
            
            if (self.isLoading) {
                return;
            }

            // Filter only image files
            var imageFiles = Array.from(files).filter(function(file) {
                return file.type.match('image.*');
            });

            if (imageFiles.length === 0) {
                alert('Lütfen en az bir görsel dosyası seçin.');
                return;
            }

            self.isLoading = true;
            $('#seo-images-dropzone').addClass('seo-uploading');
            $('#seo-images-upload-btn').prop('disabled', true);
            $('#seo-images-upload-progress').show();
            
            var totalFiles = imageFiles.length;
            var uploadedCount = 0;
            var failedCount = 0;
            var uploadedImages = [];

            // Update progress
            function updateProgress() {
                var percent = Math.round((uploadedCount + failedCount) / totalFiles * 100);
                $('.progress-bar').css('width', percent + '%').attr('aria-valuenow', percent);
                $('#seo-images-upload-status').text((uploadedCount + failedCount) + ' / ' + totalFiles);
            }

            // Upload files sequentially to avoid memory issues
            function uploadNext(index) {
                if (index >= imageFiles.length) {
                    // All files processed
                    self.isLoading = false;
                    $('#seo-images-dropzone').removeClass('seo-uploading');
                    $('#seo-images-upload-btn').prop('disabled', false);
                    $('#seo-images-file-input').val('');
                    $('#seo-images-upload-progress').hide();
                    
                    // Reload grid
                    self.loadPage(1);
                    
                    // Show result
                    if (uploadedCount > 0) {
                        if (uploadedImages.length > 0) {
                            self.renderImageDetail(uploadedImages[0]);
                        }
                        $('#seo-images-list-tab').tab('show');
                        alert(uploadedCount + ' görsel başarıyla yüklendi' + (failedCount > 0 ? ' (' + failedCount + ' başarısız)' : '') + '!');
                    } else {
                        alert('Hiçbir görsel yüklenemedi. Lütfen dosya boyutlarını ve formatlarını kontrol edin.');
                    }
                    return;
                }

                var file = imageFiles[index];
                var formData = new FormData();
                formData.append('file', file);

                $.ajax({
                    url: '/seo-images/upload',
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function(response) {
                        uploadedCount++;
                        uploadedImages.push(response);
                        updateProgress();
                        // Continue with next file
                        uploadNext(index + 1);
                    },
                    error: function(xhr) {
                        failedCount++;
                        console.error('Upload failed for file:', file.name, xhr);
                        updateProgress();
                        // Continue with next file
                        uploadNext(index + 1);
                    }
                });
            }

            // Start uploading
            updateProgress();
            uploadNext(0);
        },

        /**
         * Upload single file (backward compatibility)
         */
        uploadFile: function(file) {
            this.uploadFiles([file]);
        },

        /**
         * Save meta
         */
        saveMeta: function() {
            var self = this;
            
            if (!self.currentImageDetail) {
                return;
            }

            var alt = $('#seo-image-alt').val();
            var title = $('#seo-image-title').val();

            $.ajax({
                url: '/seo-images/' + self.currentImageDetail.id + '/update-meta',
                method: 'POST',
                data: {
                    alt: alt,
                    title: title
                },
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function(response) {
                    self.currentImageDetail.alt = alt;
                    self.currentImageDetail.title = title;
                    alert('Bilgiler kaydedildi!');
                    self.loadPage(self.currentPage);
                },
                error: function(xhr) {
                    var message = 'Kaydetme sırasında bir hata oluştu.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    }
                    alert(message);
                }
            });
        },

        /**
         * Delete image
         */
        deleteImage: function() {
            var self = this;
            
            if (!self.currentImageDetail) {
                return;
            }

            $.ajax({
                url: '/seo-images/' + self.currentImageDetail.id,
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function() {
                    alert('Görsel silindi!');
                    self.currentImageDetail = null;
                    $('#seo-images-detail-panel').html('');
                    self.loadPage(self.currentPage);
                },
                error: function(xhr) {
                    var message = 'Silme sırasında bir hata oluştu.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    }
                    alert(message);
                }
            });
        },

        /**
         * Render image preview using @seoimages directive
         */
        renderImagePreview: function(folderPath, options, callback) {
            var self = this;
            
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            
            if (!callback) {
                callback = function() {};
            }
            
            $.ajax({
                url: '/seo-images/render',
                method: 'POST',
                data: {
                    folder_path: folderPath,
                    options: options || {}
                },
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function(response) {
                    if (response.html) {
                        callback(response.html);
                    } else {
                        // Fallback to simple img - use API to get URL
                        self.getImageUrl(folderPath, 'webp', 480, function(url) {
                            callback('<img src="' + url + '" class="img-thumbnail" style="max-width: 100px;">');
                        });
                    }
                },
                error: function(xhr) {
                    console.error('Error rendering image:', xhr);
                    // Fallback to simple img - use API to get URL
                    self.getImageUrl(folderPath, 'webp', 480, function(url) {
                        callback('<img src="' + url + '" class="img-thumbnail" style="max-width: 100px;">');
                    });
                }
            });
        },

        /**
         * Get image URL (helper function to avoid hardcoded paths)
         * Uses backend API which returns URLs with APP_URL
         */
        getImageUrl: function(folderPath, format, width, callback) {
            if (!callback) {
                callback = function() {};
            }
            
            // Get image info from list API to get proper URL (which uses APP_URL)
            $.ajax({
                url: '/seo-images/list',
                method: 'GET',
                data: { per_page: 100 },
                success: function(response) {
                    var image = response.data.find(function(img) {
                        return img.folder_path === folderPath;
                    });
                    if (image && image.preview_url) {
                        // Use the preview_url from API (already includes APP_URL)
                        // If we need different format/size, we can modify it
                        var url = image.preview_url;
                        if (format && width && width !== 480) {
                            // Replace size and format in URL
                            var basename = folderPath.split('/').pop();
                            url = url.replace(basename + '-480\.(webp|jpg|avif)', basename + '-' + width + '.' + format);
                        } else if (format && format !== 'webp') {
                            // Just replace format
                            url = url.replace(/\.(webp|jpg|avif)$/, '.' + format);
                        }
                        callback(url);
                    } else {
                        // Fallback: use render endpoint
                        self.renderImagePreview(folderPath, {
                            class: 'img-thumbnail',
                            style: 'max-width: 100px;'
                        }, function(html) {
                            // Extract URL from HTML
                            var match = html.match(/src="([^"]+)"/);
                            if (match) {
                                callback(match[1]);
                            } else {
                                callback('');
                            }
                        });
                    }
                },
                error: function() {
                    // Fallback: use render endpoint
                    self.renderImagePreview(folderPath, {
                        class: 'img-thumbnail',
                        style: 'max-width: 100px;'
                    }, function(html) {
                        // Extract URL from HTML
                        var match = html.match(/src="([^"]+)"/);
                        if (match) {
                            callback(match[1]);
                        } else {
                            callback('');
                        }
                    });
                }
            });
        },


        /**
         * Reset state
         */
        resetState: function() {
            this.currentInputName = null;
            this.currentMode = 'single';
            this.selectedImageId = null;
            this.selectedImageIds = [];
            this.currentImageDetail = null;
        }
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.SeoImagesManager.init();
        });
    } else {
        window.SeoImagesManager.init();
    }

})(window, jQuery);

