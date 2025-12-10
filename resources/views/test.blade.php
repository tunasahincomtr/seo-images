<!DOCTYPE html>
<html lang="tr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SEO Images - Test Sayfası</title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Package Assets -->
    @seoimagesScripts

    <style>
        body {
            padding: 2rem 0;
        }

        .test-section {
            margin-bottom: 3rem;
            padding: 2rem;
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            background-color: #f8f9fa;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1 class="mb-4">SEO Images Paket Test Sayfası</h1>

        <div class="alert alert-info">
            <strong>Not:</strong> Bu sayfa paketin tüm özelliklerini test etmek için oluşturulmuştur.
        </div>

        <!-- Test Form -->
        <form method="POST" action="#" class="test-section">
            @csrf

            <h2>1. Tekli Görsel Seçimi</h2>
            <p class="text-muted">@seoinput('cover_image') directive kullanımı</p>
            @seoinput('cover_image')

            <hr class="my-4">

            <h2>2. Galeri (Çoklu Görsel Seçimi)</h2>
            <p class="text-muted">@seoinput('gallery', 'multiple') directive kullanımı</p>
            @seoinput('gallery', 'multiple')

            <hr class="my-4">

            <h2>3. Seçilmiş Görseli Gösterme</h2>
            <p class="text-muted">@seoimages directive kullanımı (örnek - gerçek bir görsel yükleyip test edin)</p>
            <div class="mb-3">
                <label class="form-label">Örnek Görsel (folder_path girin):</label>
                <input type="text" class="form-control" id="example-folder-path" placeholder="Örn: 2025/12/10/x"
                    value="">
                <button type="button" class="btn btn-sm btn-secondary mt-2"
                    onclick="updateExampleImage()">Güncelle</button>
            </div>
            <div id="example-image-container">
                <p class="text-muted">Yukarıdaki alana bir folder_path girin ve güncelle butonuna basın.</p>
            </div>

            <hr class="my-4">

            <button type="submit" class="btn btn-primary mt-3">
                Test Formunu Gönder
            </button>
        </form>

        <div class="test-section">
            <h2>Form Verileri (Test)</h2>
            <p class="text-muted">Form gönderildiğinde burada görünecek:</p>
            <pre id="form-data" class="bg-light p-3 rounded"></pre>
        </div>
    </div>

    <!-- Include Modal -->
    @include('seo-images::modal')

    <script>
        // Form submit handler (test için)
        $('form').on('submit', function(e) {
            e.preventDefault();
            var formData = {
                cover_image: $('input[name="cover_image"]').val(),
                gallery: $('input[name="gallery"]').val()
            };
            $('#form-data').text(JSON.stringify(formData, null, 2));
            alert('Form verileri konsola yazdırıldı!');
        });

        // Update example image
        function updateExampleImage() {
            var folderPath = $('#example-folder-path').val();
            if (folderPath) {
                // Make AJAX call to render image
                $.ajax({
                    url: '/seo-images/list',
                    method: 'GET',
                    data: {
                        per_page: 100
                    },
                    success: function(response) {
                        var image = response.data.find(function(img) {
                            return img.folder_path === folderPath;
                        });
                        if (image) {
                            // Use the @seoimages directive output would be here
                            // For now, just show preview
                            $('#example-image-container').html(
                                '<img src="' + image.preview_url + '" class="img-fluid" alt="' + (image
                                    .alt || '') + '">'
                            );
                        } else {
                            $('#example-image-container').html(
                                '<p class="text-danger">Görsel bulunamadı. Lütfen geçerli bir folder_path girin.</p>'
                                );
                        }
                    }
                });
            }
        }

        // Watch for input changes and update preview
        $(document).on('change', 'input[name="cover_image"], input[name="gallery"]', function() {
            console.log('Input changed:', $(this).val());
        });
    </script>
</body>

</html>
