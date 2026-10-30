// ==UserScript==
// @name         CODUM InstaCockpit — Instagram Otomasyon & Analiz Paneli
// @namespace    https://codum.tr/
// @version      1.0.0
// @description  Instagram için şifresiz, güvenli F12 kokpit arayüzü: Akıllı Takip (Cinsiyet/Spam filtresi), Takipten Çıkma (Beyaz liste), Reels Beğeni, Hayalet Modu ve 5 Kademeli Hız.
// @author       CODUM.TR
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @icon         https://codum.tr/assets/brand/codum-brand-logo.png
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/**
 * ==============================================================
 *  ⚡ CODUM InstaCockpit Pro VIP — Browser F12 Automation Suite ⚡
 *  Tarayıcı F12 Geliştirici Konsolunda Tek Tıkla Çalışan Tam Sürüm.
 *  - 4 Köşeye Yapışan Mıknatıslı Glassmorphism Cockpit Arayüzü
 *  - 5 Kademeli Akıllı Hız Motoru (Turtle'dan Turbo'ya)
 *  - Hayalet Modu: Hikaye & DM Görüldü Engelleme (İfşa Yok)
 *  - Akıllı Takipten Çıkma & Beyaz Liste (Whitelist)
 *  - Reels Beğen & Otomatik Kaydır (Kalp Teyitli)
 *  - Blob Korumalı Instagram Medya İndirici (MP4 / Fotoğraf)
 *  - SPA Uyumlu Dinamik Profil Takip Rozeti
 *  - Tek Tıkla Penceresiz Acil Durdurma + Canlı Sayaç + Toast Bildirimi
 *  Resmi Web: https://codum.tr/instacockpit
 * ==============================================================
 */

(function(window) {
  "use strict";

  if (!location.hostname.includes("instagram.com")) {
    alert("Lütfen önce https://www.instagram.com adresine girip hesabınıza giriş yapın, ardından bu kodu konsolda (F12) çalıştırın.");
    return;
  }

  // 1. Önceki dock ve stilleri temizle
  const prevDock = document.getElementById("codum-instagram-dock");
  if (prevDock) prevDock.remove();
  const prevStyles = document.getElementById("codum-injected-ui-css");
  if (prevStyles) prevStyles.remove();

  // Temiz Akış yüzünden gizlenmiş olabilecek tüm gönderileri anında geri getir
  try {
    document.querySelectorAll('article[data-codum-hidden], [data-codum-hidden-sidebar]').forEach(el => {
      el.style.removeProperty('display');
      delete el.dataset.codumHidden;
      delete el.dataset.codumHiddenSidebar;
    });
  } catch (_) {}

  // =========================================================================
  // 2. GHOST INTERCEPTOR (GİZLİ HİKAYE & GİZLİ DM İZLEME MOTORU)
  // =========================================================================
  if (!window.__CODUM_GHOST_INSTALLED) {
    window.__CODUM_GHOST_INSTALLED = true;
    window.__CODUM_GHOST_STORIES = true;
    window.__CODUM_GHOST_DM = true;

    async function __codumBodyText(body) {
      if (!body) return '';
      if (typeof body === 'string') return body;
      if (body instanceof URLSearchParams) return body.toString();
      if (body instanceof FormData) return [...body.entries()].map(([k,v]) => `${k}=${typeof v === 'string' ? v : ''}`).join('&');
      if (body instanceof Blob) return body.text();
      if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return new TextDecoder().decode(body);
      return '';
    }

    function __codumBlock(url, body) {
      const u = String(url || '').toLowerCase(), b = String(body || '').toLowerCase();
      const story = /\/stories\/(?:reel\/)?seen/.test(u) || /polarisstories(?:v3)?seenmutation|stories_seen|xdt_seen_reels/.test(b);
      const direct = /\/direct_v2\/.*\/seen\//.test(u) || /threads\/broadcast\/seen/.test(u) || b.includes('polarisdirectthreadseenmutation');
      return (window.__CODUM_GHOST_STORIES && story) || (window.__CODUM_GHOST_DM && direct);
    }

    const __codumPayload = () => JSON.stringify({
      status: 'ok',
      data: {
        xdt_seen_reels: { status: 'ok', success: true },
        polaris_stories_seen: { status: 'ok', success: true },
        direct_v2: { status: 'ok' }
      }
    });

    const __origFetch = window.fetch;
    window.fetch = async function(resource, config) {
      const url = resource instanceof Request ? resource.url : String(resource);
      let body = '';
      if (config && Object.hasOwn(config, 'body')) body = await __codumBodyText(config.body);
      else if (resource instanceof Request) body = await resource.clone().text();
      if (config?.signal?.aborted || (resource instanceof Request && resource.signal.aborted)) {
        throw new DOMException('Aborted', 'AbortError');
      }
      if (__codumBlock(url, body)) {
        return new Response(__codumPayload(), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return __origFetch.apply(this, arguments);
    };

    const __origOpen = XMLHttpRequest.prototype.open;
    const __origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._codumUrl = String(url);
      this._codumSync = rest[0] === false;
      this._codumMock = false;
      return __origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      const finish = (text) => {
        if (!__codumBlock(xhr._codumUrl, text)) return __origSend.call(xhr, body);
        xhr._codumMock = true;
        const val = __codumPayload();
        const response = xhr.responseType === 'json' ? JSON.parse(val) : val;
        for (const [k, v] of Object.entries({ status: 200, statusText: 'OK', readyState: 4, responseURL: xhr._codumUrl, response })) {
          Object.defineProperty(xhr, k, { configurable: true, value: v });
        }
        if (!xhr.responseType || xhr.responseType === 'text') {
          Object.defineProperty(xhr, 'responseText', { configurable: true, value: val });
        }
        const notify = () => {
          for (const name of ['readystatechange', 'load', 'loadend']) xhr.dispatchEvent(new Event(name));
        };
        if (xhr._codumSync) notify(); else setTimeout(notify, 0);
      };
      if (typeof body === 'string' || !body) return finish(body || '');
      if (body instanceof URLSearchParams) return finish(body.toString());
      if (body instanceof FormData) return finish([...body.entries()].map(([k,v]) => `${k}=${v}`).join('&'));
      return __origSend.call(xhr, body);
    };

    if (navigator.sendBeacon) {
      const __origBeacon = navigator.sendBeacon;
      navigator.sendBeacon = function(url, data) {
        if (__codumBlock(url, data)) return true;
        return __origBeacon.apply(this, arguments);
      };
    }
  }

  // =========================================================================
  // 3. F12 BACKGROUND SERVICE WORKER & STORAGE SHIM (TAM YEREL EMÜLATÖR)
  // =========================================================================
  window.chrome = window.chrome || {};

  // 3.1 chrome.storage.local
  window.chrome.storage = window.chrome.storage || {};
  window.chrome.storage.local = {
    get: function(keys, cb) {
      return new Promise((resolve) => {
        const res = {};
        const keyList = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(keys || {});
        for (const k of keyList) {
          try {
            const raw = localStorage.getItem(k);
            if (raw !== null) {
              res[k] = JSON.parse(raw);
            } else if (typeof keys === 'object' && !Array.isArray(keys) && keys[k] !== undefined) {
              res[k] = keys[k];
            }
          } catch (_) {
            res[k] = localStorage.getItem(k);
          }
        }
        if (cb) cb(res);
        resolve(res);
      });
    },
    set: function(obj, cb) {
      return new Promise((resolve) => {
        for (const [k, v] of Object.entries(obj || {})) {
          try {
            localStorage.setItem(k, JSON.stringify(v));
          } catch (e) {
            console.warn('[CODUM F12 Storage] Kaydedilemedi: ' + k, e);
          }
        }
        if (cb) cb();
        resolve();
      });
    },
    remove: function(keys, cb) {
      return new Promise((resolve) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          try { localStorage.removeItem(k); } catch (_) {}
        }
        if (cb) cb();
        resolve();
      });
    }
  };

  // 3.2 chrome.downloads simülasyonu
  window.chrome.downloads = {
    download: async function(options) {
      try {
        const url = options.url;
        const filename = options.filename || ('codum_' + Date.now() + '.jpg');
        const resp = await fetch(url, { credentials: 'omit' });
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(blobUrl);
        }, 2000);
        return 1;
      } catch (err) {
        const a = document.createElement('a');
        a.href = options.url;
        a.download = options.filename || 'media';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1000);
        return 1;
      }
    }
  };

  // 3.3 F12 Background Message Router
  const __F12_LIMITS = {
    follow: ['dailyMaxFollow', 150],
    unfollow: ['dailyMaxUnfollow', 200],
    like: ['dailyMaxLikes', 250],
    comment: ['dailyMaxComments', 50]
  };

  function __f12AccountKey(id) {
    const cleanId = String(id || '').trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      return 'codum_account_local_f12';
    }
    return 'codum_account_' + cleanId;
  }

  function __f12Today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function __f12DailyStats(raw) {
    const todayStr = __f12Today();
    if (raw && raw.date === todayStr) {
      return {
        date: todayStr,
        follow: Number(raw.follow) || 0,
        unfollow: Number(raw.unfollow) || 0,
        like: Number(raw.like) || 0,
        comment: Number(raw.comment) || 0
      };
    }
    return { date: todayStr, follow: 0, unfollow: 0, like: 0, comment: 0 };
  }

  async function __f12Route(req) {
    const type = req.type || req.action;
    const storage = window.chrome.storage.local;

    if (type === 'GET_STATE') {
      const data = await storage.get(['codum_customer', 'codum_settings', 'codum_active_account']);
      const id = req.accountId || data.codum_active_account;
      const key = __f12AccountKey(id);
      const saved = (await storage.get(key))[key] || null;
      return {
        ok: true,
        customer: data.codum_customer || { valid: true, ok: true, plan: 'local', planName: 'F12 Tam VIP Sürüm' },
        settings: data.codum_settings || {},
        accountId: id || null,
        limits: __F12_LIMITS,
        account: { stats: __f12DailyStats(saved?.stats), budget: __f12DailyStats(saved?.budget) },
        stats: __f12DailyStats(saved?.stats),
        budget: __f12DailyStats(saved?.budget)
      };
    }

    if (type === 'SET_ACTIVE_ACCOUNT') {
      if (req.accountId) {
        await storage.set({ codum_active_account: String(req.accountId) });
      }
      return { ok: true };
    }

    if (type === 'SET_GHOST_MODE' || type === 'SYNC_GHOST_MODE') {
      if (typeof req.enabled === 'boolean') {
        window.__CODUM_GHOST_STORIES = req.enabled;
        window.__CODUM_GHOST_DM = req.enabled;
      }
      if (typeof req.stories === 'boolean') window.__CODUM_GHOST_STORIES = req.stories;
      if (typeof req.dm === 'boolean') window.__CODUM_GHOST_DM = req.dm;
      return { ok: true };
    }

    if (type === 'LOG_ACTION') {
      const data = await storage.get('codum_action_logs');
      const logs = Array.isArray(data.codum_action_logs) ? data.codum_action_logs : [];
      logs.unshift({ timestamp: new Date().toISOString(), type: String(req.logType || 'info'), text: String(req.text || '').slice(0, 4000) });
      await storage.set({ codum_action_logs: logs.slice(0, 300) });
      return { ok: true };
    }

    if (type === 'DOWNLOAD_FILE') {
      const dlId = await window.chrome.downloads.download({ url: req.url, filename: req.filename });
      return { ok: true, downloadId: dlId };
    }

    if (type === 'SAVE_SETTINGS') {
      const data = await storage.get('codum_settings');
      const merged = { ...data.codum_settings, ...(req.settings || {}) };
      await storage.set({ codum_settings: merged });
      return { ok: true, settings: merged };
    }

    if (type === 'ACQUIRE_TASK') {
      const key = __f12AccountKey(req.accountId);
      const data = await storage.get([key, 'codum_settings', 'codum_customer']);
      const record = data[key] || {};
      const lockId = 'f12_lock_' + Math.random().toString(36).slice(2);
      await storage.set({ [key]: { ...record, lock: { id: lockId, owner: 'f12', expires: Date.now() + 90000 } } });
      return { ok: true, lockId };
    }

    if (type === 'RENEW_TASK' || type === 'RELEASE_TASK') {
      const key = __f12AccountKey(req.accountId);
      const data = await storage.get(key);
      const record = data[key] || {};
      await storage.set({ [key]: { ...record, lock: type === 'RELEASE_TASK' ? null : { ...record.lock, expires: Date.now() + 90000 } } });
      return { ok: true };
    }

    const key = __f12AccountKey(req.accountId);
    const data = await storage.get([key, 'codum_settings', 'codum_customer']);
    const record = data[key] || {};
    const stats = __f12DailyStats(record.stats);
    const budget = __f12DailyStats(record.budget || record.stats);

    if (!__F12_LIMITS[req.metric]) throw new Error('Geçersiz sayaç: ' + req.metric);
    const [settingName, fallback] = __F12_LIMITS[req.metric];
    const max = Number(data.codum_settings?.[settingName]) || fallback;

    if (type === 'CHECK_DAILY_LIMIT') {
      return {
        ok: true,
        reached: budget[req.metric] >= max,
        max,
        current: budget[req.metric],
        remaining: Math.max(0, max - budget[req.metric])
      };
    }

    if (type === 'RESERVE_ACTION') {
      if (budget[req.metric] >= max) {
        throw new Error(`LIMIT_REACHED: Günlük ${req.metric} sınırına (${max}) ulaşıldı. Güvenlik için işlem durduruldu.`);
      }
      budget[req.metric]++;
      await storage.set({ [key]: { ...record, stats, budget } });
      return { ok: true, remaining: max - budget[req.metric] };
    }

    if (type === 'UPDATE_STATS') {
      stats[req.metric] = (stats[req.metric] || 0) + (req.count || 1);
      if (budget[req.metric] < stats[req.metric]) budget[req.metric] = stats[req.metric];
      await storage.set({ [key]: { ...record, stats, budget } });
      return { ok: true, stats };
    }

    if (type === 'SAVE_LIST_SNAPSHOT') {
      const sKey = `codum_history_${req.accountId || 'f12'}_${req.listType}`;
      const prevData = (await storage.get(sKey))[sKey] || [];
      const newSnap = { id: 'snap_' + Date.now(), createdAt: new Date().toISOString(), users: req.users || [] };
      await storage.set({ [sKey]: [newSnap, ...prevData].slice(0, 20) });
      return { ok: true, snapshot: { id: newSnap.id, createdAt: newSnap.createdAt, count: newSnap.users.length } };
    }

    if (type === 'GET_LIST_SNAPSHOTS') {
      const sKey = `codum_history_${req.accountId || 'f12'}_${req.listType}`;
      const snaps = (await storage.get(sKey))[sKey] || [];
      return { ok: true, snapshots: snaps.map(s => ({ id: s.id, createdAt: s.createdAt, count: s.users.length })) };
    }

    return { ok: true };
  }

  // 3.4 chrome.runtime.sendMessage mock
  window.chrome.runtime = window.chrome.runtime || {};
  window.chrome.runtime.sendMessage = function(req, cb) {
    return new Promise((resolve) => {
      __f12Route(req).then((res) => {
        if (cb) cb(res);
        resolve(res);
      }).catch((err) => {
        const errObj = { ok: false, error: err.message };
        if (cb) cb(errObj);
        resolve(errObj);
      });
    });
  };

  // Varsayılan ayarları yükle (Önerilen gönderi gizleme kapatıldı: feed boşalmasını engeller)
  window.chrome.storage.local.get(['codum_customer', 'codum_settings'], (res) => {
    if (!res.codum_customer) {
      window.chrome.storage.local.set({
        codum_customer: {
          valid: true,
          ok: true,
          plan: 'local',
          planName: 'Yerel VIP Lisans',
          status: 'active',
          extensionAllowed: true,
          standalone: true
        }
      });
    }
    const current = res.codum_settings || {};
    window.chrome.storage.local.set({
      codum_settings: {
        dailyMaxFollow: 150,
        dailyMaxUnfollow: 200,
        dailyMaxLikes: 250,
        dailyMaxComments: 50,
        followSpeedSec: 35,
        followCooldownCount: 50,
        followCooldownMins: 15,
        filterPrivate: false,
        filterPrivateMode: 'gizli',
        filterAdult: true,
        filterDefaultAvatar: true,
        filterGender: 'hepsi',
        filterBlacklistWords: 'butik,satış,reklam,dm,casino,bahis',
        unfollowSpeedSec: 30,
        unfollowLimit: 200,
        unfollowMode: 'non_followers',
        unfollowWhitelist: '',
        hideFeedAds: true,
        hideSuggestedPosts: false, // Asla varsayılan gizleme! Feed beyaz boşluk olmasını engeller
        ghostModeStories: true,
        ghostModeDm: true,
        autoLikeStories: false,
        showDownloadButtons: true,
        showProfileBadge: true,
        theme: 'dark',
        ...current,
        hideSuggestedPosts: false // Mevcut kayıttan da önerilen gizlemeyi temizle
      }
    });
    window.__codumAutoLikeStories = current.autoLikeStories === true;
  });

  // =========================================================================
  // 4. CSS ENJEKSİYONU
  // =========================================================================
  const style = document.createElement("style");
  style.id = "codum-injected-ui-css";
  style.textContent = "/* CODUM İNSTAGRAM ARAÇLARI - Approved Sleek Dock & Glassmorphism UI */\n\n:root {\n  --codum-ig-gradient: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045);\n  --codum-bg-dock: rgba(18, 19, 26, 0.95);\n  --codum-bg-card: rgba(26, 27, 36, 0.96);\n  --codum-border: rgba(255, 255, 255, 0.12);\n  --codum-accent-pink: #ff3b69;\n  --codum-accent-blue: #3b82f6;\n  --codum-accent-green: #10b981;\n  --codum-text-main: #f5f5f7;\n  --codum-text-muted: #9e9ea7;\n}\n\n/* 1. Master Floating Dock */\n.codum-dock-container {\n  position: fixed;\n  top: 30px;\n  right: 20px;\n  z-index: 999999;\n  display: flex;\n  align-items: flex-start;\n  gap: 14px;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n  user-select: none;\n  transition: right 0.28s cubic-bezier(0.16, 1, 0.3, 1),\n              left 0.28s cubic-bezier(0.16, 1, 0.3, 1),\n              top 0.28s cubic-bezier(0.16, 1, 0.3, 1),\n              bottom 0.28s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n/* Köşe Yönlendirmeleri */\n.codum-dock-container[data-corner=\"top-right\"] {\n  flex-direction: row;\n}\n.codum-dock-container[data-corner=\"top-left\"] {\n  flex-direction: row-reverse;\n}\n.codum-dock-container[data-corner=\"bottom-right\"] {\n  flex-direction: row;\n  align-items: flex-end;\n}\n.codum-dock-container[data-corner=\"bottom-left\"] {\n  flex-direction: row-reverse;\n  align-items: flex-end;\n}\n\n/* Master Knob + Tools Column */\n.codum-dock-bar {\n  width: 86px;\n  background: var(--codum-bg-dock);\n  backdrop-filter: blur(24px);\n  -webkit-backdrop-filter: blur(24px);\n  border: 1px solid var(--codum-border);\n  border-radius: 18px;\n  padding: 8px 6px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);\n  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n/* Alt köşelerde araç rayı yukarı doğru açılır */\n.codum-dock-container[data-corner=\"bottom-right\"] .codum-dock-bar,\n.codum-dock-container[data-corner=\"bottom-left\"] .codum-dock-bar {\n  flex-direction: column-reverse;\n}\n\n/* Master Top Knob (Siyah Kutu) */\n.codum-master-knob {\n  width: 74px;\n  height: 46px;\n  background: #0d0e12;\n  border: 1.5px solid rgba(255, 255, 255, 0.2);\n  border-radius: 13px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  cursor: grab;\n  color: #fff;\n  font-weight: 800;\n  font-size: 11px;\n  letter-spacing: 0.6px;\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);\n  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.codum-master-knob:active {\n  cursor: grabbing;\n}\n\n.codum-master-knob:hover {\n  border-color: var(--codum-accent-pink);\n  box-shadow: 0 0 16px rgba(255, 59, 105, 0.3);\n  transform: scale(1.03);\n}\n\n.codum-knob-dot {\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: var(--codum-accent-green);\n  box-shadow: 0 0 8px var(--codum-accent-green);\n  animation: codumPulse 2s infinite ease-in-out;\n}\n\n@keyframes codumPulse {\n  0%, 100% { opacity: 1; transform: scale(1); }\n  50% { opacity: 0.4; transform: scale(0.85); }\n}\n\n/* Araç Butonları Taşıyıcısı (Açılır / Kapanır Ray) */\n.codum-tools-rail {\n  display: flex;\n  flex-direction: column;\n  gap: 7px;\n  align-items: center;\n  transition: opacity 0.25s ease, max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s ease;\n  overflow: hidden;\n  max-height: 520px;\n  opacity: 1;\n}\n\n.codum-dock-bar.collapsed .codum-tools-rail {\n  max-height: 0;\n  opacity: 0;\n  pointer-events: none;\n  transform: scale(0.92);\n}\n\n/* Alt köşelerde ters sıralama */\n.codum-dock-container[data-corner=\"bottom-right\"] .codum-tools-rail,\n.codum-dock-container[data-corner=\"bottom-left\"] .codum-tools-rail {\n  flex-direction: column-reverse;\n}\n\n/* Vertical Tool Buttons */\n.codum-tool-item {\n  width: 74px;\n  height: 60px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1.5px solid rgba(255, 255, 255, 0.1);\n  border-radius: 13px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 4px;\n  cursor: pointer;\n  color: var(--codum-text-muted);\n  font-size: 11px;\n  font-weight: 600;\n  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.codum-tool-item:hover {\n  background: rgba(255, 255, 255, 0.08);\n  border-color: var(--codum-accent-pink);\n  color: #fff;\n  transform: translateY(-2px);\n}\n\n.codum-tool-item.active {\n  background: linear-gradient(135deg, rgba(131, 58, 180, 0.25), rgba(255, 59, 105, 0.25));\n  border-color: var(--codum-accent-pink);\n  color: #fff;\n  box-shadow: 0 0 16px rgba(255, 59, 105, 0.35);\n}\n\n.codum-tool-icon {\n  font-size: 17px;\n}\n\n/* 2. Side Flyout Glass Card (Görseldeki Yana Açılan Koyu Cam Kart) */\n.codum-flyout-card {\n  width: 360px;\n  max-width: 90vw;\n  background: var(--codum-bg-card);\n  backdrop-filter: blur(32px) saturate(180%);\n  -webkit-backdrop-filter: blur(32px) saturate(180%);\n  border: 1px solid var(--codum-border);\n  border-radius: 20px;\n  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);\n  padding: 18px;\n  display: none;\n  flex-direction: column;\n  gap: 12px;\n  color: var(--codum-text-main);\n  animation: codumSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.codum-flyout-card.active {\n  display: flex;\n}\n\n@keyframes codumSlideIn {\n  0% { opacity: 0; transform: translateX(12px) scale(0.97); }\n  100% { opacity: 1; transform: translateX(0) scale(1); }\n}\n\n.codum-card-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  padding-bottom: 10px;\n}\n\n.codum-card-title {\n  font-size: 15px;\n  font-weight: 700;\n  color: #fff;\n}\n\n.codum-card-close {\n  background: none;\n  border: none;\n  color: var(--codum-text-muted);\n  cursor: pointer;\n  font-size: 16px;\n  padding: 4px;\n}\n\n.codum-card-close:hover {\n  color: #fff;\n}\n\n/* Setting Rows & iOS Toggles */\n.codum-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 13px;\n  gap: 12px;\n}\n\n.codum-row.vertical {\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 6px;\n}\n\n.codum-toggle-switch {\n  position: relative;\n  display: inline-block;\n  width: 44px;\n  height: 24px;\n}\n\n.codum-toggle-switch input {\n  opacity: 0;\n  width: 0;\n  height: 0;\n}\n\n.codum-slider {\n  position: absolute;\n  cursor: pointer;\n  top: 0; left: 0; right: 0; bottom: 0;\n  background-color: rgba(255, 255, 255, 0.16);\n  transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n  border-radius: 24px;\n}\n\n.codum-slider:before {\n  position: absolute;\n  content: \"\";\n  height: 18px;\n  width: 18px;\n  left: 3px;\n  bottom: 3px;\n  background-color: white;\n  transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n  border-radius: 50%;\n}\n\ninput:checked + .codum-slider {\n  background: var(--codum-accent-pink);\n}\n\ninput:checked + .codum-slider:before {\n  transform: translateX(20px);\n}\n\n/* Inputs & Buttons */\n.codum-input-text, .codum-input-textarea {\n  background: rgba(0, 0, 0, 0.35);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  border-radius: 10px;\n  color: #fff;\n  padding: 8px 12px;\n  font-size: 13px;\n  width: 100%;\n  box-sizing: border-box;\n  outline: none;\n  transition: border-color 0.2s ease;\n}\n\n.codum-input-text:focus, .codum-input-textarea:focus {\n  border-color: var(--codum-accent-pink);\n}\n\n.codum-input-textarea {\n  resize: vertical;\n  height: 64px;\n}\n\n.codum-action-btn {\n  width: 100%;\n  padding: 10px;\n  border-radius: 12px;\n  font-weight: 700;\n  font-size: 13px;\n  cursor: pointer;\n  border: none;\n  transition: all 0.2s ease;\n}\n\n.codum-action-btn.start {\n  background: linear-gradient(135deg, #ff3b69, #e11d48);\n  color: #fff;\n}\n\n.codum-action-btn.start:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 4px 16px rgba(255, 59, 105, 0.4);\n}\n\n.codum-action-btn.stop {\n  background: rgba(255, 255, 255, 0.1);\n  color: #fff;\n}\n\n.codum-action-btn.stop:hover {\n  background: rgba(239, 68, 68, 0.25);\n  color: #ef4444;\n}\n\n/* Progress Bar */\n.codum-progress-track {\n  width: 100%;\n  height: 6px;\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 6px;\n  overflow: hidden;\n  margin-top: 8px;\n}\n\n.codum-progress-fill {\n  height: 100%;\n  width: 0%;\n  background: linear-gradient(90deg, #ff3b69, #10b981);\n  transition: width 0.3s ease;\n}\n\n/* Profil Rozeti */\n.codum-friendship-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 12px;\n  font-weight: 700;\n  padding: 4px 10px;\n  border-radius: 12px;\n  margin-left: 12px;\n  vertical-align: middle;\n}\n\n.codum-friendship-badge.yes {\n  background: rgba(16, 185, 129, 0.15);\n  color: #10b981;\n  border: 1px solid rgba(16, 185, 129, 0.3);\n}\n\n.codum-friendship-badge.no {\n  background: rgba(239, 68, 68, 0.15);\n  color: #ef4444;\n  border: 1px solid rgba(239, 68, 68, 0.3);\n}\n\n/* Medya İndirme Butonu (Eski kutu kaldırıldı, native Instagram ikon satırına entegre edildi) */\n.codum-action-download-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  padding: 8px;\n  margin-left: 2px;\n  background: transparent;\n  border: none;\n  outline: none;\n  border-radius: 50%;\n  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), filter 0.18s ease;\n  vertical-align: middle;\n}\n\n.codum-action-download-btn:hover {\n  transform: scale(1.18);\n  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));\n}\n\n.codum-action-download-btn:active {\n  transform: scale(0.92);\n}\n\n.codum-action-download-btn svg {\n  display: block;\n}\n\n/* Kullanıcı Seçim Önizleme Listesi (Unfollow Onay Ekranı) */\n.codum-user-list-container {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  background: rgba(0, 0, 0, 0.45);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 12px;\n  padding: 8px;\n  max-height: 260px;\n  overflow-y: auto;\n}\n\n.codum-user-list-container::-webkit-scrollbar {\n  width: 5px;\n}\n.codum-user-list-container::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.25);\n  border-radius: 4px;\n}\n\n.codum-user-item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 10px;\n  border-radius: 10px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  font-size: 12px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n\n.codum-user-item:hover {\n  background: rgba(255, 255, 255, 0.09);\n  border-color: rgba(255, 255, 255, 0.15);\n}\n\n.codum-user-item.selected {\n  background: rgba(255, 59, 105, 0.12);\n  border-color: rgba(255, 59, 105, 0.35);\n}\n\n.codum-user-info {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  overflow: hidden;\n}\n\n.codum-user-name {\n  font-weight: 600;\n  color: #fff;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  max-width: 140px;\n}\n\n.codum-user-check {\n  cursor: pointer;\n  accent-color: #ff3b69;\n  width: 15px;\n  height: 15px;\n}\n\n.codum-list-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n  margin-bottom: 4px;\n}\n\n.codum-small-btn {\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  color: #e5e7eb;\n  font-size: 11px;\n  padding: 3px 8px;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n\n.codum-small-btn:hover {\n  background: rgba(255, 255, 255, 0.16);\n  color: #fff;\n}\n\n/* Canlı Çalışan İşlem DURDUR Butonu & Nabız Efekti */\n.codum-tool-item.codum-running-pulse {\n  background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95)) !important;\n  border-color: rgba(255, 255, 255, 0.7) !important;\n  color: #ffffff !important;\n  box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4) !important;\n  animation: codumRunningPulse 1.2s infinite alternate ease-in-out !important;\n  cursor: pointer !important;\n}\n\n.codum-tool-item.codum-running-pulse span {\n  color: #ffffff !important;\n  font-weight: 700 !important;\n}\n\n@keyframes codumRunningPulse {\n  0% {\n    transform: scale(0.96);\n    box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);\n  }\n  100% {\n    transform: scale(1.04);\n    box-shadow: 0 0 22px rgba(239, 68, 68, 0.95), 0 0 35px rgba(239, 68, 68, 0.4);\n  }\n}\n\n/* Üst Ekran Şık Toast Bildirim */\n#codumToastNotification {\n  position: fixed;\n  top: 24px;\n  left: 50%;\n  transform: translateX(-50%) translateY(-40px);\n  z-index: 999999999;\n  background: rgba(18, 18, 26, 0.95);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1.5px solid rgba(239, 68, 68, 0.5);\n  border-radius: 12px;\n  padding: 10px 22px;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n  font-size: 13px;\n  font-weight: 600;\n  color: #ffffff;\n  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3);\n  pointer-events: none;\n  opacity: 0;\n  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n#codumToastNotification.active {\n  opacity: 1;\n  transform: translateX(-50%) translateY(0);\n}\n\n\n\n/* --- COMPACT NEON RGB & INSTAGRAM ENGINE STYLING --- */\n:root {\n  --codum-ig-gradient: linear-gradient(135deg, #f09433 0%, #e6683c 20%, #dc2743 40%, #cc2366 60%, #bc1888 80%, #833ab4 100%);\n  --codum-rgb-gradient: linear-gradient(90deg, #f09433, #dc2743, #bc1888, #405de6, #00dfd8, #10b981, #f09433);\n}\n\n/* 1. Master Floating Dock - Compact */\n.codum-dock-container {\n  top: 20px !important;\n  right: 14px !important;\n  gap: 10px !important;\n}\n\n/* 2. Master Knob (RGB & Compact) */\n.codum-master-knob {\n  width: 62px !important;\n  height: 38px !important;\n  font-size: 10px !important;\n  background: linear-gradient(145deg, #141522, #090a10) !important;\n  border: 1.5px solid transparent !important;\n  border-radius: 10px !important;\n  position: relative !important;\n  box-shadow: 0 0 16px rgba(220, 39, 67, 0.4), 0 6px 18px rgba(0, 0, 0, 0.7) !important;\n  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;\n}\n\n.codum-master-knob::before {\n  content: '';\n  position: absolute;\n  top: -2px; left: -2px; right: -2px; bottom: -2px;\n  background: linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #405de6, #00dfd8, #f09433);\n  background-size: 300% 300%;\n  border-radius: 12px;\n  z-index: -1;\n  animation: codumRgbGlow 6s linear infinite;\n  opacity: 0.9;\n}\n\n@keyframes codumRgbGlow {\n  0% { background-position: 0% 50%; filter: hue-rotate(0deg); }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; filter: hue-rotate(360deg); }\n}\n\n.codum-master-knob:hover {\n  transform: scale(1.05) !important;\n  box-shadow: 0 0 24px rgba(220, 39, 67, 0.7), 0 0 12px rgba(240, 148, 51, 0.5) !important;\n}\n\n/* 3. Dock Bar (Kompakt Genişlik & RGB Aura) */\n.codum-dock-bar {\n  width: 72px !important;\n  padding: 6px 4px !important;\n  border-radius: 14px !important;\n  gap: 5px !important;\n  background: rgba(14, 15, 24, 0.94) !important;\n  border: 1px solid rgba(255, 255, 255, 0.16) !important;\n  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(220, 39, 67, 0.18) !important;\n  backdrop-filter: blur(28px) !important;\n  -webkit-backdrop-filter: blur(28px) !important;\n}\n\n.codum-tools-rail {\n  gap: 5px !important;\n}\n\n/* 4. Araç Butonları (Kompakt ve Şık) */\n.codum-tool-item {\n  width: 62px !important;\n  height: 48px !important;\n  padding: 4px 2px !important;\n  border-radius: 10px !important;\n  background: rgba(255, 255, 255, 0.04) !important;\n  border: 1.5px solid rgba(255, 255, 255, 0.09) !important;\n  transition: all 0.2s ease !important;\n}\n\n.codum-tool-icon {\n  font-size: 15px !important;\n  margin-bottom: 1px !important;\n}\n\n.codum-tool-label {\n  font-size: 9px !important;\n  letter-spacing: 0px !important;\n  line-height: 1.1 !important;\n}\n\n.codum-tool-item:hover {\n  background: rgba(255, 255, 255, 0.09) !important;\n  border-color: rgba(255, 255, 255, 0.35) !important;\n  box-shadow: 0 0 14px rgba(188, 24, 136, 0.45) !important;\n  transform: translateY(-1.5px);\n}\n\n.codum-tool-item.active {\n  background: linear-gradient(135deg, rgba(220, 39, 67, 0.28), rgba(131, 58, 180, 0.28)) !important;\n  border-color: #ff3b69 !important;\n  box-shadow: 0 0 16px rgba(255, 59, 105, 0.55), inset 0 0 10px rgba(255, 59, 105, 0.2) !important;\n  transform: translateY(-1.5px);\n}\n\n.codum-tool-item.active .codum-tool-label {\n  color: #fff !important;\n  font-weight: 700 !important;\n}\n\n/* 5. Flyout Card (Ekrana Sığan Kompakt Tasarım & Kaydırma) */\n.codum-flyout-card {\n  display: none !important;\n  width: 320px !important;\n  max-width: 86vw !important;\n  max-height: calc(100vh - 50px) !important;\n  background: rgba(18, 19, 30, 0.96) !important;\n  border: 1px solid rgba(255, 255, 255, 0.14) !important;\n  border-radius: 16px !important;\n  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(220, 39, 67, 0.22) !important;\n  backdrop-filter: blur(32px) !important;\n  -webkit-backdrop-filter: blur(32px) !important;\n  padding: 12px 14px !important;\n  position: relative !important;\n  flex-direction: column !important;\n  overflow: hidden !important;\n}\n\n.codum-flyout-card.active {\n  display: flex !important;\n}\n\n.codum-flyout-card::before {\n  content: '';\n  position: absolute;\n  top: 0; left: 0; right: 0;\n  height: 3px;\n  background: linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #405de6, #00dfd8, #f09433);\n  background-size: 200% 100%;\n  animation: codumRgbBar 3.5s linear infinite;\n  border-radius: 16px 16px 0 0;\n}\n\n@keyframes codumRgbBar {\n  0% { background-position: 0% 0%; }\n  100% { background-position: 200% 0%; }\n}\n\n.codum-card-header {\n  padding-bottom: 7px !important;\n  margin-bottom: 7px !important;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;\n}\n\n.codum-card-title {\n  font-size: 13px !important;\n  background: linear-gradient(135deg, #ffffff 20%, #ff80a0 70%, #ffc078 100%);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  font-weight: 800 !important;\n}\n\n.codum-card-close {\n  cursor: pointer !important;\n  font-size: 16px !important;\n  line-height: 1 !important;\n  padding: 4px 8px !important;\n  border-radius: 6px !important;\n  color: #9e9ea7 !important;\n  background: rgba(255, 255, 255, 0.06) !important;\n  border: 1px solid rgba(255, 255, 255, 0.1) !important;\n  transition: all 0.2s ease !important;\n}\n\n.codum-card-close:hover {\n  color: #fff !important;\n  background: rgba(239, 68, 68, 0.3) !important;\n  border-color: #ef4444 !important;\n  transform: scale(1.1) !important;\n}\n\n/* Gövde Alanı - Taşarsa Otomatik Pürüzsüz Scrollbar */\n.codum-flyout-body {\n  overflow-y: auto !important;\n  overflow-x: hidden !important;\n  max-height: calc(100vh - 120px) !important;\n  padding-right: 3px !important;\n}\n\n.codum-flyout-body::-webkit-scrollbar {\n  width: 4px !important;\n}\n\n.codum-flyout-body::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.22) !important;\n  border-radius: 4px !important;\n}\n\n.codum-flyout-body::-webkit-scrollbar-thumb:hover {\n  background: #ff3b69 !important;\n}\n\n/* 6. Aksiyon Butonları & Inputlar */\n.codum-action-btn.start {\n  background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 55%, #bc1888 100%) !important;\n  box-shadow: 0 3px 14px rgba(220, 39, 67, 0.45) !important;\n  border: none !important;\n  color: #fff !important;\n  font-weight: 700 !important;\n  font-size: 11.5px !important;\n  padding: 7px 10px !important;\n  border-radius: 8px !important;\n  transition: all 0.2s ease !important;\n}\n\n.codum-action-btn.start:hover {\n  box-shadow: 0 5px 20px rgba(220, 39, 67, 0.7) !important;\n  transform: translateY(-1px) scale(1.02);\n}\n\n.codum-action-btn.stop {\n  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;\n  box-shadow: 0 3px 12px rgba(239, 68, 68, 0.35) !important;\n  border: none !important;\n  font-size: 11.5px !important;\n  padding: 7px 10px !important;\n  border-radius: 8px !important;\n}\n\n.codum-small-btn {\n  background: rgba(255, 255, 255, 0.06) !important;\n  border: 1px solid rgba(255, 255, 255, 0.14) !important;\n  font-size: 10.5px !important;\n  padding: 5px 6px !important;\n  border-radius: 6px !important;\n  transition: all 0.2s ease !important;\n}\n\n.codum-small-btn:hover {\n  background: linear-gradient(135deg, rgba(220, 39, 67, 0.3), rgba(64, 93, 230, 0.3)) !important;\n  border-color: rgba(255, 255, 255, 0.4) !important;\n  color: #fff !important;\n}\n\n.codum-input-text, .codum-input-textarea {\n  font-size: 11px !important;\n  border-radius: 7px !important;\n}\n\n.codum-input-text:focus, .codum-input-textarea:focus {\n  border-color: #ff3b69 !important;\n  box-shadow: 0 0 10px rgba(255, 59, 105, 0.3) !important;\n  outline: none !important;\n}\n\n/* Durum Ledi */\n.codum-knob-dot {\n  background: #00ff88 !important;\n  box-shadow: 0 0 10px #00ff88 !important;\n  animation: codumNeonPulse 1.8s infinite ease-in-out !important;\n}\n\n@keyframes codumNeonPulse {\n  0%, 100% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 6px #00ff88); }\n  50% { opacity: 0.4; transform: scale(0.85); filter: drop-shadow(0 0 2px #00ff88); }\n}\n\n/* Aktif İşlemde Durdur Butonu ve Canlı Pulse */\n@keyframes codumStopPulse {\n  0%, 100% {\n    box-shadow: 0 0 14px rgba(239, 68, 68, 0.95), inset 0 0 8px rgba(239, 68, 68, 0.4) !important;\n    border-color: #ef4444 !important;\n    transform: scale(1.02);\n  }\n  50% {\n    box-shadow: 0 0 4px rgba(239, 68, 68, 0.4), inset 0 0 2px rgba(239, 68, 68, 0.1) !important;\n    border-color: rgba(239, 68, 68, 0.4) !important;\n    transform: scale(0.98);\n  }\n}\n\n.codum-tool-item.codum-running-pulse {\n  background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95)) !important;\n  border: 1.5px solid rgba(255, 255, 255, 0.7) !important;\n  box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4) !important;\n  animation: codumStopPulse 1.2s infinite ease-in-out !important;\n  cursor: pointer !important;\n}\n.codum-tool-item.codum-running-pulse .codum-tool-icon {\n  animation: codumStopPulse 1.2s infinite ease-in-out !important;\n}\n.codum-tool-item.codum-running-pulse span {\n  color: #ffffff !important;\n  font-weight: 700 !important;\n}\n\n/* Üst Ekran Şık Toast Bildirim */\n#codumToastNotification {\n  position: fixed;\n  top: 24px;\n  left: 50%;\n  transform: translateX(-50%) translateY(-40px);\n  z-index: 999999999;\n  background: rgba(18, 18, 26, 0.95);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1.5px solid rgba(239, 68, 68, 0.5);\n  border-radius: 12px;\n  padding: 10px 22px;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n  font-size: 13px;\n  font-weight: 600;\n  color: #ffffff;\n  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.3);\n  pointer-events: none;\n  opacity: 0;\n  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n#codumToastNotification.active {\n  opacity: 1;\n  transform: translateX(-50%) translateY(0);\n}\n";
  document.head.appendChild(style);

  // =========================================================================
  // 5. MD5 KÜTÜPHANESİ
  // =========================================================================
  !function(n){"use strict";function d(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function f(n,t,r,e,o,u){return d((u=d(d(t,n),d(e,u)))<<o|u>>>32-o,r)}function l(n,t,r,e,o,u,c){return f(t&r|~t&e,n,t,o,u,c)}function g(n,t,r,e,o,u,c){return f(t&e|r&~e,n,t,o,u,c)}function v(n,t,r,e,o,u,c){return f(t^r^e,n,t,o,u,c)}function m(n,t,r,e,o,u,c){return f(r^(t|~e),n,t,o,u,c)}function c(n,t){var r,e,o,u;n[t>>5]|=128<<t%32,n[14+(t+64>>>9<<4)]=t;for(var c=1732584193,f=-271733879,i=-1732584194,a=271733878,h=0;h<n.length;h+=16)c=l(r=c,e=f,o=i,u=a,n[h],7,-680876936),a=l(a,c,f,i,n[h+1],12,-389564586),i=l(i,a,c,f,n[h+2],17,606105819),f=l(f,i,a,c,n[h+3],22,-1044525330),c=l(c,f,i,a,n[h+4],7,-176418897),a=l(a,c,f,i,n[h+5],12,1200080426),i=l(i,a,c,f,n[h+6],17,-1473231341),f=l(f,i,a,c,n[h+7],22,-45705983),c=l(c,f,i,a,n[h+8],7,1770035416),a=l(a,c,f,i,n[h+9],12,-1958414417),i=l(i,a,c,f,n[h+10],17,-42063),f=l(f,i,a,c,n[h+11],22,-1990404162),c=l(c,f,i,a,n[h+12],7,1804603682),a=l(a,c,f,i,n[h+13],12,-40341101),i=l(i,a,c,f,n[h+14],17,-1502002290),c=g(c,f=l(f,i,a,c,n[h+15],22,1236535329),i,a,n[h+1],5,-165796510),a=g(a,c,f,i,n[h+6],9,-1069501632),i=g(i,a,c,f,n[h+11],14,643717713),f=g(f,i,a,c,n[h],20,-373897302),c=g(c,f,i,a,n[h+5],5,-701558691),a=g(a,c,f,i,n[h+10],9,38016083),i=g(i,a,c,f,n[h+15],14,-660478335),f=g(f,i,a,c,n[h+4],20,-405537848),c=g(c,f,i,a,n[h+9],5,568446438),a=g(a,c,f,i,n[h+14],9,-1019803690),i=g(i,a,c,f,n[h+3],14,-187363961),f=g(f,i,a,c,n[h+8],20,1163531501),c=g(c,f,i,a,n[h+13],5,-1444681467),a=g(a,c,f,i,n[h+2],9,-51403784),i=g(i,a,c,f,n[h+7],14,1735328473),c=v(c,f=g(f,i,a,c,n[h+12],20,-1926607734),i,a,n[h+5],4,-378558),a=v(a,c,f,i,n[h+8],11,-2022574463),i=v(i,a,c,f,n[h+11],16,1839030562),f=v(f,i,a,c,n[h+14],23,-35309556),c=v(c,f,i,a,n[h+1],4,-1530992060),a=v(a,c,f,i,n[h+4],11,1272893353),i=v(i,a,c,f,n[h+7],16,-155497632),f=v(f,i,a,c,n[h+10],23,-1094730640),c=v(c,f,i,a,n[h+13],4,681279174),a=v(a,c,f,i,n[h],11,-358537222),i=v(i,a,c,f,n[h+3],16,-722521979),f=v(f,i,a,c,n[h+6],23,76029189),c=v(c,f,i,a,n[h+9],4,-640364487),a=v(a,c,f,i,n[h+12],11,-421815835),i=v(i,a,c,f,n[h+15],16,530742520),c=m(c,f=v(f,i,a,c,n[h+2],23,-995338651),i,a,n[h],6,-198630844),a=m(a,c,f,i,n[h+7],10,1126891415),i=m(i,a,c,f,n[h+14],15,-1416354905),f=m(f,i,a,c,n[h+5],21,-57434055),c=m(c,f,i,a,n[h+12],6,1700485571),a=m(a,c,f,i,n[h+3],10,-1894986606),i=m(i,a,c,f,n[h+10],15,-1051523),f=m(f,i,a,c,n[h+1],21,-2054922799),c=m(c,f,i,a,n[h+8],6,1873313359),a=m(a,c,f,i,n[h+15],10,-30611744),i=m(i,a,c,f,n[h+6],15,-1560198380),f=m(f,i,a,c,n[h+13],21,1309151649),c=m(c,f,i,a,n[h+4],6,-145523070),a=m(a,c,f,i,n[h+11],10,-1120210379),i=m(i,a,c,f,n[h+2],15,718787259),f=m(f,i,a,c,n[h+9],21,-343485551),c=d(c,r),f=d(f,e),i=d(i,o),a=d(a,u);return[c,f,i,a]}function i(n){for(var t="",r=32*n.length,e=0;e<r;e+=8)t+=String.fromCharCode(n[e>>5]>>>e%32&255);return t}function a(n){var t=[];for(t[(n.length>>2)-1]=void 0,e=0;e<t.length;e+=1)t[e]=0;for(var r=8*n.length,e=0;e<r;e+=8)t[e>>5]|=(255&n.charCodeAt(e/8))<<e%32;return t}function e(n){for(var t,r="0123456789abcdef",e="",o=0;o<n.length;o+=1)t=n.charCodeAt(o),e+=r.charAt(t>>>4&15)+r.charAt(15&t);return e}function r(n){return unescape(encodeURIComponent(n))}function o(n){return i(c(a(n=r(n)),8*n.length))}function u(n,t){return function(n,t){var r,e=a(n),o=[],u=[];for(o[15]=u[15]=void 0,16<e.length&&(e=c(e,8*n.length)),r=0;r<16;r+=1)o[r]=909522486^e[r],u[r]=1549556828^e[r];return t=c(o.concat(a(t)),512+8*t.length),i(c(u.concat(t),640))}(r(n),r(t))}function t(n,t,r){return t?r?u(t,n):e(u(t,n)):r?o(n):e(o(n))}"function"==typeof define&&define.amd?define(function(){return t}):"object"==typeof module&&module.exports?module.exports=t:n.md5=t}(typeof window !== "undefined" ? window : (this || globalThis));
//# sourceMappingURL=md5.min.js.map

  // =========================================================================
  // 6. TÜRKÇE İSİM LİSTELERİ & FİLTRELER
  // =========================================================================
  var erkek_isimleri = ['abay', 'abayhan', 'abbas', 'abdal', 'abdi', 'abdullah', 'abdurrahman', 'abdulalim', 'abdulazim', 'abdulaziz', 'abdulbaki', 'abdulbari', 'abdulbasir', 'abdulbasit', 'abdulcabbar', 'abdulcebbar', 'abdulcelil', 'abdulcemal', 'abdulcevat', 'abdulezel', 'abdulferit', 'abdulfettah', 'abdulgaffar', 'abdulgaffur', 'abdulgafur', 'abdulgani', 'abdulhadi', 'abdulhak', 'abdulhakim', 'abdulhalik', 'abdulhalim', 'abdulhamit', 'abdulkadir', 'abdulkahhar', 'abdulkerim', 'abdullatif', 'abdulmecit', 'abdulmelik', 'abdulmennan', 'abdulmetin', 'abdulnasir', 'abdulvahap', 'abdulvahit', 'abdurrahim', 'abdurrahman', 'abdurrauf', 'abdurresit', 'abdurrezzak', 'abdussamet', 'abdussami', 'abdusselam', 'abdussemi', 'abdussettar', 'abduzzeki', 'abir', 'abid', 'abidin', 'abil', 'abir', 'abit', 'ablak', 'abras', 'abuska', 'abuzer', 'abuzettin', 'acabay', 'acabey', 'agabay', 'agcabey', 'akabay', 'akabey', 'akcabay', 'alabas', 'alabay', 'atabay', 'atabek', 'atabey', 'ataboru', 'babacan', 'babac', 'babayigit', 'babur', 'babursah', 'balaban', 'cabbar', 'cabir', 'caba', 'cabar', 'farabi', 'hicabi', 'kabadayi', 'kaban', 'kabil', 'karabas', 'karabatak', 'karabay', 'karabet', 'karabey', 'karaboga', 'karaboru', 'karabudun', 'karabugday', 'karabugra', 'karabulut', 'karabukey', 'karacabey', 'kayrabay', 'kocabas', 'kocabey', 'nabi', 'necabet', 'necabettin', 'olcabay', 'rabbani', 'rabi', 'rabih', 'sabah', 'sabahattin', 'sabar', 'sabbar', 'sabih', 'sabir', 'sabit', 'sabri', 'sabur', 'sabutay', 'sahabi', 'saricabay', 'saban', 'sahabettin', 'tabgac', 'turabi', 'yabalak', 'yaban', 'yabar', 'yabgu', 'yabiz', 'yalabuk', 'yalazabay', 'zabit', 'zeynelabidin', 'aca', 'acahan', 'acar', 'acaralp', 'acarbey', 'acarer', 'acarkan', 'acarman', 'acaroz', 'acarsoy', 'acarturk', 'acatay', 'acidas', 'aclan', 'acun', 'acunal', 'acunalan', 'acunalp', 'acuner', 'acunman', 'acunseven', 'acikalin', 'acikel', 'aciker', 'acikgun', 'acil', 'acine', 'adahan', 'adak', 'adal', 'adalan', 'adalettin', 'adam', 'adamis', 'adanan', 'adanir', 'adar', 'adarkan', 'adasal', 'adas', 'aday', 'adibelli', 'adigun', 'adiguzel', 'adin', 'adisanli', 'adisonmez', 'adivar', 'adiyahsi', 'adiyaman', 'adil', 'adilhan', 'adlan', 'adli', 'adlig', 'adli', 'adnan', 'adni', 'adsiz', 'adsoy', 'afacan', 'afak', 'afer', 'affan', 'afif', 'afsar', 'afsin', 'agah', 'agil', 'aga', 'agacan', 'agahan', 'agakan', 'agan', 'aganer', 'agaoglu', 'agar', 'agarantan', 'agaverdi', 'agca', 'agcelik', 'ager', 'agin', 'agirtas', 'agis', 'agnak', 'agyar', 'ahen', 'ahfes', 'ahiska', 'ahi', 'ahmet', 'ahsen', 'ahter', 'ajlan', 'aka', 'akad', 'akadli', 'akagan', 'akal', 'akalan', 'akalin', 'akalp', 'akaltan', 'akan', 'akanay', 'akaner', 'akansu', 'akant', 'akanyildiz', 'akarca', 'akarcay', 'akarsel', 'akarsu', 'akartuna', 'akarturk', 'akasma', 'akasoy', 'akata', 'akatay', 'akay', 'akaydin', 'akbal', 'akbas', 'akbasak', 'akbatu', 'akbatur', 'akbay', 'akbayar', 'akbek', 'akbel', 'akbet', 'akbey', 'akbil', 'akbilge', 'akboga', 'akbora', 'akboy', 'akboru', 'akbudun', 'akbug', 'akbulut', 'akburak', 'akburc', 'akburcak', 'akcan', 'akcebe', 'akcivan', 'akca', 'akcael', 'akcakan', 'akcakaya', 'akcakil', 'akcakoca', 'akcal', 'akcali', 'akcam', 'akcan', 'akcasu', 'akcay', 'akcer', 'akcigir', 'akcil', 'akcinar', 'akcit', 'akcora', 'akdag', 'akdal', 'akdamar', 'akdemir', 'akdeniz', 'akdes', 'akdik', 'akdiken', 'akdil', 'akdog', 'akdogan', 'akdogdu', 'akdogmus', 'akdogu', 'akdora', 'akdoru', 'akdoruk', 'akdol', 'akduman', 'akdur', 'akdurmus', 'akel', 'aker', 'akergin', 'akerman', 'akersan', 'akersoy', 'akgil', 'akgiray', 'akgol', 'akgoze', 'akguc', 'akgun', 'akgunduz', 'akguner', 'akgunes', 'akgungor', 'akhan', 'akhun', 'aki', 'akialp', 'akil', 'akilbek', 'akilli', 'akiman', 'akinal', 'akinalp', 'akinci', 'akincibay', 'akiner', 'akineri', 'akintan', 'akif', 'akil', 'akkan', 'akkas', 'akkaya', 'akkaynak', 'akkemik', 'akkerman', 'akkilic', 'akkin', 'akkoz', 'akkurt', 'akkus', 'akkuyas', 'aklan', 'akmac', 'akman', 'akmanalp', 'akmaner', 'akmeric', 'akozan', 'akonder', 'akoren', 'akoz', 'akpay', 'akpinar', 'akpolat', 'akpulat', 'aksal', 'aksan', 'aksay', 'aksel', 'akser', 'akses', 'aksin', 'aksoy', 'aksogut', 'aksu', 'aksun', 'aksunar', 'aksuner', 'aksungur', 'aksuyek', 'aksin', 'aksit', 'aktac', 'aktalay', 'aktan', 'aktar', 'aktas', 'aktay', 'aktekin', 'aktemur', 'akti', 'aktimur', 'aktolga', 'aktug', 'aktuna', 'aktunc', 'aktun', 'akturk', 'akun', 'akunal', 'akvarol', 'akyel', 'akyildiz', 'akyigit', 'akyol', 'akyon', 'akyurt', 'akyurek', 'akyuz', 'ala', 'alaaddin', 'alaca', 'alacan', 'alacam', 'alacuk', 'aladogan', 'alahan', 'alakoc', 'alakurt', 'alakus', 'alamet', 'alanalp', 'alanay', 'alanbay', 'alaner', 'alangu', 'alat', 'alatan', 'alatas', 'alatay', 'alay', 'alaybey', 'alaz', 'albayrak', 'albora', 'alburak', 'alcan', 'alcik', 'alcin', 'alcinsu', 'aldemir', 'aldogan', 'alem', 'alemdar', 'alemsah', 'algan', 'algin', 'algu', 'algun', 'algur', 'algun', 'alhan', 'alici', 'alisik', 'ali', 'alican', 'alihan', 'alim', 'alis', 'alisah', 'alisan', 'aliyar', 'alkan', 'alkas', 'alkilic', 'alkim', 'alkin', 'alkis', 'alkoc', 'alkor', 'alkun', 'allahverdi', 'almila', 'alnar', 'alniacik', 'alniak', 'alp', 'alpagu', 'alpagan', 'alpak', 'alpar', 'alparslan', 'alpartun', 'alpaslan', 'alpat', 'alpata', 'alpay', 'alpaydin', 'alpayer', 'alpbilge', 'alpcetin', 'alpdemir', 'alpdogan', 'alper', 'alperen', 'alpergin', 'alpermis', 'alpertunga', 'alpgiray', 'alphan', 'alpkan', 'alpkanat', 'alpkartal', 'alpkin', 'alpkutlu', 'alpkuluk', 'alpman', 'alpogan', 'alpsoy', 'alpsu', 'alptekin', 'alptogan', 'alptug', 'alpyurek', 'alpyuruk', 'alsan', 'alsancak', 'alsoy', 'altac', 'altan', 'altaner', 'altas', 'altav', 'altay', 'altemur', 'alten', 'altin', 'altinay', 'altinbaran', 'altinbas', 'altinbay', 'altinel', 'altiner', 'altinhan', 'altinisik', 'altinisin', 'altiniz', 'altinkaya', 'altinkilic', 'altinok', 'altinoz', 'altinsoy', 'altintac', 'altintas', 'altintop', 'altintug', 'altogan', 'altop', 'altug', 'altun', 'altuna', 'altunay', 'altunbas', 'altunc', 'altuncag', 'altuner', 'altunhan', 'altuntas', 'amac', 'amanullah', 'amil', 'anadolu', 'anci', 'ancibay', 'andac', 'andak', 'andelip', 'andic', 'andic', 'angi', 'angil', 'angin', 'angis', 'angit', 'ani', 'anik', 'anit', 'anli', 'annak', 'ant', 'apa', 'apak', 'apakhan', 'apaydin', 'araci', 'arafat', 'aral', 'aran', 'aras', 'arat', 'araz', 'arbas', 'arbay', 'arbek', 'arca', 'arcan', 'arda', 'ardahan', 'ardemir', 'ardic', 'ardil', 'arel', 'arer', 'argin', 'argu', 'arguc', 'arguden', 'arguder', 'argun', 'arhan', 'ari', 'aribal', 'aribas', 'ariboga', 'arica', 'arican', 'aric', 'ariel', 'arier', 'arig', 'arihan', 'arik', 'arikal', 'arikan', 'arikboga', 'ariker', 'arikhan', 'arikiz', 'arikol', 'arikut', 'aril', 'ariman', 'arin', 'arinc', 'arinik', 'aripinar', 'arisal', 'arisan', 'arisoy', 'arisu', 'aris', 'aritan', 'aritas', 'ariyuz', 'ari', 'arif', 'arik', 'arkadas', 'arkan', 'arkin', 'arkis', 'arkoc', 'arkun', 'arkut', 'arlan', 'arman', 'arna', 'arol', 'arpad', 'arpag', 'arpak', 'arpinar', 'arsal', 'arsan', 'arslan', 'arslaner', 'arsoy', 'artac', 'artam', 'artan', 'artik', 'artuc', 'artuk', 'artun', 'artunc', 'artut', 'aru', 'arukan', 'aryuz', 'arzik', 'asaf', 'asal', 'asalet', 'asan', 'asi', 'asif', 'asim', 'asil', 'aslan', 'aslaner', 'aslanhan', 'aslibey', 'aslihan', 'asri', 'asu', 'asutay', 'asan', 'ascir', 'asir', 'asir', 'askan', 'askinay', 'askiner', 'ata', 'ata', 'ataan', 'atacan', 'atac', 'atadan', 'ataergin', 'atagun', 'atahan', 'atak', 'atakan', 'ataker', 'atakul', 'atakurt', 'atakut', 'atalan', 'atalay', 'atalmis', 'ataman', 'atambay', 'atamer', 'atamturk', 'ataner', 'atanur', 'ataol', 'ataov', 'atasagun', 'atasan', 'atasay', 'atasev', 'ataseven', 'atasever', 'atasevin', 'atasoy', 'atasu', 'atatore', 'atatug', 'atature', 'ataturk', 'ataullah', 'ataun', 'atay', 'ates', 'atfi', 'atgun', 'atif', 'atil', 'atilay', 'atilgan', 'atiz', 'atik', 'atila', 'atilla', 'atlan', 'atli', 'atlig', 'atlihan', 'atmaca', 'atom', 'attila', 'atuf', 'avar', 'avci', 'avhan', 'avkan', 'avni', 'avsar', 'avunc', 'ay', 'ayalp', 'ayaltin', 'ayanc', 'ayas', 'ayata', 'ayatac', 'ayaydin', 'ayaz', 'aybar', 'aybars', 'aybas', 'aybay', 'aybek', 'ayberk', 'aybey', 'ayboga', 'aybora', 'aycan', 'aycil', 'aycihan', 'aycetin', 'aydar', 'aydemir', 'aydeniz', 'aydin', 'aydinalp', 'aydinay', 'aydinbay', 'aydinbey', 'aydinel', 'aydiner', 'aydinol', 'aydintan', 'aydintug', 'aydinyol', 'aydinc', 'aydogan', 'aydogdu', 'aydogmus', 'aydolun', 'aydonat', 'ayet', 'ayetullah', 'aygut', 'aygutalp', 'aygun', 'ayguner', 'ayhan', 'ayik', 'aykac', 'aykal', 'aykan', 'aykin', 'aykul', 'aykurt', 'aykut', 'aykutalp', 'aykutlu', 'aylan', 'ayman', 'aymete', 'aymutlu', 'ayni', 'aypar', 'aypars', 'aypolat', 'ayral', 'ayril', 'aysal', 'aysan', 'aysoy', 'aysungur', 'aysan', 'aytac', 'aytan', 'aytar', 'aytek', 'aytekin', 'aytemiz', 'aytemur', 'aytis', 'aytigin', 'aytimur', 'aytok', 'aytolun', 'aytop', 'aytore', 'aytug', 'aytuna', 'aytunca', 'aytunc', 'aytunga', 'aytun', 'ayturk', 'ayun', 'ayvaz', 'ayverdi', 'ayyarkin', 'ayyaruk', 'ayyildiz', 'ayyuce', 'azam', 'azamet', 'azamettin', 'azer', 'azim', 'aziz', 'azmi', 'azmun', 'aznavur', 'azrak', 'bagatur', 'bagdac', 'bagdas', 'bagir', 'bagis', 'bagishan', 'baha', 'bahadir', 'bahadirhan', 'bahai', 'bahattin', 'bahir', 'bahri', 'bahsi', 'bahti', 'bahtiyar', 'bakanay', 'bakir', 'bakirhan', 'baki', 'baksi', 'bala', 'bala', 'balabey', 'balaman', 'balamir', 'balatekin', 'balaturk', 'balaz', 'balbal', 'balbay', 'balbey', 'balcan', 'baldemir', 'baler', 'balhan', 'bali', 'balibas', 'balibey', 'balim', 'balibey', 'balk', 'balkan', 'balki', 'balkir', 'balkis', 'balkoc', 'balsan', 'baltas', 'bandak', 'bangu', 'barak', 'baray', 'barbaros', 'barca', 'barcak', 'barcin', 'barim', 'barin', 'baris', 'bariscan', 'barik', 'bariz', 'barkan', 'barkin', 'barlas', 'barlik', 'bars', 'barsbay', 'barsbey', 'bartu', 'basa', 'basim', 'basir', 'baskak', 'baskan', 'baskin', 'basri', 'basut', 'basaga', 'basal', 'basar', 'basargan', 'basarman', 'basat', 'basay', 'basaydin', 'basbay', 'basbug', 'basdemir', 'basdogan', 'basegmez', 'basel', 'baser', 'bashan', 'baskal', 'baskan', 'baskara', 'baskaya', 'baskaynak', 'baskur', 'baskurt', 'baskut', 'basman', 'basok', 'basol', 'basoz', 'bassoy', 'bastas', 'bastemir', 'bastugay', 'bastug', 'basturk', 'bati', 'batibay', 'batibey', 'batican', 'batihan', 'batir', 'batiray', 'batirhan', 'battal', 'batu', 'batucem', 'batuhan', 'batur', 'baturalp', 'baturay', 'baturhan', 'bayar', 'baybars', 'baybas', 'baybek', 'baybora', 'bayboru', 'baycan', 'bayca', 'baydogan', 'baydu', 'baydur', 'bayduralp', 'bayer', 'bayezit', 'bayguc', 'bayhan', 'bayhun', 'bayik', 'bayin', 'bayindir', 'bayir', 'bayirhan', 'baykal', 'baykam', 'baykan', 'baykara', 'baykir', 'baykoca', 'baykor', 'baykul', 'baykurt', 'baykut', 'baykutay', 'baylan', 'bayman', 'bayol', 'bayrak', 'bayraktar', 'bayram', 'bayri', 'bayru', 'bayrualp', 'bayrubay', 'bayruhan', 'bayruk', 'baysal', 'baysan', 'baysoy', 'baysu', 'baysungur', 'baytal', 'baytas', 'baytekin', 'baytimur', 'baytok', 'baytugay', 'baytuze', 'baytuzun', 'bayuk', 'bayulken', 'bayyigit', 'bedirhan', 'behnan', 'behram', 'behzat', 'bekata', 'bekbars', 'bekbay', 'beksan', 'bektas', 'beleda', 'bellisan', 'benal', 'benam', 'benan', 'benazir', 'bengialp', 'bengibay', 'bengisan', 'bengitas', 'berat', 'berkal', 'berkan', 'berkant', 'berkay', 'berkkan', 'berkman', 'berksal', 'berksan', 'berksay', 'berktan', 'berran', 'bertan', 'besalet', 'besat', 'besaret', 'besarettin', 'beyazit', 'beybars', 'beybolat', 'beycan', 'beyda', 'beydag', 'beydas', 'beyhan', 'beykal', 'beykan', 'beykara', 'beysan', 'beytullah', 'beyzade', 'beyzat', 'bican', 'bilan', 'bilay', 'bilbasar', 'bilbay', 'bileda', 'bilgealp', 'bilgebay', 'bilgehan', 'bilgekagan', 'bilgekan', 'bilgetay', 'bilgihan', 'bilgutay', 'bilhan', 'bilkan', 'bilsay', 'biltas', 'biltay', 'bilyap', 'binal', 'binali', 'binalp', 'binan', 'binat', 'binay', 'binbasar', 'binbay', 'bindal', 'binkan', 'binyasar', 'biran', 'birant', 'biray', 'bircan', 'birdal', 'birhan', 'birkan', 'birsan', 'birtan', 'boga', 'bogac', 'bogachan', 'bogahan', 'bogatas', 'bogatay', 'bogatekin', 'bogatir', 'bogatimur', 'bolat', 'bolcan', 'bolgan', 'bolhan', 'bolkan', 'bora', 'borahan', 'borak', 'borakan', 'borakhan', 'boran', 'boranalp', 'boranbay', 'boransu', 'boratas', 'boratav', 'boratay', 'boray', 'borkan', 'boyar', 'boydak', 'boydas', 'boylan', 'boynak', 'boyraz', 'boysal', 'boysan', 'bozan', 'bozat', 'bozay', 'bozbag', 'bozbala', 'bozbas', 'bozbay', 'bozbora', 'bozca', 'bozdag', 'bozdogan', 'bozhan', 'bozkan', 'bozkara', 'bozkaya', 'bozlak', 'bozokay', 'boztas', 'bolukbasi', 'borubars', 'borubay', 'boruhan', 'borukan', 'bucak', 'budak', 'budunal', 'budunalp', 'bugra', 'bugrahan', 'bukay', 'bulak', 'bulgan', 'bulgubay', 'bulgucan', 'bulutay', 'buminhan', 'burak', 'burcak', 'burchan', 'burhan', 'burhanettin', 'burkay', 'burukbay', 'buyrukalp', 'buyrukata', 'buyrukbay', 'buyrukhan', 'bukay', 'bunyamin', 'buran', 'burkan', 'cafer', 'cahit', 'calp', 'can', 'canal', 'canalp', 'canaltay', 'canat', 'canay', 'canaydin', 'canbay', 'canbek', 'canberk', 'canbey', 'canbolat', 'canbulat', 'canda', 'candan', 'candaner', 'candar', 'candas', 'candeger', 'candemir', 'candogan', 'canel', 'caner', 'canfer', 'cangiray', 'cangun', 'cangur', 'canip', 'cankan', 'cankat', 'cankaya', 'cankilic', 'cankoc', 'cankorur', 'cankurt', 'cankut', 'cannur', 'canol', 'canoren', 'canoz', 'canpolat', 'cansal', 'cansay', 'cansen', 'canser', 'canseven', 'cansever', 'cansin', 'cansoy', 'cansun', 'cansunar', 'cansuner', 'cantas', 'cantekin', 'cantez', 'canturk', 'canyurt', 'caran', 'carim', 'carullah', 'cavit', 'cavli', 'cavuldur', 'caymaz', 'cazim', 'cazip', 'cebbar', 'cebealp', 'cebrail', 'cefa', 'celilay', 'cemal', 'cemaleddin', 'cemalettin', 'cemalullah', 'cemsah', 'cenan', 'cenani', 'cenap', 'cengizhan', 'cerullah', 'cevahir', 'cevat', 'cevval', 'ceyhan', 'cezayir', 'cihan', 'cihandar', 'cihandide', 'cihanefruz', 'cihaner', 'cihangir', 'cihani', 'cihanmert', 'cihannur', 'cihansah', 'cihat', 'civan', 'civanbaht', 'civanmert', 'civansir', 'cosan', 'cosar', 'coskunay', 'cuma', 'cumali', 'cura', 'cundullah', 'cadir', 'cag', 'caga', 'cagacan', 'cagacar', 'cagakan', 'cagan', 'caganak', 'cagatay', 'cagay', 'cagbay', 'cagdas', 'cagil', 'cagilti', 'cagin', 'cagir', 'cagkan', 'cagla', 'caglak', 'caglam', 'caglar', 'caglasin', 'caglayan', 'caglayangil', 'caglayanturk', 'cagli', 'cagman', 'cagribey', 'cagveren', 'cakan', 'cakar', 'cakil', 'cakim', 'cakin', 'cakir', 'cakirbey', 'cakirca', 'cakirer', 'cakmak', 'cakman', 'cakmur', 'calapkulu', 'calapover', 'calapverdi', 'calgan', 'calikbey', 'calim', 'calin', 'calis', 'caliskan', 'calkan', 'calkara', 'calkin', 'calti', 'cam', 'camak', 'cambel', 'camer', 'camok', 'candar', 'candarli', 'canga', 'cangal', 'cankara', 'cankaya', 'capan', 'capaner', 'capar', 'capin', 'capkan', 'carlan', 'carman', 'cav', 'cavas', 'cavdar', 'cavdur', 'cavli', 'cavuldur', 'cavus', 'caydam', 'caydamar', 'cayhan', 'caykara', 'caylak', 'caylan', 'caynak', 'celikbas', 'celikhan', 'celikkan', 'celikkanat', 'celikkaya', 'celiktan', 'celiktas', 'celikyay', 'cetinalp', 'cetinay', 'cetinkaya', 'cetintas', 'cevikcan', 'cida', 'cidal', 'cidam', 'cidamli', 'ciga', 'cigal', 'cinak', 'cinay', 'ciray', 'citak', 'citanak', 'ciltay', 'cintan', 'cintay', 'ciray', 'coban', 'coga', 'cogahan', 'cogan', 'cogas', 'cogay', 'cokan', 'cokar', 'cokay', 'cokman', 'colak', 'colpan', 'copar', 'copuralp', 'cora', 'corak', 'coturay', 'cuga', 'culpan', 'cuvas', 'dadak', 'dadas', 'dag', 'daga', 'dagasan', 'dagdelen', 'daghan', 'dagtekin', 'daim', 'dal', 'dalan', 'dalay', 'dalayer', 'dalbas', 'dalboga', 'dalda', 'daldal', 'daldiken', 'dalgic', 'dalim', 'dalkilic', 'dalkoc', 'dalokay', 'daltekin', 'damar', 'danis', 'danisman', 'danis', 'danisment', 'danyal', 'dara', 'darcan', 'darga', 'daver', 'davran', 'davut', 'dayanc', 'dayar', 'dayi', 'daylak', 'deha', 'delikan', 'delikanli', 'demirag', 'demiralp', 'demiray', 'demirbag', 'demirbas', 'demirboga', 'demircan', 'demircay', 'demirhan', 'demirkan', 'demirkaya', 'demirkiran', 'demirman', 'demirsah', 'demirtas', 'demirtav', 'demirtay', 'demokan', 'denizalp', 'denizcan', 'denizhan', 'denizman', 'denktas', 'derman', 'dervisani', 'dervishan', 'deryadil', 'devran', 'dikalp', 'dikay', 'dikbas', 'dikbay', 'dikboga', 'dikcam', 'dikdal', 'diktas', 'dilercan', 'dilmac', 'dincalp', 'dincay', 'dinccag', 'dinckal', 'dinckaya', 'dincsan', 'dincsav', 'dincsay', 'dinctas', 'dindar', 'diribas', 'dirican', 'dirsehan', 'dizdar', 'doga', 'dogan', 'doganalp', 'doganay', 'doganbas', 'doganbey', 'doganer', 'dogangun', 'doganhan', 'dogansah', 'dogantan', 'dogantimur', 'dogudan', 'doguhan', 'dogukan', 'dolaner', 'dolay', 'dolunay', 'domanic', 'donat', 'dora', 'dorak', 'dorukhan', 'dorukkan', 'dolaslan', 'donmezcan', 'duman', 'dumanbey', 'dura', 'duracan', 'durak', 'dural', 'duran', 'duranay', 'duraner', 'duransoy', 'durantekin', 'duray', 'durhan', 'durkaya', 'durualp', 'durubay', 'durucan', 'duruhan', 'durukal', 'durukan', 'durusan', 'dundar', 'dundaralp', 'dusvar', 'ebrak', 'ecebay', 'ecehan', 'ecekan', 'edgualp', 'edgubay', 'edgukan', 'efdal', 'efekan', 'efgan', 'efnan', 'efrasiyap', 'ejderhan', 'elfaz', 'elhan', 'eliacik', 'elitas', 'elvan', 'emanet', 'emanullah', 'embiya', 'emirhan', 'emirsah', 'emrah', 'emran', 'emrullah', 'emsal', 'enbiya', 'enfal', 'enginalp', 'enginay', 'engintalay', 'enhar', 'ensar', 'ensari', 'eracar', 'erakalin', 'erakinci', 'eraksan', 'eralkan', 'eralp', 'eraltay', 'erandac', 'eranil', 'eraslan', 'eratli', 'eray', 'eraydin', 'erbas', 'erbasat', 'erbatur', 'erbay', 'erboga', 'ercan', 'ercihan', 'ercivan', 'erdag', 'erdal', 'erdemalp', 'erdenalp', 'erdenay', 'erdibay', 'erdogan', 'erduran', 'erenalp', 'erenay', 'erencan', 'erenkara', 'ergalip', 'ergazi', 'erginal', 'erginalp', 'erginay', 'erginbay', 'ergincan', 'ergunalp', 'ergunay', 'erhan', 'erimsah', 'erkal', 'erkan', 'erkarslan', 'erkas', 'erkaya', 'erkinay', 'erkiral', 'erkman', 'erkocak', 'erksal', 'erksan', 'erkutay', 'erman', 'ernoyan', 'erogan', 'erokay', 'eronat', 'erozan', 'ersagun', 'ersal', 'ersalmis', 'ersan', 'ersav', 'ersavas', 'ersay', 'ersayin', 'ersunal', 'ersahan', 'ersan', 'ersat', 'ertac', 'ertan', 'ertas', 'ertay', 'ertaylan', 'ertepinar', 'ertugay', 'ertuna', 'ertunca', 'ertuncay', 'ertunga', 'erturan', 'erunal', 'eryalcin', 'eryaman', 'eryavuz', 'eryilmaz', 'erzade', 'erzan', 'esat', 'esedullah', 'esenbay', 'esenboga', 'esendag', 'esendal', 'esenkal', 'esertas', 'eskinalp', 'esfak', 'esraf', 'evcan', 'evhat', 'evliya', 'evran', 'evrenata', 'eyyam', 'ezelhan', 'fadil', 'fahim', 'fahir', 'fahrettin', 'fahri', 'faik', 'faiz', 'fakih', 'fakir', 'fakirullah', 'falih', 'fani', 'farik', 'faris', 'faruk', 'fasih', 'fatih', 'fatin', 'faysal', 'fazil', 'fazli', 'fazlullah', 'feda', 'fedai', 'fedakar', 'fehamet', 'fehamettin', 'fehimdar', 'feragat', 'ferah', 'ferahi', 'feramus', 'feramuz', 'feray', 'fercan', 'ferda', 'ferdal', 'ferdar', 'ferhan', 'ferhat', 'ferhattin', 'feritkan', 'ferkan', 'ferman', 'fermani', 'fersan', 'feruzat', 'ferzan', 'fethullah', 'fettah', 'fevzullah', 'feyha', 'feyman', 'feyyaz', 'feyzan', 'feyzullah', 'feza', 'fezahan', 'fezai', 'fuat', 'furkan', 'gaffar', 'gafir', 'gafur', 'galip', 'gani', 'garip', 'gavsi', 'gayret', 'gayur', 'gazal', 'gazanfer', 'gazel', 'gazi', 'gedikbas', 'gedikbay', 'gediktas', 'gencal', 'gencalp', 'gencaslan', 'gencay', 'gencaga', 'gencalp', 'gencaslan', 'gencay', 'genckal', 'gencsav', 'genctan', 'geray', 'gezenay', 'giyas', 'giyasettin', 'giyasi', 'giray', 'girayalp', 'girayer', 'girayhan', 'girginalp', 'gizay', 'gokalp', 'gokay', 'gokbay', 'gokbayrak', 'gokbora', 'gokbudak', 'gokcan', 'gokcebala', 'gokcebalan', 'gokdal', 'gokdogan', 'gokhan', 'gokmenalp', 'goksal', 'goksaltuk', 'goksan', 'goksav', 'goksay', 'goktalay', 'goktan', 'goktas', 'goktay', 'goktulga', 'goktuna', 'gokyay', 'goral', 'gorgunay', 'gorguncan', 'gozay', 'gozaydin', 'gucal', 'gucalp', 'gucal', 'gucalp', 'guchan', 'guckan', 'guckanat', 'guclubay', 'gucluhan', 'guclukhan', 'gucsal', 'gucsalan', 'gucsan', 'gulbay', 'guldogan', 'gulerman', 'gulertan', 'gulhan', 'gulkan', 'gulsahin', 'gultan', 'gultas', 'guman', 'gumustan', 'gumustay', 'gunac', 'gunak', 'gunal', 'gunalan', 'gunalp', 'gunaltan', 'gunaltay', 'gunan', 'gunay', 'gunaydin', 'gunbay', 'guncag', 'gundal', 'gundas', 'gundogan', 'gundogar', 'gunduzalp', 'gunduzhan', 'guneral', 'guneralp', 'guneray', 'gunerkan', 'gunerman', 'guneshan', 'gunhan', 'gunkan', 'gunkaya', 'gunkutan', 'gunsar', 'gunsav', 'gunsiray', 'guntan', 'gunvar', 'gunyaruk', 'gurak', 'gurakan', 'gurakin', 'gural', 'guran', 'gurarda', 'gurata', 'guray', 'gurbas', 'gurbaskan', 'gurbay', 'gurboga', 'gurcan', 'gurdal', 'gurhan', 'gurkan', 'hakan', 'hakikat', 'hakki', 'haktan', 'hakverdi', 'halas', 'halaskar', 'haldun', 'halef', 'halife', 'halil', 'halilullah', 'halim', 'halis', 'halit', 'halittin', 'halûk', 'hamaset', 'hamdi', 'hamdullah', 'hami', 'hamil', 'hamis', 'hamit', 'hamza', 'han', 'hanalp', 'hanbek', 'hanbey', 'hanedan', 'hanefi', 'hanif', 'hankan', 'hansoy', 'hanzade', 'harun', 'hasan', 'hasanalp', 'hasane', 'hasbek', 'hasbi', 'hasefe', 'hasip', 'haslet', 'haspolat', 'hasim', 'hasmet', 'hasmettin', 'hatem', 'hatemî', 'hatif', 'hatim', 'hatip', 'hattat', 'havi', 'hayalî', 'hayati', 'haydar', 'hayir', 'hayran', 'hayrani', 'hayret', 'hayrettin', 'hayri', 'hayrullah', 'hazar', 'hazik', 'hazim', 'hazret', 'heyecan', 'hezarfen', 'hifzirrahman', 'hifzullah', 'hincal', 'hicap', 'hicyilmaz', 'hidayet', 'hidayettin', 'hikmetullah', 'hilkat', 'hisar', 'hitam', 'hudavendigar', 'hudavent', 'hudaverdi', 'hudayi', 'hulagu', 'hunalp', 'hudavendigar', 'hudavent', 'hudaver', 'hudaverdi', 'hudayi', 'hukumdar', 'humayun', 'huray', 'hurcan', 'hurdogan', 'hurkal', 'hurkan', 'huryasar', 'husam', 'husamettin', 'ilgar', 'ilgarli', 'ilgaz', 'ilgazcan', 'ilgazer', 'ilicak', 'ilican', 'ira', 'isikal', 'isikalp', 'isikay', 'isikhan', 'isikkan', 'isiktas', 'isilak', 'isilar', 'isiltan', 'isiman', 'isinbay', 'isinhan', 'isinkan', 'isitan', 'ibad', 'ibadet', 'ibadullah', 'ibat', 'ibrahim', 'icacan', 'ihsan', 'ihvan', 'ihya', 'ikbal', 'ikram', 'ikrami', 'ilal', 'ilalan', 'ilaldi', 'ilalmis', 'ilarslan', 'ilaydin', 'ilbars', 'ilbasan', 'ilbasmis', 'ilbasti', 'ilbas', 'ilbay', 'ilboga', 'ilbozan', 'ilcan', 'ilgar', 'ilgazi', 'ilham', 'ilhami', 'ilhan', 'ilimdar', 'ilkan', 'ilkay', 'ilkehan', 'ilkutay', 'ilkunsal', 'ilpars', 'ilsavas', 'ilsavun', 'iltan', 'iltas', 'iltay', 'ilvan', 'ilyas', 'imadettin', 'imam', 'imamettin', 'iman', 'imat', 'imdat', 'inak', 'inal', 'inalbey', 'inalcik', 'inalkut', 'inaltekin', 'inan', 'inanc', 'inancli', 'inanir', 'inanoz', 'inayet', 'incebay', 'irfan', 'irfani', 'irfat', 'irsat', 'isa', 'isfendiyar', 'ishak', 'ismail', 'israfil', 'istemihan', 'istikbal', 'isvan', 'iscan', 'isman', 'iyidogan', 'iyisan', 'izboga', 'izbudak', 'kaan', 'kadagan', 'kadam', 'kadem', 'kadim', 'kadir', 'kadrettin', 'kadri', 'kadrihan', 'kafar', 'kagan', 'kahir', 'kahraman', 'kaim', 'kakinc', 'kala', 'kalagay', 'kalender', 'kalgay', 'kalkan', 'kalmik', 'kalmuk', 'kam', 'kamaci', 'kaman', 'kamanbay', 'kamar', 'kambay', 'kamber', 'kamet', 'kamran', 'kamu', 'kamuran', 'kanagan', 'kanak', 'kanat', 'kanbay', 'kanber', 'kandemir', 'kaner', 'kanik', 'kanikor', 'kanit', 'kani', 'kanpolat', 'kanpulat', 'kansu', 'kansun', 'kanturali', 'kanturk', 'kanun', 'kanver', 'kapagan', 'kapar', 'kapcak', 'kapkin', 'kaplan', 'kaptan', 'karaalp', 'karaca', 'karacakurt', 'karacan', 'karaci', 'karacar', 'karacay', 'karacelik', 'karadag', 'karademir', 'karadeniz', 'karadogan', 'karaduman', 'karaer', 'karagoz', 'karahan', 'karakalpak', 'karakan', 'karakas', 'karakaya', 'karakoca', 'karakoc', 'karakoyun', 'karakucak', 'karakurt', 'karakus', 'karaman', 'karamik', 'karamuk', 'karamut', 'karamursel', 'karan', 'karanalp', 'karanbay', 'karaoglan', 'karaors', 'karapars', 'karasal', 'karasu', 'karasungur', 'karasuyek', 'karasin', 'karatan', 'karatas', 'karatay', 'karatekin', 'karatun', 'karayagiz', 'karayel', 'karcan', 'kardes', 'kargi', 'kargin', 'karginalp', 'karhan', 'karik', 'karindas', 'karlik', 'karlu', 'karluk', 'karlukhan', 'kartal', 'kartay', 'kartekin', 'kasal', 'kasar', 'kasim', 'kasirga', 'kaska', 'kati', 'katihan', 'kavas', 'kavcin', 'kavruk', 'kavurt', 'kavurtbey', 'kavurthan', 'kavvas', 'kay', 'kaya', 'kayaalp', 'kayacan', 'kayaer', 'kayagun', 'kayagunduz', 'kayahan', 'kayan', 'kayansel', 'kayar', 'kayas', 'kayatekin', 'kayatimur', 'kayaturk', 'kaygisiz', 'kaygusuz', 'kayhan', 'kayi', 'kayibay', 'kayihan', 'kayin', 'kayit', 'kayitmis', 'kaymas', 'kaymaz', 'kaynak', 'kaynar', 'kaynarkan', 'kayra', 'kayraalp', 'kayrahan', 'kayral', 'kayran', 'kazak', 'kazakhan', 'kazan', 'kazanhan', 'kazgan', 'kelesbay', 'keleshan', 'kemal', 'kemalettin', 'kemandar', 'kenan', 'keramet', 'keramettin', 'kerami', 'keremsah', 'kerimhan', 'kerman', 'kervan', 'keskinay', 'keyhan', 'kilavuz', 'kilical', 'kilicalp', 'kilicaslan', 'kilicbay', 'kilichan', 'kinalp', 'kinay', 'kinayman', 'kinayturk', 'kinikaslan', 'kipcak', 'kirac', 'kiralp', 'kiran', 'kiranalp', 'kiraner', 'kirat', 'kiratli', 'kiray', 'kirbay', 'kirboga', 'kirca', 'kirdar', 'kirdarli', 'kirhan', 'kirman', 'kirtay', 'kivanc', 'kivancer', 'kivancli', 'kiyam', 'kiyas', 'kizan', 'kizilaslan', 'kizilates', 'kizilbars', 'kizilboga', 'kizilelma', 'kizilpars', 'kizilyalim', 'kibar', 'kicialp', 'kicihan', 'kinas', 'kinyas', 'kipcan', 'kiram', 'kiramettin', 'kirami', 'kirman', 'kirmansah', 'kisihan', 'koca', 'kocaalp', 'kocademir', 'kocagoz', 'kocaman', 'kocatas', 'kocatay', 'kocaturk', 'kocaun', 'kocak', 'kocakalp', 'kocakaslan', 'kocaker', 'kocas', 'kocay', 'kocboga', 'kochan', 'kockan', 'kockar', 'kolat', 'kolcak', 'koldan', 'koldas', 'koman', 'komutan', 'konak', 'konan', 'kongar', 'kongarata', 'konguralp', 'kongurtay', 'konrat', 'konuralp', 'konurata', 'konuray', 'kopan', 'koparal', 'kora', 'koral', 'koralp', 'koraltan', 'koramaz', 'koraslan', 'koray', 'korcan', 'korcak', 'korcan', 'korday', 'korgan', 'korhan', 'korkan', 'korkmaz', 'korkutalp', 'korkutata', 'korman', 'kortak', 'kortan', 'kortas', 'kortay', 'korugan', 'koryak', 'koryay', 'kosal', 'kosukhan', 'kotuzhan', 'koyak', 'koyas', 'koytak', 'koytan', 'kozak', 'koksal', 'koksan', 'koktan', 'koktas', 'koktay', 'kozcan', 'kubat', 'kubilay', 'kuday', 'kudayberdi', 'kudretullah', 'kutay', 'kuyas', 'kursad', 'kursat', 'lala', 'maarif', 'macit', 'magrip', 'magrur', 'mahbup', 'mahfi', 'mahfuz', 'mahi', 'mahir', 'mahmur', 'mahmut', 'mahra', 'mahser', 'mahsun', 'mahsut', 'mahya', 'mail', 'makal', 'makbul', 'maksum', 'maksur', 'maksut', 'makul', 'malik', 'malkoc', 'malkocoglu', 'mancer', 'manco', 'mancu', 'mancuhan', 'manga', 'mangalay', 'mansur', 'manzur', 'maral', 'maruf', 'masum', 'masallah', 'masuk', 'matlup', 'matuk', 'mazhar', 'medayin', 'mefhar', 'melikhan', 'meliksah', 'menaf', 'mengualp', 'mengubay', 'mengutas', 'mengutay', 'mennan', 'mertkal', 'mertkan', 'mestan', 'mesahir', 'metehan', 'metinkaya', 'mevlana', 'midhat', 'mihrican', 'mirac', 'miran', 'miranmir', 'mirat', 'mircan', 'mirhan', 'mirza', 'mirzat', 'mithat', 'mocan', 'moran', 'moray', 'muaffak', 'muallim', 'muammer', 'muazzam', 'mugdat', 'muhacir', 'muhammed', 'muhammet', 'muhar', 'muharrem', 'muhtar', 'mukaddem', 'mukadder', 'munar', 'mungan', 'murat', 'murathan', 'murtaza', 'musa', 'musaddik', 'musafat', 'mustafa', 'mutahhar', 'mutasim', 'mutlualp', 'mutluay', 'mutlubay', 'mutluhan', 'mutlukan', 'mutlukhan', 'muvaffak', 'muvahhit', 'muvakkar', 'muzaffer', 'mubarek', 'mucahit', 'mucahittin', 'mucap', 'mucteba', 'muhurdar', 'mujdat', 'muminhan', 'mumtaz', 'munasip', 'mustakim', 'mustecap', 'musahit', 'mustak', 'musteba', 'muzahir', 'muzdat', 'naci', 'nacil', 'nadi', 'nadim', 'nadir', 'nafi', 'nafiz', 'nahit', 'nail', 'naim', 'naip', 'nakip', 'naki', 'nakip', 'namal', 'namdar', 'namik', 'nami', 'nart', 'narter', 'nas', 'nasif', 'nasir', 'nasih', 'nasip', 'nasir', 'nasrettin', 'nasri', 'nasrullah', 'nasuh', 'nasuhi', 'nasir', 'nasit', 'natik', 'natuk', 'natuvan', 'nayman', 'nazim', 'nazir', 'nazif', 'nazik', 'nazir', 'nazmi', 'nebahattin', 'necat', 'necati', 'neccar', 'nehar', 'nejat', 'nesat', 'nevcivan', 'nevsal', 'nevzat', 'nezahattin', 'nida', 'nidai', 'nihai', 'nihat', 'nihayet', 'nilhan', 'nimetullah', 'nisan', 'nisani', 'nisan', 'nisanbay', 'niyaz', 'niyazi', 'nizam', 'nizamettin', 'nizami', 'nizar', 'nogay', 'noyan', 'nuhcan', 'nuhkan', 'numan', 'nural', 'nuralp', 'nurani', 'nuratay', 'nuraydin', 'nurbaki', 'nurbay', 'nurcihan', 'nurdag', 'nurdal', 'nurdogan', 'nurihak', 'nurkan', 'nursal', 'nursan', 'nurtac', 'nurullah', 'nurzat', 'nuyan', 'oba', 'ocak', 'ocan', 'odhan', 'odkan', 'odkanli', 'odman', 'odyak', 'odyakar', 'odyakmaz', 'oflas', 'oflaz', 'oflazer', 'ogan', 'oganalp', 'oganer', 'ogansoy', 'ogeday', 'ogan', 'oganalp', 'oganer', 'ogansoy', 'oganverdi', 'ogulbali', 'ogulbas', 'ogulbay', 'ogulcan', 'ogulcak', 'ogultan', 'oguralp', 'ogurata', 'oguzalp', 'oguzata', 'oguzbala', 'oguzbay', 'oguzcan', 'oguzhan', 'oguzkan', 'oguzman', 'oguztan', 'okakin', 'okal', 'okan', 'okanalp', 'okanay', 'okandan', 'okaner', 'okar', 'okat', 'okatan', 'okatar', 'okatay', 'okay', 'okayer', 'okbas', 'okbay', 'okboga', 'okcan', 'okdag', 'okhan', 'okkan', 'okman', 'oksal', 'oksaldi', 'oksalmis', 'oksar', 'oksay', 'oksak', 'oksan', 'oksar', 'oktan', 'oktar', 'oktas', 'oktay', 'okutan', 'okyalaz', 'okyan', 'okyanus', 'okyar', 'okyay', 'olca', 'olcan', 'olcay', 'olcayhan', 'olcayto', 'olcaytu', 'olcaytug', 'olcayturk', 'oldac', 'oldag', 'olgac', 'olgunay', 'olkivanc', 'olpak', 'olsan', 'omaca', 'omac', 'omay', 'omurca', 'omurtak', 'onan', 'onar', 'onaran', 'onart', 'onat', 'onatkan', 'onatkut', 'onatsu', 'onay', 'onbulak', 'ongan', 'ongay', 'ongunalp', 'onuktan', 'onultan', 'onurad', 'onural', 'onuralp', 'onurhan', 'onurkan', 'onursal', 'onursan', 'onursay', 'opak', 'orak', 'orakay', 'oral', 'oralmis', 'oran', 'oranli', 'oray', 'orbay', 'orcan', 'orcaner', 'orgunalp', 'orguntay', 'orgunalp', 'orhan', 'orkan', 'orkutay', 'orman', 'ortac', 'ortak', 'ortan', 'oskan', 'oskay', 'osman', 'otaci', 'otag', 'otak', 'otakci', 'otamis', 'otaran', 'otay', 'oyal', 'oyalp', 'oybozan', 'oyhan', 'oykan', 'oymak', 'oyman', 'ozan', 'ozanalp', 'ozanay', 'ozaner', 'ozansoy', 'ozansu', 'ozgan', 'ocal', 'ocal', 'ogeday', 'ogutal', 'omural', 'omurcan', 'onad', 'onal', 'onalan', 'onay', 'onaydin', 'oncubay', 'ongay', 'onkal', 'onsal', 'onsav', 'ontas', 'orsan', 'orsay', 'orskan', 'ortan', 'ortas', 'ortay', 'ovunal', 'ozak', 'ozakan', 'ozakar', 'ozakay', 'ozakin', 'ozakinci', 'ozaktug', 'ozal', 'ozalp', 'ozalpman', 'ozalpsan', 'ozaltan', 'ozaltay', 'ozaltin', 'ozaltug', 'ozan', 'ozarda', 'ozari', 'ozark', 'ozarkin', 'ozaslan', 'ozata', 'ozatay', 'ozay', 'ozaydin', 'ozayhan', 'ozbag', 'ozbal', 'ozbala', 'ozbas', 'ozbatu', 'ozbay', 'ozbaydar', 'ozbekkan', 'ozboga', 'ozcan', 'ozcam', 'ozcinar', 'ozdag', 'ozdal', 'ozdamar', 'ozdilmac', 'ozdoga', 'ozdogal', 'ozdogan', 'ozduran', 'ozekan', 'ozercan', 'ozerdal', 'ozerhan', 'ozerman', 'ozertan', 'ozgebay', 'ozgenalp', 'ozgenay', 'ozgiray', 'ozgunay', 'ozgurcan', 'ozhakan', 'ozhan', 'ozilhan', 'ozinal', 'ozinan', 'ozkal', 'ozkan', 'ozkar', 'ozkaya', 'ozkayra', 'ozkerman', 'ozkinal', 'ozkinay', 'ozkula', 'ozkutal', 'ozkutay', 'ozkutsal', 'ozman', 'ozoktay', 'ozpala', 'ozpinar', 'ozpolat', 'ozpulat', 'ozsan', 'ozsanli', 'ozsahin', 'ozsan', 'oztan', 'oztanir', 'oztarhan', 'oztas', 'oztay', 'oztaylan', 'oztoygar', 'oztuna', 'ozuak', 'ozyay', 'ozyuva', 'padisah', 'pak', 'pakalin', 'pakan', 'pakbaz', 'pakel', 'paker', 'paki', 'pakkan', 'pakman', 'paksan', 'pamir', 'polat', 'poyraz', 'raci', 'racih', 'radi', 'rafet', 'rafettin', 'rafi', 'rafih', 'ragip', 'rahi', 'rahim', 'rahman', 'rahmani', 'rahmet', 'rahmeti', 'rahmetullah', 'rahmi', 'rahsan', 'raif', 'raik', 'rakim', 'ramazan', 'rami', 'ramis', 'ramiz', 'rasih', 'rasim', 'rasin', 'rasit', 'ratip', 'rauf', 'rayet', 'rayihan', 'razi', 'razi', 'reca', 'recai', 'refhan', 'regaip', 'reha', 'rehayeddin', 'renan', 'resai', 'resulhan', 'resat', 'rezzak', 'ridvan', 'rifat', 'riza', 'rizkullah', 'rizvan', 'rical', 'rifat', 'rikap', 'risalet', 'risalettin', 'ruat', 'ruhani', 'ruhcan', 'ruhsat', 'ruhsan', 'ruhullah', 'ruchan', 'saadettin', 'sacit', 'sada', 'sadak', 'sadakat', 'sadettin', 'sadik', 'sadi', 'sadir', 'sadrettin', 'sadri', 'sadullah', 'sadun', 'safa', 'safder', 'safer', 'saffet', 'safi', 'safiyuddin', 'safter', 'sagan', 'saganak', 'saganalp', 'sagbilge', 'sagbudun', 'sagcan', 'sagdic', 'sagin', 'saginc', 'sagit', 'saglam', 'saglamer', 'saglar', 'saglik', 'sagman', 'sagun', 'sahil', 'sahip', 'sahir', 'saim', 'saip', 'sair', 'sait', 'sak', 'saka', 'sakin', 'sakip', 'saki', 'sakin', 'sakman', 'sal', 'sala', 'salah', 'salahattin', 'salahi', 'salan', 'salar', 'salcan', 'saldam', 'salgur', 'salik', 'salikbey', 'salih', 'salim', 'salis', 'salkin', 'salman', 'saltan', 'salti', 'saltik', 'saltuk', 'saltukalp', 'salur', 'salurbay', 'samet', 'sami', 'samih', 'samim', 'samimi', 'samin', 'samir', 'samur', 'samuray', 'samurtay', 'san', 'sanac', 'sanak', 'sanal', 'sanalp', 'sanat', 'sanay', 'sanbay', 'sanberk', 'sancak', 'sancaktar', 'sancar', 'sancarhan', 'sancar', 'sanduc', 'saner', 'sani', 'sanih', 'sanli', 'sansin', 'sanver', 'sar', 'sarac', 'saral', 'saran', 'sarbek', 'sargan', 'sargin', 'sarginal', 'sargut', 'sarialp', 'saribay', 'sarica', 'saricam', 'sarier', 'sarihan', 'sarikaya', 'saritas', 'sarim', 'sarkan', 'sarp', 'sarper', 'sarphan', 'sarpkan', 'sarpkin', 'sarpkoc', 'sart', 'sartik', 'saru', 'saruca', 'saruhan', 'sarvan', 'sati', 'satibey', 'satilmis', 'satuk', 'satukbugra', 'satvet', 'savaci', 'savak', 'savas', 'savasan', 'savaser', 'savaskan', 'savat', 'saver', 'savgat', 'savlet', 'savni', 'savran', 'savtekin', 'savtunc', 'savtur', 'savun', 'say', 'saya', 'saybay', 'saydam', 'saygi', 'saygili', 'saygin', 'saygun', 'sayhan', 'sayil', 'sayilbay', 'sayilgan', 'sayim', 'sayin', 'sayinberk', 'sayinbey', 'sayiner', 'saykal', 'saykut', 'saylam', 'saylav', 'saylu', 'sayman', 'saymaner', 'sayrac', 'sayrak', 'sayri', 'sayru', 'sayvan', 'sayyat', 'sazak', 'sebahattin', 'sebat', 'sebati', 'sebukalp', 'secahat', 'sedat', 'sefa', 'seha', 'sehhar', 'sehran', 'selahattin', 'selamullah', 'selcukkan', 'selekman', 'selhan', 'selkan', 'selman', 'selvihan', 'semahat', 'semai', 'semavi', 'semiray', 'senai', 'sencan', 'serad', 'seralp', 'serazat', 'serbay', 'sercan', 'sercihan', 'serdal', 'serdar', 'serdarhan', 'serhan', 'serhas', 'serhat', 'serkan', 'sertac', 'sertap', 'settar', 'sevan', 'sevay', 'sevcan', 'sevkal', 'sevkan', 'seyda', 'seyfali', 'seyfullah', 'seyhan', 'seyithan', 'seyran', 'sezai', 'sezal', 'sezginay', 'sezginbas', 'siba', 'sidal', 'sidam', 'sidar', 'siral', 'siralp', 'sirat', 'siylihan', 'simavi', 'sina', 'sinan', 'sipahi', 'siracettin', 'sirac', 'siyavus', 'somay', 'sonad', 'sonalp', 'sonat', 'sonbay', 'sondal', 'songurhan', 'songurkan', 'soral', 'soyak', 'soyalp', 'soydan', 'soydaner', 'soydas', 'soyhan', 'soykal', 'soykan', 'soylubay', 'soysal', 'soysaldi', 'soysalturk', 'soysan', 'soyupak', 'soyurgal', 'sonmezalp', 'sonmezay', 'sozal', 'sualp', 'suat', 'suavi', 'suay', 'subasi', 'subay', 'subutay', 'suca', 'suka', 'sukat', 'sunal', 'sunalp', 'sunar', 'sunay', 'sunguralp', 'sungurbay', 'sunullah', 'suyurgal', 'suyurgamis', 'suyurgan', 'sualp', 'subas', 'subasi', 'subitay', 'sudas', 'suerkan', 'suersan', 'suha', 'sukan', 'suleyman', 'sumerkan', 'sungutay', 'suphan', 'suvari', 'sad', 'sadan', 'sader', 'sadiman', 'sadi', 'safak', 'safi', 'sah', 'sahadet', 'sahadettin', 'sahamet', 'sahan', 'sahap', 'sahat', 'sahbaz', 'sahbey', 'sahdar', 'sahin', 'sahinalp', 'sahinbay', 'sahinbey', 'sahiner', 'sahinhan', 'sahinkan', 'sahinter', 'sahistan', 'sahittin', 'sahruh', 'sahsuvar', 'sahvelet', 'sahzade', 'sahzat', 'saik', 'sair', 'sakar', 'sakir', 'samih', 'samil', 'san', 'sanal', 'sanalp', 'saner', 'sanli', 'sanlibay', 'sansal', 'sanver', 'sar', 'sarbay', 'sarik', 'satir', 'sayeste', 'sazi', 'sebap', 'secaat', 'sefaat', 'sefaattin', 'sefkat', 'sehadet', 'sehadettin', 'sehamet', 'sehinsah', 'sehsuvar', 'sehzade', 'sehzat', 'semail', 'senal', 'senalp', 'senaltan', 'senbay', 'sencan', 'sendogan', 'senkal', 'sensal', 'senyasar', 'serafet', 'serafettin', 'serefhan', 'seyda', 'seyyat', 'simsad', 'simsekhan', 'simsekkan', 'sinasi', 'sinaver', 'sipal', 'sirvan', 'sirzat', 'suayp', 'sungar', 'tacal', 'tacettin', 'taci', 'tacim', 'tacir', 'tacver', 'tac', 'tackin', 'tagay', 'tag', 'tagalp', 'tagar', 'tagay', 'tagman', 'taha', 'tahir', 'tahsin', 'taip', 'takdir', 'taki', 'takiyettin', 'talas', 'talat', 'talay', 'talayer', 'talayhan', 'talaykan', 'talaykoc', 'talaykurt', 'talaykut', 'talayman', 'talaz', 'talha', 'tali', 'talih', 'talip', 'talu', 'taluy', 'taluyhan', 'tamal', 'tamar', 'tamay', 'tamaydin', 'tamcelik', 'tamer', 'tamerk', 'tamkan', 'tamkoc', 'tamkurt', 'tamkut', 'tamturk', 'tan', 'tanacan', 'tanacar', 'tanagar', 'tanak', 'tanal', 'tanalp', 'tanaltan', 'tanaltay', 'tanay', 'tanaydin', 'tanbay', 'tanbek', 'tanberk', 'tanbey', 'tanboga', 'tanbolat', 'tancan', 'tandogan', 'tandogdu', 'tandogmus', 'tandoruk', 'tanel', 'taner', 'tanerk', 'tanfer', 'tangor', 'tanguc', 'tangun', 'tanguner', 'tanhan', 'tanik', 'tanin', 'tanir', 'tanircan', 'tanirer', 'tanis', 'tanju', 'tankan', 'tankoc', 'tankurt', 'tankut', 'tankutlu', 'tanla', 'tanlak', 'tanman', 'tanoren', 'tanpinar', 'tanrikorur', 'tanrikul', 'tanrikulu', 'tanriover', 'tansal', 'tansan', 'tansel', 'tansen', 'tanser', 'tansev', 'tanseven', 'tansever', 'tansi', 'tansig', 'tansik', 'tansoy', 'tansu', 'tansug', 'tansuk', 'tantug', 'tanturk', 'tanugur', 'tanver', 'tanyel', 'tanyeli', 'tanyer', 'tanyeri', 'tanyildiz', 'tanyol', 'tanyolac', 'tanyolu', 'tanyu', 'tanyucel', 'tanyuz', 'tanzer', 'tapduk', 'tapgac', 'tapik', 'tapinc', 'tapli', 'taptuk', 'taranci', 'tardu', 'tarduk', 'targan', 'tarhan', 'tarhun', 'tari', 'tarik', 'tarim', 'tariman', 'tarimer', 'tarik', 'tarkan', 'tarman', 'tartis', 'taru', 'tasan', 'tasar', 'tasboga', 'tasbudak', 'tascan', 'tasdemir', 'tasdoven', 'tasel', 'taser', 'tasgan', 'tashan', 'taskan', 'taskent', 'taskin', 'taskinel', 'taskiner', 'taskiran', 'tastan', 'tastekin', 'tatar', 'tatarhan', 'tatarkan', 'tatu', 'tav', 'tavgac', 'tavli', 'tavus', 'tay', 'tayak', 'tayaydin', 'taybars', 'taybek', 'tayberk', 'tayboga', 'taycan', 'taydas', 'taydemir', 'tayfun', 'tayfur', 'taygan', 'taygun', 'tayguner', 'tayhan', 'taykara', 'taykoc', 'taykurt', 'taykut', 'tayla', 'taylak', 'taylan', 'taylaner', 'tayman', 'taymaz', 'taypars', 'tayuk', 'tayyar', 'tayyip', 'teberdar', 'tekal', 'tekalp', 'tekant', 'tekay', 'tekbay', 'tekcan', 'tekdogan', 'tekebas', 'tekebay', 'tekecan', 'tekinal', 'tekinalp', 'tekinay', 'tekindag', 'tekinhan', 'tekyay', 'temirbay', 'temircan', 'temirhan', 'temirkan', 'temirtas', 'temizalp', 'temizcan', 'temizhan', 'temizkal', 'temizkan', 'temizsan', 'temurhan', 'temursah', 'tendubay', 'tengizalp', 'teoman', 'tercan', 'tezal', 'tezalp', 'tezay', 'tezcan', 'tezcanli', 'tezkan', 'tinal', 'tinaz', 'tilmac', 'timurcan', 'timurhan', 'timurkan', 'timurtas', 'togan', 'togay', 'tokal', 'tokalan', 'tokalp', 'tokay', 'tokcan', 'tokhan', 'tokkan', 'tokta', 'toktahan', 'toktamis', 'toktas', 'tokushan', 'tokyay', 'tola', 'tolay', 'tolga', 'tolgahan', 'tolgan', 'tolgay', 'tolgunay', 'tolonay', 'tolonbay', 'tolunay', 'tolunbay', 'tongal', 'tongar', 'topa', 'topac', 'topak', 'topay', 'topcam', 'topcay', 'toprak', 'toralp', 'toraman', 'toran', 'torcan', 'torgay', 'torhan', 'torkal', 'torkan', 'torlak', 'torumtay', 'toyboga', 'toycan', 'toygar', 'toyka', 'tozan', 'torehan', 'tufan', 'tugay', 'tugal', 'tugalp', 'tugaltan', 'tugaltay', 'tugbay', 'tughan', 'tugkan', 'tugra', 'tugsan', 'tugsav', 'tugsavas', 'tugsavul', 'tugsavun', 'tugtas', 'tugtay', 'tulga', 'tulgar', 'tuman', 'tumay', 'tuna', 'tunacan', 'tunaer', 'tunahan', 'tunakan', 'tunay', 'tunca', 'tuncal', 'tuncalp', 'tuncay', 'tuncal', 'tuncalin', 'tuncalp', 'tuncaral', 'tuncaslan', 'tuncay', 'tuncbay', 'tuncboga', 'tunccag', 'tunchan', 'tunckan', 'tunckaya', 'tunctan', 'tunga', 'tura', 'turac', 'tural', 'turalp', 'turan', 'turatekin', 'turay', 'turbay', 'turcan', 'turgay', 'turhan', 'turkan', 'tutuhan', 'tuvana', 'tukelalp', 'tukelay', 'tumay', 'tumbay', 'tumcan', 'tumenbay', 'tumenboga', 'tumerkan', 'tumhan', 'tumkal', 'tumkan', 'tunak', 'tunal', 'tunay', 'tunaydin', 'turehan', 'turkalp', 'turkaslan', 'turkay', 'turkcan', 'turkdogan', 'turkkan', 'turksan', 'turkyilmaz', 'tuzunalp', 'tuzunkan', 'ubeydullah', 'uca', 'ucaer', 'ucatekin', 'uca', 'ucan', 'ucanay', 'ucanok', 'ucantekin', 'ucanturk', 'ucar', 'ucarer', 'ucarli', 'ucay', 'ucbay', 'uchan', 'uckan', 'uckara', 'ucma', 'ucmak', 'ucman', 'uflaz', 'ufukay', 'ufuktan', 'ugan', 'ugan', 'ugural', 'uguralp', 'ugurata', 'uguray', 'ugurcan', 'ugurhan', 'ugurlubay', 'ugursal', 'ugursan', 'ugursay', 'ugurtan', 'ugurtay', 'ulac', 'ulachan', 'ulackan', 'ulak', 'ulakbey', 'ulam', 'ular', 'ulas', 'ulcan', 'ulcay', 'ulualp', 'uluant', 'ulubas', 'ulubay', 'uluca', 'ulucan', 'ulucag', 'ulucam', 'uluckan', 'uludag', 'uludogan', 'uluerkan', 'uluhan', 'ulukaan', 'ulukan', 'ulukaya', 'uluman', 'ulunay', 'ulusal', 'ulusan', 'ulusahin', 'ulusan', 'ulutan', 'ulutas', 'ulutay', 'uma', 'umac', 'umak', 'uman', 'umar', 'umman', 'umran', 'umural', 'umuralp', 'umurbay', 'unan', 'unat', 'ungan', 'ural', 'uralp', 'uraltan', 'uraltay', 'uram', 'uran', 'uras', 'uraz', 'uraza', 'urazli', 'urhan', 'urkan', 'usal', 'usalan', 'usalp', 'usbay', 'ushan', 'uskan', 'usman', 'usta', 'usak', 'utkan', 'utman', 'uyar', 'uyaralp', 'uyarel', 'uyarer', 'uygan', 'uygar', 'uyguralp', 'uysal', 'uzalp', 'uzay', 'uzbay', 'uzcan', 'uzhan', 'uzkan', 'uzman', 'uzsan', 'uztan', 'uztas', 'uztav', 'uztay', 'ubeydullah', 'ukkase', 'ulgenalp', 'ulkutan', 'unal', 'unalan', 'unaldi', 'unalmis', 'unalp', 'unay', 'unkan', 'unkaya', 'unsac', 'unsal', 'unsan', 'unuvar', 'unyay', 'urundubay', 'ustat', 'ustay', 'ustunbay', 'vacip', 'vacit', 'vafi', 'vafir', 'vafit', 'vaha', 'vahap', 'vahdet', 'vahdettin', 'vahip', 'vahit', 'vahittin', 'vaiz', 'vakkas', 'vakur', 'valasan', 'vamik', 'varal', 'varas', 'vardar', 'vargin', 'varlik', 'varol', 'vasfi', 'vasif', 'vasil', 'vassaf', 'vataner', 'vecahettin', 'vedat', 'vefa', 'vefai', 'velican', 'veliyullah', 'veral', 'versan', 'vesamet', 'vicdan', 'vicdani', 'visali', 'visam', 'volkan', 'vural', 'yada', 'yadaci', 'yadigar', 'yafes', 'yagan', 'yagin', 'yaginalp', 'yagiz', 'yagizalp', 'yagizbay', 'yagizboga', 'yagizer', 'yagizhan', 'yagizkan', 'yagizkurt', 'yagiztekin', 'yagmurca', 'yahsi', 'yahsibay', 'yahsiboga', 'yahsihan', 'yahsikan', 'yahsitay', 'yahya', 'yakup', 'yakut', 'yalap', 'yalav', 'yalavac', 'yalaz', 'yalazahan', 'yalazakan', 'yalazalp', 'yalazan', 'yalazay', 'yalcin', 'yalciner', 'yalcinkaya', 'yalcuk', 'yaldirak', 'yaldirim', 'yalgi', 'yalgin', 'yalginay', 'yalim', 'yalin', 'yalinalp', 'yalinay', 'yalki', 'yalkin', 'yalmac', 'yalman', 'yalt', 'yaltir', 'yaltirak', 'yaltiray', 'yamac', 'yaman', 'yamaner', 'yamanoz', 'yamansoy', 'yamanturk', 'yamanyigit', 'yamci', 'yanac', 'yanal', 'yanar', 'yanbek', 'yanbey', 'yandil', 'yangar', 'yanik', 'yaniker', 'yanki', 'yapalak', 'yararer', 'yarasik', 'yardak', 'yargan', 'yargi', 'yarkan', 'yarkaya', 'yarkin', 'yarlik', 'yarluk', 'yaruk', 'yasa', 'yasan', 'yasavul', 'yaser', 'yasin', 'yasun', 'yasa', 'yasam', 'yasanur', 'yasar', 'yasarturk', 'yasdas', 'yasik', 'yasin', 'yaslak', 'yatman', 'yatuk', 'yavas', 'yaver', 'yavuz', 'yavuzalp', 'yavuzay', 'yavuzbay', 'yavuzboga', 'yavuzcan', 'yavuzer', 'yavuzhan', 'yavuzsoy', 'yay', 'yayak', 'yayalp', 'yayboru', 'yaybuke', 'yaygir', 'yayla', 'yaylak', 'yazan', 'yazar', 'yazgan', 'yazganalp', 'yazgi', 'yazik', 'yazir', 'yekta', 'yelal', 'yelbay', 'yelboga', 'yeldan', 'yenal', 'yenay', 'yeneral', 'yertan', 'yesari', 'yetisal', 'yezdan', 'yibar', 'yilbay', 'yildiralp', 'yildiran', 'yildiraner', 'yildiray', 'yildizhan', 'yilhan', 'yilkan', 'yilma', 'yilmaz', 'yilmazok', 'yipar', 'yigitcan', 'yigithan', 'yigitkan', 'yinanc', 'yogunay', 'yola', 'yolac', 'yolal', 'yoldas', 'yoma', 'yordam', 'yordamli', 'yonal', 'yula', 'yura', 'yurdaay', 'yurdacan', 'yurdaer', 'yurdakul', 'yurdal', 'yurdanur', 'yurdasen', 'yurtal', 'yurtbay', 'yurtcan', 'yurtkuran', 'yurtman', 'yurtsal', 'yurtsan', 'yurttas', 'yucealp', 'yucebas', 'yucedag', 'yucelay', 'yucesan', 'yuzuak', 'zade', 'zafer', 'zafir', 'zagnos', 'zahir', 'zahit', 'zaik', 'zaim', 'zait', 'zaki', 'zakir', 'zaman', 'zamir', 'zarif', 'zati', 'zekeriya', 'zeycan', 'zeynullah', 'zeyyat', 'zikrullah', 'ziya', 'ziyaeddin', 'ziyaettin', 'ziyat', 'ziynetullah', 'zoral', 'zulfikar', 'zulkarneyn', 'bahir', 'bedel', 'bedi', 'bedih', 'bedir', 'bediz', 'bedrettin', 'bedri', 'beduk', 'begenc', 'behcet', 'behic', 'behlul', 'behmen', 'bek', 'bekam', 'bekdemir', 'bekdil', 'bekem', 'beker', 'bekir', 'bektore', 'bekturk', 'belek', 'belen', 'belge', 'belig', 'bellek', 'bender', 'bendes', 'bener', 'bengi', 'bengisoy', 'bengisu', 'bengu', 'benol', 'bensen', 'bent', 'benturk', 'benzer', 'bereket', 'beren', 'berge', 'bergin', 'beri', 'berin', 'berk', 'berke', 'berkel', 'berker', 'berki', 'berkin', 'berkmen', 'berkok', 'berkol', 'berkoz', 'berksoy', 'berksu', 'berksun', 'berktin', 'berkun', 'berter', 'besen', 'besim', 'beser', 'besir', 'betik', 'betim', 'beygu', 'beyrek', 'beytekin', 'beytemir', 'beytore', 'bilal', 'bilek', 'bilen', 'bilender', 'bilgeer', 'bilgekurt', 'bilgekut', 'bilgen', 'bilger', 'bilgeturk', 'bilgi', 'bilgic', 'bilgin', 'bilginer', 'bilgu', 'bilik', 'bilir', 'bilmen', 'bilnur', 'bilsen', 'biner', 'bingol', 'binisik', 'bintug', 'birce', 'birge', 'birgi', 'birgit', 'biriz', 'birkok', 'birmen', 'birol', 'birsel', 'birsen', 'birsin', 'birsoy', 'birsen', 'birten', 'bitek', 'bitim', 'bor', 'boy', 'boyer', 'boylu', 'boz', 'bozbey', 'bozdemir', 'bozdeniz', 'bozer', 'bozerk', 'bozkir', 'bozkurt', 'bozok', 'boztepe', 'boztimur', 'bozyel', 'bozyigit', 'boget', 'bogrek', 'boke', 'boken', 'borcek', 'bork', 'bortecin', 'boru', 'borubey', 'budun', 'bulgu', 'buluc', 'bulunc', 'bulus', 'bulut', 'buluttekin', 'bumin', 'buruk', 'buruktekin', 'buyruk', 'buyrukcu', 'buge', 'buget', 'bugduz', 'buk', 'buke', 'buklum', 'bulent', 'burce', 'burge', 'burkut', 'butun', 'cebe', 'ceben', 'cebesoy', 'ceber', 'celebi', 'celikbilek', 'colbey', 'demirbuken', 'ebecen', 'ebed', 'ebet', 'ebubekir', 'ecebey', 'ekber', 'elbek', 'elbeyi', 'elcibey', 'elibol', 'erbelgin', 'erben', 'erberk', 'erbey', 'erbil', 'erbilek', 'erbilen', 'erbilir', 'erboy', 'erdibek', 'erdibey', 'gokbel', 'gokbelen', 'gokberk', 'gokbey', 'gokboru', 'gokbudun', 'gokbulut', 'gokcebel', 'gokcebey', 'gorbil', 'gulbek', 'gulbey', 'gulbeyi', 'gumberk', 'gunbek', 'gunbey', 'gunduzbey', 'gungorbey', 'gurbuz', 'heybet', 'hurbey', 'ibik', 'ibis', 'ibo', 'ilbeg', 'ilbek', 'ilbey', 'ilbeyi', 'ilbilge', 'ilbozdu', 'ilbudun', 'incebey', 'izboru', 'izbudun', 'izbul', 'kebir', 'kirboru', 'kizginbey', 'kizilboru', 'kocboru', 'kocubey', 'konurbey', 'lebip', 'mebruk', 'mebrur', 'mebus', 'menguberti', 'muhibbi', 'mukbil', 'mustubey', 'muteber', 'mubin', 'nebi', 'nebih', 'nebil', 'oben', 'obuz', 'ogulbey', 'okbudun', 'orbek', 'obek', 'olmezbey', 'ozbek', 'ozben', 'ozberk', 'ozbey', 'ozbil', 'ozbilek', 'ozbilen', 'ozbilge', 'ozbilgin', 'ozbilir', 'ozbir', 'ozcebe', 'rebi', 'rebii', 'rehber', 'sebih', 'sebil', 'sebuk', 'sebuktekin', 'serbulent', 'soylubey', 'subegi', 'subhi', 'teber', 'teberhun', 'tebrik', 'tekbek', 'tekbey', 'tekbir', 'tekebey', 'tellibey', 'tibet', 'tosunbey', 'tuncbilek', 'tuncboru', 'tublek', 'ubeyt', 'ucbeyi', 'ugurlubey', 'ulubek', 'uluberk', 'ulubey', 'ulugbey', 'umurbey', 'urbeyi', 'usberk', 'usbey', 'ubeyd', 'ubeyt', 'unubol', 'vehbi', 'yolbul', 'zobu', 'zorbey', 'zubeyr', 'celadet', 'celal', 'celalettin', 'celali', 'celasun', 'celayir', 'celil', 'cem', 'cemi', 'cemil', 'cemre', 'cemsir', 'cemsit', 'cengaver', 'cenger', 'cengiz', 'cenk', 'cenker', 'cerit', 'cesim', 'cesur', 'cevdet', 'cevher', 'cevheri', 'cevri', 'ceyhun', 'cezlan', 'cezmi', 'cimsit', 'cindoruk', 'cosku', 'coskun', 'coskuner', 'coskunsu', 'comert', 'cuci', 'cudi', 'culduz', 'cumhur', 'cumhuriyet', 'cundi', 'cuneyt', 'delice', 'ecemis', 'ecer', 'ecevit', 'ecir', 'ecmel', 'ecvet', 'ekinci', 'emcet', 'erce', 'erciyes', 'ercument', 'erincek', 'erincik', 'evcil', 'evcimen', 'fecri', 'gence', 'gencel', 'gencer', 'genco', 'gocek', 'gokcen', 'gucel', 'gucer', 'gucumen', 'hicret', 'huccet', 'ince', 'incesu', 'ivecen', 'iyicil', 'kivilcim', 'korucu', 'mecdi', 'mecdut', 'mecit', 'mecittin', 'mecnun', 'mehcur', 'mengucek', 'mescur', 'mevcut', 'mucip', 'mucit', 'munci', 'necdet', 'necip', 'necmi', 'oncel', 'oncu', 'oncuer', 'ozgeci', 'recep', 'selcen', 'sencer', 'tecelli', 'tecen', 'tecer', 'teceren', 'tecim', 'tecimen', 'tecimer', 'tecir', 'tugcu', 'tuncel', 'tuncer', 'ulkucu', 'vecdet', 'vecdi', 'vechi', 'vecih', 'vecihi', 'vecit', 'yuce', 'yuceer', 'yucel', 'yucelen', 'yucelt', 'yucelten', 'yucesoy', 'yucetekin', 'yuceturk', 'cecen', 'cekik', 'cekim', 'cekin', 'celem', 'celen', 'celenk', 'celik', 'celikel', 'celiker', 'celikiz', 'celikkol', 'celikoz', 'celiksu', 'celikten', 'celikturk', 'celikyurek', 'celim', 'celtik', 'cender', 'cengiz', 'cepni', 'cerci', 'ceri', 'cerkez', 'cerme', 'cetik', 'cetin', 'cetinel', 'cetiner', 'cetinok', 'cetinoz', 'cetinsoy', 'cetinsu', 'cetinturk', 'cetinyigit', 'cevik', 'cevikel', 'ceviker', 'cevikoz', 'cevrim', 'cig', 'cigil', 'cigir', 'cingi', 'civgin', 'ciftci', 'cigil', 'ciglez', 'cin', 'cinel', 'ciner', 'cinerk', 'cingiz', 'cinkilic', 'cinucin', 'coker', 'coku', 'copur', 'cotuk', 'cotur', 'cokermis', 'coyur', 'demirguc', 'demirkoc', 'demirpence', 'dikec', 'dinc', 'dincel', 'dincer', 'dincerk', 'dinckol', 'dinckok', 'dincmen', 'dincok', 'dincol', 'dincoz', 'dincsel', 'dincsoy', 'dincsu', 'dincturk', 'direnc', 'elci', 'elcin', 'emec', 'enc', 'enec', 'ercelik', 'ercetin', 'ercevik', 'erdinc', 'erenguc', 'ergenc', 'erguc', 'ergulec', 'erguvenc', 'erinc', 'erincer', 'erkilic', 'erkoc', 'ersec', 'ersevinc', 'ertunc', 'ferec', 'genc', 'gencel', 'gencer', 'gencsoy', 'gencsu', 'gencturk', 'gercek', 'gerceker', 'girginkoc', 'gocen', 'gocer', 'gocmen', 'gokceer', 'gokcek', 'gokcel', 'gokcen', 'gokcer', 'gokcesu', 'gokcil', 'gokcin', 'gokcul', 'gokcun', 'goktunc', 'gonc', 'gonenc', 'gorguc', 'goyunc', 'guc', 'gucel', 'guceren', 'gucermis', 'guclu', 'gucluer', 'gucluturk', 'gucmen', 'gucsel', 'gucyener', 'gucyeter', 'gulec', 'gulecer', 'gumec', 'gunce', 'gunec', 'guvenc', 'hicsonmez', 'icli', 'icoz', 'icten', 'ilci', 'ilginc', 'kilic', 'kilicel', 'kilicer', 'kilinc', 'kiziltunc', 'kici', 'koc', 'kocer', 'kocsoy', 'koctug', 'kocturk', 'kocu', 'kocyigit', 'koceri', 'lacin', 'mehmetcik', 'menguc', 'meric', 'okcun', 'okguc', 'okguclu', 'oktunc', 'olcun', 'opcin', 'orcun', 'ortunc', 'oruc', 'oytunc', 'ogrunc', 'ogunc', 'olcum', 'olcun', 'ondunc', 'ovec', 'ovunc', 'ozcelik', 'ozcevik', 'ozcin', 'ozdinc', 'ozdincer', 'ozenc', 'ozerdinc', 'ozerinc', 'ozgenc', 'ozguc', 'ozgulec', 'ozkoc', 'ozokcu', 'oztunc', 'secen', 'secim', 'seckin', 'seckiner', 'secme', 'secmeer', 'secmen', 'secmener', 'selcuker', 'selguc', 'serdengecti', 'serdinc', 'sonuc', 'sorguc', 'soydinc', 'soydincer', 'soyselcuk', 'tekce', 'temucin', 'timucin', 'tonguc', 'tunc', 'tuncdemir', 'tuncel', 'tuncer', 'tunckilic', 'tunckol', 'tunckurt', 'tuncok', 'tuncoven', 'tuncsoy', 'tuncturk', 'tunguc', 'tumkoc', 'uc', 'uckun', 'ucuk', 'ucur', 'uluc', 'ulumeric', 'uce', 'ucel', 'ucer', 'ucisik', 'uckok', 'ucok', 'ucuk', 'unucok', 'yoruc', 'adem', 'dahi', 'deger', 'degmeer', 'dehri', 'demir', 'demirdelen', 'demirdoven', 'demirel', 'demirer', 'demirezen', 'demirgulle', 'demiriz', 'demirkol', 'demirkok', 'demirkurt', 'demirkut', 'demirok', 'demirol', 'demiroz', 'demirsoy', 'demirtekin', 'demirtug', 'demirturk', 'demiryurek', 'demren', 'dengiz', 'dengizer', 'denizel', 'denizer', 'denizmen', 'deniztekin', 'denk', 'denkel', 'denker', 'denli', 'denlisoy', 'derenel', 'derin', 'derinkok', 'derinoz', 'derlen', 'dervis', 'devin', 'deviner', 'devlet', 'devlettin', 'devrim', 'devrimer', 'didim', 'dik', 'dikel', 'diken', 'diker', 'dikey', 'dikmen', 'diksoy', 'dil', 'dilaver', 'dilemre', 'diler', 'dilge', 'dilmen', 'dilyar', 'diren', 'diri', 'dirik', 'diriker', 'dirikok', 'diril', 'dirim', 'dirimtekin', 'dirin', 'diriner', 'dirisoy', 'dirlik', 'dogru', 'dogruel', 'dogruer', 'dogruol', 'dogruoz', 'dogu', 'doguer', 'dogus', 'dolun', 'doru', 'doruk', 'dorukkurt', 'dorukkut', 'doruktekin', 'doruktepe', 'dost', 'dolek', 'dolen', 'dolensoy', 'donmez', 'donmezer', 'donmezsoy', 'donmeztekin', 'donu', 'dumlu', 'dumrul', 'durdu', 'durgun', 'durguner', 'durgunsu', 'durmus', 'dursun', 'dursen', 'duru', 'duruiz', 'duruk', 'durul', 'duruoz', 'durusel', 'durusoy', 'durusu', 'durutekin', 'duruturk', 'duyu', 'dulge', 'dulger', 'durri', 'dusun', 'dusunsel', 'duzel', 'duzey', 'duzgun', 'ede', 'edgu', 'edguer', 'edhem', 'edip', 'ediz', 'efendi', 'efgende', 'ehed', 'ejder', 'eldem', 'eldemir', 'elidemir', 'elverdi', 'ender', 'erdem', 'erdemer', 'erdemir', 'erdemli', 'erden', 'erdener', 'erdeniz', 'erdesir', 'erdi', 'erdil', 'erdilek', 'erdin', 'erdiner', 'erdog', 'erdogdu', 'erdogmus', 'erdol', 'erdolek', 'erdonmez', 'erdur', 'erdurdu', 'erdurmus', 'erdursun', 'erduru', 'erendemir', 'erendiz', 'erguden', 'erguder', 'eryildiz', 'esendemir', 'ferdi', 'feridun', 'ferzend', 'firdevsi', 'gedik', 'gediz', 'gokdemir', 'gokdeniz', 'gondem', 'gonder', 'gonuldes', 'gudek', 'guder', 'gundemir', 'gunden', 'gundeniz', 'gunder', 'gundes', 'gundogdu', 'gundogmus', 'gundondu', 'gunduz', 'gungordu', 'hemdem', 'hidir', 'idik', 'idikut', 'ildir', 'ildiz', 'idi', 'idikurt', 'idikut', 'idris', 'igdemir', 'ildem', 'ildemer', 'ildemir', 'ildeniz', 'ildes', 'iskender', 'isguden', 'isguder', 'kizildemir', 'kuddus', 'kuddusi', 'kudret', 'ledun', 'medeni', 'medet', 'medih', 'medit', 'mehdi', 'memduh', 'menderes', 'merdi', 'mevdut', 'muktedir', 'muslihiddin', 'muderris', 'mudrik', 'muldur', 'nedim', 'nedret', 'od', 'oder', 'okdemir', 'okverdi', 'odul', 'onder', 'onderol', 'ondes', 'orundu', 'ozdeger', 'ozdek', 'ozdel', 'ozdemir', 'ozden', 'ozdener', 'ozdes', 'ozdil', 'ozdilek', 'ozdogdu', 'ozdogmus', 'ozdogru', 'ozdoru', 'ozdoruk', 'ozdurdu', 'ozduru', 'ozdurul', 'ozdurum', 'ozender', 'ozerdem', 'ozerdim', 'ozonder', 'ozudogru', 'ozverdi', 'resididdin', 'sedit', 'semender', 'sevgideger', 'sevindik', 'seydi', 'siddik', 'sidki', 'sudi', 'suudi', 'suerdem', 'suerden', 'semdin', 'sendur', 'sengeldi', 'side', 'tedu', 'tendu', 'tendurek', 'tepedelen', 'tevhiddin', 'tokdemir', 'topdemir', 'toydemir', 'toydeniz', 'tumerdem', 'turkdogdu', 'ufukdeniz', 'uldiz', 'umdu', 'urundu', 'ulkudes', 'ungordu', 'unudeger', 'unverdi', 'urundu', 'vedi', 'vedit', 'veliyuddin', 'verdî', 'yedier', 'yediger', 'yildir', 'yildirer', 'yildirim', 'yurdusev', 'yurdusen', 'zeyneddin', 'zuhdi', 'alem', 'efe', 'efgen', 'efkar', 'eflatun', 'efruz', 'efser', 'ege', 'egemen', 'egesel', 'egilmez', 'egrek', 'ehlimen', 'eke', 'ekemen', 'eken', 'ekenel', 'ekener', 'ekim', 'ekiner', 'ekmel', 'ekrem', 'elgin', 'elitez', 'eliuz', 'eliustun', 'elove', 'elover', 'elver', 'elveren', 'emek', 'emet', 'emin', 'eminel', 'emir', 'emre', 'emri', 'ener', 'eneren', 'energin', 'enes', 'engin', 'enginel', 'enginer', 'enginiz', 'enginsoy', 'enginsu', 'engiz', 'engur', 'enis', 'enmutlu', 'enver', 'er', 'erek', 'ereken', 'erel', 'erem', 'eren', 'erenel', 'erenler', 'erenoz', 'erensoy', 'erensu', 'erenturk', 'erenulug', 'erer', 'ergen', 'ergenekon', 'ergener', 'ergi', 'ergil', 'ergin', 'erginel', 'erginer', 'erginsoy', 'ergintug', 'ergok', 'ergokmen', 'ergonen', 'ergonul', 'ergor', 'ergun', 'erguner', 'ergul', 'ergulen', 'erguler', 'ergumen', 'ergun', 'erguner', 'ergunes', 'erguney', 'erguven', 'erhun', 'erisik', 'erik', 'eriker', 'erim', 'erimel', 'erimer', 'erin', 'erip', 'eripek', 'eris', 'eriskin', 'eriz', 'erk', 'erke', 'erkel', 'erker', 'erkin', 'erkinel', 'erkis', 'erkin', 'erkinel', 'erkiner', 'erkmen', 'erkmenol', 'erkol', 'erksoy', 'erksun', 'erktin', 'erkul', 'erkunt', 'erkurt', 'erkus', 'erkut', 'erkutlu', 'erlik', 'ermis', 'ermutlu', 'ernur', 'eroglu', 'erogul', 'eroguz', 'erol', 'eroge', 'eroz', 'ersel', 'ersen', 'erserim', 'ersev', 'erseven', 'ersever', 'ersevin', 'ersezen', 'ersezer', 'ersin', 'erson', 'ersoy', 'ersoz', 'ersu', 'ersun', 'ersu', 'ersen', 'erset', 'erte', 'ertek', 'erteke', 'ertekin', 'ertem', 'erten', 'ertim', 'ertin', 'ertingu', 'ertok', 'ertop', 'ertore', 'ertug', 'ertugrul', 'ertut', 'ertun', 'erture', 'erturk', 'ertuze', 'ertuzun', 'erulgen', 'erun', 'erustun', 'eryetis', 'eryigit', 'erzi', 'ese', 'esenel', 'esener', 'esenkul', 'esentimur', 'esenturk', 'eser', 'esim', 'esiner', 'eskin', 'eslek', 'esvet', 'esit', 'eskin', 'esmen', 'esref', 'ethem', 'eti', 'evgin', 'evirgen', 'evren', 'evrensel', 'evrim', 'evrimer', 'evsen', 'evsen', 'eymen', 'eyup', 'ezel', 'ezgu', 'ezguer', 'ezgutekin', 'fehim', 'fehmi', 'felat', 'felek', 'fenni', 'fer', 'ferhun', 'ferih', 'ferit', 'feriz', 'ferruh', 'fersoy', 'fesih', 'fethi', 'fetih', 'fevzi', 'feyiz', 'feyzettin', 'feyzi', 'fikret', 'fikrettin', 'filizer', 'futuvvet', 'gelener', 'genez', 'gevheri', 'gezgin', 'gezginer', 'girginer', 'gizer', 'gizmen', 'gogem', 'gogen', 'gokel', 'goken', 'goker', 'gokmen', 'gokmener', 'gokmete', 'goknel', 'goksel', 'goksen', 'goksenin', 'gokser', 'goksev', 'gokseven', 'goksever', 'goksen', 'gokten', 'goktore', 'gonen', 'gonener', 'gorkel', 'gorkem', 'gorkemli', 'gorker', 'gorkey', 'gorkmen', 'gorksev', 'govez', 'goymen', 'gozegir', 'gozem', 'gulegen', 'gulek', 'gulel', 'gulener', 'gulergin', 'gulergun', 'guleryuz', 'gulmen', 'gultekin', 'gumustekin', 'gunel', 'guner', 'guneren', 'gunergin', 'guneri', 'gunes', 'gunesen', 'guney', 'gungoren', 'gungoze', 'gunsel', 'gunser', 'gunsen', 'guntekin', 'guntore', 'gunver', 'gunyeli', 'gurer', 'gursel', 'guven', 'halet', 'hekim', 'heper', 'hepyener', 'hepyuksel', 'hizlier', 'hikmet', 'hikmettin', 'himmet', 'huner', 'hurmet', 'hurriyet', 'hursel', 'hursev', 'huseyin', 'husmen', 'husrev', 'isiker', 'isiner', 'iffet', 'ilergin', 'ileri', 'ilerigun', 'ilke', 'ilker', 'ilmen', 'ilsev', 'ilseven', 'ilsever', 'iltekin', 'iltemir', 'iltemiz', 'iltemur', 'ilter', 'ilteris', 'iltuze', 'imer', 'imre', 'imren', 'iren', 'irtek', 'ismet', 'ismen', 'isseven', 'issever', 'ivegen', 'iyem', 'iyimser', 'iyiyurek', 'izem', 'izzet', 'izzettin', 'kelami', 'keles', 'kelestimur', 'kemter', 'kent', 'kenter', 'kepez', 'kerem', 'kerim', 'kermen', 'kesek', 'kesim', 'keskin', 'keskinel', 'keskiner', 'kesfi', 'kete', 'keven', 'kevkep', 'kevnî', 'key', 'keyfi', 'kezer', 'kinel', 'kiner', 'kirteke', 'kirtekin', 'kismet', 'kiper', 'kirmen', 'korel', 'korer', 'koryurek', 'kosuktekin', 'kokel', 'koken', 'koker', 'koklem', 'kokten', 'komen', 'kornes', 'kose', 'kosemen', 'kosten', 'kosek', 'kosker', 'koymen', 'kozer', 'kuzey', 'lemi', 'levent', 'levin', 'meftun', 'mehip', 'mehmet', 'mehti', 'mekin', 'mekki', 'melen', 'melih', 'melik', 'melûl', 'memik', 'memis', 'memnun', 'memo', 'memun', 'mengi', 'mengu', 'menguer', 'mengutekin', 'mensup', 'mensur', 'mensur', 'menzur', 'mergen', 'mergup', 'merih', 'mersin', 'mert', 'mertel', 'merter', 'mertkol', 'mertol', 'mertturk', 'merzuk', 'mesih', 'mesrur', 'mestur', 'mesut', 'meshur', 'meskûr', 'mesru', 'mete', 'metin', 'metiner', 'mevlit', 'mevlût', 'mevlut', 'mevzun', 'meymun', 'mezit', 'mezun', 'mirkelam', 'muhterem', 'muhtesem', 'mutluer', 'mutlutekin', 'mutver', 'muesser', 'mueyyet', 'muferrih', 'mukerrem', 'mukremin', 'mulket', 'muren', 'mursel', 'mustenir', 'muserref', 'mustehir', 'muzekker', 'nefer', 'nefi', 'nefis', 'nehip', 'nehri', 'nemutlu', 'nerim', 'nermi', 'nesil', 'nesim', 'nesimi', 'nesip', 'neset', 'nesit', 'nevfel', 'nevit', 'nevres', 'nevrettin', 'nevri', 'nevruz', 'neyyiri', 'neyzen', 'nezih', 'nezihi', 'nezir', 'nimet', 'nurel', 'nurer', 'nurersin', 'nurettin', 'nursel', 'nurtekin', 'nurver', 'nusret', 'nusrettin', 'nuzhet', 'ogultekin', 'oguzer', 'oker', 'okergin', 'oksev', 'okseven', 'oksever', 'okture', 'okturemis', 'okver', 'olguner', 'onel', 'oner', 'onerim', 'onguner', 'onguner', 'ongunes', 'onuker', 'onuktekin', 'onursev', 'onurseven', 'oge', 'oger', 'oget', 'ogeturk', 'oge', 'oget', 'ogmen', 'oke', 'okeer', 'okelik', 'oker', 'okkes', 'okmen', 'okmener', 'okte', 'oktem', 'oktemer', 'okten', 'oktener', 'olen', 'olmez', 'omer', 'onel', 'onemli', 'onen', 'oner', 'oneri', 'ones', 'oney', 'ongel', 'ongen', 'ongoren', 'onsel', 'oren', 'orenel', 'orgen', 'ornek', 'orsel', 'oruner', 'oryurek', 'otuken', 'ovet', 'oymen', 'ozek', 'ozel', 'ozen', 'ozengin', 'ozer', 'ozerek', 'ozerk', 'ozerkin', 'ozerkmen', 'ozerol', 'ozertem', 'ozgeer', 'ozgen', 'ozgener', 'ozger', 'ozguner', 'ozgunes', 'ozgurel', 'ozguven', 'ozilter', 'ozke', 'ozkent', 'ozker', 'ozlek', 'ozlen', 'ozler', 'ozluer', 'ozmen', 'ozmert', 'ozoge', 'ozpeker', 'ozpetek', 'ozsel', 'ozselen', 'ozsevi', 'ozsuer', 'ozsen', 'oztek', 'oztekin', 'oztinel', 'oztiner', 'ozupek', 'ozver', 'ozveren', 'ozveri', 'ozvermis', 'pertev', 'refet', 'refettin', 'refi', 'refig', 'refih', 'refii', 'refik', 'reis', 'rekin', 'remzi', 'reset', 'resmî', 'resul', 'resik', 'resit', 'revis', 'rezin', 'rusen', 'ruknettin', 'rustem', 'sefer', 'seferî', 'segmen', 'sehi', 'selah', 'selahi', 'selamet', 'selamettin', 'selami', 'selatin', 'selek', 'selekmen', 'seler', 'selisik', 'selim', 'selmi', 'selok', 'selvi', 'semih', 'semir', 'semuh', 'sener', 'senger', 'senî', 'senih', 'senol', 'serener', 'sergen', 'sergin', 'serhenk', 'serhun', 'serim', 'serimer', 'serin', 'serkut', 'sermet', 'serol', 'sertel', 'serter', 'sertug', 'server', 'servet', 'servi', 'seven', 'sevener', 'sever', 'sevgen', 'sevgun', 'sevgur', 'sevig', 'sevik', 'sevin', 'sevuk', 'sevuktekin', 'seyfettin', 'seyfi', 'seyhun', 'seyit', 'seylan', 'seymen', 'sezek', 'sezer', 'sezgen', 'sezgi', 'sezgin', 'sezi', 'sezim', 'sezin', 'sezis', 'sezmen', 'siper', 'sirer', 'siret', 'sirmen', 'siyret', 'somel', 'somer', 'soner', 'soyer', 'soyguven', 'soyluer', 'soytekin', 'soyuer', 'sokmen', 'sokmener', 'sokmensu', 'sokmensuer', 'sonmez', 'sonmezer', 'sozen', 'sozer', 'sozmen', 'suheyp', 'sumer', 'sunel', 'suner', 'sungurtekin', 'suel', 'suer', 'sueren', 'suergin', 'suheyl', 'sulemis', 'sumer', 'sunter', 'suyek', 'suzen', 'sefik', 'seh', 'sehalem', 'sehim', 'sehlevent', 'sehmuz', 'sekip', 'sekûr', 'semi', 'semim', 'sems', 'semsettin', 'semsi', 'sen', 'senel', 'sener', 'sengil', 'sengul', 'sengun', 'seniz', 'senlen', 'senlik', 'senol', 'sensen', 'sensoy', 'senturk', 'senyurt', 'seref', 'serif', 'sesen', 'sevket', 'sevki', 'simsek', 'simseker', 'solen', 'sukrettin', 'tegin', 'tek', 'teke', 'teker', 'tekes', 'tekil', 'tekin', 'tekinel', 'tekiner', 'tekinsoy', 'tekir', 'tekis', 'tekiz', 'tekmil', 'tekok', 'tekol', 'tekoktem', 'tekoz', 'tekozer', 'teksen', 'teksoy', 'tekun', 'tekunlu', 'telek', 'telim', 'telimer', 'telli', 'temel', 'temelli', 'temir', 'temirkut', 'temiz', 'temizel', 'temizer', 'temizol', 'temizoz', 'temizsoy', 'temren', 'temurlenk', 'tengir', 'tengiz', 'tenvir', 'tepegoz', 'tepel', 'tepir', 'terek', 'terem', 'terim', 'tesrif', 'tetik', 'tetiker', 'tevekkul', 'tevfik', 'tevhit', 'tevil', 'tevir', 'tevs', 'tevsen', 'teymur', 'tez', 'tezel', 'tezelli', 'tezer', 'tezeren', 'tezerol', 'tezok', 'tezol', 'tezveren', 'timurlenk', 'tiner', 'titizer', 'tokel', 'toker', 'tokuzer', 'tokyurek', 'topel', 'toper', 'torel', 'tokel', 'tolek', 'tomek', 'tore', 'toregun', 'torel', 'toreli', 'toren', 'tugrultekin', 'tugsel', 'tugser', 'tugtekin', 'tuhfe', 'tutel', 'tuter', 'tuzer', 'tukel', 'tulek', 'tumel', 'tumen', 'tumer', 'tumerk', 'tumerkin', 'tuner', 'tuney', 'ture', 'turek', 'turel', 'tureli', 'turemen', 'turev', 'turker', 'turkmen', 'turksel', 'turksen', 'tuze', 'tuzeer', 'tuzel', 'tuzemen', 'tuzmen', 'tuzuner', 'ugurel', 'ugursel', 'uhuvvet', 'uluer', 'ulutekin', 'usluer', 'uygunel', 'uyguner', 'uzel', 'uzer', 'uzgoren', 'uzmen', 'uztekin', 'uge', 'uke', 'ules', 'ulez', 'ulfer', 'ulfet', 'ulgen', 'ulgener', 'ulger', 'ulken', 'ulker', 'ulkumen', 'ulkusel', 'ulmen', 'umek', 'ummet', 'unek', 'uner', 'ungoren', 'unlem', 'unlen', 'unluer', 'unsev', 'unseven', 'unsever', 'unsevin', 'unver', 'unveren', 'unvermis', 'urek', 'urem', 'uren', 'uresin', 'urkmez', 'usgen', 'ustek', 'ustel', 'uster', 'ustuner', 'utugen', 'uveys', 'uye', 'uzek', 'uzer', 'uzeyir', 'vefi', 'vefik', 'vefki', 'vehip', 'vekil', 'velet', 'veli', 'velit', 'vergi', 'vergili', 'vergin', 'verim', 'vesik', 'vesim', 'veyis', 'veysel', 'veysi', 'yaren', 'yegan', 'yegin', 'yeginer', 'yegrek', 'yel', 'yelen', 'yeler', 'yelesen', 'yeleser', 'yeltekin', 'yemen', 'yenel', 'yenen', 'yener', 'yenerol', 'yengi', 'yenin', 'yenisu', 'yenisu', 'yerel', 'yergin', 'yerik', 'yersel', 'yesugey', 'yesne', 'yeten', 'yetener', 'yeter', 'yetik', 'yetim', 'yetis', 'yetisen', 'yetkin', 'yetkiner', 'yigitel', 'yigiter', 'yoner', 'yonet', 'yonetken', 'yonetmen', 'yontem', 'yurter', 'yurtguven', 'yurtsev', 'yurtseven', 'yurtsever', 'yuksel', 'yurekli', 'yuruker', 'zekai', 'zeki', 'zemin', 'zengin', 'zeren', 'zerin', 'zeynel', 'zeyni', 'zeynur', 'zeyrek', 'ziver', 'zuheyr', 'zurriyet', 'fikri', 'firuz', 'fuzuli', 'hifzi', 'kasif', 'latif', 'lutfi', 'mufit', 'muftu', 'munif', 'musfik', 'orfi', 'rifki', 'ufuk', 'vakif', 'yusuf', 'zulfi', 'zulfu', 'zulkif', 'zulkuf', 'girgin', 'giz', 'gogus', 'gokgol', 'gokhun', 'goknur', 'goksoy', 'goksu', 'goksun', 'goksin', 'goktug', 'gokturk', 'gorgu', 'gorgun', 'gork', 'gorklu', 'goyuk', 'gozutok', 'gulsoy', 'gumus', 'gumuskurt', 'gumuskut', 'gun', 'gungor', 'gungormus', 'gunisik', 'guniz', 'gunizi', 'gunizli', 'gunkurt', 'gunkut', 'gunkutlu', 'gunmutlu', 'gunnur', 'gunol', 'guntimur', 'guntulu', 'gunturk', 'gunturkun', 'gunyil', 'gunyol', 'gunyuz', 'gur', 'gurgan', 'gursu', 'hosgor', 'hulagu', 'ilgi', 'ilgim', 'ilgin', 'ilgi', 'ilgin', 'ilgu', 'ilgun', 'ilig', 'iyigun', 'izgi', 'izgu', 'kirgiz', 'kizgin', 'kizginok', 'kizginyigit', 'kongur', 'korgun', 'koygun', 'mutlugun', 'ogus', 'ogun', 'olgun', 'olgunsoy', 'olgunsu', 'ongun', 'ongunsu', 'ongur', 'ongun', 'orgun', 'orgun', 'ongor', 'ongu', 'ongul', 'ongun', 'ongut', 'ovgu', 'ozgu', 'ozgun', 'ozgur', 'ozsungur', 'ruzgar', 'silgin', 'singin', 'singin', 'songun', 'songur', 'sorgun', 'soyugur', 'sungu', 'sungun', 'sungur', 'sungur', 'tokgoz', 'tongur', 'toygun', 'turgut', 'tuygun', 'turgun', 'uguz', 'urgun', 'urungu', 'uygu', 'uygun', 'uygur', 'ugu', 'ulgu', 'ungormus', 'ungun', 'ungur', 'unugur', 'urgun', 'ustungu', 'vurgun', 'kiziltug', 'koryigit', 'koroglu', 'mutlug', 'ogul', 'ogulturk', 'ogur', 'ogus', 'oguz', 'oguztuzun', 'oktug', 'onug', 'ogun', 'ogur', 'ogus', 'ogut', 'ozogul', 'ozoguz', 'sigin', 'sogut', 'tigin', 'togus', 'toktug', 'tokuztug', 'toluntigin', 'tug', 'tugkun', 'tuglu', 'tugluk', 'tugrul', 'tuyug', 'turkoglu', 'ugur', 'ugurlu', 'ugurol', 'ugursoy', 'ugus', 'ugut', 'uguz', 'ulug', 'yigit', 'yogun', 'yulug', 'yugruk', 'hizir', 'hizli', 'hilalî', 'hilmi', 'hulki', 'hulûsi', 'hursit', 'huzur', 'hunkar', 'hur', 'hurol', 'husnu', 'ihlas', 'lahik', 'lahut', 'lamih', 'mihin', 'mihri', 'muhip', 'muhittin', 'muhlis', 'muhsin', 'muhyi', 'muslih', 'muhip', 'mulhim', 'nuh', 'orhun', 'ruhi', 'ruhittin', 'rusuhi', 'sulhi', 'suphi', 'zihni', 'zuhur', 'zuhuri', 'zuhtu', 'asik', 'iriz', 'irkil', 'ismik', 'isik', 'isikli', 'isilti', 'isin', 'isinsu', 'iskin', 'itri', 'inkilap', 'kazim', 'kimiz', 'kin', 'kinik', 'kinis', 'kizik', 'kizil', 'kizilkurt', 'layik', 'mulazim', 'ozkin', 'sati', 'sirri', 'sitki', 'siyli', 'sinik', 'tin', 'uri', 'azim', 'ikiz', 'ilkim', 'ilkin', 'ilkiz', 'ilksoy', 'ilkut', 'ilkutlu', 'ilkun', 'ilsu', 'iltutmus', 'iltuzun', 'inonu', 'iskit', 'islam', 'istiklal', 'iskur', 'iyiol', 'iyisoy', 'kamil', 'kani', 'katip', 'kip', 'kipkurt', 'kisi', 'koksin', 'koni', 'lami', 'mikail', 'muin', 'mukim', 'munis', 'muti', 'mukrim', 'mukrimin', 'mulayim', 'mumin', 'munim', 'munip', 'munir', 'murit', 'mursit', 'muslim', 'musir', 'nuri', 'nuvit', 'oniz', 'orik', 'ozil', 'oztimur', 'oztin', 'rukni', 'suzi', 'sukûti', 'sururi', 'timur', 'timuroz', 'tin', 'tinkut', 'tipi', 'titiz', 'toktimur', 'tulûi', 'turkili', 'turkiz', 'ulvi', 'umit', 'unsi', 'yumni', 'zikir', 'zikri', 'zinnur', 'konuk', 'konur', 'konuroz', 'kopuz', 'kor', 'korkut', 'kosuk', 'kotuz', 'koytuk', 'koksoy', 'molu', 'nurol', 'nurtop', 'oksu', 'okturk', 'okumus', 'okur', 'okus', 'okuslu', 'oluk', 'olus', 'omur', 'onuk', 'onul', 'onur', 'onurlu', 'onursoy', 'onursu', 'onursu', 'orkun', 'orkus', 'orkut', 'ortun', 'oruk', 'orum', 'orun', 'orus', 'oruz', 'otuk', 'oy', 'oykut', 'oytun', 'onol', 'onsoy', 'ozok', 'ozol', 'ozsoy', 'oztoklu', 'ozutok', 'som', 'sonsuz', 'sorkun', 'soykok', 'soykurt', 'soykut', 'soylu', 'soyoz', 'sursoy', 'tok', 'tokoz', 'toku', 'tokus', 'tokuz', 'tokyuz', 'tolon', 'tolun', 'topuz', 'tor', 'toros', 'torun', 'tosun', 'totuk', 'toy', 'tozun', 'tumkor', 'turkol', 'ulusoy', 'uzsoy', 'unluol', 'unlusoy', 'unsoy', 'ustol', 'yomut', 'zorlu', 'kok', 'koklu', 'koksu', 'koksur', 'kokturk', 'korklu', 'koz', 'nuroz', 'ok', 'oklu', 'okturk', 'omur', 'onur', 'ors', 'oruk', 'orun', 'otnu', 'otun', 'ovul', 'ovun', 'ozkok', 'ozkul', 'ozkurt', 'ozkut', 'ozkutlu', 'ozlu', 'ozluturk', 'ozmut', 'oznur', 'ozon', 'ozsozlu', 'ozsu', 'ozsun', 'ozsu', 'ozsut', 'ozturk', 'ozu', 'ozum', 'ozun', 'ozyoruk', 'ozyurt', 'sozusoz', 'tor', 'toru', 'torum', 'toz', 'tozum', 'turkoz', 'uluoz', 'yon', 'yoruk', 'nurkut', 'ruknu', 'rustu', 'sukru', 'tur', 'tumkurt', 'tuzunturk', 'uluturk', 'umur', 'ur', 'urluk', 'uruk', 'urun', 'urus', 'uruz', 'uzturk', 'unturk', 'urkun', 'urun', 'yurt', 'yurtkulu', 'yuruk', 'muslum', 'saman', 'su', 'sukusu', 'sun', 'suut', 'su', 'sulu', 'ulus', 'ulusu', 'us', 'uslu', 'usuk', 'usum', 'us', 'ustun', 'yunus', 'mustu', 'tutus', 'ukus', 'yumus', 'kutlu', 'kutluk', 'lut', 'mut', 'mutlu', 'mutluk', 'tulû', 'tuluk', 'tulum', 'tulun', 'tun', 'tutkun', 'tutu', 'tutuk', 'tutun', 'tuyuk', 'tuz', 'tumkut', 'tuzun', 'ulukut', 'umut', 'umutlu', 'utku', 'uytun', 'yunt', 'uz', 'uz', 'ulu', 'ulum', 'ulun', 'umu', 'yumlu', 'yumun', 'vala', 'yuluk', 'ulkulu', 'un', 'unlu', 'abdil', 'abdilkadir', 'abdilkerim', 'abdin', 'abdis', 'abdo', 'abdu', 'abdul', 'abdulahat', 'abdulalim', 'abdulazim', 'abdulaziz', 'abdulbaki', 'abdulbakir', 'abdulbari', 'abdulbekir', 'abdulcabbar', 'abdulcebar', 'abdulcebbar', 'abdulcelal', 'abdulcelil', 'abdulferit', 'abdulfettah', 'abdulgadir', 'abdulgaffar', 'abdulgafur', 'abdulgani', 'abdulgazi', 'abdulhadi', 'abdulhafiz', 'abdulhakim', 'abdulhalik', 'abdulhalim', 'abdulhamid', 'abdulhamit', 'abdulhasim', 'abdulhekim', 'abdulhizak', 'abdulkadir', 'abdulkadirhan', 'abdulkahir', 'abdulkani', 'abdulkerim', 'abdulla', 'abdullatif', 'abdulmecit', 'abdulmelek', 'abdulmelik', 'abdulmenaf', 'abdulmenav', 'abdulmennan', 'abdulmuhsin', 'abdulmuhtalif', 'abdulmuhtalip', 'abdulmutalip', 'abdulmuttalip', 'abdulrahim', 'abdulrahman', 'abdulrazzak', 'abdulriza', 'abdulsabir', 'abdulsamed', 'abdulsamet', 'abdulselam', 'abdulsemet', 'abdulvahap', 'abdulvahit', 'abdulvasih', 'abdulvehap', 'abdurahim', 'abdurahman', 'abdurha', 'abdurrahim', 'abdurrazak', 'abdurrazzak', 'abdurrehim', 'abdurrezak', 'abdurrezzak', 'abdus', 'abdusamet', 'abdussamed', 'abdussamet', 'abdusselam', 'abes', 'abeydullah', 'abtullah', 'abubekir', 'abutalip', 'abuzar', 'abuzeyt', 'adder', 'adem', 'adiguzel', 'adik', 'adim', 'adlen', 'afettin', 'agagul', 'agah', 'agakisi', 'agit', 'agmur', 'ahat', 'ahdettin', 'ahet', 'ahmetali', 'ahmetcan', 'akimhan', 'akver', 'alaaddin', 'alaadin', 'alaatdin', 'alaattin', 'aladdin', 'alaeddin', 'alaetdin', 'alaettin', 'alaiddin', 'alaittin', 'alatin', 'alattin', 'alayittin', 'aleddin', 'aleksey', 'alen', 'aletdin', 'alettin', 'alexandru', 'algin', 'aliabbas', 'alibey', 'aliekber', 'alierk', 'alifer', 'aligul', 'alihsan', 'aliihsan', 'alikadir', 'aliksan', 'alin', 'aliosman', 'aliriza', 'alirza', 'alis', 'alisevim', 'aliseydi', 'alkame', 'alkim', 'alkin', 'allattin', 'almazbek', 'almus', 'alo', 'alpcan', 'alpin', 'alptunga', 'alvi', 'ammar', 'andim', 'anilcan', 'apdil', 'apdullah', 'apdurrahman', 'aptil', 'aptulkadir', 'aptullah', 'arap', 'arapcan', 'ardil', 'argon', 'argun', 'arifcan', 'arikan', 'arin', 'arinc', 'arkin', 'arsen', 'arsunar', 'artemiz', 'artur', 'asamettin', 'asif', 'asik', 'asim', 'asip', 'asker', 'askiner', 'asli', 'aslinbey', 'asur', 'atal', 'atanail', 'ati', 'atif', 'atike', 'atil', 'atilay', 'atile', 'atilgan', 'atilhan', 'atilim', 'atilkan', 'atman', 'atnan', 'attila', 'attilla', 'avsin', 'avvat', 'ayatin', 'ayatullah', 'aybaba', 'aydin', 'aydiner', 'aykutcan', 'aynullah', 'ayton', 'aytumen', 'ayvas', 'azdin', 'azem', 'azettin', 'azrail', 'baattin', 'babek', 'badet', 'badiru', 'bahaddin', 'bahadir', 'bahaettin', 'bahaittin', 'bahatdin', 'bahittin', 'bahman', 'bahrettin', 'bahsi', 'bahtinur', 'bakir', 'bakis', 'bali', 'balkir', 'banihan', 'barboros', 'bariscan', 'barishan', 'barsen', 'bartosz', 'bartug', 'basaran', 'baskin', 'batdal', 'batikan', 'batun', 'batyr', 'baver', 'bayramali', 'bayramettin', 'baysar', 'baysat', 'bayzettin', 'bedii', 'bedirittin', 'bedran', 'bedreddin', 'begler', 'behcet', 'behman', 'behre', 'behrem', 'behsat', 'behyeddin', 'bejdar', 'bekan', 'bekirhan', 'beklem', 'bektasi', 'benhar', 'benhur', 'benisan', 'benna', 'beran', 'berati', 'beray', 'bergun', 'berhan', 'berho', 'berkcan', 'berkehan', 'berkem', 'berkkalp', 'berktug', 'bersan', 'bertal', 'besdemin', 'besin', 'bestami', 'beyazit', 'beyhani', 'beykut', 'beyler', 'beynur', 'beysim', 'beytullah', 'bezgin', 'bhekumusa', 'bilal', 'bilcan', 'binyami', 'binyamin', 'birand', 'birkay', 'biron', 'birtekin', 'bisar', 'bonci', 'boracan', 'bubo', 'buhari', 'bukan', 'bulend', 'bulent', 'bunyami', 'bunyamil', 'bunyamun', 'burakbey', 'burakhan', 'buray', 'burcay', 'burhan', 'burhaneddin', 'burtay', 'cafet', 'cagatay', 'cagda', 'cagdan', 'cagil', 'cagin', 'cagtay', 'cahid', 'cahti', 'cait', 'cakir', 'calis', 'camal', 'canali', 'candeniz', 'candirem', 'cangir', 'cansin', 'casim', 'cavat', 'cebli', 'cefer', 'celal', 'celaleddin', 'celaletdin', 'celalettin', 'cemali', 'cemocan', 'cenkoglu', 'cercis', 'cesarettin', 'cetmen', 'cevzet', 'ceykan', 'ceylan', 'ceylani', 'cezair', 'cezo', 'cida', 'cidem', 'cihad', 'cihadi', 'cihanber', 'collu', 'cosgun', 'coskan', 'coskun', 'cumaali', 'cuman', 'cuneyd', 'cuneyit', 'cunfer', 'curabey', 'dagcan', 'dagistan', 'dagittin', 'dahar', 'dahil', 'daimi', 'daniyer', 'deham', 'delil', 'demirali', 'denis', 'denizhun', 'derkay', 'destan', 'devris', 'devr˜m', 'deyer', 'dilaver', 'dilder', 'dilser', 'dincer', 'direncan', 'diyaddin', 'diyar', 'di¦dem', 'dogac', 'dogacan', 'dogancan', 'doguscan', 'dolgun', 'dona', 'dorukan', 'duhan', 'dunya', 'dunyamin', 'durali', 'durdali', 'durgut', 'durhasan', 'durmusali', 'dursan', 'dursunali', 'duyal', 'eba', 'ebazel', 'ebedin', 'ebilfez', 'ebozeyt', 'ebu', 'ebuakil', 'ebulfet', 'ebutalip', 'ebuzer', 'edep', 'edib', 'edizhun', 'ednan', 'efecan', 'efkan', 'eflatun', 'efrahim', 'efrail', 'efraim', 'eframil', 'efrayim', 'efsel', 'eftal', 'egecan', 'egemen', 'eldar', 'eleddin', 'ellez', 'elmar', 'elnur', 'elvin', 'elyasa', 'emeric', 'emincan', 'eminhan', 'emirali', 'emiray', 'emircan', 'emirsan', 'emra', 'emrahcan', 'emrecan', 'emrehan', 'emru', 'emur', 'encan', 'enercin', 'enez', 'engin.', 'enser', 'enus', 'erap', 'eraycan', 'ercet', 'erchan', 'ercin', 'erda', 'erdar', 'erdim', 'erdinay', 'erdogan', 'erdost', 'erencem', 'ergulu', 'eriscan', 'erkam', 'erkay', 'erkil', 'ermin', 'ernes', 'ersafak', 'ersah', 'ersi', 'ertural', 'erturul', 'esad', 'esalettin', 'esef', 'eset', 'eshabi', 'eshat', 'espir', 'etem', 'etkin', 'eyub', 'eyup', 'eyupcan', 'eyvaz', 'eyves', 'eyyup', 'eyyupcan', 'ezaettin', 'eznur', 'faakim', 'fadil', 'fahreddin', 'fahrittin', 'fahrullah', 'faki', 'fakiri', 'fakrullah', 'fami', 'fanambinana', 'farac', 'fariz', 'fayik', 'faysel', 'fazil', 'fazli', 'fazul', 'fedakar', 'fedayi', 'fehmettin', 'feki', 'fekrullah', 'felemez', 'fendal', 'fensur', 'feramuz', 'feran', 'ferat', 'ferayi', 'ferdin', 'ferdun', 'feremez', 'fergal', 'ferid', 'ferihan', 'ferik', 'ferru', 'fersat', 'ferudun', 'feruz', 'feryat', 'ferzende', 'ferzender', 'ferzi', 'fetdah', 'feti', 'fettullah', 'fetullah', 'fevvaz', 'fevzettin', 'feyat', 'feyaz', 'feyruz', 'feysal', 'feysel', 'feyyat', 'feyz', 'fezayi', 'fideyl', 'fikrat', 'filay', 'filit', 'firathan', 'fuad', 'furat', 'furkan', 'gabil', 'gahraman', 'galib', 'ganim', 'garip', 'gassan', 'gazap', 'gevrin', 'ginyas', 'giyasettin', 'goceri', 'gokan', 'gokcekalp', 'golgen', 'golkem', 'gorgen', 'gorkan', 'gozel', 'grzegorz', 'gulabi', 'guladin', 'gulaga', 'gulali', 'gulbeddin', 'gulbeg', 'gulbettin', 'gulemir', 'guli', 'gulmehmet', 'gulmustafa', 'gumrah', 'gunaydin', 'guncel', 'gungor', 'guntac', 'guralp', 'gurani', 'gurcag', 'gurcay', 'gurelcem', 'gurgan', 'gurkay', 'gurler', 'gurman', 'gurol', 'gursal', 'gursat', 'gursoy', 'gurur', 'habes', 'habib', 'habil', 'habip', 'haci', 'haciali', 'hacibey', 'haciosman', 'haco', 'hadi', 'hadis', 'hafir', 'hafit', 'hafiz', 'hakim', 'hakki', 'haldun', 'halid', 'halidun', 'halilibrahim', 'halilurrahman', 'haluk', 'hal˜l', 'hamdin', 'hamet', 'hamid', 'hanifi', 'harabi', 'haris', 'haritdin', 'hariz', 'hasalettin', 'hasamittin', 'hasanali', 'hasangazi', 'hasanhilmi', 'hasem', 'hasib', 'hasrettin', 'hata', 'hattap', 'havsar', 'havvas', 'hayali', 'hayas', 'haymil', 'hayreddin', 'hayredin', 'hayrittin', 'hayrunnas', 'hazim', 'haziret', 'hazrat', 'hefit', 'hekmet', 'helim', 'hemrevin', 'heybetullah', 'heyvetullah', 'hibe', 'hicazi', 'hicri', 'hidir', 'hifzullah', 'hindal', 'hino', 'hisar', 'hisemiddin', 'hitit', 'hiva', 'hizir', 'hizni', 'hocamurat', 'hogir', 'hokkes', 'horasanli', 'hozan', 'hšlya', 'huccet', 'hudai', 'hulisi', 'hulku', 'hulusi', 'hulusu', 'hunkar', 'hurgazi', 'huriyet', 'hursehit', 'hursitedip', 'huryeddin', 'husameddin', 'husametdin', 'husammeddin', 'husem', 'huseyin', 'huseyn', 'husni', 'husnuer', 'husref', 'husrem', 'husret', 'hussaini', 'hussam', 'huzam', 'huzeyfe', 'huzni', 'huzuri', 'iban', 'ibrahimethem', 'ibrahimhalil', 'ibrahimilker', 'ibrail', 'iclal', 'idan', 'idiris', 'idris', 'ihram', 'ihtisam', 'ikrameddin', 'ikrar', 'ilbegi', 'ilgin', 'ilhamettin', 'ilkat', 'ilkem', 'illettin', 'ilmafer', 'ilmiddin', 'ilten', 'ilyaz', 'imaddin', 'imirza', 'imran', 'imrana', 'inancan', 'incil', 'intihap', 'irzavan', 'isa.', 'isak', 'isik', 'isilay', 'isin', 'iskan', 'islam', 'ismailhakki', 'ismetullah', 'issa', 'isvendi', 'isvendiyar', 'itris', 'izetin', 'izettin', 'izzeddin', 'izzetin', 'jacub', 'jan', 'jankat', 'kablan', 'kaddafi', 'kadircan', 'kafur', 'kahamurat', 'kahriman', 'kakil', 'kalem', 'kalo', 'kamal', 'kamelya', 'kamil', 'kamilcan', 'kamiren', 'kamuran', 'kanco', 'karani', 'kardogan', 'karip', 'karol', 'kasif', 'kasim', 'kasimhan', 'kassim', 'katip', 'kazanfer', 'kazim', 'kefaattin', 'kelami', 'kelcik', 'kemaleddin', 'kenanbey', 'kendal', 'keremhan', 'kesra', 'kevni', 'kilic', 'kiral', 'kismet', 'kivanc', 'kivilcim', 'kiyas', 'kiyasettin', 'kiyasi', 'kiymaz', 'koblay', 'korcay', 'korkmazalp', 'korsah', 'kotas', 'kral', 'krzysztof', 'kublay', 'kucuk', 'kudiret', 'kultigin', 'kuntay', 'kuntsav', 'kural', 'kurban', 'kurbani', 'kurultay', 'kutbettin', 'kutfettin', 'kutlughan', 'kutluhan', 'kutret', 'kutsi', 'lami', 'lamih', 'latif', 'latifhan', 'lazgin', 'levend', 'lezgin', 'lider', 'lokman', 'lukasz', 'lutfi', 'lutfu', 'lutfullah', 'maciej', 'mafak', 'mahli', 'mahmud', 'mahpus', 'mahsuk', 'mahsul', 'mahsum', 'mahyettin', 'makhaddin', 'mamo', 'mansurali', 'marcin', 'marek', 'masar', 'mashar', 'matem', 'mateusz', 'mayir', 'mazen', 'mecrum', 'medhat', 'mefarettin', 'mefkure', 'mehemmed', 'meherrrem', 'mehman', 'mehmed', 'mehmetali', 'mehmetcan', 'mehmetemin', 'mehmethalit', 'mehmethan', 'mehmethanifi', 'mehmetnesim', 'mehmetsait', 'mehmetzahir', 'mehtun', 'mekail', 'mekan', 'melihcan', 'memet', 'memetali', 'memetcan', 'memili', 'menci', 'mendo', 'menduh', 'merali', 'merdali', 'mertali', 'mertay', 'mertcan', 'mertullah', 'mervan', 'merzuh', 'mesdan', 'meshut', 'mesni', 'mesret', 'messud', 'messut', 'mesud', 'mesut', 'mesuthan', 'metecan', 'mettin', 'mevlana', 'mevlud', 'mevlut', 'meydin', 'meyhati', 'mezhar', 'mezher', 'miat', 'michal', 'midi', 'mihail', 'mihdi', 'mihrac', 'mihsin', 'mikail', 'mikdat', 'mikolaj', 'miktat', 'milay', 'milayim', 'milazim', 'mimar', 'mirac', 'miralp', 'mirbadin', 'mirbek', 'mirhasan', 'mirsat', 'mirze', 'mishat', 'mistan', 'mitad', 'mitat', 'mizirap', 'mohammad', 'mohsim', 'molla', 'monis', 'muamber', 'muamer', 'mubarek', 'mucahid', 'mucahit', 'mucait', 'mucayit', 'mucdet', 'mucellib', 'mucib', 'mucteba', 'mudavim', 'muddesir', 'mufid', 'muftah', 'muhamet', 'muhammad', 'muhammedali', 'muhammer', 'muhammetali', 'muharem', 'muhazim', 'muhbet', 'muhib', 'muhiddin', 'muhreli', 'muhutdin', 'muhuttin', 'muhyedin', 'muhyettin', 'muhyiddin', 'muhyittin', 'mukail', 'mukayil', 'mukramin', 'mukrayil', 'mulayim', 'mulcem', 'mulku', 'mulla', 'mumtas', 'mumun', 'munacettin', 'munib', 'munik', 'munip', 'munir', 'munircan', 'muntez', 'munup', 'munur', 'murad', 'muratcan', 'murathanabdu', 'mursel', 'murselin', 'mursid', 'mursut', 'murteza', 'musab', 'musaburak', 'musafet', 'musamettin', 'museddin', 'muselahattin', 'muslu', 'muslum', 'mustak', 'mustan', 'mustecef', 'mutait', 'mutalip', 'mutlucan', 'muttalip', 'mutullah', 'mutus', 'muzafer', 'muzaffer', 'muzameddin', 'nabil', 'nadik', 'nafel', 'nafer', 'nafii', 'nahsen', 'naif', 'najeti', 'isimlert', 'namik', 'namuk', 'nasat', 'nasif', 'nasim', 'nasimi', 'nasuf', 'natik', 'nayif', 'nayil', 'nayim', 'nazim', 'nazimi', 'nazlim', 'nebattin', 'necai', 'necasi', 'necattin', 'necdat', 'necet', 'necibullah', 'necim', 'necip.', 'necir', 'necla', 'neclat', 'necmeddin', 'necmettin', 'necmiddin', 'necmittin', 'nejdat', 'nejdet', 'nejdi', 'nejmettin', 'nejmi', 'nergiz', 'nerman', 'nervis', 'nesih', 'nesij', 'nesin', 'nevaf', 'nevc˜han', 'nevzet', 'neytullah', 'nezafettin', 'nezif', 'nezmi', 'nidal', 'nisret', 'nizameddin', 'nofel', 'noman', 'novfel', 'nufer', 'nugman', 'nuhal', 'nuhi', 'nuhtullah', 'nurali', 'nurbolat', 'nureddin', 'nuretdin', 'nurettin', 'nurhat', 'nurican', 'nuriddin', 'nuritdin', 'nurittin', 'nursin', 'nuset', 'nusrat', 'nusreddin', 'nusret', 'nusur', 'ny', 'n˜zamett˜n', 'obeydullah', 'ogulkan', 'oguzhan', 'oguzorhan', 'okkas', 'olay', 'olcay', 'olgacan', 'olgay', 'olgu', 'olgun', 'oliver', 'olkan', 'omercan', 'omerul', 'omran', 'omurden', 'omurhan', 'onday', 'onder.', 'onem', 'onuray', 'onurcan', 'ordunc', 'oskan', 'osturk', 'over', 'ozali', 'ozan.', 'ozaydin', 'ozcem', 'ozgucan', 'ozgunalp', 'ozkay', 'ozkenan', 'ozlemin', 'pasa', 'pasali', 'pehlil', 'pehlivan', 'pehlul', 'pektas', 'pelir', 'pevrul', 'peyami', 'pinar', 'piotr', 'pirahmet', 'pirhasan', 'polatkan', 'pusat', 'r.', 'radim', 'rafal', 'rafig', 'ragayip', 'ragib', 'ragip', 'ragup', 'rais', 'ramadan', 'rametullah', 'rasik', 'rasul', 'ravent', 'rayat', 'rayif', 'rayim', 'recail', 'recayi', 'receb', 'recepali', 'refahattin', 'refail', 'refat', 'regaib', 'rehim', 'remazan', 'remezan', 'remus', 'renan', 'resul', 'resulcan', 'revaha', 'revhi', 'reyis', 'ridvan', 'rifki', 'riyat', 'riza', 'rizan', 'rizgar', 'rizk', 'rizvan', 'rucan', 'ruchan', 'rufat', 'rufet', 'rufi', 'ruken', 'ruknettin', 'rumi', 'rusan', 'rusdi', 'rusen', 'rustem', 'saadin', 'sabahatdin', 'sabahettin', 'sabahi', 'sabahittin', 'sabanul', 'sabattin', 'sabettin', 'sadat', 'sadeddin', 'sadet', 'sadetdin', 'sadettin', 'sadi', 'sadik', 'sadin', 'sadittin', 'sadulla', 'safaat', 'safet', 'safetullah', 'safii', 'sagip', 'sahab', 'sahabeddin', 'sahhuseyin', 'sahidi', 'sahimerdan', 'sahismail', 'sahmar', 'sahmettin', 'said', 'sakip', 'salahaddin', 'salahattin', 'salahettin', 'salahittin', 'salami', 'sali', 'salif', 'salihcan', 'salli', 'salper', 'samed', 'sametcan', 'samican', 'samili', 'samittin', 'sammas', 'sanli', 'sarafettin', 'sargin', 'sari', 'satan', 'sati', 'satilmis', 'satir', 'satrettin', 'savci', 'savki', 'sayeddin', 'saygin', 'sayid', 'sayim', 'sayin', 'sayip', 'sayit', 'sead', 'sebahaddin', 'sebahatdin', 'sebahiddin', 'sebahittin', 'sebaittin', 'sebattin', 'sebget', 'sebgetullah', 'secaattin', 'sedrettin', 'sefayin', 'sefi', 'sefil', 'sefkan', 'sefket', 'sefki', 'sehabettin', 'sehali', 'sehmus', 'seithan', 'sekim', 'sekvan', 'selahaddin', 'selahatdin', 'selahatin', 'selahattin', 'selaheddin', 'selahi', 'selahiddin', 'selahittin', 'selamet', 'selametdin', 'selamettin', 'selami', 'selamik', 'selatin', 'selattin', 'selcuk', 'selehattin', 'selemin', 'selhaddin', 'selver', 'semal', 'sematin', 'semistan', 'semseddin', 'semsittin', 'senadin', 'senan', 'sencar', 'sencay', 'sendur', 'sengezer', 'seraceddin', 'seracettin', 'serafeddin', 'seral', 'sercay', 'sercin', 'serda', 'serdac', 'serdarbey', 'serefbey', 'serefetdin', 'serefettin', 'serezli', 'serfet', 'serfirat', 'sergey', 'serhad', 'serhatmehmet', 'serkant', 'serper', 'sertan', 'sertas', 'servan', 'sevban', 'sevdakar', 'sevdi', 'seydihan', 'seydo', 'seydullah', 'seyfeddin', 'seyfet', 'seyfetullah', 'seyfiddin', 'seyfittin', 'seyhamit', 'seyhmus', 'seyhmuz', 'seyho', 'seyid', 'seyidhan', 'seyifali', 'seyir', 'seyitahmet', 'seyitali', 'seyva', 'seyyar', 'seyyat', 'seyyid', 'seyyidullah', 'sezair', 'sezar', 'sezayi', 'shahram', 'sidar', 'siddik', 'sidik', 'sidika', 'sidki', 'sih', 'siham', 'sihmehmet', 'sihmus', 'silay', 'simet', 'simon', 'sino', 'sirri', 'sitdik', 'sitem', 'sitki', 'sittik', 'siyahi', 'siyami', 'siyasi', 'suap', 'suayb', 'suayben', 'suayip', 'suayp', 'suayup', 'subhani', 'sucaattin', 'sucaettin', 'sugat', 'suheda', 'suheyl', 'sukret', 'sukri', 'sukur', 'suleyman', 'sulhattin', 'sullhattin', 'summani', 'suphan', 'suray', 'surecettin', 'surhap', 'suyer', 'suyup', 'tabip', 'tacdin', 'taceddin', 'taciddin', 'tacittin', 'tahayasin', 'tahip', 'takittin', 'talat', 'talet', 'tancu', 'tansuhan', 'tarjan', 'tas', 'taskin', 'taskinege', 'taumani', 'tayip', 'tayyer', 'tayyib', 'tefik', 'telat', 'temim', 'temmuz', 'temraz', 'temur', 'teslim', 'teyfik', 'teyup', 'teyyar', 'tezebey', 'tinmaz', 'tohit', 'tokhtaubai', 'tolga', 'tomasz', 'topi', 'tuberk', 'tugberk', 'tugcan', 'tugmen', 'tugrulhan', 'tumen', 'tuncay', 'tunctugay', 'turab', 'turabi', 'turgay', 'turgut', 'turkay', 'turkyilmaz', 'tursun', 'ubeyit', 'ucler', 'ugras', 'ugur', 'ugurkan', 'uhut', 'ulfani', 'ulki', 'ulvi', 'umithan', 'umurhan', 'umut', 'umutcan', 'unur', 'urartu', 'urfet', 'urfettin', 'urfi', 'usame', 'usamettin', 'useme', 'useyin', 'useyt', 'utkucan', 'uveyis', 'uyaris', 'u¦ur', 'vadedin', 'vahdeddin', 'vahdi', 'vali', 'vargin', 'vasif', 'vaysal', 'vecdan', 'vedad', 'veis', 'vejdi', 'velaattin', 'velat', 'velattin', 'velitdin', 'velittin', 'verdiat', 'veysal', 'veyseddin', 'vezat', 'vezir', 'yadigar', 'yadikar', 'yadin', 'yagfes', 'yagiz', 'yagizcan', 'yakub', 'yalcinkaya', 'yalgin', 'yalim', 'yalin', 'yamin', 'yansi', 'yardim', 'yarkin', 'yasaddin', 'yasal', 'yasarnuri', 'yasat', 'yasattin', 'yasir', 'yeda', 'yekcan', 'yekda', 'yektacan', 'yemliha', 'yetgin', 'yigit', 'yigitalp', 'yigitcan', 'yigiter', 'yihya', 'yilay', 'yildir', 'yildiran', 'yildiray', 'yildirim', 'yildiz', 'yilmaz', 'yonis', 'yonus', 'yosif', 'yunis', 'yunus', 'yunusemre', 'yurda', 'yurdun', 'yurtsenin', 'yusa', 'yusuf', 'yusufhan', 'zafercan', 'zahi', 'zahid', 'zaliha', 'zana', 'zari', 'zehni', 'zekai', 'zekariya', 'zekariye', 'zekayi', 'zekeriye', 'zekeriyya', 'zekerya', 'zemirhan', 'zennun', 'zeydan', 'zeydin', 'zeynal', 'zeynalabidin', 'zeynettin', 'zeynittin', 'zeyyad', 'zhamshitbek', 'ziyacan', 'ziyaddin', 'ziyafer', 'ziyafettin', 'ziyaittin', 'ziyattin', 'ziyettin', 'zohtu', 'zuberbaris', 'zubeyir', 'zufer', 'zuhat', 'zuhdu', 'zuheyla', 'zulfukar', 'zulgarni', 'zulkar', 'zulkarneyin', 'zulker', 'zuray', 'zurtullah',"anil"];
var kiz_isimleri = ["yesi̇m","ekin","zeyneb","esra","yusra","seda","nur","sumeyye","aba","abaca","abacan","abac","abaza","abgul","abher","abihayat","abiru","abide","abiye","abruy","alabegim","alabegum","alabezek","almabanu","anabaci","anaboru","ayaba","gultab","isabet","kamertab","mehabet","muhabbet","nabia","nabiye","nursabah","nusabe","rabia","sabahat","sabahnur","sabika","sabir","sabiha","sabire","sabite","sabiye","sabrinnisa","sabriye","tabende","acarbegum","acarbike","acarbuke","acarhatun","acarkatun","acunbegim","acunbegum","acunbike","acunbuke","acungunes","acunisik","aca","acalya","acangul","acelya","acilay","ackingul","adalet","adeviye","adisah","adile","adniye","adviye","afet","afi","afife","afitap","afiye","afiyet","afra","agus","agahanim","agahatun","agakatun","aganbegim","aganbegum","aganbike","aganbuke","agbaci","agbegim","agbegum","agbet","agbilek","agca","aggul","agkiz","ahenk","ahu","aise","ajda","ak","akbaci","akcagul","akcicek","akdolun","akgul","akhanim","akibe","akide","akife","akile","akinci","akipek","akkadin","akkar","akkiz","akkor","akkutlu","akmaral","aknur","akol","aksari","aksen","akseven","aksevil","aksuna","aksulun","aktolun","akyipek","alageyik","alagoz","alagun","alakiz","alangoya","alanur","alapinar","alayunt","albeni","alcicek","alcin","aldeniz","alemsah","alemtap","alev","alevnaz","algis","algul","alim","alimli","alincak","alisin","alika","alime","alipek","alisa","alise","aliye","alkoz","alli","allikiz","almagul","almila","almile","almula","alpnur","alsevin","alsu","altinbasak","altinbike","altincicek","altindal","altingul","altinhanim","altinhatun","altinkiz","altinnur","altinsac","altuncan","alyipek","amber","amile","amine","amiran","amire","amre","anahanim","anakadin","anakiz","anar","anargul","anber","arefe","argana","arife","arkay","armanc","arukiz","arziye","arzu","arzugul","arzuhan","arzum","asalbegim","asalbegum","asan","asena","asfer","asilbanu","asilgul","asima","asile","asime","asimegul","asiye","asli","asligul","aslim","aslinur","asliye","asude","asuman","asya","asye","asa","asina","askim","atagul","atifa","atife","atime","atiye","atlas","avniye","ayaca","ayal","ayana","ayanfer","ayasun","ayasan","aybala","aybanu","aybegim","aybegum","ayben","aybeniz","aybet","aybige","aybike","aybir","aybirgen","aybuge","aybuke","ayca","aycagul","aycahan","aycennet","ayceren","ayca","aycag","aycil","aycicek","aycil","aycolpan","ayculpan","ayda","aydagul","aydan","aydanari","aydanur","aydenk","aydil","aydilek","aydolu","ayduru","ayfer","ayferi","ayferim","aygen","aygerim","aygok","aygol","aygonenc","aygonul","aygul","ayguler","aygulhan","aygumus","aygunkiz","aygur","ayguzel","ayhanim","ayhatun","ayim","ayimbet","ayimsa","ayisigi","ayisini","ayilkin","aykas","aykatun","aykiz","aykonul","aykun","ayla","aylanur","aylin","aymaral","aymelek","ayna","aynagul","aynifer","aynimah","aynisa","aynisah","ayniye","aynur","aypare","ayperi","aypinar","aysel","ayselen","aysema","aysen","ayser","aysere","ayseren","ayseven","aysevil","aysevim","aysilu","aysim","aysima","aysine","aysuda","aysultan","aysuna","aysunay","ayse","aysecan","aysedudu","aysegul","aysehan","aysen","aysenur","aysil","aysin","aysim","aysin","aysirin","aysohret","ayten","ayterim","aytirim","aytoz","aytutkun","aytul","ayulduz","ayulger","ayulker","ayver","ayyalap","ayyalin","ayyuca","ayyuz","ayzit","ayzuhre","azade","azelya","azime","azize","azmidil","azra","azze","baci","bade","badegul","badiye","bagdagul","baglan","bahar","bahise","bahriye","bahtinur","bahtiser","bahtisen","bakinaz","bakiye","balca","baldan","balin","balkin","balkiz","balli","balsari","balseker","banu","banuhan","baria","barika","basira","basiret","basriye","basak","bascik","bedia","bedirnisa","bedreka","behnane","belma","benay","benguhan","benian","berguzar","beria","berrak","besamet","betulay","beyaz","beyhatun","beyza","bidar","bidayet","bihan","bilgecan","bilgivar","binhan","binnaz","birnaz","birtane","bugday","buldan","burran","busra","cahide","caize","calibe","cana","canane","canas","canfeda","canfes","canfeza","canfidan","canfide","cangul","canhanim","canipek","canik","canipek","cankiz","canozen","canozlem","canperver","canruba","canses","cansev","canten","cavidan","cazibe","cevza","ceyda","ceydahan","cihanbanu","cihanfer","cihangul","cilvenaz","cilvesaz","cagnur","cagrinur","calikusu","cesminaz","cilhan","cilhanim","cimnaz","cobanyildizi","daime","damla","daya","dayahatun","daye","dehan","deryanur","didar","dila","dilara","dilay","dilbaz","dildade","dildar","dilferah","dilfeza","dilhan","dilhayat","dilman","dilruba","dilsafa","dilsaz","dilsitan","dilsah","dilsat","dirahsan","dirayet","doganbike","dogannur","dogay","duduhan","duhan","durcan","durkadin","durukadin","duysal","durdane","durefsan","durrusehvar","fadila","fadik","fadile","fadim","fadime","fahime","fahire","fahriye","fahrunnisa","faika","faize","fakihe","fariha","farise","fasihe","fatine","fatma","fatmagul","fatmanur","fato","fatos","fazila","fazilet","fekahet","ferahet","ferahfeza","ferahnisa","ferahnur","ferahnuma","ferahru","feraset","feraye","ferdane","ferdaniye","ferican","feriha","ferzane","fetanet","feyza","fezanur","fitnat","fidan","fidangul","figan","filbahar","firaz","firkat","firuzan","fitnat","fulya","funda","furuzan","galibe","gamze","ganime","ganimet","ganiye","garibe","gaye","gazale","gelenay","girizan","gonca","goncafem","goncafer","goncagul","goncater","gokduman","goksan","gonulay","gozal","gozalan","gulac","gulacti","gulal","gulara","gulasli","gulasya","gulay","gulaydin","gulayim","gulayse","gulbadem","gulbag","gulbahar","gulbanu","gulbeyaz","gulcan","gulcanan","gulcemal","gulcihan","guldal","guldali","guldan","guldane","guldehan","guldunya","guleda","gulefsan","gulenay","gulendam","guleray","gulercan","gulfam","gulfeda","gulferah","gulfesan","gulfeza","gulfidan","gulgonca","gulhanim","gulhatir","gulhatun","gulhayat","gulinaz","gulistan","gulizar","gulkadin","gulluhan","gullusah","gullusan","gulmisal","gulnar","gulnare","gulnazik","gulnihal","gulsalin","gulsan","gulsanem","gulsay","gulsefa","gulsema","gulsima","gulsuna","gulsunam","gulsunan","gulsunar","gulsad","gulsadiye","gulsah","gulsan","gultac","gultane","gultaze","gulumay","gulzar","gulziba","gumushatun","gunana","gunbatu","gunebakan","guneshanim","gunnar","gunnaz","gunsah","guvenay","guzay","guzelay","guzelcan","guzinay","hacer","hacergul","hacigul","hacihanim","hacikadin","hadiye","hadra","hafiza","hafide","hafize","halavet","hale","halenur","halide","halile","halime","halise","hamdiye","hamide","hamise","hamiye","hamiyet","hamra","hanbegum","hanbegendi","hanbike","hanbiken","handan","hande","hanim","hanimkiz","hanife","hankiz","hansultan","hanuman","harbiye","hare","harika","hasay","hasene","hasgul","hasibe","haskiz","hasna","hatira","hatice","haticenur","hatife","hatime","hatun","hatunana","hava","haver","havva","hayal","hayat","hayirgul","hayriye","hayrunnisa","hazal","hazan","hazel","hazime","hazin","hazine","hemta","hiraman","hicran","hoseda","hosfidan","hoskadem","huban","hulya","hurican","hukminaz","hulya","huma","humeyra","hurnaz","husna","huveyda","huzzam","iraz","isilay","isildar","isinay","isinsal","iba","ifakat","ilay","ilayda","ilginay","ilkbahar","ilkbal","ilkcan","ilknaz","ilkyaz","imbat","insaf","ipar","irfaniye","ismican","ismihan","isminaz","itibar","Jale","kadin","kadinana","kadincik","kadife","kadime","adire","kadriye","kamer","kaniye","karadut","karakiz","karanfil","kardan","kardelen","karsel","karyagdi","katun","kaymak","keriman","kezban","keziban","kizhanim","kizimay","kizkina","kibare","kibariye","kifaye","kifayet","kimya","kiraz","konca","koncagul","kulan","kumral","kutan","kutlay","kutluay","kutsal","kutsalan","kutsalar","kutsan","kuzay","kubra","lalehan","lalezar","lamia","lamiha","lema","leman","lerzan","letafet","liyakat","macide","madelet","magfiret","mahbube","mahcicek","mahfer","mahinev","mahinur","mahire","mahizar","mahizer","mahmude","mahmure","mahnur","mahpare","mahperi","mahpeyker","mahru","mahrur","mahsure","mahten","mahter","maide","makbule","maklûbe","maksude","maksume","maksure","malike","manolya","mansure","marifet","marti","marufe","marziye","masume","masuka","mavi","mavisel","mavis","mazlume","medar","mediha","mefharet","mehlika","mehpare","mehtap","melahat","melda","meleknaz","meleksah","meliha","melisa","melissa","memduha","meram","mercan","merzuka","mesadet","mestinaz","mesale","meva","meyransa","meyyal","misra","mihman","mihriban","mihrimah","mihrinaz","mihrinisa","mihrisah","mimoza","mina","miray","misal","miyase","muadelet","mualla","muarra","muattar","muazzez","mubahat","muhaddere","mukaddes","musaffa","mutarra","mutena","mutia","muvahhide","mubahat","mubareke","muberra","muheyya","mukafat","mumtaze","munteha","musemma","mustakime","mustesna","musfika","naciye","nadide","nadime","nadire","nadiye","nafia","nafile","nafiye","nafize","nagehan","nagme","nahide","nahire","naibe","naile","naime","naire","nakiye","naksidil","nalan","isimler","namika","namiye","nardan","nardane","nargul","narhanim","narin","nariye","narkadin","nasfet","nasira","nasibe","nasiha","nasiye","naside","nasire","natika","naz","nazan","nazbike","nazende","nazenin","nazhanim","nazidil","nazima","nazife","nazire","nazli","nazlican","nazligul","nazlihan","nazlim","nazmiye","nebahat","nefaset","neriman","neslihan","neslisah","nesecan","neva","neval","nevale","nevbahar","nevcan","neveda","nevnihal","nevra","nevsale","nevvare","neyran","nezafet","nezahat","nezahet","nezaket","nihade","nihal","nihan","nilay","niran","nisa","nisvan","nuran","nurbanu","nurdanay","nurdane","nurefsan","nurfeza","nurfidan","nurhanim","nurhayal","nurhayat","nurinisa","nurkadin","nurmah","nursac","nursema","nursima","nurtan","nurtane","Ortanca","Oya","Oyacicek","Oyali","ozant","ozaytan","ozbasak","ozcanan","ozenay","ozgulay","pakize","paksu","paksut","pamuk","papatya","parla","parlak","parlanur","parlar","paye","payende","payidar","pekak","pekay","pekbal","pekkan","perican","perihan","perinisan","perizat","perran","pervane","peyman","pinar","pirlanta","pitirca","pitrak","piran","piraye","punar","pursan","raciye","radife","radiye","rafia","ragibe","ragbet","rahile","rahime","rahiye","rahmiye","rahsende","raife","raika","rakime","rakibe","rakide","rakime","ramiye","rana","rasiha","rasime","rasiye","raside","ratibe","raufe","ravza","rayiha","raziye","rebia","refah","refahet","refia","refika","reftar","renginar","resane","revza","reyhan","reyya","rezan","rezzan","rikkat","rindan","ruhan","ruhfeza","ruhsal","ruhsar","ruhsare","ruksan","rumeysa","ruveyda","ruveyha","ruya","saadet","sacide","saci","sadberk","sadedil","sadegul","sadhezar","sadika","sadice","sadiye","sadriye","safigul","safinaz","safinur","safir","safire","safiye","safiyet","sahavet","sahba","sahibe","sahire","sahra","sahure","saibe","saide","saika","saime","saire","sakibe","sakine","salikbike","salinbike","saliha","salime","salise","salkim","saltanat","samahat","samanur","samiha","samime","samire","samiye","sanavber","sanem","sanemnur","sanevber","sania","saniha","saniye","sannur","sare","saricicek","sarigul","sariguzel","sarikiz","sarmasik","satia","satigul","satihanim","satu","savniye","sayar","saygul","saynur","sayran","seba","sebahat","secilay","sedanur","sehavet","sehernaz","sehhare","selay","selcan","selda","seldag","selma","selva","selvican","selvinaz","sema","semagul","semanur","semiha","semiramis","semra","senal","senar","senay","seniha","sera","seran","serap","seray","serfiraz","serma","sernaz","sernevaz","serra","servinaz","seval","sevda","sevdakar","sevenay","sevencan","severcan","sevgican","sevgihan","sevginaz","sevican","sevilay","sevilcan","sevinay","sevnaz","sevsay","sevtap","seyyal","seyyare","seza","sezan","sezay","siddika","sidika","sirga","sirma","sirmahan","sima","simay","simayisems","simhan","sincan","sirap","sitare","siva","solmaz","sonbahar","sontac","sudan","suna","suzan","sueda","suhandan","sulunay","sumeyra","suveyda","suzulay","sadiye","saduman","safaknur","safiye","sahane","sahbanu","sahdane","sahende","saheser","sahhanim","sahigul","sahika","sahmelek","sahnaz","sahnisa","sahnur","sahsinur","sahvar","sahver","saika","saire","sakayik","sakire","samiha","samile","sansel","sanser","sarika","sayegan","saziment","saziye","sefika","sehbal","sehnaz","sehrazat","sehriban","sehrinaz","sehvar","sekernaz","sekerpare","semsinisa","sendag","serefnaz","setaret","sevketfeza","sevkinaz","sevval","seydagul","seydanur","seyma","siray","sifa","sirinsah","tacizer","taciser","taceser","tacli","tacliyildiz","tacnur","tagan","tagangul","tahire","tahsine","taibe","takiye","talia","talibe","taliha","taliye","tamam","tamgul","tandan","tanegul","tanelgin","tangul","tangulu","tanhatun","tanseli","tanses","tarcin","tarimbike","tasvir","tatli","tavus","tayyibe","taze","tazegul","tenay","tevfika","tevrat","tiraje","topaz","tuba","tugba","tulca","turfa","turhatun","turna","tulay","tulcan","tulinay","5451Uganbike","5499Ulya","5505Umay","uftade","ulkuhan","ummuhan","unsay","urunay","Vacibe","Vacide","Vahibe","Vahide","Valide","Vamika","Vasfiye","Vasila","Vecahet","Veciha","Veda","Vedia","Vefakar","Vefia","Vefika","Verda","Verdinaz","Vildan","Vuslat","yagis","yagmanaz","yalaza","yaldiz","yapincak","yaprak","yarcan","yarpuz","yasemin","yasil","yaylagul","yazgul","yazgulu","yelda","yilay","yildanur","yonca","yosma","yurdaal","yurdagul","yurdaser","yurdatap","yurday","yurtsay","zafire","zahide","zahire","zaide","zaika","zakire","zambak","zamire","zarife","zatinur","zatiye","zehra","zeliha","zennisan","zerafet","zerefsan","zeria","zernisan","zerrintac","ziba","zican","ziyafet","zuhal","zuhal","zuleyha","zulfibar","zulfiyar","zulfizar","zulfubar","zulfuyar","zulfuzar","zumra","bahire","beder","bedihe","bedis","bedriye","begim","begum","behice","behin","behire","behiye","beken","belgi","belgin","belik","belin","beliz","belkis","belmen","benek","benevse","bengigul","bengul","benice","benli","benligul","bennur","bensu","berceste","bercis","beriye","berkiye","bermude","berrin","berse","besime","beste","bestegul","besgul","besire","betigul","betil","betul","beylem","beysun","bezek","bezen","bezmialem","bigum","bihin","bihine","bihter","bihterin","bike","bilgenur","bilginur","bilgiser","bilgun","bilis","billûr","bilsev","bilsin","bingul","bingun","biniz","binzet","birben","birbenek","bircek","birgen","birgul","birgun","biricik","birim","birke","birnur","birtek","bitengul","boncuk","bozcin","bogurtlen","bugul","buket","burcu","buse","bulbul","burcin","burgu","burumcek","bute","citlembik","dilbent","dilber","dilbeste","dilbu","dudubikem","ebru","edibe","elbirle","elbirlik","erdibike","erdibikem","eribe","feribe","gokben","gurbet","gulbeden","gulben","gulbende","gulbeniz","gulberk","gulbeseker","gulbike","gulbikem","gulbil","gulbin","gulbitti","gulbiz","gulboy","gulbu","gulbun","gulbuz","gulebetin","gulengubin","gulpembe","isinbike","ibili","icimbike","ilbike","isenbike","katibe","kebire","kebuter","kelebek","kickinebike","kutbiye","lebibe","lebriz","mebruke","mebrure","mebuse","mergube","mevhibe","muhibbe","mukbile","mubeccel","mubeyyen","mubine","muhibe","munibe","nebihe","nebile","nebiye","necibe","nesibe","nevber","nilberk","nuhbe","nurben","nurbige","pembe","pembegul","rebiyye","sebile","sebla","sebu","sibel","simber","subhiye","sulbiye","sulunbike","sumbul","sumbulves","sunbule","sebnem","sebnur","sekibe","serbet","sirinbegim","sirinbige","teberruk","tebessum","tilbe","tolunbike","ubeyde","ubuk","Vecibe","Vehbiye","zebercet","zubeyde","cedide","celile","cemile","ceminur","cennet","ceren","cevriye","ceylan","cilvekar","cudiye","domurcuk","ecegul","ecenur","evecen","fecir","fecriye","gelincik","gonce","gulce","gulece","gulinci","guvercin","guzelce","huceste","huceste","iclal","imece","inci","inciden","incifem","incifer","incigul","incila","incilay","incinur","incisel","inciser","mecide","mehcure","mevcude","mucide","mucize","muceddet","mucella","mucessem","mucevher","munciye","necile","necla","necmiye","necve","netice","ticen","tomurcuk","Vechiye","Vecihe","yucenur","ceyiz","cigdem","cilek","cilen","cilenti","ciler","cimen","cisen","cisil","elcim","ercil","gogunc","gokcem","gozenc","gulce","gulcehre","gulcicek","gulcimen","gulcin","gulcun","guncicegi","guncicek","icim","kircicek","koncuy","nurcin","ovgunc","percem","pericehre","purcek","secgul","secik","secil","tugce","ucgul","define","defne","demet","demhos","deste","destegul","didem","dila","dilasup","dilderen","dilefruz","dilege","dilek","dilem","dilfigar","dilfiruz","dilhun","dilhus","dilnisin","dilnur","dilsuz","dilsen","dilsikar","dondu","done","donus","dudu","duhter","durkiz","dursune","durugul","dusize","duygun","duri","duriye","durnev","edis","evdegul","ferdiye","ferhunde","feride","fermude","fide","firdevs","furuzende","gonulden","gozde","guldeger","guldehen","guldem","guldemet","gulden","guldeniz","guldenur","gulder","gulderen","guldermis","guldeste","guldilek","guldone","gulduren","gulender","gulfide","guzide","hediye","hurside","idil","ilden","Julide","kudsiye","medide","medine","mehdiye","melodi","mesude","mevlide","mevlûde","mevlude","mezide","mudrike","mueddep","mufide","mujde","muride","murside","muveddet","nedime","neside","nevide","nurdide","nurdil","nurdogdu","nurfide","nuvide","Orkide","ozderen","pekdeger","peride","remide","reside","reside","ruveyde","ruvide","sedef","seden","serdil","sevde","sevdiye","seyyide","sidkiye","sidre","simden","sude","sudiye","suzidil","sundus","suveyde","sendeniz","sendil","sermende","sevkidil","tevhide","Vedide","Velide","yaridil","yediveren","yildiku","yildiz","yurdum","asiye","atike","atiye","azime","efsun","egenur","ehil","ela","elanur","elif","elife","elik","emel","emine","emos","emriye","enfes","enise","erengul","erengun","erge","ergem","erisen","ermiye","ervin","esengul","esengun","esergul","esmer","ese","esim","esin","etik","etike","evin","evnur","ezelî","ezgi","ezgin","fakihe","fehime","fehmiye","fenniye","fergun","feri","feriser","feriste","fernur","feruze","ferve","fethiye","fevziye","feyziye","figen","fikriye","firuze","fugen","gelengul","gelin","gelinkiz","gevher","gezer","gizem","gokperi","gokselen","golge","gorez","gorsev","govem","goze","gozlem","gufte","guher","gulafet","gulaver","gulen","gulengul","gulennur","guler","guleren","gulersin","gulesen","guleser","gulesin","gulev","gulfem","gulfer","gulgen","gulgez","gulgûne","gulguney","gulguzel","gulipek","gulnese","guloren","gulozer","gulperi","gulrenk","gulsel","gulseli","gulselin","gulsemin","gulsen","gulser","gulseren","gulserim","gulsev","gulseven","gulsever","gulsevi","gulsevil","gulsevin","gulsezer","gulsezin","gulsinem","gulsume","gulsehri","gulseker","gulsen","gulseref","gulserif","gulten","gulter","gulumser","gulumsen","gulver","gulveren","gulzemin","gunerim","gunfer","gunseli","gunsenin","gunseren","gunten","gurel","gurselin","gursen","gurses","gursev","gursevil","gursen","gurten","guze","guzel","guzey","hakime","hepgul","hepsen","heves","hifziye","hilmiye","hossel","hossen","hosses","hosten","hulkiye","hurisel","huriser","huriye","hurrem","hukmiye","hurrem","hursen","hursen","husne","husniye","husnuguzel","husnuye","ilksel","ilksen","ilksev","ilksen","ilmiye","ilsen","ime","imge","ipek","ipekel","ipekten","irem","isen","isenkutlug","isvekar","izel","kamile","kasife","kazime","kekik","keklik","kerime","kesfiye","kevser","kiymet","korpe","kosem","kumriye","kutsel","kutseli","lale","lalegul","laleruh","lamiye","latife","lemiye","lerze","lerzis","leyla","leylagul","leyli","leylifer","leylufer","leziz","lezize","lutfiye","mefkûre","meftune","mehir","mehru","mehtiye","mehves","melek","meleknur","melekper","melekru","melike","melis","meliz","meltem","memnune","menekse","menevse","mengli","mengûs","mensure","mensure","menzure","merve","meryem","merziye","meserret","mesrure","mesture","mesure","meskûre","methiye","metine","mevsim","mevzune","meyil","meymune","meziyet","mihine","mihriye","mine","minnet","muhlise","muhsine","muine","mukime","munise","muslihe","muge","mukevven","mukrime","mulhime","mumine","munevver","munife","munime","munire","muruvvet","musevver","muslime","muslume","mustenire","muskule","muyesser","muzehher","muzeyyen","nefise","nehir","nehire","nejla","neptun","nergis","nergise","nermin","nesime","nesli","nesligul","nesrin","nesteren","nese","nesegul","nesem","nesenur","nesever","nesve","neveser","nevgul","nevhiz","nevin","nevinur","nevir","nevreste","nevriye","neyire","neyyire","nezihe","nezire","nilufer","niyet","nuralem","nurfer","nuriye","nurmelek","nurper","nurperi","nurselen","nurseli","nursen","nursenin","nurser","nurseren","nursev","nurseven","nursevil","nursevim","nursevin","nursine","nursen","nurtek","nurten","nurveren","nurzen","nurzer","nukhet","orengul","orfiye","orge","osme","otlegen","ozengul","ozenir","ozenli","ozgunel","ozguney","ozipek","ozlem","ozlenen","ozleyis","ozten","pek","pekoz","peksu","peksen","pelin","pelit","peren","peri","perinur","periru","perives","perize","permun","peruze","perver","perviz","pesen","pesent","petek","peyker","piruze","prenses","puren","purfer","pursen","refihe","refiye","rekine","remziye","rengin","resmigul","resmiye","rifkiye","ruhisen","ruhiye","ruhsen","ruhsen","rukiye","ruziye","rustiye","seher","sehergul","sekine","sel","selisil","selisin","selime","selin","selmin","selnur","selvet","semen","semin","semine","semire","semiye","senem","sengul","sengun","seniye","sennur","serengul","sergul","sergun","seringul","sermelek","sermin","sernur","serpil","serpin","sevengul","sevengun","sevgi","sevgili","sevgim","sevginur","sevgisun","sevgul","sevi","sevil","sevilen","sevilsen","sevim","sevimgul","sevnur","sevsen","sevsevil","seyfiye","seylap","sezel","sirriye","sitkiye","simge","simten","simuzer","sine","sinem","siren","sonel","sonsen","sonten","sonver","sulhiye","suphiye","suheyla","sumeyre","surmeli","susen","sehime","sehper","sehriyar","sehriye","seker","sekime","sekûre","selale","semime","seminur","semsifer","semsiye","sengonul","sennur","senoz","sensu","senyer","senyil","senyuz","serefnur","seremet","serife","sermin","sevkinur","sevkiye","sive","sivekar","sohret","sule","sukriye","sukûfe","tekgul","tekmile","teknur","telmize","telvin","temenni","temime","temre","tenigul","tennur","tennure","terken","tesrife","tezgul","tijen","tulen","turkine","tuzenur","ulke","ulkem","ulkenur","ulkuye","ummiye","umniye","unsel","unsiye","unzile","urmegul","urpek","urper","Veliye","Venus","yegah","yegane","yeliz","yenigul","yepelek","yesim","yeterkiz","yilsen","yipek","yurtsevil","yurtsevin","yukselen","yumniye","zekavet","zekire","zekiye","zemzem","zennur","zergûn","zerrin","zerrinkar","zerriste","zeynep","zeyniye","zeyno","zihniye","zinnure","ziynet","ziyneti","zuhre","zuhtiye","zulfiye","zulfuye","fikir","filiz","ful","fusun","fusunkar","lutuf","lutufkar","tifligul","goknil","gonul","gul","gulgonul","gulgûn","gulgun","gulhiz","gulhuri","guliz","gulkiz","gullu","gulmus","gulnur","gulnus","guloz","gulriz","gulru","gulruh","gulsim","gulsimin","gulsu","gulsum","gulsun","gultop","gulum","gulustu","gulus","gulyuz","gungul","gunsili","gunsu","guz","guzin","guzingul","hosnigar","hurgul","husnugul","irisgul","ilgul","ilkgul","irgun","ismigul","izgul","izgun","kutgun","lalgûn","morgul","mujgan","nigar","nilgûn","nilgun","nurgok","nurgul","nurgun","nurnigar","Ogul","Ongu","Orgul","ovgul","ovgun","ozgul","ozgulum","ruhugul","songul","tungur","ulgur","yilgul","yilgun","kugu","halinur","hilal","hosnur","hosnut","hossun","huri","hurmuz","husnuhal","husun","mihrinur","mirrih","nurhilal","ruhinur","ruhunur","iris","isil","isit","itir","ilkisik","misir","nurisik","pirilti","siylikiz","atik","iklil","ilknur","iris","islim","islimî","isminur","limon","mir","mirnur","misli","nil","nili","nilsu","nuris","nursim","nusin","ozis","oznil","sili","sim","simin","simruy","sitti","siir","sirin","tomris","tuti","tulin","Oylum","somnur","sonnur","sonol","omurlu","onnur","oyku","oz","pullu","putun","kumru","kurtulus","nurlu","nursu","nursun","sumru","turkan","turknur","yar","zumrut","kukus","sunu","sukûn","sukût","sulun","kutun","tulun","yumuk","lulu","ulku","ulkum","abdylla","abutel","acibe","addule","adelet","adeli","adife","adike","adila","adivye","adiye","adla","adle","adliye","adul","adulle","afe","afide","agnieszka","ahizer","ahunur","aile","akgullu","akise","akizer","akkadin","akkiz","aklime","aleksandra","aleyna","aliman","alimen","aliya","alize","alkim","almast","almes","alperin","altin","altingul","alye","ambere","amina","amirhamza","amse","anakadin","anakiz","anayasa","ani","anis","anita","anna","ansa","anse","antika","anzel","anzilha","arabi","arafa","ariz","armahan","arne","arsevi","arzi","ashan","asife","asiman","asire","asiya","askim","asli","aslican","asligul","aslihan","aslinur","asriye","assiya","assiye","asuhan","ati","atie","atife","atifet","atika","atike","atile","atiyye","atman","atra","aura","avna","aybilge","ayca","aycan","ayce","aycin","aydin","ayise","aykiz","aylar","ayle","aylen","aylil","ayliz","ayne","aynel","aynil","aynilhayat","aynimah","ayno","aynulhayat","aynurisa","ayper","aysali","aysana","ayseana","aysekadin","ayseli","aysemin","aysen","aysena","aysene","aysete","aysi","aysil","aysin","aytel","ayter","ayzer","ayzin","azaniye","azap","azbiye","azima","azimenur","aziza","aznur","badel","badem","bagda","bagdat","bager","bahdisen","bahire","bahtinur","bahtisen","baise","balkis","balkiz","balli","bani","banu","banur","bariye","basra","batun","baydan","bayse","bediha","bediriye","bedirnaz","bediya","bedrivan","begihan","begun","behican","behide","behime","behiza","behra","behriye","belda","belde","belemir","belgizar","belguzar","belhizar","belkis","belkisa","belkiz","belkizan","belkize","benazil","bendegul","bendihan","benefsi","bennuray","benzegul","beratiye","beray","berda","berfiye","berfo","bergen","bergun","berhude","beride","beridiye","beril","besbin","besbinaz","beser","beseriye","besey","besna","besne","besra","besrai","besravi","besrayi","bessi","beyce","beyice","beynun","beytiye","beytul","beyzanur","bido","bildan","bilgesu","bilgul","bilican","bilihan","bilkay","billur","bilmez","bilnaz","bilor","bilun","binevs","birdane","birdesen","birgul","birguzel","birsele","birseren","birsev","bitul","bore","bugse","bugu","buhide","bulca","bulunmaz","burce","burcuhan","burdem","bureyre","burtay","buson","busra","busranur","caferiye","cagdan","cagil","cagin","caide","cakir","camia","canseli","canser","canset","cansin","cansukan","canur","cavide","cayide","cazime","cefahir","cefair","cemale","cemide","cemiliye","cemine","cemiyle","cenay","cenneti","cerasela","cerem","ceride","cetine","cevale","cevregul","cevrinaz","ceydanur","ceyla","ceylan","ceylin","ceynur","cezair","cezanur","cezminur","cidem","ciden","cig","cigse","cile","cilem","cilga","cili","cise","cisel","cisem","civeyra","ciydem","cuferiye","cuheyna","culye","cumazel","cumaziye","curiye","damlagul","damlanur","dane","darcin","delila","denizgulu","dergi","derle","deryal","destan","destina","deva","digdem","dilara","dilfuruz","dilfuzar","dilihan","dilruba","dilsa","dinara","dizem","dogcan","dolat","donay","donduhan","doner","donsun","dudhan","dudugul","dudusen","duha","dunya","dunyale","durana","durangul","durdane","durdaniye","durdiye","durgadin","durgul","duriye","durkadin","durna","durnel","durri","dursade","dursadiye","dursef","dursel","dursen","dursine","dursiye","dursuniye","duruye","duygu","duyguhan","ebide","ebise","eblike","ecem","edanur","edaviye","edaye","edebiye","edeviye","edibiye","efaket","efil","efsunkar","eftal","egem","ehad","ehlem","ehliiman","ela","elame","elamiye","elanur","elay","elem","elfazi","elfide","elfize","elgiz","elham","elide","elifana","elifgizem","elifgul","elifhan","elifnur","elifsena","elis","eliz","elmaze","elnara","elnaz","elvadiye","elvida","elvin","elzem","ema","emal","embiye","emeti","emile","emina","emineeylem","eminei","emini","eminkadin","eminos","emiray","emirayse","emire","emirnaz","emis","emise","emra","emral","emsel","enbiye","engul","enzile","enzule","erebiye","erep","erife","erince","ersan","eruze","erva","ervaniye","erzem","esame","esefatma","esem","esenay","esiana","esil","esiye","eskan","eslem","esmanperi","esmanur","esme","esmecan","esmegul","esmehan","esmerhan","esmin","esmine","esmiye","esranur","esrin","esse","eva","evde","evenur","evinc","evlim","evra","evrin","evsun","eyne","eysel","ezet","ezher","ezime","ezine","ezo","faali","faden","fadima","fadimana","fadimeana","fadimehanim","fadiya","fadiye","fadliye","fagat","faide","faike","faime","fakiye","fakriye","famile","faniye","fatigul","fatik","fatim","fatima","fatimana","fatimatuzzehra","fatime","fatimet","fatimetozehra","fatinur","fatis","fatiye","fatmaana","fatmadudu","fatmakadin","fatmana","fatmanim","fatmasu","fatmatul","fatme","fatou","fatuma","fatumatuzzehra","fayika","fayize","fazila","fazile","fedan","feden","fedile","fedim","fedime","fedriye","fefharet","fehiman","fehire","felekferz","feleknaz","feleksan","fendiye","ferahdiba","ferahiye","ferayi","ferdag","ferfuri","fergul","ferihan","ferik","ferime","ferinaz","feris","feristah","feriya","ferizan","ferize","fermin","fermuta","ferrah","fersun","feruza","feruzan","feruze","ferya","feryal","feryas","ferziye","fetane","fetiye","feyfuri","feyime","feyiznur","feyme","feyruz","feyruze","feyzanur","feyzin","fezal","fezaye","fezile","fidaniye","fidaye","fidel","fidelya","fildan","filis","fincan","finci","findik","findika","firdes","firdest","firdevis","firiha","firke","firuzan","firyaset","fisun","fitnet","fulden","fulten","fulya","fundagul","furgan","furuzan","fussulet","fusun","gabel","gabriela","gadiriye","gafure","galiya","gamzegul","gayet","gazal","gazali","genime","georgeta","gevi","gilman","gisver","giymet","gizemnur","gizemsu","gogercin","goher","gokbuke","gokcay","gokis","goksemin","goli","goncay","gonlum","govercin","gozdehan","gozdem","gozdenur","gozel","gozen","gubra","gulabiye","gulafer","gulamiye","gulan","gulaver","gulaydin","gulban","gulbani","gulbarin","gulberat","gulbeyde","gulbie","gulbiye","gulcay","gulce","gulcegun","gulcehal","gulcema","gulcemile","gulcerek","gulceylan","guldali","guldam","guldiz","guldurdu","gule","gulefer","gulem","gulendem","gulendiye","gulengun","gulenser","guley","guleycan","guleyda","gulezgi","gulfadim","gulfami","gulfan","gulfari","gulfatma","gulfen","gulferi","gulferide","gulfethiye","gulfikar","gulfire","gulfiye","gulfizar","gulfuzar","gulfuze","gulgiz","gulgul","gulhanim","gulhaniye","gulhat","gulhis","gulhisar","gulhizar","gulhuriye","gulhuzar","guli","gulice","gulihsan","gulin","gulisa","gulisan","gulisraf","gulkadin","gulkiz","gullabiye","gulleman","guller","gulli","gulliya","gullizar","gullunar","gullunaz","gulluzar","gulmenevse","gulmez","gulmine","gulminnet","gulmirace","gulnade","gulnam","gulisimler","gulnara","gulnarin","gulnaz","gulnaziye","gulnigar","gulnihan","gulorya","gulozge","gulpasa","gulper","gulpinar","gulrengin","gulsa","gulsabiya","gulsade","gulsaran","gulsat","gulseda","gulseher","gulsehriye","gulsem","gulsen","gulsena","gulsenem","gulsepen","gulseri","gulserin","gulseval","gulsevdi","gulsevim","gulsifa","gulsin","gulsiye","gulsu","gulsultan","gulsum","gulsun","gultulin","gulu","gulufer","gulumse","gulun","gulunay","gulus","gulusan","gulusen","guluser","gulustan","gulusun","guluz","guluzar","gulyar","gulyaz","gulyeter","gulzade","gulzadiye","gulzide","gulziye","gumrah","gunar","guncel","gunday","gungore","gunnur","gunrem","gunsiray","gurcim","gurcu","gurcuye","gurser","gussum","gussun","gusum","guvercin","guyhan","guzella","guzeyde","guzgul","guzude","habiba","habibe","habiybe","hacar","hacere","hacice","hacihanim","hacikadin","hacile","hacili","hacire","hadice","hadime","hadrey","hafife","hafise","hafiye","hafiza","hafset","hafside","hafza","hakife","hakik","hakime","hakiye","hakki","halidiye","halimedudu","halimi","halimser","halisa","haliye","hamail","hamayil","hamdune","hamire","hamsa","hamse","hamsiye","hanasli","handenur","hanen","haney","hangul","hani","hanik","hanim","hanime","hanimi","hanimkiz","hanimsah","hanimzer","hanperi","hansa","hanse","hanume","hanze","hanzey","hapa","hapic","harbinaz","harip","harise","hariye","hasbiye","hasgullu","hasi","hasine","hasivet","haskar","haskiz","hassi","hassiye","hatice","hatike","hatimet","hatin","hatira","hatiyce","havadudu","havagul","havali","havana","havane","havanim","havanur","havar","havelya","havil","havize","havse","havser","havsun","havvagul","havvana","havvane","havvanur","hayel","hayirli","hayrinisa","hayrinnusa","hayrun","hayrunisa","hayrunnisa","hazarcan","hazari","hazbiye","hazna","hazni","hecide","heday","hediyegul","hedla","hedle","hefin","hekime","helen","helime","helin","heman","hemi","hemide","hena","henda","henife","henzede","herdem","herdemcan","hergul","hesibe","hesna","hetike","hevzi","heyfhilat","hezal","hezare","hezel","hezniye","hicaziye","hicrigul","hidaye","hikmiye","hilal","hilayda","hilin","hilman","hilvan","hilye","hinar","hinet","hivda","hizniye","homayi","hopan","hori","horiye","horu","hosgun","hosnaz","hubriye","huda","hudakar","hudanur","hudaye","huldiye","hulye","huma","humayun","humeyin","humeyra","hurdunya","hureyra","huri","hurinaz","huriye","huriyet","hurizad","hurkus","hurma","hurmus","hurriyet","huru","hurule","huruyet","husna","husnem","husni","husnigul","husnuce","huzeyca","huzume","ibadiye","icil","iclal","ide","ifagat","ifaget","ifaze","ifdadiye","iftade","ihsane","ikbale","ikilem","iklama","iklime","ilavet","ilfar","ilgahan","ilgihan","ilgim","ilgin","ilkel","ilkem","ilklima","ilper","imahan","imatullah","imhan","imihan","immigulsum","immihan","immuhan","imral","imran","imrel","imrihan","incifir","incihan","incilay","intimas","inzile","iran","iremnur","irfide","isik","isil","isilay","isin","isinsu","islime","ismahan","ismehan","ismi","ismihan","isra","istem","istiham","itir","ivyek","iyam","izaura","izlem","izlifet","iznihar","Jalile","Jefide","Julide","Julude","kabile","kadirgin","kadiriye","kadirye","kadisah","kafiye","kameriye","kamila","kamile","kamuran","kanaat","kandef","kania","karafil","karer","kargul","kaside","katarzyna","katibe","katife","kaver","kazi","kazime","kebira","kefser","kehribar","kelem","kendi","kerima","kerziban","kerzik","keser","kesire","ketayi","ketibe","kevi","kezibe","kezziban","kibriya","kibriye","kilman","kimet","kinem","kini","kirez","kismet","kismis","kitan","kivanc","kivilcim","kiyafet","kiymet","kiymetli","kocer","koka","komec","kuaybe","kubar","kubran","kubranur","kucuk","kuduret","kulter","kumas","kumray","kumri","kupra","kupriye","kurciye","kusun","kutezziban","kutret","kuzeyde","kuzidiye","kuzudiye","laden","ladiker","ladin","laika","lale","lalegul","lalever","lalezar","lalifer","lalihan","lamia","lamiye","latife","laze","lebude","lemangul","lemye","letife","levize","levziye","leyla","leylan","leylanur","leylufer","leymun","leyzan","lezgin","libas","lida","lifar","ligar","lilianna","lilifer","lilufer","lilve","liman","limun","lina","linda","lisan","lufen","lulgun","lulufer","lutfiye","lutfuye","lutviye","luup","m.","mafiret","mafiye","mafuzer","magbule","maggul","mahfuza","mahfuze","mahide","mahigul","mahiner","mahiye","mahmudiye","mahnaz","mahsubiye","maigul","maksude","mariama","maside","matan","maver","mavus","mayide","mayile","maynur","mayseker","maysel","mazes","maziye","mazlume","mebrule","mebure","mecbure","mecburiye","mecdulin","mecra","media","mediye","mefal","mefaret","mefide","mefkure","mehbare","mehbup","mehdiyar","mehlibar","mehmure","mehnur","mehri","mehriban","mehrican","mehrigul","mekbule","mekiya","mekiye","mekkiye","mektup","melaha","melahat","meldanur","meleha","melehat","melekey","meleki","melihan","melihat","melihe","melika","melikkan","meliknur","melul","memihan","memnuniye","mendufa","menduha","menendi","menfeat","menfiye","menhur","menica","menice","menife","menis","menisan","mensur","mensure","menzil","meray","merba","merban","merda","merdane","merdiye","merguze","merhuze","merim","meriman","merime","meris","merivan","meriyem","mermi","mernur","mernus","merva","mervane","mervem","mervenur","mervil","merya","meryam","meryemana","meryeme","mesgule","meskure","meskuriye","meslihan","mesrule","mesude","mesudiye","mesuriye","meveddet","mevlida","mevlidiye","mevliya","mevliye","mevlude","mevludiye","mevra","mevre","mevriye","mevtun","mevziye","meyase","meyese","meyhanim","meyli","meymene","meyram","meyrem","meyser","mihdiye","mihrab","mihrac","mihrap","milid","milyel","minel","minever","minevver","minibe","minire","minnaz","mintaha","minteha","mirac","mirace","miradiye","mires","miriye","miseyne","misra","misri","misriye","miyasa","miyaser","miyasi","miyasser","miyese","miyeser","miyesser","mizgin","mola","mualla","muazez","muazzen","muazzes","muberra","muberrah","muberya","mubetcel","mucade","mucahide","mucella","mucelta","mucibe","mucteba","mueser","muessere","muferra","mufide","mugaddes","mugan","mugatter","mugber","muhammeriye","muhbet","muhdiye","muhibe","muhide","muhiye","muhside","muhsine","muhteber","muhtereme","muhtesemen","muhubbet","muhubet","mujde","mujden","mujgan","mujgehan","mujgen","mukaddere","mukaddez","mukader","mukades","mukafat","mukatder","mukatdes","mukattere","mukrume","mulfer","mulkicihan","mulkinaz","mulkiye","mulufe","mulufer","mumesir","mumine","mumune","munadiye","munasiye","mune","munever","munevir","munevvere","munezzer","munife","munise","munure","munzire","muradiye","murcan","muret","mureyya","murfide","murivvet","mursine","murten","murufet","muruvet","murvet","musaret","musemme","muserrefe","muskan","muskunaz","muslumet","mustakiyma","muster","musude","musure","muttezim","muveyla","muzafer","muzdelife","muzet","muzeyen","muzeyme","muzude","nabahat","nacide","nacifer","nadan","nades","nadiha","nadile","nadiriye","nafier","nafizenur","nagihan","nahizer","naide","naife","naima","nalan","nalin","isimlergul","namike","nanifer","narcan","nargehan","narhanim","narhatun","nari","narinc","narmine","nasiba","nasihat","nasihe","nasire","nasiybe","natalia","natike","navruz","navruze","nayet","naygihan","nayile","nayime","nayliye","nazander","nazangul","nazcan","nazdar","nazefet","nazegul","nazen","nazengul","nazeni","nazente","nazenti","nazez","nazgul","nazgule","nazi","nazide","nazifer","nazike","naziker","nazile","nazilet","nazime","nazimet","nazira","naziriye","naziye","naziyfe","nazli","nazlican","nazligul","nazlihan","nazlim","nazliye","nazrife","nebat","nebia","nebibe","nebide","nebiha","nebihat","necah","necbiye","necife","necilal","necima","necime","necla","neclay","necle","necser","necude","necva","nedibe","nedife","nedriye","nedve","nedye","nefaret","nefes","nefide","nefiga","nefika","nefire","nefiya","nefiye","nefize","nefya","negihan","negul","nehari","nehide","nehime","nejdet","nejdiye","nejla","nejmiye","nelahat","nelda","nelli","nemrun","nerfide","nergahan","nergihan","nergiz","nergul","nergun","nerguzel","neriban","neric","nerkiz","nerman","nermiye","nerve","nerzan","nesai","nesfe","nesife","nesirin","neslahan","neslican","neslinur","nesra","nesrihan","nesrim","nesrin","nesriye","netife","nevcihan","nevel","nevgin","nevgun","nevil","nevim","nevise","nevraz","nevrim","nevrize","nevse","nevsi","nevzer","nevzete","nevziye","neyfinur","neysen","nezafiye","nezan","nezehat","nezengul","nezife","neziha","nezihan","nezihat","nezihet","neziye","neziyet","nezize","nezrife","nice","nigar","nige","nigmet","nihari","nihaye","nikar","nikat","nila","nilcan","nilda","nildem","nilden","nilfer","nilgul","nilgun","nilifer","nilsah","nilsen","nilufer","nimetiye","nirgul","nisficihan","nispahi","niyase","nizgin","nofe","noran","nuber","nudet","nudiye","nudret","nufide","nuhiye","nuket","nukte","nulfer","nulgun","nulifer","nulufer","nupelda","nura","nurale","nurane","nuraniye","nurat","nurayi","nurbanu","nurberat","nurbetul","nurcay","nurcin","nurda","nurdagul","nurdamla","nurdaniye","nurdanur","nurdeniz","nurdoken","nuren","nurevsan","nurey","nurfatma","nurfen","nurfet","nurfiye","nurgen","nurgil","nurguzel","nurhak","nurhan","nurhayet","nurhuda","nurhun","nurice","nurihayat","nurisan","nurisen","nuristan","nuriya","nuriyet","nurkadin","nurnisa","nursa","nursan","nursat","nurseda","nursel","nurselin","nursemi","nursenim","nursevcan","nursever","nurside","nursifa","nursin","nursiye","nursuman","nurten","nurufe","nurus","nurusah","nurva","nurven","nurya","nurziye","nushet","nutfiye","nuveyde","nuveyre","nuzret","Oana","Olga","Olgu","Olgul","omiriye","omluye","omriye","omrum","omruye","omuriya","omurnaz","onem","Orcin","Orlinda","ozde","ozdem","ozgecan","ozgehan","ozgenaz","ozgenur","oznur","pakizer","pasey","pehman","pelda","pelinsu","pembesin","pembi","pembis","pempe","penbe","penpe","peral","peray","percihan","perdane","peria","perihannur","perim","perinaz","peris","perisan","perizade","perizan","pernur","pevziye","peyda","peyran","peyruze","piltan","pinar","pori","rabbiye","rabiha","rabike","rabiya","rabiye","radiye","rafika","rafike","rafiye","rahan","rahcan","rahide","raime","raize","rakife","rakite","rakiye","ramize","ramona","ramziye","raniya","rasan","rasen","rasike","raviye","rayla","raz","razinan","rebihat","rebis","recudiye","redda","redife","refa","refan","refike","refiya","rehime","rekiya","remiha","renata","rengul","renin","resalet","resmi","revasiye","revsi","revzete","reyide","reyzan","rezge","ridvane","rifa","rihan","rime","riskiye","rivayet","riyhane","rizkiye","rubasa","rufiye","ruhat","ruhevza","ruhide","ruhser","rujdiye","ruken","rukhiya","rukide","rukkiye","rukuya","rukuye","rukye","rurten","rusan","zinya","eda","sila","meral","seren","esma","eylul","eylem","asel","yasemin","aybuke","erdanur","ceylan","aysun","tuana","selen","gokce","derya","esen","luna","sulfiye","ulfiye","sevinc","sukran"]; var notr_isimler = ["pervin","firat","azgin","payal","dilan","kevin","azad","roj","rojda","bahoz","boran","baran"];
var notr_isimler = ["delal","pervin","firat","azgin","payal","dilan","kevin","azad","roj","rojda","bahoz","boran","baran",];
var badwords = ['porno','porn','pornografi','pornography','onlyfans','escort','eskort','nsfw','xxx','hentai','seks','sex','erotik','erotic','masturbasyon','mastürbasyon','nude','nudity','blowjob','cumshot','hardcore'];

if (typeof window !== 'undefined') {
  window.erkek_isimleri = erkek_isimleri;
  window.kadin_isimleri = typeof kiz_isimleri !== 'undefined' ? kiz_isimleri : [];
  window.kiz_isimleri = window.kadin_isimleri;
  window.notr_isimler = notr_isimler;
  window.badwords = badwords;
}
if (typeof globalThis !== 'undefined') {
  globalThis.erkek_isimleri = erkek_isimleri;
  globalThis.kadin_isimleri = typeof kiz_isimleri !== 'undefined' ? kiz_isimleri : [];
  globalThis.kiz_isimleri = globalThis.kadin_isimleri;
  globalThis.notr_isimler = notr_isimler;
  globalThis.badwords = badwords;
}


  // =========================================================================
  // 7. CODUM ÇEKİRDEK (CODUM CORE)
  // =========================================================================
  /* CODUM Instagram Araçları - Core Engine & Utilities */
(function(root) {
  'use strict';

  const VERSION = '1.5.1';
  const API_ORIGIN = 'https://codum.tr';

  function safeJson(raw, fallback = null) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function today(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('İşlem durduruldu', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
      if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    });
  }

  function humanJitter(baseMs, varianceRatio = 0.25) {
    const delta = baseMs * varianceRatio;
    const randomShift = (Math.random() * delta * 2) - delta;
    return Math.max(500, Math.round(baseMs + randomShift));
  }

  function normalizeTurkish(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
      .replace(/Ü/g, 'u').replace(/ü/g, 'u')
      .replace(/Ş/g, 's').replace(/ş/g, 's')
      .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
      .replace(/Ö/g, 'o').replace(/ö/g, 'o')
      .replace(/Ç/g, 'c').replace(/ç/g, 'c')
      .toLowerCase()
      .trim();
  }

  function cleanUsername(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw.trim()
      .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '')
      .replace(/^@+/, '')
      .split(/[/?#]/)[0]
      .toLowerCase();
  }

  // Cinsiyet tespit motoru (isimler.js listesinden)
  function detectGender(fullNameOrUsername) {
    if (!fullNameOrUsername) return 'unknown';
    const clean = normalizeTurkish(fullNameOrUsername);
    const words = clean.split(/[^a-z0-9]+/i).filter(w => w.length >= 2);

    const maleList = root.erkek_isimleri || (typeof window !== 'undefined' ? window.erkek_isimleri : null);
    const femaleList = root.kadin_isimleri || root.kiz_isimleri || (typeof window !== 'undefined' ? (window.kadin_isimleri || window.kiz_isimleri) : null);

    const hasMaleList = Array.isArray(maleList);
    const hasFemaleList = Array.isArray(femaleList);

    for (const word of words) {
      if (hasFemaleList && femaleList.some(n => normalizeTurkish(n) === word)) return 'kadin';
      if (hasMaleList && maleList.some(n => normalizeTurkish(n) === word)) return 'erkek';
    }
    return 'unknown';
  }

  // +18 ve Kara Liste Filtresi (Gelişmiş Kelime Sınırı & Güvenli Beyaz Liste)

  function matchesWords(text, words) {
    const tokens = normalizeTurkish(text).split(/[^a-z0-9]+/).filter(Boolean);
    return Array.isArray(words) && words.some(word => {
      const needle = normalizeTurkish(word).split(/[^a-z0-9]+/).filter(Boolean);
      return needle.length && tokens.some((_, i) => needle.every((part,j) => tokens[i+j] === part));
    });
  }

  function containsBadwords(text, customBlacklist = []) {
    return matchesWords(text, customBlacklist) || matchesWords(text, root.badwords || []);
  }

  // Müşteri / Lisans yönetimi
  function normalizeCustomer(current, data, token) {
    const isBanned = data.status === 'banned' || data.status === 'suspended' || data.status === 'inactive';
    const isPending = data.status === 'pending_approval' || data.pending === true;
    const isExpired = Boolean(data.expired) || (data.expiresAt && Number.isFinite(Date.parse(data.expiresAt)) && Date.parse(data.expiresAt) <= Date.now());
    const isValid = !isBanned && !isPending && !isExpired && data.valid !== false && data.ok !== false;
    return {
      ...current,
      ...data,
      valid: isValid,
      ok: isValid,
      expired: isExpired,
      pending: isPending,
      status: data.status || (isValid ? 'active' : 'inactive'),
      extensionAllowed: data.extensionAllowed !== false && !isBanned && isValid,
      serverError: data.serverError || '',
      accessToken: token || current?.accessToken || '',
      lastVerifiedAt: new Date().toISOString()
    };
  }

  function validCustomer(customer, token) {
    if (!customer) return false;
    if (customer.valid !== true || customer.ok === false) return false;
    // Öncelik 1: Yasaklı, dondurulmuş veya süresi dolmuş hesaplar hiçbir şekilde geçemez!
    if (customer.pending || customer.status === 'banned' || customer.status === 'suspended' || customer.status === 'inactive' || customer.expired || customer.valid === false || customer.extensionAllowed === false) {
      return false;
    }
    if (customer.expiresAt) {
      const exp = Date.parse(customer.expiresAt);
      if (!Number.isFinite(exp) || exp <= Date.now()) return false;
    }

    // Explicit local mode is separate from server-verified paid plans.
    if (customer.standalone === true && customer.plan === 'local') {
      return true;
    }
    if (!(token || customer.accessToken) || !customer.lastVerifiedAt) return false;
    if (customer.lastVerifiedAt) {
      const verifiedTime = Date.parse(customer.lastVerifiedAt);
      if (!Number.isFinite(verifiedTime) || verifiedTime > Date.now() + 60000 || Date.now() - verifiedTime > 72 * 3600 * 1000) return false;
    }
    return true;
  }

  // Günlük sayaç / istatistik (Hesap bazlı veya genel)
  function dailyStats(saved, date = today()) {
    if (!saved || saved.date !== date) {
      return { date, follow: 0, unfollow: 0, like: 0, comment: 0, story: 0, dm: 0, remove: 0 };
    }
    const keys = ['follow', 'unfollow', 'like', 'comment', 'story', 'dm', 'remove'];
    const res = { date };
    for (const k of keys) {
      res[k] = Number.isFinite(saved[k]) ? Math.max(0, Math.floor(saved[k])) : 0;
    }
    return res;
  }

  // Dosya indirme (TXT, JSON veya CSV)
  function downloadText(textContent, filename = 'codum_export.txt', mimeType = 'text/plain;charset=utf-8') {
    try {
      const blob = new Blob([textContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    } catch (e) {
      console.error('[CODUM Core] Dosya indirme hatası:', e);
      return false;
    }
  }

  function downloadTextFile(filename, textContent) {
    return downloadText(textContent, filename, 'text/plain;charset=utf-8');
  }

  // Cookie okuma
  function getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : '';
    } catch (_) {
      return '';
    }
  }

  const CodumCore = {
    VERSION,
    API_ORIGIN,
    safeJson,
    today,
    sleep,
    humanJitter,
    normalizeTurkish,
    cleanUsername,
    detectGender,
    containsBadwords,
    matchesWords,
    normalizeCustomer,
    validCustomer,
    dailyStats,
    downloadText,
    downloadTextFile,
    getCookie
  };

  root.CodumCore = CodumCore;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodumCore;
  }
})(typeof window !== 'undefined' ? window : globalThis);


  // =========================================================================
  // 8. INSTAGRAM REST & GRAPHQL ENGINE
  // =========================================================================
  /* CODUM Instagram Araçları - Core Instagram Engine */
(function(root) {
  'use strict';

  const CORE = root.CodumCore;

  // =========================================================================
  // 1. INSTAGRAM REST & GRAPHQL API İSTEMCİSİ
  // =========================================================================
  class InstagramApiClient {
    constructor() {
      this.appId = '936619743392459'; // Instagram Web Client App ID
      this.asbdId = '129477';
      this.currentUser = null;
    }

    getCsrfToken() {
      // 1. document.cookie üzerinden oku
      let token = CORE.getCookie('csrftoken') || '';
      if (token) return token;

      // 2. window._sharedData veya config üzerinden oku
      try {
        if (typeof window !== 'undefined' && window._sharedData?.config?.csrf_token) {
          return window._sharedData.config.csrf_token;
        }
      } catch (_) {}

      // 3. Sayfadaki script etiketlerinden regex ile ara
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const s of scripts) {
          const m = s.textContent.match(/"csrf_token":"([^"]+)"/);
          if (m && m[1]) return m[1];
        }
      } catch (_) {}

      return '';
    }

    getUserId() {
      // 1. ds_user_id çerezi
      let uid = CORE.getCookie('ds_user_id') || '';
      if (uid) return uid;

      // 2. window._sharedData
      try {
        if (typeof window !== 'undefined' && window._sharedData?.config?.viewerId) {
          return String(window._sharedData.config.viewerId);
        }
      } catch (_) {}

      // 3. Inline script tag taraması
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const s of scripts) {
          const m = s.textContent.match(/"viewerId":"(\d+)"/);
          if (m && m[1]) return m[1];
        }
      } catch (_) {}

      return '';
    }

    isLoggedIn() {
      return Boolean(this.getUserId());
    }

    getHeaders(extra = {}) {
      const headers = {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': this.getCsrfToken(),
        'X-IG-App-ID': this.appId,
        'X-ASBD-ID': this.asbdId,
        'X-Instagram-AJAX': '101416790',
        ...extra
      };
      if (this.wwwClaim) {
        headers['X-IG-WWW-Claim'] = this.wwwClaim;
      }
      return headers;
    }

    async request(url, options = {}) {
      const defaultOptions = {
        method: 'GET',
        headers: this.getHeaders(options.headers || {}),
        credentials: 'include'
      };
      this.assertActive?.();
      const finalOptions = { ...defaultOptions, ...options, headers: this.getHeaders(options.headers || {}), signal: this.signal };
      const accountId = this.getUserId();
      if (this.accountId && accountId !== this.accountId) throw new Error('ACCOUNT_CHANGED: Aktif hesap değişti.');

      if (finalOptions.method === 'POST') {
        finalOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (finalOptions.body && typeof finalOptions.body === 'object' && !(finalOptions.body instanceof FormData)) {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(finalOptions.body)) {
            params.append(k, v);
          }
          finalOptions.body = params.toString();
        } else if (!finalOptions.body) {
          finalOptions.body = '';
        }
      }

      if (typeof AbortSignal.timeout === 'function' && typeof AbortSignal.any === 'function') {
        finalOptions.signal = this.signal ? AbortSignal.any([this.signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000);
      }
      const res = await fetch(url, finalOptions);
      const claim = res.headers.get('x-ig-set-www-claim');
      if (claim) {
        this.wwwClaim = claim;
      }

      if (res.status === 429) {
        throw new Error('RATE_LIMITED: Instagram işlem limiti uyguladı. Lütfen bekleyin.');
      }
      if (res.status === 401) {
        throw new Error('LOGIN_REQUIRED: Instagram oturumunuz kapanmış veya süresi dolmuş.');
      }
      if (res.status === 403) {
        throw new Error('FORBIDDEN: Instagram bu işleme izin vermedi (403 Erişim Engeli).');
      }

      let data;
      try {
        data = await res.json();
      } catch (_) {
        if (!res.ok) {
          throw new Error(`HTTP_${res.status}: Instagram sunucusu geçersiz yanıt döndürdü.`);
        }
        throw new Error('INVALID_RESPONSE: Instagram geçerli JSON döndürmedi.');
      }

      if (!res.ok) {
        const msg = data?.message || `HTTP_${res.status}`;
        throw new Error(`API_ERROR: ${msg}`);
      }

      if (data && data.status === 'fail') {
        if (data.message === 'feedback_required') {
          throw new Error('FEEDBACK_REQUIRED: Instagram geçici işlem engeli verdi. Birkaç saat beklenmelidir.');
        }
        if (data.message === 'checkpoint_required') {
          throw new Error('CHECKPOINT_REQUIRED: Instagram güvenlik doğrulaması (checkpoint) istiyor.');
        }
        if (data.message === 'login_required') {
          throw new Error('LOGIN_REQUIRED: Instagram oturumu açık değil.');
        }
        throw new Error(`API_FAIL: ${data.message || 'İşlem başarısız oldu'}`);
      }

      if (!data || typeof data !== 'object' || data.errors || data.error || data.challenge || data.message === 'challenge_required') {
        throw new Error('INVALID_RESPONSE: İşlem doğrulanamadı veya güvenlik doğrulaması gerekiyor.');
      }
      return data;
    }

    // Aktif oturum bilgisi
    async getCurrentAccount() {
      const uid = this.getUserId();
      if (!uid) { this.currentUser = null; return null; }
      if (this.currentUser?.id === uid) return this.currentUser;
      const data = await this.request('https://www.instagram.com/api/v1/accounts/edit/web_form_data/');
      this.currentUser = {id:uid,username:data.form_data?.username || uid,fullName:data.form_data?.first_name || ''};
      return this.currentUser;
    }

    // Kullanıcı profil bilgisi (web_profile_info)
    async getUserProfile(username) {
      const clean = CORE.cleanUsername(username);
      const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(clean)}`;
      const res = await this.request(url);
      return res?.data?.user || null;
    }

    // İlişki durumu (Seni takip ediyor mu?)
    async getFriendship(userId) {
      const url = `https://www.instagram.com/api/v1/friendships/show/${userId}/`;
      return await this.request(url);
    }

    // Takip Et
    async follow(userId) {
      const url = `https://www.instagram.com/api/v1/friendships/create/${userId}/`;
      return await this.request(url, { 
        method: 'POST', 
        body: { 
          user_id: userId,
          csrf_token: this.getCsrfToken() 
        } 
      });
    }

    // Takipten Çık
    async unfollow(userId) {
      const url = `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`;
      return await this.request(url, { 
        method: 'POST', 
        body: { 
          user_id: userId,
          csrf_token: this.getCsrfToken() 
        } 
      });
    }

    // Takipçiyi Çıkar
    async removeFollower(userId) {
      const url = `https://www.instagram.com/api/v1/friendships/remove_follower/${userId}/`;
      return await this.request(url, { method: 'POST', body: {} });
    }

    // Takipçiler listesini çek (REST - Mert Çobanov & Instagram Web API standardı)
    async getFollowers(userId, maxId = '') {
      let url = `https://www.instagram.com/api/v1/friendships/${encodeURIComponent(userId)}/followers/?count=50`;
      if (maxId) url += `&max_id=${encodeURIComponent(maxId)}`;
      return await this.request(url);
    }

    // Takip edilenler listesini çek (REST - Mert Çobanov & Instagram Web API standardı)
    async getFollowing(userId, maxId = '') {
      let url = `https://www.instagram.com/api/v1/friendships/${encodeURIComponent(userId)}/following/?count=50`;
      if (maxId) url += `&max_id=${encodeURIComponent(maxId)}`;
      return await this.request(url);
    }

    // Kısa koddan (Shortcode - Örn: C_xyz) Instagram sayısal Medya ID çözümleme
    shortcodeToMediaId(shortcode) {
      if (!shortcode || typeof shortcode !== 'string') throw new Error('INVALID_MEDIA: Gönderi kimliği gerekli.');
      const clean = shortcode.trim().replace(/^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([^/?#]+).*$/i, '$1');
      if (/^\d+$/.test(clean)) return clean;
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      let id = 0n;
      for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        const index = BigInt(alphabet.indexOf(char));
        if (index === -1n) throw new Error('INVALID_MEDIA: Geçersiz gönderi kodu.');
        id = id * 64n + index;
      }
      return id.toString();
    }

    // Gönderi beğen
    async likeMedia(mediaId) {
      const numericId = this.shortcodeToMediaId(mediaId);
      const url = `https://www.instagram.com/api/v1/web/likes/${numericId}/like/`;
      return await this.request(url, { method: 'POST', body: {} });
    }

    async postCommentViaDOM(commentText) {
      try {
        const area = document.querySelector('form textarea[aria-label*="orum"], form textarea[placeholder*="orum"], form textarea[aria-label*="omment"], form textarea[placeholder*="omment"], div[role="textbox"][contenteditable="true"]');
        if (!area) return false;
        area.focus();
        if (area.tagName === 'TEXTAREA') {
          area.value = commentText;
          area.dispatchEvent(new Event('input', { bubbles: true }));
          area.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          area.textContent = commentText;
          area.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: commentText }));
        }
        await new Promise(r => setTimeout(r, 600));
        const postButton = [...document.querySelectorAll('form button, form div[role="button"]')].find(b => {
          const t = (b.textContent || '').trim().toLowerCase();
          return /^(paylaş|post|gönder)$/i.test(t) && b.offsetParent !== null;
        });
        if (postButton) {
          postButton.click();
          await new Promise(r => setTimeout(r, 1200));
          return true;
        }
      } catch (_) {}
      return false;
    }

    // Yorum gönder (API + DOM Hibrit Motor)
    async postComment(mediaId, commentText) {
      const numericId = this.shortcodeToMediaId(mediaId);
      const url = `https://www.instagram.com/api/v1/web/comments/${numericId}/add/`;
      try {
        return await this.request(url, { method: 'POST', body: { comment_text: commentText } });
      } catch (err) {
        const domSuccess = await this.postCommentViaDOM(commentText);
        if (domSuccess) return { status: 'ok', comment: { pk: 'dom_' + Date.now() } };
        throw err;
      }
    }

    // Hikaye tepsisi
    async getStoryTray() {
      const url = 'https://www.instagram.com/api/v1/feed/reels_tray/';
      return await this.request(url);
    }

    // DM Gönder
    async sendDirectMessage(recipientUserIds, text) {
      const url = 'https://www.instagram.com/api/v1/direct_v2/threads/broadcast/text/';
      const recipientStr = Array.isArray(recipientUserIds) ? `[[${recipientUserIds.join(',')}]]` : `[[${recipientUserIds}]]`;
      const body = {
        recipient_users: recipientStr,
        client_context: (Date.now() * 1000).toString(),
        text: text
      };
      return await this.request(url, { method: 'POST', body });
    }
  }

  // =========================================================================
  // 2. CODUM OTOMASYON MOTORU
  // =========================================================================
  class InstagramEngine {
    constructor() {
      this.api = new InstagramApiClient();
      this.isRunning = false;
      this.isPaused = false;
      this.currentTask = null;
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0 };
      this.processedHistory = new Set();
      this.onLogCallback = null;
      this.onStatusCallback = null;

      // Checkpoint depolama anahtarı (Kaldığı yerden devam edebilme)
      this.STORAGE_KEY_UNFOLLOW = 'codum_ig_unfollow_checkpoint';
      this.busy = false;
    }

    setLogHandler(fn) { this.onLogCallback = fn; }
    setStatusHandler(fn) { this.onStatusCallback = fn; }

    log(message, type = 'info') {
      const time = new Date().toLocaleTimeString();
      if (typeof this.onLogCallback === 'function') {
        this.onLogCallback({ time, message, type });
      }
      try {
        chrome.runtime.sendMessage({ type: 'LOG_ACTION', logType: type, text: message });
      } catch (_) {}
    }

    updateStatus(customInfo = '') {
      if (typeof this.onStatusCallback === 'function') {
        this.onStatusCallback({
          isRunning: this.isRunning,
          isPaused: this.isPaused,
          task: this.currentTask,
          stats: { ...this.stats },
          info: customInfo
        });
      }
    }

    assertActive() {
      if (this.controller?.signal.aborted) throw new DOMException('İşlem durduruldu', 'AbortError');
      if (this.taskAccount && this.api.getUserId() !== this.taskAccount) throw new Error('ACCOUNT_CHANGED: Aktif hesap değişti.');
    }

    async checkDailyLimit(metric) {
      this.assertActive();
      const res = await chrome.runtime.sendMessage({ type: 'CHECK_DAILY_LIMIT', metric, accountId: this.api.getUserId() });
      this.assertActive();
      if (!res?.ok) throw new Error(res?.error || 'LIMIT_UNAVAILABLE: Limit kontrolü yapılamadı.');
      if (res.reached) { this.stop('Günlük işlem sınırına ulaşıldı.'); return false; }
      return true;
    }

    async reserveAction(metric) {
      this.assertActive();
      const res = await chrome.runtime.sendMessage({ type: 'RESERVE_ACTION', metric, accountId: this.api.getUserId() });
      this.assertActive();
      if (!res?.ok) throw new Error(res?.error || 'LIMIT_UNAVAILABLE: İşlem izni alınamadı.');
      return res;
    }

    stop(reason = 'Kullanıcı tarafından durduruldu.') {
      if (this.controller?.signal.aborted) return;
      this.controller?.abort();
      this.isRunning = false;
      this.isPaused = false;
      this.log(reason, 'warning');
      this.updateStatus(reason);
    }

    async safeDelay(baseMs, minInterval = 2000) {
      this.assertActive();
      const ms = CORE.humanJitter(Math.max(minInterval, baseMs));
      this.updateStatus('Bekleniyor (' + Math.round(ms / 1000) + ' sn)...');
      await CORE.sleep(ms, this.controller?.signal);
      this.assertActive();
    }

    // =========================================================================
    // 3. AKILLI TAKİP MOTORU (FOLLOW)
    // =========================================================================
    async startFollowTask(targetList, options = {}) {
      if (this.isRunning) return;
      this.isRunning = true;
      this.currentTask = 'Takip Etme';
      const maxCount = Number(options.maxFollowCount) || 150;
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0, targetTotal: targetList.length, maxCount };
      this.log(`🚀 Takip motoru başlatıldı. İncelenecek hedef: ${targetList.length}`, 'info');

      const speed = (Number(options.followSpeedSec) || 45) * 1000;
      const cooldownCount = Number(options.followCooldownCount) || 50;
      const cooldownMinutes = Number(options.followCooldownMins) || 15;
      const blacklistWords = (options.filterBlacklistWords || '').split(',').map(s => s.trim()).filter(Boolean);

      try {
        for (let i = 0; i < targetList.length; i++) {
          if (!this.isRunning) break;
          if (this.stats.success >= maxCount) {
            this.log(`🎯 Belirlenen maksimum takip sınırına (${maxCount}) ulaşıldı.`, 'success');
            break;
          }

          // Günlük güvenlik limit kontrolü
          const canFollow = await this.checkDailyLimit('follow');
          if (!canFollow) break;

          const target = targetList[i];
          const username = typeof target === 'string' ? target : target.username;
          this.stats.processed++;
          this.log(`[${i + 1}/${targetList.length}] İncelemede: @${username}`, 'info');

          let profile = null;
          try {
            profile = await this.api.getUserProfile(username);
          } catch (error) {
            throw error;
          }

          if (!profile) {
            this.stats.skipped++;
            continue;
          }

          // Filtreler: Gizli Hesap Kontrolü
          if (options.filterPrivate) {
            const isPriv = Boolean(profile.is_private);
            const mode = options.filterPrivateMode || 'gizli';
            if (mode === 'gizli' && isPriv) {
              this.log(`@${username} hesabı gizli olduğu için atlandı.`, 'info');
              this.stats.skipped++;
              continue;
            }
            if (mode === 'acik' && !isPriv) {
              this.log(`@${username} hesabı açık olduğu için atlandı.`, 'info');
              this.stats.skipped++;
              continue;
            }
          }

          if (options.filterDefaultAvatar && (profile.has_anonymous_profile_picture || !profile.profile_pic_url)) {
            this.log(`@${username} varsayılan profil resmine sahip, atlandı.`, 'info');
            this.stats.skipped++;
            continue;
          }

          const bioAndName = `${profile.full_name || ''} ${profile.biography || ''}`;
          if ((options.filterAdult && CORE.containsBadwords(bioAndName)) || CORE.matchesWords(bioAndName, blacklistWords)) {
            this.log(`@${username} bio/isminde spam veya +18 kelime tespit edildi. Atlandı.`, 'warning');
            this.stats.skipped++;
            continue;
          }

          if (options.filterGender && options.filterGender !== 'hepsi') {
            const detected = CORE.detectGender(profile.full_name || username);
            if (detected !== options.filterGender) {
              this.log(`@${username} cinsiyet kuralına (${options.filterGender}) uymuyor. Atlandı.`, 'info');
              this.stats.skipped++;
              continue;
            }
          }

          try {
            await this.reserveAction('follow');
            this.assertActive();
            const followRes = await this.api.follow(profile.id);
            if (followRes && (followRes.status === 'ok' && (followRes.friendship_status?.following === true || followRes.friendship_status?.outgoing_request === true))) {
              this.stats.success++;
              this.processedHistory.add(username);
              this.log(`✅ @${username} takip edildi! (${this.stats.success}/${maxCount})`, 'success');
              chrome.runtime.sendMessage({ type: 'UPDATE_STATS', metric: 'follow', accountId: this.taskAccount, count: 1 }).catch(() => {});
            } else {
              throw new Error(followRes?.message || 'Instagram takip işlemi başarısız yanıt döndürdü.');
            }
          } catch (followErr) {
            this.log(`❌ @${username} takip edilemedi: ${followErr.message}`, 'error');
            this.stats.failed++;
            this.stop('Takip durduruldu: ' + followErr.message);
            break;
          }

          // Periyodik soğuma
          if (this.stats.success > 0 && this.stats.success % cooldownCount === 0) {
            this.log(`☕ ${cooldownCount} işlem tamamlandı. ${cooldownMinutes} dakika dinlenme molası...`, 'warning');
            for (let m = cooldownMinutes; m > 0; m--) {
              if (!this.isRunning) break;
              this.updateStatus(`Mola: ${m} dk kaldı`);
              await CORE.sleep(60000, this.controller?.signal);
            }
          }

          await this.safeDelay(speed, 5000);
        }
      } finally {
        this.stop('Takip görevi tamamlandı.');
      }
    }

    // =========================================================================
    // 4. CODUM TAKİPTEN ÇIKMA MOTORU (CHECKPOINT & AKILLI UNFOLLOW)
    // =========================================================================
    async startUnfollowTask(followingList, followersSet = new Set(), options = {}) {
      if (this.isRunning) return;
      this.isRunning = true;
      this.currentTask = 'Takipten Çıkma';
      const maxCount = Number(options.unfollowLimit) || 200;
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0, targetTotal: followingList.length, maxCount };
      this.log(`🚪 Akıllı Takipten Çıkma Motoru başlatıldı. Toplam taranacak: ${followingList.length}`, 'info');

      const speed = (Number(options.unfollowSpeedSec) || 35) * 1000;
      const whitelist = (options.unfollowWhitelist || '').split(/[\n,]/).map(CORE.cleanUsername).filter(Boolean);
      const isUnfollowAll = options.unfollowMode === 'all';

      // Checkpoint kontrolü (Kaldığı index)
      let startIndex = 0;
      {
        try {
          const saved = (await chrome.storage.local.get(this.STORAGE_KEY_UNFOLLOW))[this.STORAGE_KEY_UNFOLLOW] || {};
          if (saved && Date.now() - saved.timestamp < 24 * 3600000 && saved.accountId === this.taskAccount && saved.signature === JSON.stringify(followingList.map(u => u.id || u.pk || u.username || u)) && typeof saved.lastIndex === 'number' && saved.lastIndex >= 0 && saved.lastIndex < followingList.length) {
            startIndex = saved.lastIndex;
            this.log(`📌 Önceki oturumdan kalan kayıt bulundu. Kaldığı yerden devam ediliyor: [${startIndex + 1}. hesap]`, 'info');
          }
        } catch (_) {}
      }

      try {
        for (let i = startIndex; i < followingList.length; i++) {
          if (!this.isRunning) break;
          if (this.stats.success >= maxCount) {
            this.log(`🎯 Belirlenen çıkarma sınırına (${maxCount}) ulaşıldı.`, 'success');
            await chrome.storage.local.remove(this.STORAGE_KEY_UNFOLLOW);
            break;
          }

          // Günlük güvenlik limit kontrolü
          const canUnfollow = await this.checkDailyLimit('unfollow');
          if (!canUnfollow) break;

          // Checkpoint kaydet
          await chrome.storage.local.set({ [this.STORAGE_KEY_UNFOLLOW]: {
            lastIndex: i, accountId: this.taskAccount, signature: JSON.stringify(followingList.map(u => u.id || u.pk || u.username || u)), timestamp: Date.now()
          } });

          const target = followingList[i];
          const username = CORE.cleanUsername(typeof target === 'string' ? target : target.username);
          const userId = target.id || target.pk;

          this.stats.processed++;

          // 1. Beyaz liste koruması
          if (whitelist.includes(username)) {
            this.log(`🛡️ @${username} beyaz listede. Asla takipten çıkarılmaz. Atlandı.`, 'info');
            this.stats.skipped++;
            continue;
          }

          // 2. Geri takip ediyor mu?
          const isFollower = followersSet.has(username);
          if (options.requireNonFollower && isFollower) {
            this.log(`🤝 @${username} sizi geri takip ediyor. Atlandı.`, 'info');
            this.stats.skipped++;
            continue;
          }

          // Takipten Çık
          try {
            let targetId = userId;
            if (!targetId) {
              const prof = await this.api.getUserProfile(username);
              targetId = prof?.id;
            }

            if (!targetId) {
              this.stats.skipped++;
              continue;
            }

            if (options.requireNonFollower) {
              const relationship = await this.api.getFriendship(targetId);
              if (typeof relationship?.followed_by !== 'boolean') {
                this.log(`⚠️ @${username} ilişki durumu doğrulanamadı, güvenlik için atlandı.`, 'warning');
                this.stats.skipped++;
                continue;
              }
              if (relationship.followed_by) {
                this.log(`🤝 @${username} sizi geri takip ediyor (Doğrulandı). Atlandı.`, 'info');
                this.stats.skipped++;
                await CORE.sleep(CORE.humanJitter(600, 0.2), this.controller?.signal);
                continue;
              }
            }
            await this.reserveAction('unfollow');
            this.assertActive();
            const unfRes = await this.api.unfollow(targetId);
            if (unfRes && (unfRes.status === 'ok' && unfRes.friendship_status?.following === false)) {
              const checkpoint = (await chrome.storage.local.get(this.STORAGE_KEY_UNFOLLOW))[this.STORAGE_KEY_UNFOLLOW];
              await chrome.storage.local.set({[this.STORAGE_KEY_UNFOLLOW]:{...checkpoint,lastIndex:i+1}});
              this.stats.success++;
              this.log(`🚪 @${username} takipten çıkarıldı! (${this.stats.success}/${maxCount})`, 'success');
              chrome.runtime.sendMessage({ type: 'UPDATE_STATS', metric: 'unfollow', accountId: this.taskAccount, count: 1 }).catch(() => {});
            } else {
              throw new Error(unfRes?.message || 'Instagram takipten çıkarma başarısız yanıt döndürdü.');
            }
          } catch (unfErr) {
            this.log(`❌ @${username} takipten çıkarılamadı: ${unfErr.message}`, 'error');
            this.stats.failed++;
            this.stop('Takipten çıkma durduruldu: ' + unfErr.message);
            break;
          }

          await this.safeDelay(speed, 5000);
        }
      } finally {
        this.stop('Takipten çıkma görevi tamamlandı.');
      }
    }

    // =========================================================================
    // 5. LİSTE TARAMA (LEAD SCRAPER / ARKA PLAN OTOMATİK TARAMA)
    // =========================================================================
    async scrapeUserList(target, type = 'followers', maxLimit = 5000) {
      this.log(`📋 Arka planda ${type === 'followers' ? 'takipçiler' : 'takip ettikleriniz'} taranıyor...`, 'info');
      const result = [];
      const seen = new Set();
      let scrapeError = null;
      let isStopped = false;
      let hasNext = true;
      let pages = 0;
      let truncated = false;
      const cursors = new Set();

      // Instagram web uç noktalarını kullanır; platform değişiklikleri hata olarak raporlanır.
      try {
        let targetId = '';
        if (typeof target === 'string' && /^\d+$/.test(target)) {
          targetId = target;
        } else if (target) {
          const prof = await this.api.getUserProfile(target);
          targetId = prof?.id; 
        } else {
          targetId = this.api.getUserId();
        }

        if (!targetId) {
          throw new Error('Instagram kullanıcı kimliği (ID) bulunamadı.');
        }

        let maxId = '';

        while (hasNext && result.length < maxLimit && pages < 100) {
          if (!this.isRunning) {
            isStopped = true;
            this.log('🛑 Tarama işlemi kullanıcı tarafından durduruldu.', 'warning');
            break;
          }

          pages++;
          const data = type === 'followers'
            ? await this.api.getFollowers(targetId, maxId)
            : await this.api.getFollowing(targetId, maxId);

          const users = data?.users || [];
          if (!Array.isArray(data?.users)) throw new Error('INVALID_RESPONSE: Kullanıcı listesi yok.');
          if (!users.length) { hasNext = Boolean(data.next_max_id); break; }

          for (const [userIndex, u] of users.entries()) {
            const uName = (u.username || '').toLowerCase();
            if (uName && !seen.has(uName)) {
              seen.add(uName);
              result.push({
                id: String(u.pk || u.id || ''),
                username: uName,
                fullName: u.full_name || '',
                isPrivate: Boolean(u.is_private)
              });
            }
            if (result.length >= maxLimit) { truncated = userIndex < users.length - 1; break; }
          }

          this.log(`🔍 Arka planda taranıyor: ${result.length} hesap bulundu (Sayfa ${pages})...`, 'info');
          maxId = data.next_max_id || '';
          if (maxId && cursors.has(maxId)) throw new Error('INVALID_RESPONSE: Instagram aynı liste sayfasını tekrar döndürdü.');
          if (maxId) cursors.add(maxId);
          hasNext = truncated || Boolean(maxId && data.has_more !== false);

          if (hasNext && result.length < maxLimit && this.isRunning) {
            await CORE.sleep(CORE.humanJitter(1200, 0.2), this.controller?.signal);
          }
        }
      } catch (err) {
        scrapeError = err.message;
        this.log(`API Liste tarama hatası: ${err.message}`, 'warning');
      }

      const isCompleted = !hasNext && !scrapeError && !isStopped;
      result.completed = isCompleted;
      result.hasMore = Boolean(hasNext);
      result.stopped = isStopped;
      result.error = scrapeError;
      

      this.log(`✓ ${type === 'followers' ? 'Takipçiler' : 'Takip edilenler'}: Toplam ${result.length} hesap hazırlandı (${isCompleted ? 'Tamamlandı' : 'Kısmi/Durduruldu'}).`, isCompleted ? 'success' : 'warning');
      return result;
    }

    // =========================================================================
    // 5.1 CANLI REELS OTO-BEĞENİ & GEÇİŞ MOTORU (REELS AUTO SCROLL & LIKE)
    // =========================================================================
    findActiveReel() {
      const visible = el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      };
      const area = v => {
        const r = v.getBoundingClientRect();
        return Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0)) * Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));
      };
      const video = [...document.querySelectorAll('video')].filter(visible).sort((a,b)=>area(b)-area(a))[0];
      if (!video) return null;
      let container = video.parentElement;
      const label = el => (el.getAttribute('aria-label') || el.querySelector('title')?.textContent || '').trim().toLowerCase();
      let heart, liked;
      // Reels action icons are often siblings of the video, not children of its wrapper.
      while (container && container !== document.body) {
        const icons = [...container.querySelectorAll('svg[aria-label],svg:has(title),button[aria-label],[role="button"][aria-label]')]
          .filter(el => !el.closest('#codum-instagram-dock') && visible(el));
        const vr = video.getBoundingClientRect();
        const nearby = el => { const r=el.getBoundingClientRect();return r.bottom >= vr.top && r.top <= vr.bottom; };
        heart = icons.find(el => /^(like|likes|beğen)$/.test(label(el)) && nearby(el));
        liked = icons.find(el => /^(unlike|beğenmekten vazgeç)$/.test(label(el)) && nearby(el));
        if (heart || liked) break;
        container = container.parentElement;
      }
      if (!container || container === document.body) return null;
      const key = video.currentSrc || video.src;
      if (!key) return null;
      return {video,container,key,button:heart?.closest('button,[role="button"]'),liked:Boolean(liked)};
    }

    async advanceReel(previousKey) {
      const current = this.findActiveReel();
      if (!current) throw new Error('Aktif Reels bulunamadı.');
      const next = [...document.querySelectorAll('svg[aria-label],button[aria-label],[role="button"][aria-label]')].find(el => {
        if (el.closest('#codum-instagram-dock')) return false;
        const label = (el.getAttribute('aria-label') || '').trim();
        const r = el.getBoundingClientRect();
        return /^(next|next video|next reel|sonraki|sonraki video|sonraki reels|aşağı|down)$/i.test(label) && r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight;
      });
      this.assertActive();
      const button = next?.closest('button,[role="button"]');
      if (button) button.click();
      else {
        let scroller = current.video.parentElement;
        while (scroller && scroller !== document.body) {
          if (scroller.scrollHeight > scroller.clientHeight + 16 && /auto|scroll/.test(getComputedStyle(scroller).overflowY)) break;
          scroller = scroller.parentElement;
        }
        const distance = Math.max(current.video.getBoundingClientRect().height, (scroller?.clientHeight || innerHeight)*0.85);
        if (scroller && scroller !== document.body) scroller.scrollBy({top:distance,behavior:'smooth'});
        else window.scrollBy({top:distance,behavior:'smooth'});
      }
      for (let n=0;n<20;n++) {
        await CORE.sleep(300,this.controller.signal); this.assertActive();
        const active = this.findActiveReel();
        if (active && active.key !== previousKey) return;
      }
      throw new Error('Sonraki Reels yüklenmedi. Yanlış videoyu tekrar beğenmemek için durduruldu.');
    }

    async confirmLike(read, key) {
      for (let n=0;n<20;n++) {
        await CORE.sleep(200,this.controller.signal); this.assertActive();
        const item=read();
        if (item?.key === key && item.liked) return;
      }
      throw new Error('Beğeni doğrulanamadı; işlem durduruldu.');
    }

    assertContentType(kind) {
      const path=location.pathname;
      if (kind==='reels' && !/^\/reels?(?:\/|$)/.test(path)) throw new Error('Reels ekranından ayrıldığınız için görev durduruldu.');
      if (kind==='posts' && /^\/(?:reels?|stories)(?:\/|$)/.test(path)) throw new Error('Gönderi ekranından ayrıldığınız için görev durduruldu.');
      if (kind==='stories' && !/^\/stories\/[^/]+\/\d+/.test(path)) throw new Error('Hikâye ekranından ayrıldığınız için görev durduruldu.');
    }

    findActivePost(seen = new Set()) {
      for (const article of document.querySelectorAll('article')) {
        const r=article.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= innerHeight || r.width <= 0) continue;
        const link=article.querySelector('a[href*="/p/"]');
        const match=link?.getAttribute('href')?.match(/\/p\/([\w-]+)/);
        if (!match || seen.has(match[1])) continue;
        const actions=article.querySelector('section') || article;
        const heart=actions.querySelector('svg[aria-label="Like"],svg[aria-label="Beğen"]');
        const liked=Boolean(actions.querySelector('svg[aria-label="Unlike"],svg[aria-label="Beğenmekten vazgeç"]'));
        if (!heart && !liked) continue;
        return {key:match[1],article,button:heart?.closest('button,[role="button"]'),liked};
      }
      return null;
    }

    async startPostAutoLikeRunner(options = {}) {
      this.isRunning = true;
      this.currentTask = 'Gönderi Beğenme';
      const maxCount = Math.max(1, Math.min(250, Number(options.maxLikeCount) || 30));
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0, targetTotal: maxCount };
      const seen = new Set();
      let stalled = 0;

      while (this.isRunning && this.stats.success < maxCount && stalled < 5) {
        this.assertActive();
        this.assertContentType('posts');
        const post = this.findActivePost(seen);
        if (!post) {
          stalled++;
          this.updateStatus('Yeni gönderiler taranıyor (' + stalled + '/5)...');
          window.scrollBy({ top: Math.round(window.innerHeight * 0.75), behavior: 'smooth' });
          await this.safeDelay(1500);
          continue;
        }

        const key = post.key;
        if (!post.liked) {
          if (!post.button) throw new Error('Gönderinin beğeni düğmesi bulunamadı.');
          await this.reserveAction('like');
          this.assertActive();
          if (this.findActivePost(seen)?.key !== key) continue;
          post.button.click();
          await this.confirmLike(() => this.findActivePost(seen), key);
          this.stats.success++;
          await chrome.runtime.sendMessage({ type: 'UPDATE_STATS', accountId: this.taskAccount, metric: 'like' });
          this.log('Gönderi beğenildi (' + this.stats.success + '/' + maxCount + ').', 'success');
        } else {
          this.stats.skipped++;
        }

        seen.add(key);
        this.stats.processed++;
        stalled = 0;
        this.updateStatus();

        if (this.stats.success >= maxCount) break;

        // OTOMATİK AKIŞ KAYDIRMA (Bir sonraki gönderiyi ekranın ortasına yumuşakça getirir)
        if (post.article) {
          post.article.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const nextArticle = post.article.nextElementSibling;
          if (nextArticle && nextArticle.tagName === 'ARTICLE') {
            nextArticle.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            window.scrollBy({ top: Math.round(window.innerHeight * 0.75), behavior: 'smooth' });
          }
        } else {
          window.scrollBy({ top: Math.round(window.innerHeight * 0.75), behavior: 'smooth' });
        }

        // Dinamik Canlı Hız: Görev çalışırken anlık olarak değiştirilebilir
        const currentSpeed = window.__codumPostSpeedSec ? Number(window.__codumPostSpeedSec) : (Number(options.speedSec) || 8);
        await this.safeDelay(Math.max(2, currentSpeed) * 1000);
      }
      if (stalled >= 5) this.log('Yeni gönderi bulunamadı; görev durduruldu.', 'warning');
    }

    findActiveStory() {
      const match=location.pathname.match(/^\/stories\/([^/]+)\/(\d+)/);
      if (!match) return null;
      const player=document.querySelector('section[role="region"],div[role="dialog"]') || document.querySelector('main');
      if (!player) return null;
      const heart=player.querySelector('svg[aria-label="Like"],svg[aria-label="Beğen"]');
      const liked=Boolean(player.querySelector('svg[aria-label="Unlike"],svg[aria-label="Beğenmekten vazgeç"]'));
      return {key:match[2],player,button:heart?.closest('button,[role="button"]'),liked};
    }

    async advanceStory(key) {
      const active=this.findActiveStory();
      const scope=active?.player || document;
      const next=[...scope.querySelectorAll('button[aria-label],[role="button"][aria-label],svg[aria-label]')].find(el=>{
        const r=el.getBoundingClientRect();
        return /^(next|sonraki|next story|sonraki hikaye|sonraki hikâye)$/i.test(el.getAttribute('aria-label')||'') && r.width>0 && r.height>0;
      });
      this.assertActive(); next?.closest('button,[role="button"]')?.click();
      // Without a labelled next control, wait for the player's normal advance.
      for (let n=0;n<120;n++) {
        await CORE.sleep(500,this.controller.signal); this.assertActive();
        if (!/^\/stories\//.test(location.pathname)) throw new Error('Hikâye oynatıcısı kapandı; görev durduruldu.');
        const story=this.findActiveStory();
        if (story && story.key!==key) return;
      }
      throw new Error('Sonraki hikâye açılmadı; görev durduruldu.');
    }

    async startStoryAutoLikeRunner(options = {}) {
      this.isRunning=true; this.currentTask='Hikâye Beğenme';
      const maxCount=Math.max(1,Math.min(250,Number(options.maxLikeCount)||20));
      this.stats={processed:0,success:0,skipped:0,failed:0,targetTotal:maxCount};
      const seen=new Set(); let stalled=0;
      while (this.isRunning && this.stats.success<maxCount && stalled<5) {
        this.assertActive(); this.assertContentType('stories'); const story=this.findActiveStory();
        if (!story || !story.button && !story.liked) {stalled++;await this.safeDelay(1500);continue;}
        if (seen.has(story.key)) {await this.advanceStory(story.key);continue;}
        if (!story.liked) {
          await this.reserveAction('like');this.assertActive();
          if (this.findActiveStory()?.key !== story.key) continue;
          story.button.click();
          await this.confirmLike(()=>this.findActiveStory(),story.key);
          this.stats.success++;
          await chrome.runtime.sendMessage({type:'UPDATE_STATS',accountId:this.taskAccount,metric:'like'});
          this.log('Hikâye beğenildi ('+this.stats.success+'/'+maxCount+').','success');
        } else this.stats.skipped++;
        seen.add(story.key);this.stats.processed++;stalled=0;this.updateStatus();
        if (this.stats.success>=maxCount) break;
        await this.safeDelay(Math.max(3,Number(options.speedSec)||5)*1000);
        if (this.findActiveStory()?.key===story.key) await this.advanceStory(story.key);
      }
      if (stalled>=5) this.log('Beğenilebilir hikâye bulunamadı; görev durduruldu.','warning');
    }

    async ensureCommentsDrawerOpen() {
      // Yorum linkleri halihazırda sayfada varsa zaten açıktır
      if (document.querySelector('a[href*="/c/"]')) return true;

      // 1. Reels veya Gönderi üzerindeki yorum butonunu ara
      const allButtons = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(b => !b.closest('#codum-instagram-dock'));
      for (const btn of allButtons) {
        const label = (btn.getAttribute('aria-label') || '').toLowerCase();
        const svg = btn.querySelector('svg');
        const svgLabel = (svg?.getAttribute('aria-label') || svg?.querySelector('title')?.textContent || '').toLowerCase();
        if ((label.includes('yorum') || label.includes('comment') || svgLabel.includes('yorum') || svgLabel.includes('comment')) &&
            !label.includes('paylaş') && !label.includes('share') && !label.includes('kaydet') && !label.includes('save') && !label.includes('kapat') && !label.includes('close')) {
          this.log('💬 Yorum çekmecesi kapalıydı, otomatik açılıyor...', 'info');
          btn.click();
          await this.safeDelay(1800);
          return true;
        }
      }

      // 2. Sayfadaki yorum SVG'lerinden butonu bul
      const commentSvgs = Array.from(document.querySelectorAll('svg')).filter(svg => {
        if (svg.closest('#codum-instagram-dock')) return false;
        const l = (svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || '').toLowerCase();
        return (l.includes('yorum') || l.includes('comment')) && !l.includes('paylaş') && !l.includes('share') && !l.includes('kaydet') && !l.includes('save');
      });
      for (const svg of commentSvgs) {
        const btn = svg.closest('button, div[role="button"]');
        if (btn && !btn.closest('#codum-instagram-dock')) {
          this.log('💬 Yorum çekmecesi kapalıydı, otomatik açılıyor...', 'info');
          btn.click();
          await this.safeDelay(1800);
          return true;
        }
      }
      return false;
    }

    findCommentToLike(seen = new Set()) {
      const scope = document.querySelector('[role="dialog"]') ||
                    document.querySelector('div[aria-label*="orum" i], section[aria-label*="orum" i], div[aria-label*="omment" i]') ||
                    document.querySelector('main') ||
                    document.body;
      if (!scope) return null;
      for (const link of scope.querySelectorAll('a[href*="/c/"]')) {
        const match = (link.getAttribute('href') || '').match(/\/c\/(\d+)/);
        if (!match || seen.has(match[1])) continue;
        let row = link.closest('li') || link.parentElement;
        const listItem = link.closest('li');
        let depth = 0;
        while (row && row !== scope) {
          if (++depth > 4 || ['ARTICLE', 'MAIN', 'SECTION'].includes(row.tagName) || row.querySelector('video')) break;
          const ids = new Set([...row.querySelectorAll('a[href*="/c/"]')].map(a => (a.getAttribute('href') || '').match(/\/c\/(\d+)/)?.[1]).filter(Boolean));
          // Never climb into a container holding more than this one comment.
          if (ids.size > 1) break;
          let heart = row.querySelector('svg[aria-label="Like"],svg[aria-label="Beğen"],svg[aria-label="like"],svg[aria-label="beğen"]');
          let liked = Boolean(row.querySelector('svg[aria-label="Unlike"],svg[aria-label="Beğenmekten vazgeç"],svg[aria-label="unlike"],svg[aria-label="beğenmekten vazgeç"]'));
          if (!heart && !liked) {
            const svgs = row.querySelectorAll('svg');
            for (const s of svgs) {
              const l = (s.getAttribute('aria-label') || s.querySelector('title')?.textContent || '').toLowerCase();
              if (l.includes('vazgeç') || l.includes('vazgec') || l.includes('unlike')) { liked = true; break; }
              if (l === 'beğen' || l === 'begen' || l === 'like') { heart = s; break; }
            }
          }
          const rect = row.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && (heart || liked)) {
            return { key: match[1], row, scope, button: heart?.closest('button,[role="button"]') || heart?.parentElement, liked };
          }
          if (listItem) break;
          row = row.parentElement;
        }
      }
      return null;
    }

    async startCommentLikeRunner(options = {}) {
      this.isRunning = true;
      this.currentTask = 'Yorum Beğenme';
      const maxCount = Math.max(1, Math.min(250, Number(options.maxLikeCount) || 20));
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0, targetTotal: maxCount };
      const seen = new Set();
      let stalled = 0;
      const startPath = location.pathname;

      // Çekmece kapalıysa otomatik açmayı dene
      await this.ensureCommentsDrawerOpen();

      while (this.isRunning && this.stats.success < maxCount && stalled < 5) {
        this.assertActive();
        if (location.pathname !== startPath) throw new Error('Gönderi değiştiği için yorum beğenisi durduruldu.');
        let comment = this.findCommentToLike(seen);
        if (!comment && stalled === 0) {
          // Açılmamış veya yüklenmemişse bir kez daha açmayı dene
          await this.ensureCommentsDrawerOpen();
          comment = this.findCommentToLike(seen);
        }
        if (!comment) {
          stalled++;
          this.updateStatus('Açık yorum listesi taranıyor (' + stalled + '/5)...');
          const scope = document.querySelector('[role="dialog"]') ||
                        document.querySelector('div[aria-label*="orum" i], section[aria-label*="orum" i], div[aria-label*="omment" i]') ||
                        document.querySelector('main');
          let scroller = scope && [...scope.querySelectorAll('ul,div')].find(el => el.scrollHeight > el.clientHeight + 16 && /auto|scroll/.test(getComputedStyle(el).overflowY));
          if (scroller) scroller.scrollBy({ top: Math.max(200, scroller.clientHeight * 0.7), behavior: 'smooth' });
          await this.safeDelay(1500);
          continue;
        }
        if (!comment.liked) {
          if (!comment.button) throw new Error('Yorumun beğeni düğmesi bulunamadı.');
          await this.reserveAction('like');
          this.assertActive();
          if (location.pathname !== startPath || this.findCommentToLike(seen)?.key !== comment.key) continue;
          comment.button.click();
          await this.confirmLike(() => this.findCommentToLike(seen), comment.key);
          this.stats.success++;
          await chrome.runtime.sendMessage({ type: 'UPDATE_STATS', accountId: this.taskAccount, metric: 'like' });
          this.log('Yorum beğenildi (' + this.stats.success + '/' + maxCount + ').', 'success');
        } else {
          this.stats.skipped++;
        }
        seen.add(comment.key);
        this.stats.processed++;
        stalled = 0;
        this.updateStatus();
        if (this.stats.success >= maxCount) break;
        await this.safeDelay(Math.max(3, Number(options.speedSec) || 10) * 1000);
      }
      if (stalled >= 5) this.log('Yeni ve kimliği doğrulanabilir yorum bulunamadı. Yorum listesini açıp yükleyin; başka kalp düğmelerine tıklanmadı.', 'warning');
    }

    async startReelsAutoLikeRunner(options = {}) {
      this.isRunning = true;
      this.currentTask = 'Reels Beğenme';
      const maxCount = Math.max(1, Math.min(250, Number(options.maxLikeCount) || 30));
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0, targetTotal: maxCount };
      const seen = new Set();
      let stalled = 0;
      while (this.isRunning && this.stats.success < maxCount && stalled < 5) {
        this.assertActive(); this.assertContentType('reels');
        const reel = this.findActiveReel();
        if (!reel) { stalled++; this.updateStatus('Aktif video ve beğeni düğmesi aranıyor (' + stalled + '/5)...'); await this.safeDelay(1500); continue; }
        const {key,button} = reel;
        if (seen.has(key)) { await this.advanceReel(key); continue; }
        if (button && !reel.liked) {
          if (!button) { stalled++; await this.safeDelay(1500); continue; }
          await this.reserveAction('like'); this.assertActive();
          if (this.findActiveReel()?.key !== key) continue;
          button.click();
          let confirmed = false;
          for (let n = 0; n < 20; n++) { await CORE.sleep(200, this.controller.signal); const active=this.findActiveReel(); if (active?.key === key && active.liked) { confirmed = true; break; } }
          if (!confirmed) throw new Error('INVALID_RESPONSE: Beğeni doğrulanamadı; görev durduruldu.');
          this.stats.success++;
          this.log('❤️ Reels beğenildi (' + this.stats.success + '/' + maxCount + ').', 'success');
          await chrome.runtime.sendMessage({type:'UPDATE_STATS', metric:'like', accountId:this.taskAccount});
        } else if (reel.liked) { this.stats.skipped++; this.log('Önceden beğenilmiş video atlandı.'); }
        else { stalled++; await this.safeDelay(1500); continue; }
        seen.add(key); this.stats.processed++; stalled = 0; this.updateStatus();
        if (this.stats.success >= maxCount) break;
        const currentSpeed = window.__codumPostSpeedSec ? Number(window.__codumPostSpeedSec) : (Number(options.speedSec) || 3);
        await this.safeDelay(Math.max(1, currentSpeed) * 1000);
        this.updateStatus('Sonraki Reels yükleniyor...');
        await this.advanceReel(key);
      }
      if (stalled >= 5) this.log('Video değişmedi veya hedef bulunamadı; görev durduruldu.', 'warning');
    }

    // =========================================================================
    // 5.2 OTOMATİK YORUM MOTORU (COMMENT)
    // =========================================================================
    async startCommentTask(mediaList, templates = [], options = {}) {
      if (this.isRunning) return;
      this.isRunning = true;
      this.currentTask = 'Yorum Yapma';
      const maxCount = Number(options.maxCommentCount) || 20;
      this.stats = { processed: 0, success: 0, skipped: 0, failed: 0, targetTotal: mediaList.length, maxCount };
      this.log(`💬 Yorum motoru başlatıldı. Toplam hedef: ${mediaList.length}`, 'info');

      try {
        for (let i = 0; i < mediaList.length; i++) {
          if (!this.isRunning) break;
          if (this.stats.success >= maxCount) {
            this.log(`🎯 Belirlenen yorum sınırına (${maxCount}) ulaşıldı.`, 'success');
            break;
          }

          // Günlük güvenlik limiti
          const canComment = await this.checkDailyLimit('comment');
          if (!canComment) break;

          const target = mediaList[i];
          const mediaId = typeof target === 'string' ? target : (target.id || target.shortcode);
          const commentText = typeof target === 'object' && typeof target.commentText === 'string' ? target.commentText : templates[Math.floor(Math.random() * templates.length)];
          if (!commentText?.trim()) throw new Error('Yorum metni gerekli.');

          this.stats.processed++;
          this.updateStatus(`Yorum gönderiliyor: ${i + 1}/${mediaList.length}`);

          try {
            await this.reserveAction('comment');
            this.assertActive();
            const result = await this.api.postComment(mediaId, commentText);
            if (result?.status !== 'ok' || !result.comment?.pk) throw new Error('INVALID_RESPONSE: Yorum sonucu doğrulanamadı.');
            this.stats.success++;
            this.log(`💬 Yorum yapıldı (${mediaId}): "${commentText}"`, 'success');
            chrome.runtime.sendMessage({ type: 'UPDATE_STATS', metric: 'comment', accountId: this.taskAccount, count: 1 }).catch(() => {});
          } catch (commErr) {
            this.log(`❌ Yorum yapılamadı (${mediaId}): ${commErr.message}`, 'error');
            this.stats.failed++;
            this.stop('Yorum durduruldu: ' + commErr.message);
            break;
          }

          if (i + 1 < mediaList.length && this.stats.success < maxCount) await this.safeDelay(Math.max(5,Number(options.commentSpeedSec) || 25)*1000,5000);
        }
      } finally {
        this.stop('Yorum görevi tamamlandı.');
      }
    }
  }

  // =========================================================================
  // 6. AKIŞ TEMİZLEYİCİ (REKLAM & ÖNERİ ENGELLEYİCİ)
  // =========================================================================
  class CleanFeedEngine {
    constructor() {
      this.hideAds = true;
      this.hideSuggested = true;
      this.observer = null;
    }

    start(hideAds = true, hideSuggested = true) {
      this.hideAds = hideAds;
      this.hideSuggested = hideSuggested;

      // Önceki işaretleri ve stilleri temizle, böylece ayar değişince yeniden değerlendirilir
      document.querySelectorAll('article[data-codum-checked]').forEach(a => {
        if (a.dataset.codumHidden) { a.style.setProperty('display', a.dataset.codumOriginalDisplay || '', a.dataset.codumOriginalPriority || ''); delete a.dataset.codumHidden; }
        delete a.dataset.codumChecked;
      });
      document.querySelectorAll('[data-codum-hidden-sidebar]').forEach(el => {
        el.style.setProperty('display',el.dataset.codumOriginalDisplay || '',el.dataset.codumOriginalPriority || '');
        delete el.dataset.codumHiddenSidebar;
      });

      this.scanFeed();

      if (!this.observer) {
        this.observer = new MutationObserver(() => {
          clearTimeout(this.scanTimer); this.scanTimer = setTimeout(() => this.scanFeed(),150);
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
      }
    }

    scanFeed() {
      try {
        // Instagram reuses cards; restore our changes before classifying current content.
        document.querySelectorAll('[data-codum-hidden], [data-codum-hidden-sidebar]').forEach(el => {
          el.style.setProperty('display',el.dataset.codumOriginalDisplay || '',el.dataset.codumOriginalPriority || '');
          delete el.dataset.codumHidden; delete el.dataset.codumHiddenSidebar;
        });
        // Yalnızca Instagram anasayfasındayken çalış (profil veya keşfet sayfalarını etkileme)
        const path = window.location.pathname;
        if (path !== '/' && path !== '') return;

        // 1. Akıştaki Gönderiler (Articles)
        const articles = document.querySelectorAll('main article, article');
        articles.forEach(article => {
          

          // 1. Sponsorlu Reklam Kontrolü
          if (this.hideAds) {
            const hasSponsoredLink = Boolean(article.querySelector('a[href*="/ads/"], a[href*="/about/this-ad/"]'));
            let hasSponsoredText = false;
            
            const headerEl = article.querySelector('header');
            if (headerEl) {
              const hText = (headerEl.innerText || '').toLowerCase();
              hasSponsoredText = hText.includes('sponsorlu') || hText.includes('sponsored');
            }

            if (hasSponsoredLink || hasSponsoredText) {
              article.dataset.codumChecked = 'true';
              if (!article.dataset.codumHidden) {
                article.dataset.codumOriginalDisplay = article.style.getPropertyValue('display');
                article.dataset.codumOriginalPriority = article.style.getPropertyPriority('display');
              }
              article.dataset.codumHidden = 'true';
              article.style.setProperty('display', 'none', 'important');
              return;
            }
          }

          // 2. Önerilen Gönderi Kontrolü
          if (this.hideSuggested) {
            const headerEl = article.querySelector('header');
            if (headerEl) {
              const hText = (headerEl.innerText || '').toLowerCase();
              if (hText.includes('senin için önerilenler') ||
                  hText.includes('sizin için önerilenler') ||
                  hText.includes('suggested for you')) {
                article.dataset.codumChecked = 'true';
                article.dataset.codumOriginalDisplay = article.style.getPropertyValue('display');
                article.dataset.codumOriginalPriority = article.style.getPropertyPriority('display');
                article.dataset.codumHidden = 'true';
                article.style.setProperty('display', 'none', 'important');
                return;
              }
            }
          }

          // Normal gönderi
          article.dataset.codumChecked = 'true';
        });

        // 2. Sağ Sidebar "Sizin için önerilenler" kutusu
        if (this.hideSuggested) {
          const sidebarHeadings = document.querySelectorAll('div[role="complementary"] h2, div[role="complementary"] span');
          sidebarHeadings.forEach(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            if (txt === 'sizin için önerilenler' || txt === 'senin için önerilenler' || txt === 'suggested for you') {
              const box = el.closest('div[style*="max-width"]') || el.parentElement?.parentElement;
              if (box && !box.querySelector('main') && !box.querySelector('nav')) {
                if (!box.dataset.codumHiddenSidebar) { box.dataset.codumOriginalDisplay = box.style.getPropertyValue('display'); box.dataset.codumOriginalPriority = box.style.getPropertyPriority('display'); }
                box.dataset.codumHiddenSidebar = 'true';
                box.style.setProperty('display', 'none', 'important');
              }
            }
          });
        }
      } catch (e) {
        console.debug('[CODUM CleanFeed] scan error:', e);
      }
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      clearTimeout(this.scanTimer);
      document.querySelectorAll('article[data-codum-checked]').forEach(a => {
        if (a.dataset.codumHidden) { a.style.setProperty('display', a.dataset.codumOriginalDisplay || '', a.dataset.codumOriginalPriority || ''); delete a.dataset.codumHidden; }
        delete a.dataset.codumChecked;
      });
      document.querySelectorAll('[data-codum-hidden-sidebar]').forEach(el => {
        el.style.setProperty('display',el.dataset.codumOriginalDisplay || '',el.dataset.codumOriginalPriority || '');
        delete el.dataset.codumHiddenSidebar;
      });
    }
  }

  // =========================================================================
  // 7. MEDYA İNDİRİCİ (HD DOWNLOADER)
  // =========================================================================
  class MediaDownloader {
    constructor() {
      this.api = typeof InstagramApiClient !== 'undefined' ? new InstagramApiClient() : (root.InstagramApiClient ? new root.InstagramApiClient() : null);
      this.injectDownloadButtons();
      this.initObserver();
    }

    initObserver() {
      const observer = new MutationObserver(() => { clearTimeout(this.scanTimer); this.scanTimer = setTimeout(() => this.injectDownloadButtons(),150); });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    injectDownloadButtons() {
      if (this.enabled === false) return;
      const articles = [...document.querySelectorAll('article')];
      if (/^\/(stories|reels?)\//.test(window.location.pathname)) {
        for (const video of document.querySelectorAll('video')) {
          const host = video.closest('[role="dialog"],section[role="region"]') || video.parentElement;
          if (host && !host.closest('article') && !articles.includes(host)) articles.push(host);
        }
      }
      articles.forEach(article => {
        if (article.querySelector('.codum-action-download-btn')) return;

        const actionSection = article.querySelector('section') || (article.tagName !== 'ARTICLE' ? article : null);
        if (!actionSection) return;

        // Instagram'ın Like, Comment, Repost, Share ikonlarının bulunduğu div satırı
        const likeIcon = actionSection.querySelector('svg[aria-label*="Beğen"], svg[aria-label*="Like"], svg[aria-label*="Yorum"], svg[aria-label*="Comment"]');
        const iconRow = likeIcon ? (likeIcon.closest('div')?.parentElement || likeIcon.closest('div')) : (actionSection.querySelector('div') || actionSection);

        const btn = document.createElement('div');
        btn.className = 'codum-action-download-btn';
        if (article.tagName !== 'ARTICLE') btn.classList.add('codum-video-download');
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.title = 'CODUM: Görünen Medyayı İndir';

        btn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="codumDlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981"/>
                <stop offset="100%" stop-color="#059669"/>
              </linearGradient>
            </defs>
            <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="url(#codumDlGrad)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 3V15M12 15L7.5 10.5M12 15L16.5 10.5" stroke="url(#codumDlGrad)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.downloadArticleMedia(article, btn).catch(error => { btn.title = error.message; alert(error.message); });
        });

        if (iconRow) {
          iconRow.appendChild(btn);
        } else {
          actionSection.appendChild(btn);
        }
      });
    }

    async downloadArticleMedia(article, btnEl = null) {
      if (btnEl) {
        btnEl.style.transform = 'scale(1.25)';
        setTimeout(() => { if (btnEl) btnEl.style.transform = ''; }, 300);
      }

      const video = article.querySelector('video');
      if (video) {
        let source = video.currentSrc || video.src || video.querySelector('source')?.src;

        // Blob ise doğrudan DOM / React Fiber / API üzerinden gerçek MP4 adresini bul
        if (!source || source.startsWith('blob:')) {
          // 1. React Props & Fiber araması
          const findVideoInReact = (el) => {
            if (!el) return null;
            try {
              for (const k in el) {
                if (k.startsWith('__reactFiber') || k.startsWith('__reactProps') || k.startsWith('__reactInternalInstance')) {
                  let curr = el[k];
                  let d = 0;
                  while (curr && d < 45) {
                    const p = curr.memoizedProps || curr.pendingProps || curr;
                    const candidates = [
                      p?.videoUrl,
                      p?.video_url,
                      p?.src,
                      p?.item?.video_versions?.[0]?.url,
                      p?.post?.video_versions?.[0]?.url,
                      p?.media?.video_versions?.[0]?.url,
                      p?.video_versions?.[0]?.url
                    ];
                    for (const c of candidates) {
                      if (c && typeof c === 'string' && c.startsWith('http') && !c.startsWith('blob:')) {
                        return c;
                      }
                    }
                    curr = curr.return || curr.child || curr.sibling;
                    d++;
                  }
                }
              }
            } catch (_) {}
            return null;
          };

          source = findVideoInReact(video) || findVideoInReact(article);

          // 2. Shortcode ve API üzerinden MP4 url çözme
          if (!source) {
            const link = article.querySelector('a[href*="/p/"], a[href*="/reel/"], a[href*="/reels/"]') || 
                         document.querySelector('a[href*="/p/"], a[href*="/reel/"], a[href*="/reels/"]');
            const match = (link?.getAttribute('href') || window.location.pathname).match(/\/(?:p|reels?|tv)\/([\w-]+)/);
            if (match && match[1]) {
              const shortcode = match[1];
              try {
                const apiInstance = this.api || (typeof InstagramApiClient !== 'undefined' ? new InstagramApiClient() : (window.InstagramApiClient ? new window.InstagramApiClient() : null));
                const numericId = apiInstance ? apiInstance.shortcodeToMediaId(shortcode) : (window.__shortcodeToMediaId ? window.__shortcodeToMediaId(shortcode) : null);
                if (numericId) {
                  const infoRes = await (apiInstance ? apiInstance.request(`https://www.instagram.com/api/v1/media/${numericId}/info/`) : fetch(`https://www.instagram.com/api/v1/media/${numericId}/info/`, { headers: { 'x-ig-app-id': '936619743392459' } }).then(r => r.json()));
                  const vUrl = infoRes?.items?.[0]?.video_versions?.[0]?.url;
                  if (vUrl) source = vUrl;
                }
              } catch (_) {}

              // Fallback: ?__a=1&__d=dis
              if (!source) {
                try {
                  const fallbackRes = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
                    headers: { 'x-ig-app-id': '936619743392459' }
                  }).then(r => r.json());
                  const vUrl = fallbackRes?.items?.[0]?.video_versions?.[0]?.url || fallbackRes?.graphql?.shortcode_media?.video_url;
                  if (vUrl) source = vUrl;
                } catch (_) {}
              }
            }
          }

          // 3. Performance Resource Timing Cache'den MP4 taraması
          if (!source && window.performance) {
            try {
              const resources = window.performance.getEntriesByType('resource');
              const videoEntries = resources.filter(r => (r.name.includes('.mp4') || (r.name.includes('cdninstagram.com') && r.initiatorType === 'video')) && !r.name.includes('blob:'));
              if (videoEntries.length > 0) {
                source = videoEntries[videoEntries.length - 1].name;
              }
            } catch (_) {}
          }
        }

        if (!source || source.startsWith('blob:')) {
          throw new Error('Video doğrudan MP4 adresi bulunamadı. Lütfen videoyu 1 saniye oynatıp tekrar indirmeyi deneyin.');
        }

        const result = await chrome.runtime.sendMessage({
          type: 'DOWNLOAD_FILE',
          url: source,
          filename: 'codum_instagram_video_' + Date.now() + '.mp4'
        });
        if (!result?.ok) throw new Error(result?.error || 'Video indirmesi başlatılamadı.');
        return;
      }

      // 2. Yüksek Çözünürlüklü Resim Ara (Çoklu kaydırmalı gönderiler dahil)
      const imgs = Array.from(article.querySelectorAll('img')).filter(im => {
        if (!im.src || im.src.includes('profile')) return false;
        const r = im.getBoundingClientRect();
        return (r.width > 150 && r.height > 150) || im.width > 200;
      });

      // Görünür olan aktif slaytı seç
      let targetImg = imgs.find(im => {
        const r = im.getBoundingClientRect();
        return r.left >= 0 && r.right <= (window.innerWidth || document.documentElement.clientWidth);
      }) || imgs[0] || article.querySelector('img[style*="object-fit"], img');

      if (targetImg && targetImg.src) {
        let bestUrl = targetImg.src;
        if (targetImg.srcset) {
          const parts = targetImg.srcset.split(',');
          const highest = parts.map(p => p.trim().split(/\s+/)).sort((a,b) => parseFloat(b[1] || '0') - parseFloat(a[1] || '0'))[0]?.[0];
          if (highest) bestUrl = highest;
        }

        const result = await chrome.runtime.sendMessage({type:'DOWNLOAD_FILE',url:bestUrl,filename:'codum_instagram_image_'+Date.now()+'.jpg'});
        if (!result?.ok) throw new Error(result?.error || 'Görsel indirmesi başlatılamadı.');
      } else throw new Error('İndirilebilir medya bulunamadı.');
    }


  }

  for (const method of ['startFollowTask', 'startUnfollowTask', 'startCommentTask', 'startReelsAutoLikeRunner', 'startPostAutoLikeRunner', 'startStoryAutoLikeRunner', 'startCommentLikeRunner', 'scrapeUserList']) {
    const original = InstagramEngine.prototype[method];
    InstagramEngine.prototype[method] = async function(...args) {
      if (this.busy) throw new Error('Önce çalışan görevi durdurun ve tamamlanmasını bekleyin.');
      this.busy = true;
      this.controller = new AbortController();
      this.taskAccount = this.api.getUserId();
      this.api.accountId = this.taskAccount;
      this.api.signal = this.controller.signal;
      this.api.assertActive = () => this.assertActive();
      this.updateStatus('Görev hazırlanıyor...');
      let acquired = false;
      try {
        if (!this.taskAccount) throw new Error('LOGIN_REQUIRED: Önce Instagram hesabınıza giriş yapın.');
        const lock = await chrome.runtime.sendMessage({type:'ACQUIRE_TASK', accountId:this.taskAccount, readOnly:method === 'scrapeUserList'});
        if (!lock?.ok) throw new Error(lock?.error || 'Görev kilidi alınamadı.');
        acquired = true;
        this.lockId = lock.lockId;
        this.heartbeat = setInterval(() => chrome.runtime.sendMessage({type:'RENEW_TASK', accountId:this.taskAccount, lockId:this.lockId}).then(r => { if (!r?.ok) this.stop('Görev kilidi kaybedildi.'); }).catch(() => this.stop('Bağlantı kesildi.')), 20000);
        this.assertActive();
        // Original action methods initialize their own state; the scraper needs it here.
        this.isRunning = method === 'scrapeUserList';
        return await original.apply(this, args);
      } catch (error) {
        if (error.name !== 'AbortError') this.log(error.message, 'error');
        if (method === 'scrapeUserList') {
          const result = []; Object.assign(result, {completed:false, hasMore:true, stopped:this.controller.signal.aborted, error:error.message}); return result;
        }
      } finally {
        clearInterval(this.heartbeat);
        if (acquired) await chrome.runtime.sendMessage({type:'RELEASE_TASK', accountId:this.taskAccount, lockId:this.lockId}).catch(() => {});
        this.isRunning = false; this.busy = false; this.api.signal = undefined; this.api.assertActive = undefined; this.api.accountId = undefined;
        this.updateStatus();
      }
    };
  }

  root.InstagramEngine = InstagramEngine;
  root.InstagramApiClient = InstagramApiClient;
  root.CleanFeedEngine = CleanFeedEngine;
  root.MediaDownloader = MediaDownloader;
})(typeof window !== 'undefined' ? window : globalThis);


  // =========================================================================
  // 9. MODERN DOCK & FLYOUT PANEL ARAYÜZÜ
  // =========================================================================
  /* CODUM İNSTAGRAM ARAÇLARI - In-Page Dock & Interactive UI Controller */
(function(root) {
  'use strict';

  const CORE = root.CodumCore;
  let engine = null;
  let cleanFeed = null;
  let downloader = null;

  let dockContainer = null;
  let activeToolId = null;

  function init() {
    if (document.getElementById('codum-instagram-dock')) return;

    engine = new root.InstagramEngine();
    cleanFeed = new root.CleanFeedEngine();
    downloader = new root.MediaDownloader();

    // 1. Ayarları yükle ve Temiz Akış motorunu başlat
    chrome.storage.local.get(['codum_settings'], (res) => {
      const s = res.codum_settings || {};
      window.__codumAutoLikeStories = s.autoLikeStories === true;
      if (s.hideFeedAds !== false || s.hideSuggestedPosts !== false) {
        cleanFeed.start(s.hideFeedAds !== false, s.hideSuggestedPosts !== false);
      }
    });

    // 2. Dock Container Oluştur
    dockContainer = document.createElement('div');
    dockContainer.id = 'codum-instagram-dock';
    dockContainer.className = 'codum-dock-container';
    dockContainer.setAttribute('data-corner', 'top-right');

      // Instagram'ın dış tıklama (outside-click) dinleyicisinin yorum ve diyalog pencerelerini kapatmasını engelle
      ['mousedown', 'pointerdown', 'click', 'touchstart'].forEach(evt => {
        dockContainer.addEventListener(evt, (e) => e.stopPropagation());
      });

    // HTML İskeleti (Onaylanan 1. Tasarım + Açılır Kapanır Master Knob)
    dockContainer.innerHTML = `
      <!-- Yana Açılan Koyu Cam Kart (Flyout Card) -->
      <div class="codum-flyout-card" id="codumFlyoutCard">
        <div class="codum-card-header">
          <span class="codum-card-title" id="flyoutTitle">Araç Başlığı</span>
          <button type="button" class="codum-card-close" id="flyoutCloseBtn">✕</button>
        </div>
        <div id="flyoutBody">
          <!-- Dinamik araç içeriği buraya basılır -->
        </div>
      </div>

      <!-- Dikey Dock Bar -->
      <div class="codum-dock-bar" id="codumDockBar">
        <!-- Master Siyah Kutu (Tıklandığında açılır/kapanır, sürüklendiğinde 4 köşeye yapışır) -->
        <div class="codum-master-knob" id="codumMasterKnob" title="Tıkla: Aç/Kapat | Sürükle: Köşelere Taşı">
          <span>CODUM</span>
          <span class="codum-knob-dot"></span>
        </div>

        <!-- Açılır Araç Rayı -->
        <div class="codum-tools-rail" id="codumToolsRail">
          <div class="codum-tool-item" data-tool="follow" title="Otomatik Takip Motoru">
            <span class="codum-tool-icon">👥</span>
            <span>Takip</span>
          </div>

          <div class="codum-tool-item" data-tool="unfollow" title="Akıllı Takipten Çıkma (Geri Takip Etmeyenler)">
            <span class="codum-tool-icon">🚪</span>
            <span>Takipten Çık</span>
          </div>

          <div class="codum-tool-item" data-tool="like_comment" title="Otomatik Beğeni ve Yorum">
            <span class="codum-tool-icon">❤️</span>
            <span>Beğeni/Yorum</span>
          </div>

          <div class="codum-tool-item" data-tool="story_ghost" title="Hikaye İzleme & Hayalet Modu">
            <span class="codum-tool-icon">👁️</span>
            <span>Hikaye</span>
          </div>

          <div class="codum-tool-item" data-tool="scraper" title="Toplu Kullanıcı Listesi Dışa Aktarma (Lead Scraper)">
            <span class="codum-tool-icon">📋</span>
            <span>Liste Aktar</span>
          </div>

          <div class="codum-tool-item" data-tool="clean_feed" title="Temiz Akış: Reklam ve Keşfet Gönderilerini Gizleme">
            <span class="codum-tool-icon">🛡️</span>
            <span>Temiz Akış</span>
          </div>

          <div class="codum-tool-item" data-tool="settings" title="Güvenlik Sınırları & Ayarlar">
            <span class="codum-tool-icon">⚙️</span>
            <span>Ayarlar</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dockContainer);

    // Event Bağlantıları
    bindDockEvents();
    setupDraggableSnap(dockContainer);
    initProfileBadgeWatcher();
    initStoryAutoLikeWatcher();

    // Engine Canlı Durum ve İlerleme Olayları
    engine.setLogHandler(({ message, type }) => {
      const logEl = document.getElementById('flyoutLiveStatus');
      if (logEl) {
        logEl.textContent = message;
        logEl.style.color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
      }
    });

    engine.setStatusHandler(({ isRunning, stats, info, task }) => {
      const progBar = document.getElementById('flyoutProgressFill');
      const progText = document.getElementById('flyoutProgressText');
      if (progBar && progText) {
        const total = (stats.success + stats.skipped + stats.failed) || 1;
        const pct = Math.min(100, Math.round((stats.success / total) * 100));
        progBar.style.width = `${pct}%`;
        progText.textContent = `İlerleme: %${pct} - ${stats.success} işlem yapıldı`;
      }

      // Sol Dock Araç Çubuğundaki İlgili Butonu Canlı DURDUR (count) Olarak Güncelle
      const currentTask = task || engine.currentTask || '';
      let runningTool = null;
      if (isRunning) {
        if (currentTask.includes('Takipten')) runningTool = 'unfollow';
        else if (currentTask.includes('Takip')) runningTool = 'follow';
        else runningTool = 'like_comment';
      }

      const defaultToolMeta = {
        follow: { icon: '👥', label: 'Takip' },
        unfollow: { icon: '🚪', label: 'Takipten Çık' },
        like_comment: { icon: '❤️', label: 'Beğeni/Yorum' },
        story_ghost: { icon: '👁️', label: 'Hikaye' },
        scraper: { icon: '📋', label: 'Liste Aktar' },
        clean_feed: { icon: '🛡️', label: 'Temiz Akış' },
        settings: { icon: '⚙️', label: 'Ayarlar' }
      };

      document.querySelectorAll('.codum-tool-item').forEach(item => {
        const t = item.dataset.tool;
        const iconEl = item.querySelector('.codum-tool-icon');
        const textEl = item.querySelector('span:not(.codum-tool-icon)');
        const meta = defaultToolMeta[t];

        if (isRunning && t === runningTool) {
          item.classList.add('codum-running-pulse');
          if (iconEl) iconEl.textContent = '⏹️';
          const successCount = (stats && stats.success) || 0;
          if (textEl) textEl.innerHTML = `<span style="color:#ffffff;font-weight:800;letter-spacing:0.5px;">DURDUR (${successCount})</span>`;
          item.setAttribute('title', `${currentTask || 'İşlem'} Sürüyor (Tıkla ve Penceresiz Durdur)`);
        } else if (meta) {
          item.classList.remove('codum-running-pulse');
          if (iconEl) iconEl.textContent = meta.icon;
          if (textEl) textEl.textContent = meta.label;
          item.setAttribute('title', meta.label);
        }
      });

      // Panel açıkken acil durdur bannerı varsa güncelle
      const emergencyBanner = document.getElementById('codumEmergencyStopBanner');
      if (emergencyBanner) {
        emergencyBanner.style.display = isRunning ? 'flex' : 'none';
        const successCountEl = document.getElementById('codumEmergencySuccessCount');
        if (successCountEl && stats) {
          successCountEl.textContent = `${stats.success || 0} adet`;
        }
        const taskNameEl = document.getElementById('codumEmergencyTaskName');
        if (taskNameEl && task) {
          taskNameEl.textContent = task;
        }
      }

      if (!isRunning) {
        const btnRun = document.getElementById('btnRunUnfollow');
        if (btnRun) {
          btnRun.disabled = false;
          btnRun.textContent = 'Taramayı Başlat';
          btnRun.style.opacity = '1';
          btnRun.style.background = '';
        }
        const btnRunReels = document.getElementById('btnRunReelsLike');
        if (btnRunReels) {
          btnRunReels.disabled = false;
          btnRunReels.textContent = '▶ Reels Beğeniyi Başlat';
          btnRunReels.style.opacity = '1';
        }
      }
    });
  }

  // Araç Kartı Açma / Kapatma
  function bindDockEvents() {
    const flyout = document.getElementById('codumFlyoutCard');
    const closeBtn = document.getElementById('flyoutCloseBtn');

    function closeFlyout() {
      if (flyout) flyout.classList.remove('active');
      document.querySelectorAll('.codum-tool-item').forEach(b => b.classList.remove('active'));
      activeToolId = null;
    }

    function showCodumToast(message) {
      let toast = document.getElementById('codumToastNotification');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'codumToastNotification';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('active');
      clearTimeout(window.__codumToastTimer);
      window.__codumToastTimer = setTimeout(() => {
        if (toast) toast.classList.remove('active');
      }, 2500);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeFlyout();
      });
    }

    // Escape tuşu ile anında kapatma
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && flyout && flyout.classList.contains('active')) {
        closeFlyout();
      }
    });

    // Dışarı tıklayınca paneli kapatma
    document.addEventListener('click', (e) => {
      const dock = document.getElementById('codum-instagram-dock');
      if (flyout && flyout.classList.contains('active') && dock && !dock.contains(e.target)) {
        closeFlyout();
      }
    });

    document.querySelectorAll('.codum-tool-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const tool = item.dataset.tool;

        // 1. Canlı Çalışan İşlemi Tek Tıkla Penceresiz Anında Durdurma
        const isPulse = item.classList.contains('codum-running-pulse');
        const isRunning = engine && engine.isRunning;
        let isCurrentEngineTool = false;
        if (isRunning) {
          const t = engine.currentTask || '';
          if (t.includes('Takipten') && tool === 'unfollow') isCurrentEngineTool = true;
          else if (t.includes('Takip') && !t.includes('Takipten') && tool === 'follow') isCurrentEngineTool = true;
          else if ((t.includes('Beğen') || t.includes('Yorum') || t.includes('Reels') || t.includes('Gönderi') || !t) && tool === 'like_comment') isCurrentEngineTool = true;
        }

        if (isPulse || isCurrentEngineTool) {
          const taskName = engine.currentTask || 'İşlem';
          const successCount = (engine.stats && engine.stats.success) || 0;
          engine.stop('Kullanıcı dock üzerinden işlemi durdurdu.');

          // Butonları hemen varsayılan durumlarına döndür
          const defaultToolMeta = {
            follow: { icon: '👥', label: 'Takip' },
            unfollow: { icon: '🚪', label: 'Takipten Çık' },
            like_comment: { icon: '❤️', label: 'Beğeni/Yorum' },
            story_ghost: { icon: '👁️', label: 'Hikaye' },
            scraper: { icon: '📋', label: 'Liste Aktar' },
            clean_feed: { icon: '🛡️', label: 'Temiz Akış' },
            settings: { icon: '⚙️', label: 'Ayarlar' }
          };
          document.querySelectorAll('.codum-tool-item').forEach(b => {
            b.classList.remove('codum-running-pulse');
            const meta = defaultToolMeta[b.dataset.tool];
            if (meta) {
              const ic = b.querySelector('.codum-tool-icon');
              const tx = b.querySelector('span:not(.codum-tool-icon)');
              if (ic) ic.textContent = meta.icon;
              if (tx) tx.textContent = meta.label;
              b.setAttribute('title', meta.label);
            }
          });

          // Üstte Şık Bildirim (Toast)
          showCodumToast(`🛑 ${taskName} anında durduruldu (${successCount} işlem yapıldı)`);
          if (flyout && flyout.classList.contains('active') && activeToolId) {
            renderFlyoutContent(activeToolId);
          }
          return;
        }

        // 2. Normal Araç Kartı Açma / Kapatma
        if (activeToolId === tool) {
          closeFlyout();
          return;
        }

        document.querySelectorAll('.codum-tool-item').forEach(b => b.classList.remove('active'));
        item.classList.add('active');
        activeToolId = tool;
        renderFlyoutContent(tool);
        if (flyout) flyout.classList.add('active');
      });
    });
  }

  // Dinamik Araç Kartı İçerikleri
  function renderFlyoutContent(tool) {
    const title = document.getElementById('flyoutTitle');
    const body = document.getElementById('flyoutBody');

    if (tool === 'unfollow') {
      title.textContent = '🚪 Takipten Çık (Akıllı)';
      body.innerHTML = `
        <div class="codum-row">
          <span>Geri Takip Etmeyenleri Filtrele:</span>
          <label class="codum-toggle-switch">
            <input type="checkbox" id="unfToggleNonFollowers" checked>
            <span class="codum-slider"></span>
          </label>
        </div>
        <div class="codum-row">
          <span>Çıkarmadan Önce Bana Sor:</span>
          <label class="codum-toggle-switch">
            <input type="checkbox" id="unfAskBefore" checked>
            <span class="codum-slider"></span>
          </label>
        </div>
        <div class="codum-row vertical">
          <span>🛡️ Beyaz Liste (Asla Çıkarılmayacaklar):</span>
          <textarea class="codum-input-textarea" id="unfWhitelist" placeholder="arkadas1, guvenli_hesap, marka"></textarea>
        </div>
        <div class="codum-row">
          <span>Çıkarma Hızı (5 Kademe):</span>
          <select class="codum-input-text" id="unfSpeedPreset" style="width:145px;font-size:11px;">
            <option value="60">🐢 1. Çok Yavaş (60s)</option>
            <option value="45">🛡️ 2. Yavaş (45s)</option>
            <option value="30" selected>⚡ 3. Normal (30s)</option>
            <option value="20">🚀 4. Hızlı (20s)</option>
            <option value="12">🔥 5. Turbo (12s)</option>
          </select>
        </div>

        <!-- Önizleme ve Seçim Alanı -->
        <div id="unfPreviewSection" style="display:none;flex-direction:column;gap:6px;margin-top:6px;">
          <div class="codum-list-toolbar">
            <span id="unfSelectedCount" style="font-size:12px;font-weight:700;color:#38bdf8;">0 hesap seçildi</span>
            <div style="display:flex;gap:4px;">
              <button type="button" class="codum-small-btn" id="unfSelectAll">Tümünü Seç</button>
              <button type="button" class="codum-small-btn" id="unfDeselectAll">Temizle</button>
            </div>
          </div>
          <input type="text" class="codum-input-text" id="unfSearchBox" placeholder="Listede ara..." style="margin-bottom:4px;font-size:12px;">
          <div class="codum-user-list-container" id="unfUserListContainer"></div>
        </div>

        <div style="margin-top:6px;">
          <div id="flyoutProgressText" style="font-size:12px;font-weight:600;color:#f5f5f7;">İlerleme: Hazır</div>
          <div class="codum-progress-track">
            <div class="codum-progress-fill" id="flyoutProgressFill"></div>
          </div>
        </div>
        <div id="flyoutLiveStatus" style="font-size:11px;color:#9e9ea7;margin-top:4px;">Durum: Beklemede</div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button type="button" class="codum-action-btn start" id="btnRunUnfollow">Taramayı Başlat</button>
          <button type="button" class="codum-action-btn stop" id="btnStopUnfollow">Durdur</button>
        </div>
      `;

      const btnRun = document.getElementById('btnRunUnfollow');
      const btnStop = document.getElementById('btnStopUnfollow');
      const liveStatus = document.getElementById('flyoutLiveStatus');
      const progText = document.getElementById('flyoutProgressText');
      const progBar = document.getElementById('flyoutProgressFill');
      const previewSec = document.getElementById('unfPreviewSection');
      const listContainer = document.getElementById('unfUserListContainer');
      const countLabel = document.getElementById('unfSelectedCount');
      const searchBox = document.getElementById('unfSearchBox');
      const btnSelectAll = document.getElementById('unfSelectAll');
      const btnDeselectAll = document.getElementById('unfDeselectAll');

      let candidateList = []; // Taranan ve filtrelenen adaylar
      let isWaitingConfirmation = false;

      function updateSelectedBadge() {
        const selectedCount = candidateList.filter(u => u.selected).length;
        countLabel.textContent = `${selectedCount} / ${candidateList.length} hesap seçildi`;
        if (isWaitingConfirmation) {
          btnRun.textContent = `Seçilenleri Çıkar (${selectedCount})`;
          btnRun.disabled = selectedCount === 0;
          btnRun.style.opacity = selectedCount === 0 ? '0.5' : '1';
        }
      }

      function renderUserCheckboxes(filterText = '') {
        listContainer.innerHTML = '';
        const search = filterText.toLowerCase().trim();
        const filtered = candidateList.filter(u => !search || u.username.includes(search) || (u.fullName && u.fullName.toLowerCase().includes(search)));

        if (!filtered.length) {
          listContainer.innerHTML = '<div style="color:#9e9ea7;text-align:center;padding:16px;font-size:12px;">Eşleşen hesap bulunamadı.</div>';
          return;
        }

        filtered.forEach(u => {
          const item = document.createElement('div');
          item.className = `codum-user-item ${u.selected ? 'selected' : ''}`;
          item.innerHTML = `
            <div class="codum-user-info">
              <input type="checkbox" class="codum-user-check" data-username="${u.username}" data-id="${u.id}" ${u.selected ? 'checked' : ''}>
              <div>
                <div class="codum-user-name">@${u.username}</div>
                ${u.fullName ? `<div style="font-size:10px;color:#9e9ea7;">${u.fullName}</div>` : ''}
              </div>
            </div>
            <a href="https://instagram.com/${u.username}" target="_blank" class="codum-profile-link" style="font-size:11px;color:#38bdf8;text-decoration:none;padding:2px 6px;border-radius:4px;">Profile Git ↗</a>
          `;

          const chk = item.querySelector('.codum-user-check');

          // Tıklamada satırın geneline basınca da tik açılıp kapansın (Profil linki hariç)
          item.addEventListener('click', (e) => {
            if (e.target.closest('.codum-profile-link')) return;
            if (e.target !== chk) {
              chk.checked = !chk.checked;
            }
            u.selected = chk.checked;
            item.classList.toggle('selected', u.selected);
            updateSelectedBadge();
          });

          chk.addEventListener('change', () => {
            u.selected = chk.checked;
            item.classList.toggle('selected', u.selected);
            updateSelectedBadge();
          });

          listContainer.appendChild(item);
        });
        updateSelectedBadge();
      }

      btnSelectAll.addEventListener('click', () => {
        candidateList.forEach(u => u.selected = true);
        listContainer.querySelectorAll('.codum-user-check').forEach(c => c.checked = true);
        listContainer.querySelectorAll('.codum-user-item').forEach(el => el.classList.add('selected'));
        updateSelectedBadge();
      });

      btnDeselectAll.addEventListener('click', () => {
        candidateList.forEach(u => u.selected = false);
        listContainer.querySelectorAll('.codum-user-check').forEach(c => c.checked = false);
        listContainer.querySelectorAll('.codum-user-item').forEach(el => el.classList.remove('selected'));
        updateSelectedBadge();
      });

      searchBox.addEventListener('input', (e) => {
        renderUserCheckboxes(e.target.value);
      });

      btnRun.addEventListener('click', async () => {
        // Aşama 2: Kullanıcı listeden seçimini yaptı ve "Seçilenleri Çıkar" dedi
        if (isWaitingConfirmation) {
          const selectedUsers = candidateList.filter(u => u.selected);
          if (!selectedUsers.length) {
            alert('Lütfen takipten çıkarmak istediğiniz en az bir hesap seçin!');
            return;
          }

          const confirmed = confirm(`Seçtiğiniz ${selectedUsers.length} hesap takipten çıkarılacak. Onaylıyor musunuz?`);
          if (!confirmed) return;

          isWaitingConfirmation = false;
          btnRun.textContent = 'Çıkarılıyor...';
          btnRun.disabled = true;

          const speedSec = Number(document.getElementById('unfSpeedPreset')?.value) || Number(document.getElementById('unfSpeed')?.value) || 30;
          const whitelistVal = document.getElementById('unfWhitelist').value;

          engine.startUnfollowTask(selectedUsers, new Set(), {
            unfollowLimit: selectedUsers.length,
            unfollowSpeedSec: speedSec,
            unfollowWhitelist: whitelistVal,
            unfollowMode: 'all' // Zaten sadece çıkarılması onaylananlar gönderildi
          });
          return;
        }

        // Aşama 1: Arka planda sessizce tara
        if (engine.isRunning) return;

        btnRun.disabled = true;
        btnRun.textContent = '⏳ Taranıyor...';
        btnRun.style.opacity = '0.7';

        try {
          const viewerId = engine.api.getUserId();
          const me = await engine.api.getCurrentAccount();
          const targetHandle = viewerId || me?.username || me?.id;
          if (!targetHandle) {
            alert('Instagram oturumu algılanamadı. Lütfen Instagram hesabınıza giriş yaptığınızdan emin olun.');
            btnRun.disabled = false;
            btnRun.textContent = 'Taramayı Başlat';
            btnRun.style.opacity = '1';
            return;
          }

          const askBefore = document.getElementById('unfAskBefore').checked;
          const onlyNonFollowers = document.getElementById('unfToggleNonFollowers').checked;
          const whitelistText = document.getElementById('unfWhitelist').value;
          const whitelist = whitelistText.split(/[\n,]/).map(CORE.cleanUsername).filter(Boolean);

          if (liveStatus) {
            liveStatus.textContent = '🔍 Takip ettiğiniz kişiler taranıyor...';
            liveStatus.style.color = '#38bdf8';
          }
          if (progText) progText.textContent = 'İlerleme: Takip edilenler taranıyor...';
          if (progBar) progBar.style.width = '15%';

          const scrapedFollowing = await engine.scrapeUserList(targetHandle, 'following', 5000);
          if (!scrapedFollowing || !scrapedFollowing.length) {
            alert('Takip ettiğiniz kişiler bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
            btnRun.disabled = false;
            btnRun.textContent = 'Taramayı Başlat';
            btnRun.style.opacity = '1';
            return;
          }

          let followersSet = new Set();
          if (onlyNonFollowers) {
            if (liveStatus) {
              liveStatus.textContent = `🔍 ${scrapedFollowing.length} takip edilen bulundu. Sizi takip edenler taranıyor...`;
              liveStatus.style.color = '#38bdf8';
            }
            if (progBar) progBar.style.width = '35%';

            const followers = await engine.scrapeUserList(targetHandle, 'followers', 5000);
            followers.forEach(f => followersSet.add(f.username.toLowerCase()));
          }

          // Adayları filtrele (Beyaz listedekiler hariç ve sadece geri takip etmeyenler)
          let eligible = scrapedFollowing.filter(u => {
            const clean = (u.username || '').toLowerCase();
            if (whitelist.includes(clean)) return false;
            if (onlyNonFollowers && followersSet.has(clean)) return false;
            return true;
          });

          if (!eligible.length) {
            alert('Tebrikler! Sizi geri takip etmeyen herhangi bir hesap bulunamadı (veya hepsi beyaz listede).');
            btnRun.disabled = false;
            btnRun.textContent = 'Taramayı Başlat';
            btnRun.style.opacity = '1';
            return;
          }

          candidateList = eligible.map(u => ({ ...u, selected: true }));

          if (liveStatus) {
            liveStatus.textContent = `🎯 Tarama bitti: Sizi takip etmeyen ${candidateList.length} kişi bulundu.`;
            liveStatus.style.color = '#10b981';
          }
          if (progBar) progBar.style.width = '50%';

          if (askBefore) {
            // Kullanıcıya sor: Listeyi göster ve seçim yaptır
            isWaitingConfirmation = true;
            previewSec.style.display = 'flex';
            renderUserCheckboxes();
            btnRun.disabled = false;
            btnRun.textContent = `Seçilenleri Çıkar (${candidateList.length})`;
            btnRun.style.opacity = '1';
            btnRun.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
            if (progText) progText.textContent = 'Onay Bekleniyor: Lütfen çıkarmak istediklerinizi seçin';
          } else {
            // Direkt otomatik başlat
            btnRun.textContent = 'İşleniyor...';
            engine.startUnfollowTask(candidateList, new Set(), {
              unfollowLimit: candidateList.length,
              unfollowSpeedSec: Number(document.getElementById('unfSpeedPreset')?.value) || Number(document.getElementById('unfSpeed')?.value) || 30,
              unfollowWhitelist: whitelistText,
              unfollowMode: 'all'
            });
          }
        } catch (err) {
          console.error('[CODUM Unfollow Error]', err);
          if (liveStatus) {
            liveStatus.textContent = `Hata: ${err.message}`;
            liveStatus.style.color = '#ef4444';
          }
          btnRun.disabled = false;
          btnRun.textContent = 'Taramayı Başlat';
          btnRun.style.opacity = '1';
        }
      });

      btnStop.addEventListener('click', () => {
        engine.stop('Kullanıcı durdurdu.');
        isWaitingConfirmation = false;
        btnRun.disabled = false;
        btnRun.textContent = 'Taramayı Başlat';
        btnRun.style.opacity = '1';
        btnRun.style.background = '';
      });
    }

    else if (tool === 'follow') {
      title.textContent = '👥 Akıllı Takip Motoru';
      body.innerHTML = `
        <div class="codum-row">
          <span>Cinsiyet Filtresi:</span>
          <select class="codum-input-text" id="flwGender" style="width:130px;">
            <option value="hepsi">Filtre Yok</option>
            <option value="kadin">Sadece Kadın</option>
            <option value="erkek">Sadece Erkek</option>
          </select>
        </div>
        <div class="codum-row">
          <span>+18 & Spam Kelime Filtresi:</span>
          <label class="codum-toggle-switch">
            <input type="checkbox" id="flwAdult" checked>
            <span class="codum-slider"></span>
          </label>
        </div>
        <div class="codum-row">
          <span>Gizli Hesapları Atla:</span>
          <label class="codum-toggle-switch">
            <input type="checkbox" id="flwPrivate">
            <span class="codum-slider"></span>
          </label>
        </div>
        <div class="codum-row">
          <span>Maksimum Takip:</span>
          <input type="number" class="codum-input-text" id="flwLimit" value="150" style="width:70px;text-align:right;">
        </div>
        <div class="codum-row">
          <span>Takip Hızı (5 Kademe):</span>
          <select class="codum-input-text" id="flwSpeedPreset" style="width:145px;font-size:11px;">
            <option value="60">🐢 1. Çok Yavaş (60s)</option>
            <option value="45">🛡️ 2. Yavaş (45s)</option>
            <option value="30" selected>⚡ 3. Normal (30s)</option>
            <option value="20">🚀 4. Hızlı (20s)</option>
            <option value="12">🔥 5. Turbo (12s)</option>
          </select>
        </div>
        <div id="flyoutLiveStatus" style="font-size:11px;color:#9e9ea7;">Durum: Açık profildeki takipçileri hedefler.</div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button type="button" class="codum-action-btn start" id="btnRunFollow">Takibi Başlat</button>
          <button type="button" class="codum-action-btn stop" id="btnStopFollow">Durdur</button>
        </div>
      `;

      document.getElementById('btnRunFollow').addEventListener('click', async () => {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const user = parts[0] || '';
        if (!user || ['explore', 'reels', 'direct', 'stories'].includes(user)) {
          alert('Lütfen hedef bir kullanıcının profil sayfasına gidin (Örn: instagram.com/hedefkullanici)');
          return;
        }
        const scraped = await engine.scrapeUserList(user, 'followers', 300);
        const followSpeed = Number(document.getElementById('flwSpeedPreset')?.value) || 30;
        engine.startFollowTask(scraped, {
          maxFollowCount: Number(document.getElementById('flwLimit').value) || 150,
          followSpeedSec: followSpeed,
          filterGender: document.getElementById('flwGender').value,
          filterAdult: document.getElementById('flwAdult').checked,
          filterPrivate: document.getElementById('flwPrivate').checked
        });
      });

      document.getElementById('btnStopFollow').addEventListener('click', () => engine.stop());
    }

    else if (tool === 'scraper') {
      title.textContent = '📋 Toplu Kullanıcı Listesi Dışa Aktarma';
      body.innerHTML = `
        <div class="codum-row">
          <span>Liste Türü:</span>
          <select class="codum-input-text" id="scrType" style="width:140px;">
            <option value="followers">Takipçileri Çek</option>
            <option value="following">Takip Edilenleri Çek</option>
          </select>
        </div>
        <div class="codum-row">
          <span>Çekilecek Adet:</span>
          <input type="number" class="codum-input-text" id="scrLimit" value="500" style="width:70px;text-align:right;">
        </div>
        <div id="flyoutLiveStatus" style="font-size:11px;color:#9e9ea7;">Durum: Açık profilden liste oluşturur.</div>
        <button type="button" class="codum-action-btn start" id="btnRunScraper">Listeyi İndir (TXT / JSON)</button>
      `;

      document.getElementById('btnRunScraper').addEventListener('click', async () => {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const user = parts[0] || '';
        if (!user || ['explore', 'reels', 'direct', 'stories'].includes(user)) {
          alert('Lütfen hedef kullanıcının profil sayfasına gidin.');
          return;
        }
        const type = document.getElementById('scrType').value;
        const limit = Number(document.getElementById('scrLimit').value) || 500;
        const list = await engine.scrapeUserList(user, type, limit);
        if (list && list.length > 0) {
          const txtData = list.map(u => `${u.username},${u.full_name || ''}`).join('\n');
          CORE.downloadText(txtData, `${user}_${type}.txt`, 'text/plain');
        } else {
          alert('Kullanıcı listesi çekilemedi.');
        }
      });
    }

    else if (tool === 'clean_feed') {
      title.textContent = '🛡️ Temiz Akış Modu';
      chrome.storage.local.get(['codum_settings'], (res) => {
        const s = res.codum_settings || {};
        body.innerHTML = `
          <div class="codum-row">
            <span>Sponsorlu Reklamları Gizle:</span>
            <label class="codum-toggle-switch">
              <input type="checkbox" id="chkFeedAds" ${s.hideFeedAds !== false ? 'checked' : ''}>
              <span class="codum-slider"></span>
            </label>
          </div>
          <div class="codum-row">
            <span>Önerilen Gönderileri Gizle:</span>
            <label class="codum-toggle-switch">
              <input type="checkbox" id="chkFeedSuggested" ${s.hideSuggestedPosts !== false ? 'checked' : ''}>
              <span class="codum-slider"></span>
            </label>
          </div>
          <p style="font-size:11px;color:#9e9ea7;line-height:1.5;margin-top:6px;">
            Instagram ana sayfanızdaki tüm reklam kartları ve takip etmediğiniz yabancı hesapların keşfet gönderileri anında filtrelenir.
          </p>
        `;

        document.getElementById('chkFeedAds').addEventListener('change', (e) => {
          chrome.storage.local.set({ codum_settings: { ...s, hideFeedAds: e.target.checked } });
          cleanFeed.start(e.target.checked, document.getElementById('chkFeedSuggested').checked);
        });

        document.getElementById('chkFeedSuggested').addEventListener('change', (e) => {
          chrome.storage.local.set({ codum_settings: { ...s, hideSuggestedPosts: e.target.checked } });
          cleanFeed.start(document.getElementById('chkFeedAds').checked, e.target.checked);
        });
      });
    }

    else if (tool === 'story_ghost') {
      title.textContent = '👁️ Hikaye & Hayalet Modu';
      chrome.storage.local.get(['codum_settings'], (res) => {
        const s = res.codum_settings || {};
        body.innerHTML = `
          <div class="codum-row">
            <span>👻 Hayalet Hikaye İzleme (Görüldü Yok):</span>
            <label class="codum-toggle-switch">
              <input type="checkbox" id="chkGhostStories" ${s.ghostModeStories !== false ? 'checked' : ''}>
              <span class="codum-slider"></span>
            </label>
          </div>
          <div class="codum-row">
            <span>👻 DM Görüldüsünü Kapat:</span>
            <label class="codum-toggle-switch">
              <input type="checkbox" id="chkGhostDm" ${s.ghostModeDm !== false ? 'checked' : ''}>
              <span class="codum-slider"></span>
            </label>
          </div>
          <div class="codum-row">
            <span>İzlenen Hikayeleri Otomatik Beğen:</span>
            <label class="codum-toggle-switch">
              <input type="checkbox" id="chkAutoLikeStories" ${s.autoLikeStories === true ? 'checked' : ''}>
              <span class="codum-slider"></span>
            </label>
          </div>
          <p style="font-size:11px;color:#10b981;line-height:1.4;margin-top:4px;">
            ✓ Hayalet modu devredeyken hikayeleri izlersiniz ancak kullanıcı adınız karşı tarafın izleyenler listesine ASLA düşmez.
          </p>
        `;

        document.getElementById('chkGhostStories')?.addEventListener('change', (e) => {
          chrome.runtime.sendMessage({ type: 'SET_GHOST_MODE', enabled: e.target.checked });
          chrome.storage.local.set({ codum_settings: { ...s, ghostModeStories: e.target.checked } });
        });

        document.getElementById('chkGhostDm')?.addEventListener('change', (e) => {
          chrome.storage.local.set({ codum_settings: { ...s, ghostModeDm: e.target.checked } });
        });

        document.getElementById('chkAutoLikeStories')?.addEventListener('change', (e) => {
          window.__codumAutoLikeStories = e.target.checked;
          chrome.storage.local.set({ codum_settings: { ...s, autoLikeStories: e.target.checked } });
        });
      });
    }

    
    else if (tool === 'like_comment') {
      const isRunningNow = engine.isRunning;
      const currentTask = engine.currentTask || 'İşlem';
      title.textContent = isRunningNow ? `⏹️ ${currentTask} (Sürüyor)` : '❤️ Beğeni & Yorum Motorları';

      // Aktif çalışan görevi tespit et
      let initialSub = window.__codumActiveSubTab || 'reels';
      if (engine.isRunning) {
        if (['Gönderi Beğenme', 'Hikaye Beğenme', 'Yorum Beğenme'].includes(engine.currentTask)) {
          initialSub = 'post_story';
        } else if (engine.currentTask === 'Yorum Yapma') {
          initialSub = 'comment';
        } else if (engine.currentTask === 'Reels Beğenme') {
          initialSub = 'reels';
        }
      }

      body.innerHTML = `
        <!-- ACİL DURDUR VE CANLI BİLGİ KARTI (İşlem Varsa En Üstte Çıkar) -->
        <div id="codumEmergencyStopBanner" style="display:${isRunningNow ? 'flex' : 'none'};background:linear-gradient(135deg, rgba(239,68,68,0.32), rgba(185,28,28,0.22));border:1px solid #ef4444;border-radius:10px;padding:8px 10px;margin-bottom:8px;flex-direction:column;gap:6px;box-shadow:0 0 14px rgba(239,68,68,0.3);animation:codumStopPulse 1.5s infinite ease-in-out;">
          <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
            <div>
              <div style="font-weight:700;font-size:11.5px;color:#fff;">🟢 <span id="codumEmergencyTaskName">${currentTask}</span> Çalışıyor</div>
              <div style="font-size:10px;color:#fca5a5;">Başarılı: <span id="codumEmergencySuccessCount">${engine.stats?.success || 0} adet</span></div>
            </div>
            <button type="button" id="btnQuickStopAll" style="background:linear-gradient(135deg, #ef4444, #b91c1c);color:#fff;font-weight:800;border:none;border-radius:7px;padding:6px 14px;font-size:11.5px;cursor:pointer;box-shadow:0 0 10px rgba(239,68,68,0.6);letter-spacing:0.5px;transition:all 0.2s ease;">⏹️ DURDUR</button>
          </div>
          <!-- CANLI HIZ VE OTOMATİK KAYDIRMA KONTROLÜ -->
          <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.12);padding-top:5px;width:100%;">
            <span style="font-size:10px;color:#e2e8f0;font-weight:600;">⚡ Canlı Hız (5 Kademe):</span>
            <div style="display:flex;gap:3px;flex-wrap:wrap;">
              <button type="button" class="codum-speed-chip" data-speed="10" style="padding:2px 5px;font-size:9px;border-radius:5px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;">🐢 10s</button>
              <button type="button" class="codum-speed-chip" data-speed="6" style="padding:2px 5px;font-size:9px;border-radius:5px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;">🛡️ 6s</button>
              <button type="button" class="codum-speed-chip" data-speed="4" style="padding:2px 5px;font-size:9px;border-radius:5px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;">⚡ 4s</button>
              <button type="button" class="codum-speed-chip" data-speed="2.5" style="padding:2px 5px;font-size:9px;border-radius:5px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;">🚀 2.5s</button>
              <button type="button" class="codum-speed-chip" data-speed="1.2" style="padding:2px 5px;font-size:9px;border-radius:5px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;">🔥 1.2s</button>
            </div>
          </div>
        </div>

        <!-- KOMPAKT ÜST SEKMELER -->
        <div style="display:flex;gap:4px;margin-bottom:8px;background:rgba(0,0,0,0.35);padding:3px;border-radius:9px;border:1px solid rgba(255,255,255,0.08);">
          <button type="button" id="tabBtnReels" style="flex:1;padding:5px 0;font-size:11px;border:none;border-radius:7px;cursor:pointer;background:${initialSub === 'reels' ? 'linear-gradient(135deg, #f09433, #dc2743)' : 'transparent'};color:${initialSub === 'reels' ? '#fff' : '#9e9ea7'};font-weight:${initialSub === 'reels' ? '700' : '600'};">⚡ Reels ${engine.isRunning && engine.currentTask === 'Reels Beğenme' ? '🟢' : ''}</button>
          <button type="button" id="tabBtnPostStory" style="flex:1;padding:5px 0;font-size:11px;border:none;border-radius:7px;cursor:pointer;background:${initialSub === 'post_story' ? 'linear-gradient(135deg, #f09433, #dc2743)' : 'transparent'};color:${initialSub === 'post_story' ? '#fff' : '#9e9ea7'};font-weight:${initialSub === 'post_story' ? '700' : '600'};">📸 Gönderi ${engine.isRunning && ['Gönderi Beğenme', 'Hikaye Beğenme', 'Yorum Beğenme'].includes(engine.currentTask) ? '🟢' : ''}</button>
          <button type="button" id="tabBtnComment" style="flex:1;padding:5px 0;font-size:11px;border:none;border-radius:7px;cursor:pointer;background:${initialSub === 'comment' ? 'linear-gradient(135deg, #f09433, #dc2743)' : 'transparent'};color:${initialSub === 'comment' ? '#fff' : '#9e9ea7'};font-weight:${initialSub === 'comment' ? '700' : '600'};">💬 Yorum ${engine.isRunning && engine.currentTask === 'Yorum Yapma' ? '🟢' : ''}</button>
        </div>

        <!-- 1. REELS BEĞENİ ALANI -->
        <div id="subSecReels" style="display:${initialSub === 'reels' ? 'block' : 'none'};">
          <div style="background:rgba(255,59,105,0.08);border:1px solid rgba(255,59,105,0.22);border-radius:11px;padding:9px;">
            <div style="font-weight:700;font-size:12px;color:#fff;margin-bottom:3px;">⚡ Reels Beğen & Kaydır:</div>
            <div style="font-size:10.5px;color:#9e9ea7;margin-bottom:7px;">
              Reels videolarını sırayla izler, beğenir ve sonrakine geçer.
            </div>
            <div class="codum-row" style="margin-bottom:5px;">
              <span style="font-size:11px;">Reels Hızı (5 Kademe):</span>
              <select class="codum-input-text" id="reelsSpeedPreset" style="width:145px;padding:3px 6px;font-size:11px;">
                <option value="10">🐢 1. Çok Yavaş (10s)</option>
                <option value="6">🛡️ 2. Yavaş (6s)</option>
                <option value="4" selected>⚡ 3. Normal (4s)</option>
                <option value="2.5">🚀 4. Hızlı (2.5s)</option>
                <option value="1.2">🔥 5. Turbo (1.2s)</option>
              </select>
            </div>
            <input type="hidden" id="reelsSpeedSec" value="4">
            <div class="codum-row" style="margin-bottom:7px;">
              <span style="font-size:11px;">Beğeni Limiti:</span>
              <input type="number" class="codum-input-text" id="reelsMaxCount" value="30" min="1" max="250" style="width:55px;text-align:right;padding:4px 6px;">
            </div>
            <div style="display:flex;gap:6px;">
              <button type="button" class="codum-action-btn start" id="btnRunReelsLike" style="flex:1;" ${engine.isRunning && engine.currentTask === 'Reels Beğenme' ? 'disabled' : ''}>${engine.isRunning && engine.currentTask === 'Reels Beğenme' ? '⏳ Beğeniliyor...' : '▶ Başlat'}</button>
              <button type="button" class="codum-action-btn stop" id="btnStopReelsLike" style="width:75px;">Durdur</button>
            </div>
          </div>
        </div>

        <!-- 2. GÖNDERİ, HİKAYE & YORUM BEĞENİ ALANI (HIZ VE LİMİT AYARLARI DAHİL) -->
        <div id="subSecPostStory" style="display:${initialSub === 'post_story' ? 'block' : 'none'};">
          <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.22);border-radius:11px;padding:9px;">
            <div style="font-weight:700;font-size:12px;color:#fff;margin-bottom:3px;">📸 Akış, Hikaye & Yorum Beğeni:</div>
            <div style="font-size:10.5px;color:#9e9ea7;margin-bottom:7px;">
              Seçilen içerik türünü otomatik tarar ve sırayla beğenir.
            </div>
            
            <div class="codum-row" style="margin-bottom:5px;">
              <span style="font-size:11px;">Beğeni Türü:</span>
              <select class="codum-input-text" id="postLikeTargetType" style="width:130px;padding:3px 6px;font-size:11px;">
                <option value="posts" selected>🖼️ Akış Gönderileri</option>
                <option value="stories">⭕ Açık Hikayeler</option>
                <option value="comments">💬 Gönderi Yorumları</option>
              </select>
            </div>

            <div class="codum-row" style="margin-bottom:5px;">
              <span style="font-size:11px;">Beğeni Hızı (5 Kademe):</span>
              <select class="codum-input-text" id="postLikeSpeedPreset" style="width:145px;padding:3px 6px;font-size:11px;">
                <option value="15">🐢 1. Çok Yavaş (15s)</option>
                <option value="10">🛡️ 2. Yavaş (10s)</option>
                <option value="6" selected>⚡ 3. Normal (6s)</option>
                <option value="4">🚀 4. Hızlı (4s)</option>
                <option value="2">🔥 5. Turbo (2s)</option>
              </select>
            </div>
            <input type="hidden" id="postLikeSpeedSec" value="6">

            <div class="codum-row" style="margin-bottom:7px;">
              <span style="font-size:11px;">Beğeni Limiti:</span>
              <input type="number" class="codum-input-text" id="postLikeMaxCount" value="30" min="1" max="250" style="width:55px;text-align:right;padding:4px 6px;">
            </div>

            <div style="display:flex;gap:6px;">
              <button type="button" class="codum-action-btn start" id="btnRunGenericLike" style="flex:1;" ${engine.isRunning && ['Gönderi Beğenme','Hikaye Beğenme','Yorum Beğenme'].includes(engine.currentTask) ? 'disabled' : ''}>${engine.isRunning && ['Gönderi Beğenme','Hikaye Beğenme','Yorum Beğenme'].includes(engine.currentTask) ? '⏳ Beğeniliyor...' : '▶ Beğeniyi Başlat'}</button>
              <button type="button" class="codum-action-btn stop" id="btnStopGenericLike" style="width:75px;">Durdur</button>
            </div>
          </div>
        </div>

        <!-- 3. OTOMATİK YORUM ALANI -->
        <div id="subSecComment" style="display:${initialSub === 'comment' ? 'block' : 'none'};">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:9px;">
            <div style="font-weight:700;font-size:12px;color:#fff;margin-bottom:3px;">💬 Otomatik Yorum Gönder:</div>
            <div class="codum-row vertical" style="margin-top:4px;">
              <span style="font-size:10.5px;color:#9e9ea7;">Hedef Link (Boşsa sayfadakileri alır):</span>
              <input type="text" class="codum-input-text" id="customCommentTarget" placeholder="Örn: https://instagram.com/p/C_xyz" style="margin-bottom:5px;padding:4px 6px;">
              <span style="font-size:10.5px;color:#9e9ea7;">Şablonlar (* ile ayırın):</span>
              <textarea class="codum-input-textarea" id="txtComments" style="height:42px;">Harika paylaşım!*Tebrikler👏*Süper içerik🔥</textarea>
              <div class="codum-row" style="margin-top:5px;margin-bottom:6px;">
                <span style="font-size:11px;">Yorum Hızı (5 Kademe):</span>
                <select class="codum-input-text" id="commentSpeedPreset" style="width:145px;padding:3px 6px;font-size:11px;">
                  <option value="60">🐢 1. Çok Yavaş (60s)</option>
                  <option value="40">🛡️ 2. Yavaş (40s)</option>
                  <option value="25" selected>⚡ 3. Normal (25s)</option>
                  <option value="15">🚀 4. Hızlı (15s)</option>
                  <option value="8">🔥 5. Turbo (8s)</option>
                </select>
              </div>
              <input type="hidden" id="commentSpeedSec" value="25">
              <button type="button" class="codum-action-btn start" id="btnPostComments" ${engine.isRunning && engine.currentTask === 'Yorum Yapma' ? 'disabled' : ''}>${engine.isRunning && engine.currentTask === 'Yorum Yapma' ? '⏳ Gönderiliyor...' : '💬 Yorum Gönderimini Başlat'}</button>
            </div>
          </div>
        </div>
      `;

      // Acil Durdur Butonu Olayı
      document.getElementById('btnQuickStopAll')?.addEventListener('click', () => {
        engine.stop('Kullanıcı acil durdur butonundan durdurdu.');
        renderFlyoutContent('like_comment');
      });

      // Canlı Hız Butonları ve Hız Girişleri
      document.querySelectorAll('.codum-speed-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const s = Number(chip.dataset.speed);
          window.__codumPostSpeedSec = s;
          const inputPost = document.getElementById('postLikeSpeedSec');
          if (inputPost) inputPost.value = s;
          const inputReels = document.getElementById('reelsSpeedSec');
          if (inputReels) inputReels.value = s;
          document.querySelectorAll('.codum-speed-chip').forEach(c => {
            c.style.background = c === chip ? 'linear-gradient(135deg, #f09433, #dc2743)' : 'rgba(255,255,255,0.1)';
            c.style.fontWeight = c === chip ? '700' : '400';
          });
          engine.log('⚡ Beğeni hızı ' + s + ' saniye olarak güncellendi.', 'info');
        });
      });

      document.getElementById('postLikeSpeedSec')?.addEventListener('input', (e) => {
        window.__codumPostSpeedSec = Number(e.target.value) || 8;
      });
      document.getElementById('reelsSpeedSec')?.addEventListener('input', (e) => {
        window.__codumPostSpeedSec = Number(e.target.value) || 3;
      });

      document.getElementById('reelsSpeedPreset')?.addEventListener('change', (e) => {
        const val = Number(e.target.value) || 4;
        const hiddenInput = document.getElementById('reelsSpeedSec');
        if (hiddenInput) hiddenInput.value = val;
        window.__codumPostSpeedSec = val;
        engine.log('⚡ Reels hızı ' + val + ' saniye olarak ayarlandı.', 'info');
      });

      document.getElementById('postLikeSpeedPreset')?.addEventListener('change', (e) => {
        const val = Number(e.target.value) || 6;
        const hiddenInput = document.getElementById('postLikeSpeedSec');
        if (hiddenInput) hiddenInput.value = val;
        window.__codumPostSpeedSec = val;
        engine.log('⚡ Beğeni hızı ' + val + ' saniye olarak ayarlandı.', 'info');
      });

      document.getElementById('commentSpeedPreset')?.addEventListener('change', (e) => {
        const val = Number(e.target.value) || 25;
        const hiddenInput = document.getElementById('commentSpeedSec');
        if (hiddenInput) hiddenInput.value = val;
        engine.log('💬 Yorum hızı ' + val + ' saniye olarak ayarlandı.', 'info');
      });

      // Alt sekme geçiş mekanizması
      const tabReels = document.getElementById('tabBtnReels');
      const tabPostStory = document.getElementById('tabBtnPostStory');
      const tabComment = document.getElementById('tabBtnComment');
      const secReels = document.getElementById('subSecReels');
      const secPostStory = document.getElementById('subSecPostStory');
      const secComment = document.getElementById('subSecComment');

      function switchSubTab(targetName, activeBtn, activeSec) {
        window.__codumActiveSubTab = targetName;
        [tabReels, tabPostStory, tabComment].forEach(b => {
          if (b) {
            b.style.background = 'transparent';
            b.style.color = '#9e9ea7';
            b.style.fontWeight = '600';
          }
        });
        [secReels, secPostStory, secComment].forEach(s => {
          if (s) s.style.display = 'none';
        });

        activeSec.style.display = 'block';
        activeBtn.style.background = 'linear-gradient(135deg, #f09433, #dc2743)';
        activeBtn.style.color = '#fff';
        activeBtn.style.fontWeight = '700';
      }

      tabReels?.addEventListener('click', () => switchSubTab('reels', tabReels, secReels));
      tabPostStory?.addEventListener('click', () => switchSubTab('post_story', tabPostStory, secPostStory));
      tabComment?.addEventListener('click', () => switchSubTab('comment', tabComment, secComment));

      // Reels Beğeni Olayları
      const btnRunReels = document.getElementById('btnRunReelsLike');
      const btnStopReels = document.getElementById('btnStopReelsLike');

      btnRunReels?.addEventListener('click', () => {
        if (engine.isRunning) return;
        const speed = Number(document.getElementById('reelsSpeedSec').value) || 3;
        const max = Number(document.getElementById('reelsMaxCount').value) || 30;
        btnRunReels.disabled = true;
        btnRunReels.textContent = '⏳ Beğeniliyor...';
        btnRunReels.style.opacity = '0.7';

        engine.startReelsAutoLikeRunner({ speedSec: speed, maxLikeCount: max });
      });

      btnStopReels?.addEventListener('click', () => {
        engine.stop('Kullanıcı durdurdu.');
        btnRunReels.disabled = false;
        btnRunReels.textContent = '▶ Başlat';
        btnRunReels.style.opacity = '1';
      });

      // Gönderi / Hikaye / Yorum Beğeni Olayları (Hız ve Limitli)
      const btnRunGenericLike = document.getElementById('btnRunGenericLike');
      const btnStopGenericLike = document.getElementById('btnStopGenericLike');

      btnRunGenericLike?.addEventListener('click', () => {
        if (engine.isRunning) return;
        const kind = document.getElementById('postLikeTargetType')?.value || 'posts';
        if (kind === 'posts' && window.location.pathname.match(/\/(?:reels?)\//)) {
          engine.log('⚠️ Reels sayfasındasınız. Reels videolarını beğenmek için üstteki [⚡ Reels] sekmesini, yorumları beğenmek için [Beğeni Türü: Gönderi Yorumları] seçin.', 'warning');
          btnRunGenericLike.disabled = false;
          btnRunGenericLike.textContent = '▶ Beğeniyi Başlat';
          btnRunGenericLike.style.opacity = '1';
          return;
        }
        const speed = Number(document.getElementById('postLikeSpeedSec')?.value) || 8;
        const max = Number(document.getElementById('postLikeMaxCount')?.value) || 30;

        btnRunGenericLike.disabled = true;
        btnRunGenericLike.textContent = '⏳ Beğeniliyor...';
        btnRunGenericLike.style.opacity = '0.7';

        if (kind === 'posts') {
          engine.startPostAutoLikeRunner({ speedSec: speed, maxLikeCount: max });
        } else if (kind === 'stories') {
          engine.startStoryAutoLikeRunner({ speedSec: speed, maxLikeCount: max });
        } else if (kind === 'comments') {
          engine.startCommentLikeRunner({ speedSec: speed, maxLikeCount: max });
        }
      });

      btnStopGenericLike?.addEventListener('click', () => {
        engine.stop('Kullanıcı durdurdu.');
        btnRunGenericLike.disabled = false;
        btnRunGenericLike.textContent = '▶ Beğeniyi Başlat';
        btnRunGenericLike.style.opacity = '1';
      });

      // Yorum Gönderme Olayı
      document.getElementById('btnPostComments')?.addEventListener('click', () => {
        const rawTemplates = document.getElementById('txtComments').value;
        const templates = rawTemplates.split('*').map(s => s.trim()).filter(Boolean);
        if (!templates.length) {
          alert('Lütfen en az bir yorum şablonu girin.');
          return;
        }

        const ids = [];
        const customTarget = document.getElementById('customCommentTarget')?.value?.trim();
        if (customTarget) {
          ids.push(customTarget);
        } else {
          const mCurrent = window.location.pathname.match(/\/(?:p|reels?|tv)\/([a-zA-Z0-9_\-]+)/);
          if (mCurrent && mCurrent[1]) ids.push(mCurrent[1]);

          const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/reels/"]');
          links.forEach(l => {
            const m = l.href.match(/\/(?:p|reels?|tv)\/([a-zA-Z0-9_\-]+)/);
            if (m && m[1] && !ids.includes(m[1])) ids.push(m[1]);
          });
        }

        if (!ids.length) {
          alert('Yorum yapılacak gönderi bulunamadı. Lütfen bir Reels/gönderi açın ya da hedef kutusuna link girin.');
          return;
        }

        const speed = Number(document.getElementById('commentSpeedSec')?.value) || 25;
        engine.startCommentTask(ids, templates, { maxCommentCount: 20, commentSpeedSec: speed });
      });
    }

    else if (tool === 'settings') {
      title.textContent = '⚙️ Güvenlik Kadranı & Limitler';
      const currentAccountId = engine?.api?.getUserId() || null;
      chrome.runtime.sendMessage({ type: 'GET_STATE', accountId: currentAccountId }, (stateRes) => {
        chrome.storage.local.get(['codum_settings', 'stats_today'], (res) => {
          const s = (stateRes && stateRes.settings) || res.codum_settings || {};
          const accStats = (stateRes && stateRes.account && stateRes.account.stats) || (stateRes && stateRes.stats) || res.stats_today || {};

          const followCount = accStats.follow || accStats.follows || 0;
          const unfollowCount = accStats.unfollow || accStats.unfollows || 0;
          const likeCount = accStats.like || accStats.likes || 0;

          const maxFollow = s.dailyMaxFollow || s.dailyFollowLimit || 150;
          const maxUnfollow = s.dailyMaxUnfollow || s.dailyUnfollowLimit || 200;
          const maxLikes = s.dailyMaxLikes || s.dailyLikeLimit || 250;

          body.innerHTML = `
            <div style="font-size:12px;line-height:1.7;margin-bottom:10px;">
              <div><strong>Ürün:</strong> CODUM InstaCockpit Pro VIP</div>
              <div><strong>Sürüm:</strong> 1.0.0 Pro</div>
              <div><strong>Lisans:</strong> <span style="color:#10b981;">VIP Aktif</span></div>
              <div><strong>Merkez:</strong> <a href="https://codum.tr" target="_blank" style="color:#ff3b69;text-decoration:none;">codum.tr</a></div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:10px;margin-bottom:10px;">
              <div style="font-size:12px;font-weight:700;margin-bottom:6px;">Bugünkü İşlem Sayacı:</div>
              <div style="display:flex;justify-content:space-around;font-size:12px;text-align:center;">
                <div><strong style="color:#3b82f6;">${followCount}</strong><br>Takip</div>
                <div><strong style="color:#ef4444;">${unfollowCount}</strong><br>Çıkarma</div>
                <div><strong style="color:#10b981;">${likeCount}</strong><br>Beğeni</div>
              </div>
            </div>
            <div class="codum-row" style="margin-bottom:6px;">
              <span>Günlük Takip Limiti:</span>
              <input type="number" class="codum-input-text" id="setDailyFollow" value="${maxFollow}" style="width:70px;text-align:right;">
            </div>
            <div class="codum-row" style="margin-bottom:6px;">
              <span>Günlük Çıkarma Limiti:</span>
              <input type="number" class="codum-input-text" id="setDailyUnfollow" value="${maxUnfollow}" style="width:70px;text-align:right;">
            </div>
            <div class="codum-row" style="margin-bottom:6px;">
              <span>Günlük Beğeni Limiti:</span>
              <input type="number" class="codum-input-text" id="setDailyLikes" value="${maxLikes}" style="width:70px;text-align:right;">
            </div>
            <button type="button" class="codum-action-btn start" id="btnSaveConfig" style="margin-top:10px;">Limitleri Kaydet</button>
          `;

          document.getElementById('btnSaveConfig')?.addEventListener('click', () => {
            const fl = Number(document.getElementById('setDailyFollow').value) || 150;
            const ufl = Number(document.getElementById('setDailyUnfollow').value) || 200;
            const lkl = Number(document.getElementById('setDailyLikes').value) || 250;

            const updatedSettings = {
              ...s,
              dailyMaxFollow: fl,
              dailyFollowLimit: fl,
              dailyMaxUnfollow: ufl,
              dailyUnfollowLimit: ufl,
              dailyMaxLikes: lkl,
              dailyLikeLimit: lkl
            };

            chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', accountId: currentAccountId, settings: updatedSettings }, () => {
              chrome.storage.local.set({ codum_settings: updatedSettings }, () => {
                alert('Güvenlik limitleri başarıyla kaydedildi ve motora aktarıldı.');
              });
            });
          });
        });
      });
    }
  }

  // 3. Köşelere Sürükleme ve Tıklamayla Açılma (Drag & Snap & Click Toggle)
  function setupDraggableSnap(dock) {
    const knob = dock.querySelector('#codumMasterKnob');
    const dockBar = dock.querySelector('#codumDockBar');
    let isDragging = false;
    let hasMoved = false;
    let startX = 0, startY = 0;

    knob.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      dock.style.transition = 'none';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 6 || dy > 6) {
        hasMoved = true;
      }
      if (hasMoved) {
        dock.style.left = (e.clientX - 45) + 'px';
        dock.style.top = (e.clientY - 25) + 'px';
        dock.style.right = 'auto';
        dock.style.bottom = 'auto';
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = '';
      dock.style.transition = 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)';

      // Tıklama vs Sürükleme Kontrolü
      if (!hasMoved) {
        // Tıklandı: Araç rayını aç / kapat
        dockBar.classList.toggle('collapsed');
        return;
      }

      // Sürüklendi: En yakın 4 köşeden birine yapış (Snap to Corner)
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const isRight = e.clientX > winW / 2;
      const isBottom = e.clientY > winH / 2;

      let corner = 'top-right';
      if (isRight && !isBottom) corner = 'top-right';
      else if (!isRight && !isBottom) corner = 'top-left';
      else if (isRight && isBottom) corner = 'bottom-right';
      else if (!isRight && isBottom) corner = 'bottom-left';

      dock.setAttribute('data-corner', corner);

      dock.style.left = isRight ? 'auto' : '20px';
      dock.style.right = isRight ? '20px' : 'auto';
      dock.style.top = isBottom ? 'auto' : '30px';
      dock.style.bottom = isBottom ? '30px' : 'auto';
    });
  }

  // 4. Profil Sayfası "Seni Takip Ediyor mu?" Rozeti
  function initProfileBadgeWatcher() {
    let lastBadgeUsername = null;
    setInterval(async () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, '');
      const parts = path.split('/');
      if (parts.length === 1 && parts[0] && !['explore', 'reels', 'direct', 'stories', 'p', 'reel', 'tv'].includes(parts[0])) {
        const username = parts[0];

        // Farklı bir profile geçildiyse eski rozeti temizle
        if (lastBadgeUsername && lastBadgeUsername !== username) {
          document.querySelectorAll('.codum-friendship-badge').forEach(b => b.remove());
          lastBadgeUsername = null;
        }

        const existingBadge = document.querySelector('.codum-friendship-badge');
        if (existingBadge && existingBadge.dataset.username === username) {
          return;
        }

        try {
          document.querySelectorAll('.codum-friendship-badge').forEach(b => b.remove());
          const profile = await engine.api.getUserProfile(username);
          if (profile && profile.id) {
            const friendship = await engine.api.getFriendship(profile.id);
            if (friendship) {
              lastBadgeUsername = username;
              injectProfileBadge(friendship.followed_by, username);
            }
          }
        } catch (_) {}
      } else {
        if (lastBadgeUsername) {
          document.querySelectorAll('.codum-friendship-badge').forEach(b => b.remove());
          lastBadgeUsername = null;
        }
      }
    }, 1200);
  }

  function injectProfileBadge(isFollowingMe, username) {
    document.querySelectorAll('.codum-friendship-badge').forEach(b => b.remove());
    const headerTitle = document.querySelector('header h2, header h1');
    if (!headerTitle) return;

    const badge = document.createElement('span');
    badge.className = `codum-friendship-badge ${isFollowingMe ? 'yes' : 'no'}`;
    badge.dataset.username = username || '';
    badge.innerHTML = isFollowingMe ? '🟢 Seni Takip Ediyor' : '🔴 Seni Takip Etmiyor';
    headerTitle.appendChild(badge);
  }

  // 5. İzlenen Hikayeleri Otomatik Beğenme Motoru
  function initStoryAutoLikeWatcher() {
    setInterval(() => {
      if (window.__codumAutoLikeStories === false) return;
      if (!window.location.pathname.startsWith('/stories/')) return;
      try {
        const player = document.querySelector('section[role="region"], div[role="dialog"]') || document.querySelector('main');
        if (!player) return;
        const heart = player.querySelector('svg[aria-label="Like"], svg[aria-label="Beğen"]');
        const liked = Boolean(player.querySelector('svg[aria-label="Unlike"], svg[aria-label="Beğenmekten vazgeç"]'));
        if (heart && !liked) {
          const btn = heart.closest('button, [role="button"]');
          if (btn && btn.dataset.codumAutoLiked !== window.location.pathname) {
            btn.dataset.codumAutoLiked = window.location.pathname;
            btn.click();
            const currentAccountId = engine?.api?.getUserId() || null;
            chrome.runtime.sendMessage({ type: 'UPDATE_STATS', metric: 'like', accountId: currentAccountId }).catch(() => {});
          }
        }
      } catch (_) {}
    }, 1200);
  }

  // Sayfa hazır olduğunda çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);


})(typeof window !== 'undefined' ? window : globalThis);
