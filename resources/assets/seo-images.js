/**
 * SeoImagesManager - Laravel SEO Images Package
 * Tam çalışan, eksiksiz frontend yönetim sistemi
 */
(function (window, $) {
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
         * Escape HTML to prevent XSS
         */
        escapeHtml: function (text) {
            if (text == null) return '';
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(text).replace(/[&<>"']/g, function (m) {
                return map[m];
            });
        },

        /**
         * Show toast notification (Bootstrap 5)
         */
        showToast: function (message, type) {
            type = type || 'success';

            // Create toast container if not exists
            var $container = $('#seo-toast-container');
            if ($container.length === 0) {
                $container = $('<div id="seo-toast-container" class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;"></div>');
                $('body').append($container);
            }

            // Icon based on type
            var icon = '';
            var bgClass = 'bg-success';
            if (type === 'success') {
                icon = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>';
                bgClass = 'bg-success';
            } else if (type === 'error') {
                icon = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>';
                bgClass = 'bg-danger';
            } else if (type === 'warning') {
                icon = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
                bgClass = 'bg-warning';
            } else if (type === 'info') {
                icon = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>';
                bgClass = 'bg-info';
            }

            var toastId = 'seo-toast-' + Date.now();
            var toastHtml = '<div id="' + toastId + '" class="toast align-items-center text-white ' + bgClass + ' border-0" role="alert" aria-live="assertive" aria-atomic="true">' +
                '<div class="d-flex">' +
                '<div class="toast-body d-flex align-items-center gap-2">' +
                icon +
                '<span>' + message + '</span>' +
                '</div>' +
                '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Kapat"></button>' +
                '</div>' +
                '</div>';

            $container.append(toastHtml);

            var toastEl = document.getElementById(toastId);
            var toast = new bootstrap.Toast(toastEl, {
                delay: 4000
            });
            toast.show();

            // Remove from DOM after hidden
            toastEl.addEventListener('hidden.bs.toast', function () {
                toastEl.remove();
            });
        },

        /**
         * Initialize the manager
         */
        init: function () {
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
            $(document).ready(function () {
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
            });
        },

        /**
         * Bind all events
         */
        bindEvents: function () {
            var self = this;

            // Open modal button (delegated)
            $(document).on('click', '[data-seoinput-open]', function (e) {
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
            $(document).on('dblclick', '#seo-images-grid .seo-image-item', function () {
                if (self.currentMode === 'single') {
                    var imageId = $(this).data('image-id');
                    self.selectImage(imageId);
                    self.applySelection();
                }
            });

            // Image selection (single mode - single click - select and show detail)
            $(document).on('click', '#seo-images-grid .seo-image-item', function () {
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
            $(document).on('change', '#seo-images-grid .seo-image-checkbox', function () {
                var imageId = parseInt($(this).val());
                var isChecked = $(this).is(':checked');

                if (isChecked) {
                    if (self.selectedImageIds.indexOf(imageId) === -1) {
                        self.selectedImageIds.push(imageId);
                    }
                } else {
                    self.selectedImageIds = self.selectedImageIds.filter(function (id) {
                        return id !== imageId;
                    });
                }

                self.updateSelectionUI();
            });

            // Apply selection button
            $(document).on('click', '#seo-images-apply-selection', function () {
                self.applySelection();
            });

            // Upload button
            $(document).on('click', '#seo-images-upload-btn', function () {
                $('#seo-images-file-input').click();
            });

            // File input change
            $(document).on('change', '#seo-images-file-input', function () {
                var files = this.files;
                if (files.length > 0) {
                    // Upload all selected files
                    self.uploadFiles(Array.from(files));
                }
            });


            // Save meta button
            $(document).on('click', '#seo-images-save-meta', function () {
                self.saveMeta();
            });

            // Delete image button
            $(document).on('click', '#seo-images-delete-btn', function () {
                if (confirm('Bu görseli silmek istediğinize emin misiniz?')) {
                    self.deleteImage();
                }
            });

            // Pagination
            $(document).on('click', '#seo-images-pagination .seo-page-btn', function (e) {
                e.preventDefault();
                var page = $(this).data('page');
                if (page) {
                    self.loadPage(page);
                }
            });

            // Search
            $(document).on('keyup', '#seo-images-search', function () {
                var searchTerm = $(this).val();
                clearTimeout(self.searchTimeout);
                self.searchTimeout = setTimeout(function () {
                    self.currentPage = 1;
                    self.loadPage(1, searchTerm);
                }, 500);
            });

            // Modal events
            $('#seo-images-modal').on('hidden.bs.modal', function () {
                self.resetState();
            });

            // Tab switching
            $(document).on('click', '#seo-images-modal .nav-link', function () {
                var tab = $(this).data('tab');
                if (tab === 'upload') {
                    // Reset file input when switching to upload tab
                    $('#seo-images-file-input').val('');
                } else if (tab === 'dashboard') {
                    // Load dashboard when switching to dashboard tab
                    self.loadDashboard();
                }
            });

            // Remove gallery item
            $(document).on('click', '.seo-remove-gallery-item', function (e) {
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
                    folderPaths = folderPaths.filter(function (path) {
                        return path !== folderPath;
                    });

                    // Update hidden input
                    $hiddenInput.val(JSON.stringify(folderPaths));

                    // Remove item from DOM
                    $item.fadeOut(200, function () {
                        $(this).remove();
                    });
                } catch (e) {
                    console.error('Error removing gallery item:', e);
                    self.showToast('Görsel silinirken bir hata oluştu.', 'error');
                }
            });
        },

        /**
         * Initialize dropzone
         */
        initDropzone: function () {
            var self = this;
            var dropzone = document.getElementById('seo-images-dropzone');

            if (!dropzone) return;

            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
                dropzone.addEventListener(eventName, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            // Highlight dropzone
            ['dragenter', 'dragover'].forEach(function (eventName) {
                dropzone.addEventListener(eventName, function () {
                    dropzone.classList.add('seo-dropzone-active');
                });
            });

            ['dragleave', 'drop'].forEach(function (eventName) {
                dropzone.addEventListener(eventName, function () {
                    dropzone.classList.remove('seo-dropzone-active');
                });
            });

            // Handle drop
            dropzone.addEventListener('drop', function (e) {
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
        openModal: function () {
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
        loadPage: function (page, search) {
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
                success: function (response) {
                    self.renderGrid(response.data);
                    self.renderPagination(response.meta);
                    self.updateSelectionUI();
                    self.isLoading = false;
                },
                error: function (xhr) {
                    console.error('Error loading images:', xhr);
                    $('#seo-images-grid').html('<div class="alert alert-danger">Görseller yüklenirken bir hata oluştu.</div>');
                    self.isLoading = false;
                }
            });
        },

        /**
         * Render image grid
         */
        renderGrid: function (images) {
            var self = this;
            var html = '<div class="row g-3">';

            if (images.length === 0) {
                html = '<div class="col-12 text-center p-4">Görsel bulunamadı.</div>';
            } else {
                images.forEach(function (image) {
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

                    html += '<img src="' + self.escapeHtml(image.preview_url) + '" class="card-img-top" alt="' + self.escapeHtml(image.alt || '') + '">';
                    html += '<div class="card-body p-2">';
                    html += '<small class="text-muted">' + self.escapeHtml(image.basename || '') + '</small>';
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
        renderPagination: function (meta) {
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
        showImageDetail: function (imageId) {
            var self = this;

            // Find image in current grid
            var $item = $('#seo-images-grid .seo-image-item[data-image-id="' + imageId + '"]');
            if ($item.length === 0) {
                // Load from API
                $.ajax({
                    url: '/seo-images/list',
                    method: 'GET',
                    data: {
                        per_page: 100
                    },
                    success: function (response) {
                        var image = response.data.find(function (img) {
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
                data: {
                    per_page: 100
                },
                success: function (response) {
                    var image = response.data.find(function (img) {
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
        renderImageDetail: function (image) {
            var self = this;
            var html = '<div class="seo-image-detail">';

            // Preview image
            html += '<div class="mb-3 text-center">';
            html += '<img src="' + self.escapeHtml(image.preview_url) + '" class="img-fluid rounded shadow-sm" alt="' + self.escapeHtml(image.alt || '') + '" style="max-height: 300px;">';
            html += '</div>';

            // Meta fields
            html += '<div class="mb-3">';
            html += '<label class="form-label fw-bold">Alt Text</label>';
            html += '<input type="text" class="form-control" id="seo-image-alt" value="' + self.escapeHtml(image.alt || '') + '" placeholder="Görsel açıklaması">';
            html += '</div>';
            html += '<div class="mb-3">';
            html += '<label class="form-label fw-bold">Title</label>';
            html += '<input type="text" class="form-control" id="seo-image-title" value="' + self.escapeHtml(image.title || '') + '" placeholder="Görsel başlığı">';
            html += '</div>';

            // Image info
            html += '<div class="mb-3 p-2 bg-light rounded">';
            html += '<small class="text-muted d-block">Boyut: <strong>' + self.escapeHtml(image.width || 0) + ' x ' + self.escapeHtml(image.height || 0) + ' px</strong></small>';
            html += '<small class="text-muted d-block">Dosya: <strong>' + self.escapeHtml(image.basename || '') + '</strong></small>';
            html += '</div>';

            // Formats and variations - Accordion style
            if (image.formats && image.formats.length > 0) {
                html += '<div class="mb-3">';
                html += '<label class="form-label fw-bold mb-2">Formatlar ve Varyasyonlar</label>';
                html += '<div class="accordion seo-formats-container" id="seo-formats-accordion-' + image.id + '">';

                image.formats.forEach(function (formatData, index) {
                    if (!formatData.original.exists && formatData.sizes.length === 0) {
                        return; // Skip if format doesn't exist
                    }

                    var formatId = 'format-' + image.id + '-' + formatData.format;
                    var collapseId = 'collapse-' + formatId;
                    var isFirst = index === 0;

                    html += '<div class="accordion-item seo-format-group border rounded mb-2">';
                    html += '<h2 class="accordion-header" id="heading-' + formatId + '">';
                    html += '<button class="accordion-button seo-format-header' + (isFirst ? '' : ' collapsed') + '" type="button" data-bs-toggle="collapse" data-bs-target="#' + collapseId + '" aria-expanded="' + (isFirst ? 'true' : 'false') + '" aria-controls="' + collapseId + '">';
                    html += '<span class="badge bg-secondary me-2">' + self.escapeHtml(formatData.format.toUpperCase()) + '</span>';
                    if (formatData.original.exists) {
                        var sizeKB = formatData.original.size ? (formatData.original.size / 1024).toFixed(1) : '?';
                        html += '<small class="text-muted">Orijinal: ' + sizeKB + ' KB</small>';
                    }
                    html += '</button>';
                    html += '</h2>';
                    html += '<div id="' + collapseId + '" class="accordion-collapse collapse' + (isFirst ? ' show' : '') + '" aria-labelledby="heading-' + formatId + '" data-bs-parent="#seo-formats-accordion-' + image.id + '">';
                    html += '<div class="accordion-body p-2">';

                    // Original
                    if (formatData.original.exists) {
                        html += '<div class="seo-format-item mb-2">';
                        html += '<a href="' + self.escapeHtml(formatData.original.url) + '" target="_blank" class="text-decoration-none">';
                        html += '<div class="d-flex align-items-center p-2 bg-white rounded border">';
                        html += '<img src="' + self.escapeHtml(formatData.original.url) + '" class="seo-format-thumb me-2" alt="Original ' + self.escapeHtml(formatData.format) + '">';
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
                        formatData.sizes.forEach(function (sizeData) {
                            html += '<div class="seo-format-item mb-2">';
                            html += '<a href="' + self.escapeHtml(sizeData.url) + '" target="_blank" class="text-decoration-none">';
                            html += '<div class="d-flex align-items-center p-2 bg-white rounded border">';
                            html += '<img src="' + self.escapeHtml(sizeData.url) + '" class="seo-format-thumb me-2" alt="' + self.escapeHtml(sizeData.width) + 'px ' + self.escapeHtml(formatData.format) + '">';
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

                    html += '</div>'; // accordion-body
                    html += '</div>'; // accordion-collapse
                    html += '</div>'; // accordion-item
                });

                html += '</div>'; // accordion
                html += '</div>'; // mb-3
            }

            // Action buttons with SVG icons - outline style, side by side
            html += '<div class="d-flex gap-2">';

            html += '<button type="button" class="btn btn-outline-primary d-flex align-items-center justify-content-center flex-fill" id="seo-images-save-meta">';
            html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="me-2"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>';
            html += 'Kaydet';
            html += '</button>';
            html += '<button type="button" class="btn btn-outline-danger d-flex align-items-center justify-content-center flex-fill" id="seo-images-delete-btn" data-image-id="' + image.id + '">';
            html += '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="me-2"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>';
            html += 'Sil';
            html += '</button>';
            html += '</div>';
            html += '</div>';

            $('#seo-images-detail-panel').html(html);
            self.currentImageDetail = image;
        },

        /**
         * Select image (single mode)
         */
        selectImage: function (imageId) {
            this.selectedImageId = imageId;
            this.updateSelectionUI();
        },

        /**
         * Update selection UI
         */
        updateSelectionUI: function () {
            var self = this;

            // Update grid selection
            $('#seo-images-grid .seo-image-item').removeClass('selected');
            if (self.currentMode === 'single') {
                if (self.selectedImageId) {
                    $('#seo-images-grid .seo-image-item[data-image-id="' + self.selectedImageId + '"]').addClass('selected');
                }
            } else {
                self.selectedImageIds.forEach(function (id) {
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
        },

        /**
         * Apply selection
         */
        applySelection: function () {
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
                        data: {
                            per_page: 100
                        },
                        success: function (response) {
                            var image = response.data.find(function (img) {
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
                        data: {
                            per_page: 100
                        },
                        success: function (response) {
                            var folderPaths = [];
                            self.selectedImageIds.forEach(function (id) {
                                var image = response.data.find(function (img) {
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
        updatePreview: function () {
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
                    }, function (html) {
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

                    folderPaths.forEach(function (folderPath, index) {
                        self.renderImagePreview(folderPath, {
                            class: 'img-thumbnail',
                            style: 'max-width: 100px; height: auto;'
                        }, function (imageHtml) {
                            renderedItems[index] = '<div class="seo-gallery-item position-relative" data-folder-path="' + folderPath + '">' +
                                imageHtml +
                                '<button type="button" class="btn btn-sm btn-danger seo-remove-gallery-item position-absolute top-0 end-0" style="transform: translate(50%, -50%); z-index: 10; width: 20px; height: 20px; padding: 0; line-height: 18px; font-size: 14px;" data-folder-path="' + folderPath + '" title="Sil">×</button>' +
                                '</div>';

                            renderedCount++;
                            if (renderedCount === totalCount) {
                                // All images rendered, combine in order
                                renderedItems.forEach(function (item) {
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
        uploadFiles: function (files) {
            var self = this;

            if (self.isLoading) {
                return;
            }

            // Filter only image files
            var imageFiles = Array.from(files).filter(function (file) {
                return file.type.match('image.*');
            });

            if (imageFiles.length === 0) {
                self.showToast('Lütfen en az bir görsel dosyası seçin.', 'warning');
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
                        self.showToast(uploadedCount + ' görsel başarıyla yüklendi' + (failedCount > 0 ? ' (' + failedCount + ' başarısız)' : '') + '!', 'success');
                    } else {
                        self.showToast('Hiçbir görsel yüklenemedi. Lütfen dosya boyutlarını ve formatlarını kontrol edin.', 'error');
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
                    success: function (response) {
                        uploadedCount++;
                        uploadedImages.push(response);
                        updateProgress();
                        // Continue with next file
                        uploadNext(index + 1);
                    },
                    error: function (xhr) {
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
        uploadFile: function (file) {
            this.uploadFiles([file]);
        },

        /**
         * Save meta
         */
        saveMeta: function () {
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
                success: function (response) {
                    self.currentImageDetail.alt = alt;
                    self.currentImageDetail.title = title;
                    self.showToast('Bilgiler kaydedildi!', 'success');
                    self.loadPage(self.currentPage);
                },
                error: function (xhr) {
                    var message = 'Kaydetme sırasında bir hata oluştu.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    }
                    self.showToast(message, 'error');
                }
            });
        },

        /**
         * Delete image
         */
        deleteImage: function () {
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
                success: function () {
                    self.showToast('Görsel silindi!', 'success');
                    self.currentImageDetail = null;
                    $('#seo-images-detail-panel').html('');
                    self.loadPage(self.currentPage);
                },
                error: function (xhr) {
                    var message = 'Silme sırasında bir hata oluştu.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    }
                    self.showToast(message, 'error');
                }
            });
        },

        /**
         * Render image preview using @seoimages directive
         */
        renderImagePreview: function (folderPath, options, callback) {
            var self = this;

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            if (!callback) {
                callback = function () {};
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
                success: function (response) {
                    if (response.html) {
                        callback(response.html);
                    } else {
                        // Fallback to simple img - use API to get URL
                        self.getImageUrl(folderPath, 'webp', 480, function (url) {
                            callback('<img src="' + url + '" class="img-thumbnail" style="max-width: 100px;">');
                        });
                    }
                },
                error: function (xhr) {
                    console.error('Error rendering image:', xhr);
                    // Fallback to simple img - use API to get URL
                    self.getImageUrl(folderPath, 'webp', 480, function (url) {
                        callback('<img src="' + url + '" class="img-thumbnail" style="max-width: 100px;">');
                    });
                }
            });
        },

        /**
         * Get image URL (helper function to avoid hardcoded paths)
         * Uses backend API which returns URLs with APP_URL
         */
        getImageUrl: function (folderPath, format, width, callback) {
            if (!callback) {
                callback = function () {};
            }

            // Get image info from list API to get proper URL (which uses APP_URL)
            $.ajax({
                url: '/seo-images/list',
                method: 'GET',
                data: {
                    per_page: 100
                },
                success: function (response) {
                    var image = response.data.find(function (img) {
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
                        }, function (html) {
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
                error: function () {
                    // Fallback: use render endpoint
                    self.renderImagePreview(folderPath, {
                        class: 'img-thumbnail',
                        style: 'max-width: 100px;'
                    }, function (html) {
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
         * Load and render dashboard
         */
        loadDashboard: function () {
            var self = this;

            // Show loading state
            $('#seo-images-dashboard-content').html(
                '<div class="text-center p-4">' +
                '<div class="spinner-border" role="status"></div>' +
                '<p class="mt-2 text-muted">Yükleniyor...</p>' +
                '</div>'
            );

            $.ajax({
                url: '/seo-images/dashboard',
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function (response) {
                    if (response.error) {
                        $('#seo-images-dashboard-content').html(
                            '<div class="alert alert-danger">' + self.escapeHtml(response.message) + '</div>'
                        );
                        return;
                    }
                    self.renderDashboard(response);
                },
                error: function (xhr) {
                    console.error('Error loading dashboard:', xhr);
                    $('#seo-images-dashboard-content').html(
                        '<div class="alert alert-danger">Dashboard yüklenirken bir hata oluştu.</div>'
                    );
                }
            });
        },

        /**
         * Render dashboard content
         */
        renderDashboard: function (stats) {
            var self = this;

            if (!stats || stats.error) {
                $('#seo-images-dashboard-content').html(
                    '<div class="alert alert-danger">' +
                    (stats && stats.message ? self.escapeHtml(stats.message) : 'Dashboard verileri yüklenemedi.') +
                    '</div>'
                );
                return;
            }

            var html = '<div class="row g-3">';

            // Total Images Card
            html += '<div class="col-md-3">';
            html += '<div class="card h-100">';
            html += '<div class="card-body text-center">';
            html += '<h5 class="card-title text-muted mb-2">Toplam Görsel</h5>';
            html += '<h2 class="mb-0">' + (stats.total_images || 0) + '</h2>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

            // Total Storage Card
            html += '<div class="col-md-3">';
            html += '<div class="card h-100">';
            html += '<div class="card-body text-center">';
            html += '<h5 class="card-title text-muted mb-2">Toplam Depolama</h5>';
            var storageGb = stats.total_storage_gb || 0;
            var storageMb = stats.total_storage_mb || 0;
            if (storageGb >= 1) {
                html += '<h2 class="mb-0">' + storageGb.toFixed(2) + ' <small class="text-muted">GB</small></h2>';
            } else {
                html += '<h2 class="mb-0">' + storageMb.toFixed(2) + ' <small class="text-muted">MB</small></h2>';
            }
            html += '</div>';
            html += '</div>';
            html += '</div>';

            // Format Distribution Card
            html += '<div class="col-md-6">';
            html += '<div class="card h-100">';
            html += '<div class="card-body">';
            html += '<h5 class="card-title mb-3">Format Dağılımı</h5>';

            var formats = stats.format_distribution || {
                jpg: {
                    count: 0,
                    percentage: 0
                },
                webp: {
                    count: 0,
                    percentage: 0
                },
                avif: {
                    count: 0,
                    percentage: 0
                }
            };

            // Calculate percentages first
            var jpgPct = formats.jpg && formats.jpg.percentage !== undefined ? formats.jpg.percentage : 0;
            var webpPct = formats.webp && formats.webp.percentage !== undefined ? formats.webp.percentage : 0;
            var avifPct = formats.avif && formats.avif.percentage !== undefined ? formats.avif.percentage : 0;

            // Ensure percentages are numbers
            jpgPct = isNaN(jpgPct) ? 0 : parseFloat(jpgPct);
            webpPct = isNaN(webpPct) ? 0 : parseFloat(webpPct);
            avifPct = isNaN(avifPct) ? 0 : parseFloat(avifPct);

            html += '<div class="mb-2">';
            html += '<div class="d-flex justify-content-between align-items-center mb-1">';
            html += '<span><strong>JPG:</strong> ' + (formats.jpg && formats.jpg.count ? formats.jpg.count : 0) + ' görsel</span>';
            html += '<span class="badge bg-secondary">' + jpgPct.toFixed(1) + '%</span>';
            html += '</div>';

            html += '<div class="progress mb-2" style="height: 8px;">';
            html += '<div class="progress-bar bg-primary" role="progressbar" style="width: ' + jpgPct + '%"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="mb-2">';
            html += '<div class="d-flex justify-content-between align-items-center mb-1">';
            html += '<span><strong>WebP:</strong> ' + (formats.webp && formats.webp.count ? formats.webp.count : 0) + ' görsel</span>';
            html += '<span class="badge bg-info">' + webpPct.toFixed(1) + '%</span>';
            html += '</div>';
            html += '<div class="progress mb-2" style="height: 8px;">';
            html += '<div class="progress-bar bg-info" role="progressbar" style="width: ' + webpPct + '%"></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="mb-2">';
            html += '<div class="d-flex justify-content-between align-items-center mb-1">';
            html += '<span><strong>AVIF:</strong> ' + (formats.avif && formats.avif.count ? formats.avif.count : 0) + ' görsel</span>';
            html += '<span class="badge bg-success">' + avifPct.toFixed(1) + '%</span>';
            html += '</div>';
            html += '<div class="progress mb-2" style="height: 8px;">';
            html += '<div class="progress-bar bg-success" role="progressbar" style="width: ' + avifPct + '%"></div>';
            html += '</div>';
            html += '</div>';

            html += '</div>';
            html += '</div>';
            html += '</div>';

            // Recent Uploads Card
            html += '<div class="col-md-6">';
            html += '<div class="card h-100">';
            html += '<div class="card-body">';
            html += '<h5 class="card-title mb-3">Son 7 Gün Yüklemeler</h5>';
            html += '<div class="list-group list-group-flush">';

            var recentUploads = stats.recent_uploads || [];
            var maxCount = recentUploads.length > 0 ?
                Math.max.apply(null, recentUploads.map(function (u) {
                    return u.count || 0;
                })) :
                0;

            if (recentUploads.length === 0) {
                html += '<div class="text-center text-muted py-3">Veri bulunamadı.</div>';
            } else {
                recentUploads.forEach(function (upload) {
                    if (!upload || !upload.date) return;

                    var date = new Date(upload.date);
                    if (isNaN(date.getTime())) return;

                    var dayName = date.toLocaleDateString('tr-TR', {
                        weekday: 'short'
                    });
                    var dateStr = date.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short'
                    });
                    var count = upload.count || 0;
                    var percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    if (isNaN(percentage)) percentage = 0;

                    html += '<div class="list-group-item px-0 py-2">';
                    html += '<div class="d-flex justify-content-between align-items-center mb-1">';
                    html += '<span><strong>' + self.escapeHtml(dayName) + '</strong> ' + self.escapeHtml(dateStr) + '</span>';
                    html += '<span class="badge bg-primary">' + count + '</span>';
                    html += '</div>';
                    html += '<div class="progress" style="height: 6px;">';
                    html += '<div class="progress-bar bg-primary" role="progressbar" style="width: ' + percentage.toFixed(1) + '%"></div>';
                    html += '</div>';
                    html += '</div>';
                });
            }

            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

            // Largest Images Card
            html += '<div class="col-md-6">';
            html += '<div class="card h-100">';
            html += '<div class="card-body">';
            html += '<h5 class="card-title mb-3">En Büyük Görseller (Top 5)</h5>';
            html += '<div class="list-group list-group-flush">';

            var largestImages = stats.largest_images || [];
            if (largestImages.length > 0) {
                largestImages.forEach(function (image) {
                    if (!image) return;

                    var previewUrl = image.preview_url || '';
                    var basename = image.basename || 'Bilinmeyen';
                    var width = image.width || 0;
                    var height = image.height || 0;
                    var sizeMb = image.total_size_mb || 0;

                    html += '<div class="list-group-item px-0 py-2">';
                    html += '<div class="d-flex align-items-center">';
                    if (previewUrl) {
                        html += '<img src="' + self.escapeHtml(previewUrl) + '" class="rounded me-2" style="width: 50px; height: 50px; object-fit: cover;" alt="' + self.escapeHtml(basename) + '">';
                    } else {
                        html += '<div class="rounded me-2 bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;"><small class="text-muted">N/A</small></div>';
                    }
                    html += '<div class="flex-grow-1">';
                    html += '<div class="fw-semibold">' + self.escapeHtml(basename) + '</div>';
                    html += '<small class="text-muted">' + width + ' x ' + height + ' px</small>';
                    html += '</div>';
                    html += '<div class="text-end">';
                    html += '<div class="fw-bold">' + sizeMb.toFixed(2) + ' MB</div>';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                });
            } else {
                html += '<div class="text-center text-muted py-3">Görsel bulunamadı.</div>';
            }

            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

            // Format Sizes Card
            html += '<div class="col-12">';
            html += '<div class="card">';
            html += '<div class="card-body">';
            html += '<h5 class="card-title mb-3">Format Bazında Depolama</h5>';
            html += '<div class="row g-3">';

            var formatSizes = stats.format_sizes || {
                jpg: {
                    total_mb: 0,
                    total_gb: 0
                },
                webp: {
                    total_mb: 0,
                    total_gb: 0
                },
                avif: {
                    total_mb: 0,
                    total_gb: 0
                }
            };

            ['jpg', 'webp', 'avif'].forEach(function (format) {
                var formatData = formatSizes[format] || {
                    total_mb: 0,
                    total_gb: 0
                };
                var displaySize = (formatData.total_gb || 0) >= 1 ?
                    (formatData.total_gb || 0).toFixed(2) + ' GB' :
                    (formatData.total_mb || 0).toFixed(2) + ' MB';

                html += '<div class="col-md-4">';
                html += '<div class="p-3 border rounded text-center">';
                html += '<h6 class="text-uppercase text-muted mb-2">' + format.toUpperCase() + '</h6>';
                html += '<h4 class="mb-0">' + displaySize + '</h4>';
                html += '</div>';
                html += '</div>';
            });

            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';

            html += '</div>'; // row end

            $('#seo-images-dashboard-content').html(html);
        },

        /**
         * Reset state
         */
        resetState: function () {
            this.currentInputName = null;
            this.currentMode = 'single';
            this.selectedImageId = null;
            this.selectedImageIds = [];
            this.currentImageDetail = null;
        }
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.SeoImagesManager.init();
        });
    } else {
        window.SeoImagesManager.init();
    }

})(window, jQuery);