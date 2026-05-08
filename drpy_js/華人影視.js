/**
 * 華人影視（HRTV）
 * 播放問題已修復 - 2026年1月18日更新
 * 篩選功能已增強 - 2026年1月20日更新
 */

// ========== 基礎配置 ==========
const baseUrl = 'https://www.men.cc';  // 華人影視域名
const siteName = 'HRTV';               // 網站名稱

// ========== 爬蟲接口函數 ==========

async function init(cfg) {
    console.log(`[${siteName}] 爬蟲初始化`);
    return {
        sites: [{
            key: 'hrtv',
            name: siteName,
            type: 3,
            searchable: 1,
            changeable: 1,
            ext: '.html'
        }],
        player: {
            decode: 0,
            parse: 0,
            jx: 0
        }
    };
}

async function homeContent(filter) {
    // 定義通用的篩選選項
    const commonFilters = [
        {
            key: "sort",
            name: "排序",
            value: [
                { n: "最新", v: "time" },
                { n: "熱度", v: "hits" },
                { n: "評分", v: "score" }
            ]
        },
        {
            key: "area",
            name: "地區",
            value: [
                { n: "全部", v: "" },
                { n: "大陸", v: "大陸" },
                { n: "香港", v: "香港" },
                { n: "台灣", v: "台灣" },
                { n: "美國", v: "美國" },
                { n: "日本", v: "日本" },
                { n: "韓國", v: "韓國" },
                { n: "泰國", v: "泰國" },
                { n: "英國", v: "英國" }
            ]
        },
        {
            key: "year",
            name: "年份",
            value: [
                { n: "全部", v: "" },
                { n: "2026", v: "2026" },
                { n: "2025", v: "2025" },
                { n: "2024", v: "2024" },
                { n: "2023", v: "2023" },
                { n: "2022", v: "2022" },
                { n: "2021", v: "2021" },
                { n: "2020", v: "2020" },
                { n: "2019", v: "2019" },
                { n: "2018", v: "2018" }
            ]
        }
    ];

    return {
        class: [
            { type_id: "1", type_name: "電影" },
            { type_id: "2", type_name: "連續劇" },
            { type_id: "4", type_name: "動漫" },
            { type_id: "31", type_name: "紀錄片" },
            { type_id: "6", type_name: "喜劇" },
            { type_id: "7", type_name: "愛情" },
            { type_id: "9", type_name: "動作" },
            { type_id: "10", type_name: "科幻" },
            { type_id: "8", type_name: "恐怖" },
            { type_id: "11", type_name: "劇情" }
        ],
        filters: {
            "1": commonFilters,
            "2": commonFilters,
            "4": commonFilters,
            "31": commonFilters,
            "6": commonFilters,
            "7": commonFilters,
            "9": commonFilters,
            "10": commonFilters,
            "8": commonFilters,
            "11": commonFilters
        }
    };
}

async function homeVideoContent() {
    try {
        const url = `${baseUrl}/index.php/vod/show/id/1.html`;
        const res = await req(url);
        
        if (res.error) {
            return Result.error(`獲取失敗: ${res.error}`);
        }
        
        const html = res.body;
        const videos = extractVideosFromHTML(html);
        
        return Result.list(videos.slice(0, 20));
        
    } catch (error) {
        return Result.error(`首頁錯誤: ${error.message}`);
    }
}

async function categoryContent(tid, pg, filter, extend) {
    try {
        const page = pg || 1;
        let url = '';
        
        const params = [];
        params.push(`id/${tid}`);
        
        if (extend) {
            if (extend.area) params.push(`area/${encodeURIComponent(extend.area)}`);
            if (extend.year) params.push(`year/${extend.year}`);
            if (extend.sort) params.push(`by/${extend.sort}`);
        }
        
        // 如果沒有指定排序，默認按時間
        if (!extend || !extend.sort) {
            params.push(`by/time`);
        }
        
        params.push(`page/${page}`);
        url = `${baseUrl}/index.php/vod/show/${params.join('/')}.html`;
        
        const res = await req(url);
        if (res.error) {
            return Result.error(`請求失敗: ${res.error}`);
        }
        
        const html = res.body;
        const videos = extractVideosFromHTML(html);
        const pageInfo = extractPaginationInfo(html);
        
        return {
            code: 1,
            msg: "成功",
            list: videos,
            page: page,
            pagecount: pageInfo.pagecount || 1,
            limit: 24,
            total: pageInfo.total || videos.length
        };
        
    } catch (error) {
        return Result.error(`分類錯誤: ${error.message}`);
    }
}

async function detailContent(ids) {
    try {
        if (!ids || !ids[0]) {
            return Result.error('缺少視頻ID');
        }
        
        const vodId = ids[0];
        const url = `${baseUrl}/index.php/vod/detail/id/${vodId}.html`;
        
        const res = await req(url);
        if (res.error) {
            return Result.error(`詳情失敗: ${res.error}`);
        }
        
        const html = res.body;
        const video = extractDetailFromHTML(html, vodId);
        
        return {
            code: 1,
            msg: "成功",
            list: [video]
        };
    } catch (error) {
        return Result.error(`詳情錯誤: ${error.message}`);
    }
}

async function searchContent(key, quick, pg) {
    try {
        const encodedKey = encodeURIComponent(key.trim());
        const page = pg || 1;
        const url = `${baseUrl}/index.php/vod/search/wd/${encodedKey}/page/${page}.html`;
        
        const res = await req(url);
        if (res.error) return Result.error(`搜索失敗: ${res.error}`);
        
        const html = res.body;
        const videos = extractVideosFromHTML(html);
        const pageInfo = extractPaginationInfo(html);
        
        return {
            code: 1,
            msg: "成功",
            list: videos,
            page: page,
            pagecount: pageInfo.pagecount || 1,
            total: pageInfo.total || videos.length
        };
    } catch (error) {
        return Result.error(`搜索錯誤: ${error.message}`);
    }
}

async function playerContent(flag, id, vipFlags) {
    try {
        let vodId, sid = "1", nid = "1";
        if (id.includes('-')) {
            const parts = id.split('-');
            vodId = parts[0];
            sid = parts[1] || "1";
            nid = parts[2] || "1";
        } else {
            vodId = id;
        }
        
        const playUrl = `${baseUrl}/index.php/vod/play/id/${vodId}/sid/${sid}/nid/${nid}.html`;
        const playRes = await req(playUrl);
        if (playRes.error) return Result.error(`獲取播放頁失敗: ${playRes.error}`);
        
        const playHtml = playRes.body;
        let videoUrl = extractPlayerUrlFromHTML(playHtml);
        
        if (!videoUrl) videoUrl = extractVideoUrlFromJavaScript(playHtml);
        
        if (videoUrl) {
            return {
                url: fixUrl(videoUrl),
                parse: 0,
                header: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': baseUrl
                }
            };
        } else {
            return { url: playUrl, parse: 1 };
        }
    } catch (error) {
        return Result.error(`播放錯誤: ${error.message}`);
    }
}

// ========== 解析工具函數 ==========

function extractPlayerUrlFromHTML(html) {
    try {
        const playerVarMatch = html.match(/var\s+player_aaaa\s*=\s*({[\s\S]*?});/);
        if (playerVarMatch) {
            const playerDataStr = playerVarMatch[1];
            const urlMatch = playerDataStr.match(/"url"\s*:\s*"([^"]+)"/);
            if (urlMatch) {
                return urlMatch[1].replace(/\\\//g, '/');
            }
        }
        return null;
    } catch (e) { return null; }
}

function extractVideoUrlFromJavaScript(html) {
    const m3u8Pattern = /(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/g;
    const matches = html.match(m3u8Pattern);
    if (matches) {
        for (let url of matches) {
            if (!url.includes('baidu') && !url.includes('ads')) return url.replace(/\\\//g, '/');
        }
    }
    return null;
}

function extractVideosFromHTML(html) {
    const videos = [];
    const itemPattern = /<li class="hl-list-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = itemPattern.exec(html)) !== null) {
        const itemHtml = match[0];
        const idMatch = itemHtml.match(/\/id\/(\d+)\.html/);
        const titleMatch = itemHtml.match(/title="([^"]+)"/);
        const imgMatch = itemHtml.match(/data-original="([^"]+)"/);
        const remarksMatch = itemHtml.match(/class="[^"]*remarks[^"]*"[^>]*>([^<]+)<\/span>/);
        
        if (idMatch && titleMatch) {
            videos.push({
                vod_id: idMatch[1],
                vod_name: titleMatch[1],
                vod_pic: fixUrl(imgMatch ? imgMatch[1] : ''),
                vod_remarks: remarksMatch ? remarksMatch[1] : ''
            });
        }
    }
    return videos;
}

function extractDetailFromHTML(html, vodId) {
    const video = { vod_id: vodId, vod_name: '', vod_pic: '', vod_play_from: '暴風資源' };
    const titleMatch = html.match(/<h2 class="hl-dc-title[^>]*>([^<]+)<\/h2>/);
    if (titleMatch) video.vod_name = titleMatch[1];
    
    const imgMatch = html.match(/data-original="([^"]+)"/);
    if (imgMatch) video.vod_pic = fixUrl(imgMatch[1]);

    const playListMatch = html.match(/<ul class="hl-plays-list[^>]*>([\s\S]*?)<\/ul>/);
    if (playListMatch) {
        const episodePattern = /href="\/index\.php\/vod\/play\/id\/\d+\/sid\/(\d+)\/nid\/(\d+)\.html"[^>]*>([^<]+)<\/a>/g;
        const episodes = [];
        let epMatch;
        while ((epMatch = episodePattern.exec(playListMatch[1])) !== null) {
            episodes.push(`${epMatch[3]}$${vodId}-${epMatch[1]}-${epMatch[2]}`);
        }
        video.vod_play_url = episodes.join('#');
    }
    return video;
}

function extractPaginationInfo(html) {
    const info = { pagecount: 1, total: 0 };
    const totalMatch = html.match(/共[^<]*<em[^>]*>(\d+)<\/em>/);
    if (totalMatch) info.total = parseInt(totalMatch[1]);
    const pages = html.match(/\/page\/(\d+)\.html/g);
    if (pages) {
        const nums = pages.map(p => parseInt(p.match(/\d+/)[0]));
        info.pagecount = Math.max(...nums);
    }
    return info;
}

function fixUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    return baseUrl + (url.startsWith('/') ? '' : '/') + url;
}

function cleanText(text) {
    return text ? text.replace(/<[^>]+>/g, '').trim() : '';
}

function req(url) {
    return new Promise((resolve) => {
        if (typeof Java !== 'undefined' && Java.req) {
            resolve(Java.req(url));
        } else {
            fetch(url).then(r => r.text()).then(body => resolve({ body })).catch(e => resolve({ error: e.message }));
        }
    });
}

const Result = {
    list: (v) => ({ code: 1, msg: "成功", list: v, page: 1, pagecount: 1, total: v.length }),
    error: (m) => ({ code: 0, msg: m, list: [] })
};

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, homeContent, homeVideoContent, categoryContent, detailContent, searchContent, playerContent };
} else {
    Object.assign(window, { init, homeContent, homeVideoContent, categoryContent, detailContent, searchContent, playerContent });
}