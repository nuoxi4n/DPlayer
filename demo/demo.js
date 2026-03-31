// stats.js: JavaScript Performance Monitor
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
function animate() {
    stats.begin();
    // monitored code goes here
    stats.end();

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

const debugStateEle = document.getElementById('debug-state');
const debugBadgesEle = document.getElementById('debug-badges');
const dp2VolumeInput = document.getElementById('dp2-volume');
const dp2RateSelect = document.getElementById('dp2-rate');
let dpFloat = null;

const readyStateMap = {
    0: 'HAVE_NOTHING',
    1: 'HAVE_METADATA',
    2: 'HAVE_CURRENT_DATA',
    3: 'HAVE_FUTURE_DATA',
    4: 'HAVE_ENOUGH_DATA',
};

const networkStateMap = {
    0: 'NETWORK_EMPTY',
    1: 'NETWORK_IDLE',
    2: 'NETWORK_LOADING',
    3: 'NETWORK_NO_SOURCE',
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return String(value);
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDebugTime(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return String(value);
    }

    return `${value.toFixed(2)}s`;
}

function formatDebugFlag(value) {
    return value ? 'on' : 'off';
}

function formatVideoState(video) {
    if (video.ended) {
        return 'ended';
    }

    if (video.paused) {
        return 'paused';
    }

    return 'playing';
}

function formatBufferedRanges(video) {
    if (!video || !video.buffered || video.buffered.length === 0) {
        return '-';
    }

    const ranges = [];

    for (let i = 0; i < video.buffered.length; i++) {
        ranges.push(`${formatDebugTime(video.buffered.start(i))}-${formatDebugTime(video.buffered.end(i))}`);
    }

    return ranges.join(', ');
}

function syncDp2Controls() {
    if (!window.dp2) {
        return;
    }

    if (dp2VolumeInput) {
        dp2VolumeInput.value = String(dp2.video.volume);
    }

    if (dp2RateSelect) {
        dp2RateSelect.value = String(dp2.video.playbackRate);
    }
}

function renderDp2Badges() {
    if (!window.dp2 || !debugBadgesEle) {
        return;
    }

    const video = dp2.video;
    const badges = [
        ['autoplay', dp2.options.autoplay],
        ['muted', video.muted],
        ['loop', video.loop],
        ['playing', !video.paused && !video.ended],
    ];

    debugBadgesEle.innerHTML = badges
        .map(([label, value]) => `<span class="debug-badge ${value ? 'is-on' : 'is-off'}">${escapeHtml(label)}: ${escapeHtml(formatDebugFlag(value))}</span>`)
        .join('');
}

function renderDp2DebugState() {
    if (!window.dp2 || !debugStateEle) {
        return;
    }

    const video = dp2.video;
    const fields = [
        ['autoplay option', formatDebugFlag(dp2.options.autoplay)],
        ['autoplay runtime', formatDebugFlag(video.autoplay)],
        ['muted', formatDebugFlag(video.muted)],
        ['loop', formatDebugFlag(video.loop)],
        ['state', formatVideoState(video)],
        ['current time', formatDebugTime(video.currentTime)],
        ['duration', formatDebugTime(video.duration)],
        ['volume', `${formatNumber(video.volume * 100)}%`],
        ['playback rate', `${formatNumber(video.playbackRate)}x`],
        ['ready state', readyStateMap[video.readyState] || String(video.readyState)],
        ['network state', networkStateMap[video.networkState] || String(video.networkState)],
        ['buffered', formatBufferedRanges(video)],
        ['resolution', `${video.videoWidth || '-'} x ${video.videoHeight || '-'}`],
        ['video type', dp2.options.video.type],
        ['current src', video.currentSrc || video.src || '-'],
        ['danmaku enabled', !!dp2.options.danmaku],
    ];

    debugStateEle.innerHTML = fields
        .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
        .join('');

    renderDp2Badges();
    syncDp2Controls();
}

function setDp2Volume(value) {
    if (!window.dp2) {
        return;
    }

    dp2.volume(value, true, true);
    renderDp2DebugState();
}

function setDp2PlaybackRate(value) {
    if (!window.dp2) {
        return;
    }

    dp2.speed(parseFloat(value));
    renderDp2DebugState();
}

function setDp2Muted(nextMuted) {
    if (!window.dp2) {
        return;
    }

    const muted = Boolean(nextMuted);

    if (muted) {
        dp2.video.muted = true;
        dp2.bar.set('volume', 0, 'width');
        dp2.template.volumeBarWrapWrap.dataset.balloon = '0%';
        dp2.switchVolumeIcon();
    } else {
        const restoredVolume = dp2.video.volume > 0 ? dp2.video.volume : (dp2.user.get('volume') || dp2.options.volume || 0.2);
        dp2.volume(restoredVolume, true, true);
    }

    renderDp2DebugState();
}

function toggleDp2Loop() {
    if (!window.dp2) {
        return;
    }

    dp2.video.loop = !dp2.video.loop;
    dp2.options.loop = dp2.video.loop;
    renderDp2DebugState();
}

function toggleDp2Muted() {
    if (!window.dp2) {
        return;
    }

    setDp2Muted(!dp2.video.muted);
}

function initFloatPlayer() {
    if (dpFloat) {
        return dpFloat;
    }

    dpFloat = new DPlayer({
        container: document.getElementById('dplayer-container'),
        preload: 'none',
        screenshot: true,
        video: {
            url: 'http://static.smartisanos.cn/common/video/t1-ui.mp4',
            pic: 'http://static.smartisanos.cn/pr/img/video/video_03_cc87ce5bdb.jpg',
            thumbnails: 'http://static.smartisanos.cn/pr/img/video/video_03_cc87ce5bdb.jpg'
        },
        subtitle: {
            url: 'subtitle test'
        },
        danmaku: {
            id: '9E2E3368B56CDBB4',
            api: 'https://api.prprpr.me/dplayer/'
        }
    });

    window.dpFloat = dpFloat;

    return dpFloat;
}

initPlayers();
handleEvent();

function handleEvent() {
    document.getElementById('dplayer-dialog').addEventListener('click', (e) => {
        const $clickDom = e.currentTarget;
        const isShowStatus = $clickDom.getAttribute('data-show');

        if (isShowStatus) {
            document.getElementById('float-dplayer').style.display = 'none';
        } else {
            $clickDom.setAttribute('data-show', 1);
            document.getElementById('float-dplayer').style.display = 'block';
            const floatPlayer = initFloatPlayer();

            window.requestAnimationFrame(() => {
                floatPlayer.resize();
            });
        }
    });

    document.getElementById('close-dialog').addEventListener('click', () => {
        const $openDialogBtnDom = document.getElementById('dplayer-dialog');

        $openDialogBtnDom.setAttribute('data-show', '');
        document.getElementById('float-dplayer').style.display = 'none';
    });
}

function initPlayers() {
    // dp1
    window.dp1 = new DPlayer({
        container: document.getElementById('dplayer1'),
        preload: 'none',
        screenshot: true,
        video: {
            url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png',
            thumbnails: 'https://i.loli.net/2019/06/06/5cf8c5d9cec8510758.jpg'
        },
        subtitle: {
            url: [
                {
                    url: 'https://s-sh-17-dplayercdn.oss.dogecdn.com/hikarunara.vtt',
                    lang: 'zh-cn',
                    name: '光',
                },
                {
                    url: 'https://gist.githubusercontent.com/samdutton/ca37f3adaf4e23679957b8083e061177/raw/e19399fbccbc069a2af4266e5120ae6bad62699a/sample.vtt',
                    lang: 'en-us',
                    name: 'github',
                },
            ],
            defaultSubtitle: 7,
            type: 'webvtt',
            fontSize: '25px',
            bottom: '10%',
            color: '#b7daff'
        },
        danmaku: {
            id: '9E2E3368B56CDBB4',
            api: 'https://api.prprpr.me/dplayer/',
            addition: ['https://s-sh-17-dplayercdn.oss.dogecdn.com/1678963.json']
        }
    });

    // dp2
    window.dp2 = new DPlayer({
        container: document.getElementById('dplayer2'),
        preload: 'none',
        autoplay: false,
        theme: '#FADFA3',
        loop: true,
        screenshot: true,
        airplay: true,
        chromecast: true,
        hotkey: true,
        logo: 'https://i.loli.net/2019/06/06/5cf8c5d94521136430.png',
        volume: 0.2,
        mutex: true,
        lang: 'zh-cn',
        video: {
            url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png',
            thumbnails: 'https://i.loli.net/2019/06/06/5cf8c5d9cec8510758.jpg',
            type: 'auto'
        },
        subtitle: {
            url: 'https://s-sh-17-dplayercdn.oss.dogecdn.com/hikarunara.vtt',
            type: 'webvtt',
            fontSize: '25px',
            bottom: '10%',
            color: '#b7daff'
        },
        danmaku: {
            id: '9E2E3368B56CDBB4',
            api: 'https://api.prprpr.me/dplayer/',
            addition: ['https://s-sh-17-dplayercdn.oss.dogecdn.com/1678963.json'],
            token: 'tokendemo',
            maximum: 3000,
            user: 'DIYgod',
            bottom: '15%',
            unlimited: true,
            speedRate: 0.5,
        },
        contextmenu: [
            {
                text: 'custom contextmenu',
                link: 'https://github.com/MoePlayer/DPlayer'
            }
        ]
    });

    const debugEvents = [
        'loadedmetadata',
        'play',
        'playing',
        'pause',
        'timeupdate',
        'volumechange',
        'ratechange',
        'seeked',
        'waiting',
        'ended',
        'resize',
        'fullscreen',
        'fullscreen_cancel',
        'webfullscreen',
        'webfullscreen_cancel',
    ];

    debugEvents.forEach((eventName) => {
        dp2.on(eventName, renderDp2DebugState);
    });

    if (dp2VolumeInput) {
        dp2VolumeInput.addEventListener('input', (event) => {
            setDp2Volume(event.target.value);
        });
    }

    if (dp2RateSelect) {
        dp2RateSelect.addEventListener('change', (event) => {
            setDp2PlaybackRate(event.target.value);
        });
    }

    renderDp2DebugState();

    const events = [
        'abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended', 'error',
        'loadeddata', 'loadedmetadata', 'loadstart', 'mozaudioavailable', 'pause', 'play',
        'playing', 'ratechange', 'seeked', 'seeking', 'stalled',
        'volumechange', 'waiting',
        'screenshot',
        'thumbnails_show', 'thumbnails_hide',
        'danmaku_show', 'danmaku_hide', 'danmaku_clear',
        'danmaku_loaded', 'danmaku_send', 'danmaku_opacity',
        'contextmenu_show', 'contextmenu_hide',
        'notice_show', 'notice_hide',
        'quality_start', 'quality_end',
        'destroy',
        'resize',
        'fullscreen', 'fullscreen_cancel', 'webfullscreen', 'webfullscreen_cancel',
        'subtitle_show', 'subtitle_hide', 'subtitle_change'
    ];
    const eventsEle = document.getElementById('events');
    for (let i = 0; i < events.length; i++) {
        dp2.on(events[i], (info) => {
            eventsEle.innerHTML += `<p>Event: ${events[i]} ${info?`Data: <span>${JSON.stringify(info)}</span>`:''}</p>`;
            eventsEle.scrollTop = eventsEle.scrollHeight;
        });
    }

    // dp3
    window.dp3 = new DPlayer({
        container: document.getElementById('dplayer3'),
        preload: 'none',
        video: {
            quality: [{
                name: 'HD',
                url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                type: 'hls'
            }, {
                name: 'SD',
                url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
                type: 'normal'
            }],
            defaultQuality: 0,
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png'
        }
    });

    // dp4
    window.dp4 = new DPlayer({
        container: document.getElementById('dplayer4'),
        preload: 'none',
        video: {
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            type: 'hls'
        }
    });

    // dp5
    window.dp5 = new DPlayer({
        container: document.getElementById('dplayer5'),
        preload: 'none',
        video: {
            url: 'https://artplayer.org/assets/sample/video.flv',
            type: 'flv'
        }
    });

    // dp8
    window.dp8 = new DPlayer({
        container: document.getElementById('dplayer8'),
        preload: 'none',
        video: {
            url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
            type: 'dash'
        }
    });

    // dp9
    window.dp9 = new DPlayer({
        container: document.getElementById('dplayer9'),
        video: {
            url: 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
            type: 'webtorrent'
        }
    });

    // dp6
    window.dp6 = new DPlayer({
        container: document.getElementById('dplayer6'),
        preload: 'none',
        live: true,
        danmaku: true,
        apiBackend: {
            read: function (options) {
                console.log('假装 WebSocket 连接成功');
                options.success && options.success([]);
            },
            send: function (options) {
                console.log('假装通过 WebSocket 发送数据', options.data);
                options.success && options.success();
            }
        },
        video: {
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            type: 'hls'
        }
    });

    // dp10
    window.dp10 = new DPlayer({
        container: document.getElementById('dplayer10'),
        video: {
            url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            type: 'pearplayer',
            customType: {
                pearplayer: function (video, player) {
                    const pearPlayerId = `pearplayer-${Date.now()}-${Math.random().toString(16).slice(2)}`;

                    video.id = pearPlayerId;
                    new PearPlayer(`#${pearPlayerId}`, {
                        src: video.src,
                        autoplay: player.options.autoplay
                    });
                }
            }
        }
    });
}

function clearPlayers() {
    for (let i = 0; i < 6; i++) {
        window['dp' + (i + 1)].pause();
        document.getElementById('dplayer' + (i + 1)).innerHTML = '';
    }
}

function switchDPlayer() {
    if (dp2.options.danmaku.id !== '5rGf5Y2X55qu6Z2p') {
        dp2.switchVideo({
            url: 'http://static.smartisanos.cn/common/video/t1-ui.mp4',
            pic: 'http://static.smartisanos.cn/pr/img/video/video_03_cc87ce5bdb.jpg',
            type: 'auto',
        }, {
            id: '5rGf5Y2X55qu6Z2p',
            api: 'https://api.prprpr.me/dplayer/',
            maximum: 3000,
            user: 'DIYgod'
        });
    } else {
        dp2.switchVideo({
            url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png',
            thumbnails: 'https://i.loli.net/2019/06/06/5cf8c5d9cec8510758.jpg',
            type: 'auto'
        }, {
            id: '9E2E3368B56CDBB42',
            api: 'https://api.prprpr.me/dplayer/',
            maximum: 3000,
            user: 'DIYgod'
        });
    }

    renderDp2DebugState();
}