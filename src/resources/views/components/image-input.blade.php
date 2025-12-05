@php
    $multiple = $multiple ?? false;
    $inputName = $multiple ? config('seo-images.multiple_name_pattern', 'images[]') : $name;
    $wrapperClass = $multiple ? 'seo-image-input-wrapper seo-image-multiple' : 'seo-image-input-wrapper';
    $namePattern = $multiple ? config('seo-images.multiple_name_pattern', 'images[]') : $name;
@endphp

<div class="{{ $wrapperClass }}" data-name="{{ $name }}" data-multiple="{{ $multiple ? 'true' : 'false' }}"
    data-name-pattern="{{ $namePattern }}">
    @if ($multiple)
        {{-- Çoklu seçim için gizli input'lar --}}
        <div class="seo-image-multiple-inputs"></div>
        <div class="seo-image-selected-list" style="margin-top: 10px; display: none;">
            <div class="selected-images-sortable"></div>
            <small class="text-muted d-block mt-2">Sıralamak için resimleri sürükleyip bırakın</small>
        </div>
        <button type="button" class="btn btn-primary seo-image-select-btn" data-bs-toggle="modal"
            data-bs-target="#seoImageModal">
            Resim Seç (Çoklu)
        </button>
        <button type="button" class="btn btn-danger seo-image-clear-all-btn" style="display: none;">
            Tümünü Temizle
        </button>
    @else
        {{-- Tekli seçim için normal input --}}
        <input type="text" name="{{ $inputName }}" id="{{ $name }}" value="{{ old($name, $value ?? '') }}"
            class="seo-image-input form-control" readonly placeholder="Resim seçmek için tıklayın">
        <button type="button" class="btn btn-primary seo-image-select-btn" data-bs-toggle="modal"
            data-bs-target="#seoImageModal">
            Resim Seç
        </button>
        <button type="button" class="btn btn-danger seo-image-remove-btn" style="display: none;">
            Kaldır
        </button>
        <div class="seo-image-preview" style="margin-top: 10px; display: none;">
            <img src="" alt="Preview" style="max-width: 200px; max-height: 200px;">
        </div>
    @endif
</div>

@php
    // CSS ve JS'yi sadece bir kez yükle
    static $assetsLoaded = false;
    if (!$assetsLoaded) {
        $assetsLoaded = true;
@endphp
@push('styles')
<link href="{{ asset('vendor/seo-images/css/seo-images.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ asset('vendor/seo-images/js/seo-images.js') }}"></script>
@endpush
@php
    }
    
    // Modal'ı sadece bir kez include et
    static $modalIncluded = false;
    if (!$modalIncluded) {
        $modalIncluded = true;
@endphp
@include('seo-images::modal')
@php
    }
@endphp
