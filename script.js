// 全局变量
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const previewSection = document.getElementById('previewSection');
const resultsSection = document.getElementById('resultsSection');
const previewImage = document.getElementById('previewImage');
const resetBtn = document.getElementById('resetBtn');
const noData = document.getElementById('noData');

// 事件监听
selectFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFile(files[0]);
    }
});

resetBtn.addEventListener('click', () => {
    resetUI();
});

// 文件处理
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件!');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const image = new Image();

        image.onload = function() {
            previewImage.src = e.target.result;
            previewSection.classList.remove('hidden');
            uploadArea.parentElement.classList.add('hidden');

            displayBasicInfo(file, image);
            extractEXIFData(e.target.result);
        };

        image.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// 显示基础信息
function displayBasicInfo(file, image) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileType').textContent = file.type || '未知';
    document.getElementById('imageDimensions').textContent = `${image.width} x ${image.height}`;
}

// 提取EXIF数据
function extractEXIFData(imageData) {
    const image = new Image();

    image.onload = function() {
        EXIF.getData(image, function() {
            const allTags = EXIF.getAllTags(this);
            const hasExif = Object.keys(allTags).length > 0;

            if (hasExif) {
                displayCaptureInfo(allTags);
                displayCameraSettings(allTags);
                displayLocationInfo(allTags);
                resultsSection.classList.remove('hidden');
                noData.classList.add('hidden');
            } else {
                resultsSection.classList.remove('hidden');
                noData.classList.remove('hidden');
            }
        });
    };

    image.src = imageData;
}

// 显示拍摄信息
function displayCaptureInfo(tags) {
    const dateTimeOriginal = tags.DateTimeOriginal || tags.DateTime;
    if (dateTimeOriginal) {
        const formattedDate = formatDate(dateTimeOriginal);
        document.getElementById('captureDate').textContent = formattedDate;
    }

    document.getElementById('cameraMake').textContent = tags.Make || '-';
    document.getElementById('cameraModel').textContent = tags.Model || '-';
    document.getElementById('software').textContent = tags.Software || '-';
}

// 显示拍摄参数
function displayCameraSettings(tags) {
    document.getElementById('aperture').textContent = tags.FNumber ? `f/${tags.FNumber}` : '-';
    document.getElementById('shutterSpeed').textContent = formatShutterSpeed(tags.ExposureTime);
    document.getElementById('iso').textContent = tags.ISOSpeedRatings || tags.ISO || '-';
    document.getElementById('focalLength').textContent = tags.FocalLength ? `${tags.FocalLength}mm` : '-';
    document.getElementById('flash').textContent = formatFlash(tags.Flash);
}

// 显示地理位置
async function displayLocationInfo(tags) {
    const lat = tags.GPSLatitude;
    const latRef = tags.GPSLatitudeRef;
    const lon = tags.GPSLongitude;
    const lonRef = tags.GPSLongitudeRef;

    if (lat && latRef && lon && lonRef) {
        const latitude = convertDMSToDD(lat, latRef);
        const longitude = convertDMSToDD(lon, lonRef);

        document.getElementById('latitude').textContent = latitude.toFixed(6);
        document.getElementById('longitude').textContent = longitude.toFixed(6);

        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        document.getElementById('mapsLink').href = mapsUrl;

        try {
            const address = await reverseGeocode(latitude, longitude);
            document.getElementById('location').textContent = address;
        } catch (error) {
            document.getElementById('location').textContent = '无法获取地址信息';
        }
    } else {
        document.getElementById('latitude').textContent = '-';
        document.getElementById('longitude').textContent = '-';
        document.getElementById('location').textContent = '-';
        document.getElementById('mapsLink').style.display = 'none';
    }
}

// 工具函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    try {
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split(':');
        const [hour, minute, second] = timePart.split(':');

        const date = new Date(year, month - 1, day, hour, minute, second);

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };

        return date.toLocaleDateString('zh-CN', options);
    } catch (error) {
        return dateString;
    }
}

function formatShutterSpeed(exposureTime) {
    if (!exposureTime) return '-';

    if (exposureTime < 1) {
        const denominator = Math.round(1 / exposureTime);
        return `1/${denominator}s`;
    } else {
        return `${exposureTime}s`;
    }
}

function formatFlash(flashValue) {
    if (!flashValue) return '-';

    const flashStates = {
        0: '未闪光',
        1: '闪光',
        5: '闪光,未检测到回光',
        7: '闪光,检测到回光',
        9: '强制闪光',
        13: '强制闪光,未检测到回光',
        15: '强制闪光,检测到回光',
        16: '不闪光',
        24: '不闪光,自动模式',
        25: '闪光,自动模式',
        29: '闪光,自动模式,未检测到回光',
        31: '闪光,自动模式,检测到回光'
    };

    return flashStates[flashValue] || '未知';
}

function convertDMSToDD(dms, ref) {
    const degrees = dms[0] + dms[1] / 60 + dms[2] / 3600;
    return (ref === 'S' || ref === 'W') ? -degrees : degrees;
}

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh-CN`
        );

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (data && data.address) {
            const addressParts = [];

            if (data.address.city) addressParts.push(data.address.city);
            if (data.address.town) addressParts.push(data.address.town);
            if (data.address.village) addressParts.push(data.address.village);
            if (data.address.county) addressParts.push(data.address.county);
            if (data.address.state) addressParts.push(data.address.state);
            if (data.address.country) addressParts.push(data.address.country);

            return addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
        }

        return '无法获取地址信息';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return '无法获取地址信息';
    }
}

function resetUI() {
    fileInput.value = '';
    previewSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    uploadArea.parentElement.classList.remove('hidden');

    const fields = ['fileName', 'fileSize', 'fileType', 'imageDimensions', 
                   'captureDate', 'cameraMake', 'cameraModel', 'software',
                   'aperture', 'shutterSpeed', 'iso', 'focalLength', 'flash',
                   'latitude', 'longitude', 'location'];
    
    fields.forEach(field => {
        document.getElementById(field).textContent = '-';
    });

    document.getElementById('mapsLink').href = '#';
    document.getElementById('mapsLink').style.display = '';
}
