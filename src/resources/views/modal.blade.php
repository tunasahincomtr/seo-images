<!-- SEO Images Modal -->
<div class="modal fade" id="seoImageModal" tabindex="-1" aria-labelledby="seoImageModalLabel" aria-hidden="true"
    style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1050;">
    <div class="modal-dialog modal-fullscreen" style="margin: 0; max-width: 100%; height: 100%;">
        <div class="modal-content" style="height: 100%; border: 0; border-radius: 0;">
            <div class="modal-header">
                <h5 class="modal-title" id="seoImageModalLabel">Resim Kütüphanesi</h5>
                <div class="ms-auto me-3">
                    <span id="selectedCount" class="badge bg-primary" style="display: none;">0 seçili</span>
                </div>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-0">
                <div class="row g-0 h-100">
                    <!-- Sol Panel - Resim Listesi -->
                    <div class="col-md-8 border-end" style="height: 100%; overflow-y: auto;">
                        <!-- Arama Kutusu -->
                        <div class="p-3 border-bottom">
                            <div class="input-group">
                                <span class="input-group-text">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </span>
                                <input type="text" class="form-control" id="imageSearchInput"
                                    placeholder="Resim ara (alt etiketi, başlık, dosya adı...)">
                                <button class="btn btn-outline-secondary" type="button" id="clearSearchBtn"
                                    style="display: none;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Yükleme Alanı -->
                        <div class="upload-area" id="uploadArea" style="position: relative; margin: 15px;">
                            <input type="file" id="imageUpload" accept="image/*" multiple
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10;">
                            <div class="upload-content" style="pointer-events: none;">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <p>Resimleri buraya sürükleyip bırakın veya tıklayarak seçin</p>
                            </div>
                        </div>

                        <!-- Resim Listesi -->
                        <div class="image-grid" id="imageGrid" style="padding: 15px;">
                            <div class="loading">Yükleniyor...</div>
                        </div>

                        <!-- Daha Fazla Göster Butonu -->
                        <div class="text-center p-3" id="loadMoreContainer" style="display: none;">
                            <button type="button" class="btn btn-primary" id="loadMoreBtn">
                                Daha Fazla Göster (12)
                            </button>
                        </div>
                    </div>

                    <!-- Sağ Panel - Resim Detayları -->
                    <div class="col-md-4 bg-light" id="imageDetailsPanel"
                        style="display: none; height: 100%; overflow-y: auto;">
                        <div class="p-3">
                            <h6 class="mb-3">Resim Detayları</h6>

                            <!-- Seçilen Resim Önizlemesi - 3 Format (Picture Etiketi) -->
                            <div class="mb-3 text-center">
                                <picture id="selectedImagePreviewPicture" style="display: none;">
                                    <source id="selectedImagePreviewAvif" srcset="" type="image/avif">
                                    <source id="selectedImagePreviewWebp" srcset="" type="image/webp">
                                    <img id="selectedImagePreview" src="" alt="Preview" class="img-fluid rounded"
                                        style="max-height: 200px; width: auto; display: block; margin: 0 auto;">
                                </picture>
                            </div>
                            
                            <!-- Format ve Boyut Bilgileri -->
                            <div class="mb-3" id="imageFormatInfo" style="display: none;">
                                <!-- Format ve boyutlar JavaScript ile dinamik olarak eklenecek -->
                            </div>

                            <!-- Form -->
                            <div id="imageDetailsForm">
                                <input type="hidden" id="selectedImageId">

                                <div class="mb-3">
                                    <label for="selectedImageAltText" class="form-label">Alt Etiketi</label>
                                    <input type="text" class="form-control" id="selectedImageAltText"
                                        name="alt_text" placeholder="Alt etiketi girin">
                                </div>

                                <div class="mb-3">
                                    <label for="selectedImageTitle" class="form-label">Başlık</label>
                                    <input type="text" class="form-control" id="selectedImageTitle"
                                        name="title" placeholder="Başlık girin">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Dosya Konumu</label>
                                    <input type="text" class="form-control" id="selectedImagePath" readonly>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Boyutlar</label>
                                    <input type="text" class="form-control" id="selectedImageDimensions" readonly>
                                </div>

                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-primary"
                                        id="updateImageBtn">Güncelle</button>
                                    <button type="button" class="btn btn-danger" id="deleteSelectedImageBtn">Resmi
                                        Sil</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Kapat</button>
                <button type="button" class="btn btn-primary" id="selectImageBtn"
                    style="display: none;">Seç</button>
                <button type="button" class="btn btn-success" id="selectMultipleImagesBtn"
                    style="display: none;">Seçilenleri Ekle (<span id="multipleCount">0</span>)</button>
            </div>
        </div>
    </div>
</div>
