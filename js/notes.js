/**
 * Notes section: Markdown (marked) + LaTeX (MathJax 3).
 *
 * Flow for the viewer:
 * 1. Fetch the .md file and notes-manifest.json (for optional PDF/detail link).
 * 2. marked.parse() → HTML string → inject into #note-body; prepend CTA if manifest has detailUrl.
 * 3. MathJax.typesetPromise([container]) so equations in the new DOM are rendered.
 *
 * MathJax is loaded on view.html; we wait on MathJax.startup.promise before typesetting.
 */

(function (global) {
  'use strict';

  /** Only allow safe slugs so ?note= cannot become a path traversal (e.g. ../../etc). */
  var SLUG_RE = /^[a-zA-Z0-9_-]+$/;

  function isValidSlug(s) {
    return typeof s === 'string' && SLUG_RE.test(s);
  }

  /** Only allow same-site PDFs under ../data/ (matches how the site hosts coursework). */
  function isSafeDetailUrl(url) {
    if (typeof url !== 'string' || !url.startsWith('../data/')) return false;
    var rest = url.slice('../data/'.length);
    return /^[A-Za-z0-9_.-]+$/.test(rest);
  }

  function listIdForSection(section) {
    if (section === 'problem') return 'notes-list-problem';
    if (section === 'report') return 'notes-list-report';
    if (section === 'papers') return 'notes-list-papers';
    // return 'notes-list-other'; 
  }

  function hideEmptyNoteBlocks() {
    ['problem', 'report', 'papers'].forEach(function (key) {
      var block = document.getElementById('notes-block-' + key);
      if (!block) return;
      var ul = block.querySelector('ul');
      block.style.display = ul && ul.children.length ? '' : 'none';
    });
  }

  /**
   * Sort order for the notes index. true = newest sortDate first, false = oldest first.
   * Entries without sortDate sort as 1970-01-01 (end of list when newest-first).
   */
  var NOTES_SORT_NEWEST_FIRST = true;

  /** ISO YYYY-MM-DD from manifest; used for ordering only. */
  function sortKeyForItem(item) {
    if (!item || typeof item.sortDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.sortDate)) {
      return '1970-01-01';
    }
    return item.sortDate;
  }

  function sortManifestItems(items) {
    var copy = items.slice();
    copy.sort(function (a, b) {
      var ka = sortKeyForItem(a);
      var kb = sortKeyForItem(b);
      var cmp = kb.localeCompare(ka);
      if (!NOTES_SORT_NEWEST_FIRST) cmp = -cmp;
      if (cmp !== 0) return cmp;
      return ((a && a.slug) || '').localeCompare((b && b.slug) || '');
    });
    return copy;
  }

  /**
   * Wait until MathJax 3 finished startup (tex-svg.js loaded + ready).
   * Safe to call even before the script tag has run (polls briefly).
   */
  function whenMathJaxReady() {
    if (global.MathJax && global.MathJax.startup && global.MathJax.startup.promise) {
      return global.MathJax.startup.promise;
    }
    return new Promise(function (resolve) {
      var n = 0;
      var id = setInterval(function () {
        if (global.MathJax && global.MathJax.startup && global.MathJax.startup.promise) {
          clearInterval(id);
          global.MathJax.startup.promise.then(resolve);
        } else if (++n > 200) {
          clearInterval(id);
          resolve();
        }
      }, 25);
    });
  }

  /** Run MathJax on a single element after Markdown HTML is in the DOM. */
  function typeset(container) {
    if (!global.MathJax || !global.MathJax.typesetPromise) {
      return Promise.resolve();
    }
    return global.MathJax.typesetPromise([container]).catch(function (err) {
      console.warn('MathJax typeset:', err);
    });
  }

  function configureMarked() {
    if (!global.marked) return;
    global.marked.setOptions({
      gfm: true,
      headerIds: true,
    });
  }

  /**
   * notes/index.html — fetch manifest and fill section lists.
   * Manifest entries: slug, title, optional section ("problem" | "report" | "papers"),
   * optional date (display), sortDate (YYYY-MM-DD, required for stable ordering),
   * optional detailUrl for the note viewer CTA.
   * Lists are sorted by sortDate; toggle NOTES_SORT_NEWEST_FIRST in this file for direction.
   */
  function initNotesIndex() {
    var fallbackList = document.getElementById('notes-list');
    var hasSections =
      document.getElementById('notes-list-problem') &&
      document.getElementById('notes-list-report');
      //  &&
      // document.getElementById('notes-list-papers');
      // &&
      // document.getElementById('notes-list-other');

    fetch(new URL('notes-manifest.json', global.location.href))
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (items) {
        if (!Array.isArray(items)) throw new Error('manifest not an array');
        items = sortManifestItems(items);
        items.forEach(function (item) {
          if (!item || !isValidSlug(item.slug)) return;
          var listId = hasSections ? listIdForSection(item.section) : 'notes-list';
          var listEl = document.getElementById(listId) || fallbackList;
          if (!listEl) return;

          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = 'view.html?note=' + encodeURIComponent(item.slug);
          a.textContent = item.title || item.slug;
          li.appendChild(a);
          if (item.date) {
            li.appendChild(document.createTextNode(' — ' + item.date));
          }
          if (item.description) {
            var br = document.createElement('br');
            var small = document.createElement('small');
            small.className = 'notes-blurb';
            small.textContent = item.description;
            li.appendChild(br);
            li.appendChild(small);
          }
          listEl.appendChild(li);
        });
        if (hasSections) hideEmptyNoteBlocks();
      })
      .catch(function (err) {
        var msg =
          '<li class="notes-error">Could not load the note list. (' +
          String(err.message || err) +
          ')</li>';
        if (hasSections) {
          var o = document.getElementById('notes-list-other');
          if (o) o.innerHTML = msg;
        } else if (fallbackList) {
          fallbackList.innerHTML = msg;
        }
      });
  }

  /**
   * notes/view.html — ?note=slug → fetch slug.md, render, then MathJax.
   */
  function initNoteView() {
    var params = new URLSearchParams(global.location.search);
    var slug = params.get('note');
    var bodyEl = document.getElementById('note-body');
    if (!bodyEl) return;

    if (!isValidSlug(slug)) {
      bodyEl.innerHTML =
        '<p>Missing or invalid <code>note</code> parameter. Use <code>view.html?note=your-slug</code>.</p>';
      return;
    }

    bodyEl.innerHTML = '<p class="notes-loading">Loading…</p>';

    var mdUrl = new URL('./' + slug + '.md', global.location.href);
    var manifestUrl = new URL('notes-manifest.json', global.location.href);

    Promise.all([
      fetch(mdUrl).then(function (r) {
        if (!r.ok) throw new Error(r.status === 404 ? 'Note not found.' : 'HTTP ' + r.status);
        return r.text();
      }),
      fetch(manifestUrl).then(function (r) {
        return r.ok ? r.json() : [];
      }),
    ])
      .then(function (pair) {
        var md = pair[0];
        var manifest = pair[1];
        var entry = null;
        if (Array.isArray(manifest)) {
          for (var i = 0; i < manifest.length; i++) {
            if (manifest[i] && manifest[i].slug === slug) {
              entry = manifest[i];
              break;
            }
          }
        }

        configureMarked();
        if (!global.marked) throw new Error('marked.js not loaded');
        bodyEl.innerHTML = global.marked.parse(md);

        // Optional CTA from manifest: open full PDF / detailed report (see notes-manifest.json).
        if (entry && entry.detailUrl && isSafeDetailUrl(entry.detailUrl)) {
          var cta = document.createElement('p');
          cta.className = 'notes-detail-cta';
          var link = document.createElement('a');
          link.href = entry.detailUrl;
          link.rel = 'noopener';
          link.target = '_blank';
          link.textContent =
            typeof entry.detailLabel === 'string' && entry.detailLabel
              ? entry.detailLabel
              : 'View detailed report (PDF)';
          cta.appendChild(link);
          bodyEl.insertBefore(cta, bodyEl.firstChild);
        }

        // Browser tab title from first Markdown heading
        var h1 = bodyEl.querySelector('h1');
        if (h1 && h1.textContent) {
          document.title = h1.textContent + ' — Notes — Marcus Lai';
        }

        return whenMathJaxReady().then(function () {
          return typeset(bodyEl);
        });
      })
      .catch(function (err) {
        bodyEl.innerHTML =
          '<p class="notes-error">' + String(err.message || err) + '</p>';
      });
  }

  global.NotesApp = {
    initNotesIndex: initNotesIndex,
    initNoteView: initNoteView,
    isValidSlug: isValidSlug,
  };
})(typeof window !== 'undefined' ? window : this);
