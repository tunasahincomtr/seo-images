<!-- Seo Images Modal -->
<div class="modal fade" id="seo-images-modal" tabindex="-1" aria-labelledby="seo-images-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="seo-images-modal-label">Görsel Yönetimi</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <ul class="nav nav-tabs mb-3" id="seo-images-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="seo-images-list-tab" data-bs-toggle="tab" data-bs-target="#seo-images-list-pane" type="button" role="tab" aria-controls="seo-images-list-pane" aria-selected="true">
                            Liste
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="seo-images-upload-tab" data-bs-toggle="tab" data-bs-target="#seo-images-upload-pane" type="button" role="tab" aria-controls="seo-images-upload-pane" aria-selected="false" data-tab="upload">
                            Yükle
                        </button>
                    </li>
                </ul>
                <div class="tab-content" id="seo-images-tab-content">
                    <!-- List Tab -->
                    <div class="tab-pane fade show active" id="seo-images-list-pane" role="tabpanel" aria-labelledby="seo-images-list-tab">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="mb-3">
                                    <input type="text" class="form-control" id="seo-images-search" placeholder="Ara...">
                                </div>
                                <div id="seo-images-grid">
                                    <div class="text-center p-4">
                                        <div class="spinner-border" role="status"></div>
                                    </div>
                                </div>
                                <div id="seo-images-pagination"></div>
                            </div>
                            <div class="col-md-4">
                                <div id="seo-images-detail-panel"></div>
                            </div>
                        </div>
                    </div>
                    <!-- Upload Tab -->
                    <div class="tab-pane fade" id="seo-images-upload-pane" role="tabpanel" aria-labelledby="seo-images-upload-tab">
                        <div id="seo-images-dropzone">
                            <div class="mb-3">
                                <i class="bi bi-cloud-upload" style="font-size: 3rem; color: #6c757d;"></i>
                            </div>
                            <p class="mb-3">Dosya(lar)ı buraya sürükleyip bırakın veya</p>
                            <button type="button" class="btn btn-primary" id="seo-images-upload-btn">Dosya Seç</button>
                            <input type="file" id="seo-images-file-input" accept="image/*" multiple style="display: none;">
                            <p class="mt-3 text-muted small">Desteklenen formatlar: JPG, PNG, GIF, WebP, HEIC (Birden fazla dosya seçebilirsiniz)</p>
                            <div id="seo-images-upload-progress" class="mt-3" style="display: none;">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p class="mt-2 small text-muted"><span id="seo-images-upload-status">0 / 0</span> dosya yükleniyor...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                <button type="button" class="btn btn-primary" id="seo-images-apply-selection" disabled>Seçilenleri Ekle</button>
            </div>
        </div>
    </div>
</div>

