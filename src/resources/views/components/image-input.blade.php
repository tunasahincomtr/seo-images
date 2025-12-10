@php
    $multiple = $multiple ?? false;
    // Input name: tekli seçimde "image", çoklu seçimde "images[]"
    // Eğer name verilmemişse, tekli için "image", çoklu için "images" kullan
    if (!isset($name) || empty($name)) {
        $name = $multiple ? 'images' : 'image';
    }
    $inputName = $multiple ? $name . '[]' : $name;
    $wrapperClass = $multiple ? 'seo-image-input-wrapper seo-image-multiple' : 'seo-image-input-wrapper';
    // Name pattern: çoklu seçimde images[], tekli seçimde image
    $namePattern = $multiple ? $name . '[]' : $name;
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
        <button type="button" class="btn btn-primary seo-image-select-btn">
            Resim Seç (Çoklu)
        </button>
        <button type="button" class="btn btn-danger seo-image-clear-all-btn" style="display: none;">
            Tümünü Temizle
        </button>
    @else
        {{-- Tekli seçim için hidden input --}}
        <input type="hidden" name="{{ $inputName }}" id="seo-image-input-{{ $name }}" value="{{ old($name, $value ?? '') }}"
            class="seo-image-input" data-input-name="{{ $name }}">
        <button type="button" class="btn btn-primary seo-image-select-btn">
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
    
    // Modal'ı sadece bir kez include et - FORM DIŞINDA (body sonunda)
    static $modalIncluded = false;
    if (!$modalIncluded) {
        $modalIncluded = true;
@endphp
@push('modals')
@include('seo-images::modal')
@endpush
@php
    }
@endphp
