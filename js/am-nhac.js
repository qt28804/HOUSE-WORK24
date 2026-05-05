// ============================================================
// am-nhac.js — Logic cho trang Âm nhạc
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavbar();

    // Enter key trên ô input link
    document.getElementById('linkInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') loadLink();
    });
});

// ── Detect link type ──
function detectType(url) {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/soundcloud\.com/.test(url))        return 'soundcloud';
    if (/spotify\.com/.test(url))           return 'spotify';
    if (/\.(mp3|ogg|wav|aac|flac)(\?|$)/i.test(url)) return 'mp3';
    return 'iframe'; // fallback
}

// ── Convert to embed URL ──
function toEmbedUrl(url, type) {
    if (type === 'youtube') {
        let id = '';
        const m1 = url.match(/[?&]v=([^&]+)/);
        const m2 = url.match(/youtu\.be\/([^?]+)/);
        const m3 = url.match(/embed\/([^?]+)/);
        if (m1) id = m1[1];
        else if (m2) id = m2[1];
        else if (m3) id = m3[1];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
    }
    if (type === 'soundcloud') {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&color=%23667eea`;
    }
    if (type === 'spotify') {
        return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    return url;
}

// ── Show player ──
function showPlayer(src, type) {
    const placeholder = document.getElementById('playerPlaceholder');
    const frame       = document.getElementById('playerFrame');
    const audioEl     = document.getElementById('audioEl');

    placeholder.style.display = 'none';
    frame.style.display       = 'none';
    audioEl.style.display     = 'none';

    if (type === 'mp3') {
        audioEl.src = src;
        audioEl.style.display = 'block';
        audioEl.style.padding = '1rem';
        audioEl.play().catch(() => {});
    } else {
        frame.src    = src;
        frame.height = type === 'spotify' ? '152' : type === 'soundcloud' ? '166' : '200';
        frame.style.display = 'block';
    }
}

// ── Load from input ──
function loadLink() {
    const raw = document.getElementById('linkInput').value.trim();
    if (!raw) { alert('Vui lòng dán link nhạc vào ô trên!'); return; }
    const type = detectType(raw);
    const src  = (type === 'mp3') ? raw : toEmbedUrl(raw, type);
    showPlayer(src, type);
}

// ── Play sample ──
function playSample(src, type) {
    document.getElementById('linkInput').value = src;
    showPlayer(src, type);
}
