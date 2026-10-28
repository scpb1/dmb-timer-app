/** Данные «Армейский год в датах» (365 дней) для HTML-прототипов */
(function () {
  const TOTAL = 365;

  /** @type {{ dpp?: number, ddd?: number, name: string, icon: string, group: string }[]} */
  const MILESTONES = [
    { dpp: 0, name: 'Призыв', icon: '🚩', group: 'start' },
    { dpp: 11, name: 'Зеркала 11 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 22, name: 'Зеркала 22 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 33, name: 'Зеркала 33 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 36, name: '10% службы', icon: '⑩', group: 'percent' },
    { dpp: 44, name: 'Зеркала 44 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 50, name: '50 дпп', icon: '★', group: 'hundred' },
    { dpp: 55, name: 'Зеркала 55 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 66, name: 'Зеркала 66 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 73, name: '20% службы', icon: '⑳', group: 'percent' },
    { dpp: 77, name: 'Малые топорики', icon: '🪓', group: 'small' },
    { dpp: 88, name: 'Малые матрёшки', icon: '🪆', group: 'small' },
    { dpp: 91, name: '1/4 службы', icon: '¼', group: 'fraction' },
    { dpp: 99, name: 'Зеркала 99 дпп', icon: '🪞', group: 'mirror' },
    { dpp: 100, name: '100 дпп', icon: '★', group: 'hundred' },
    { dpp: 109, name: '30% службы', icon: '③', group: 'percent' },
    { dpp: 111, name: 'Малый заборчик', icon: '🚧', group: 'small' },
    { dpp: 122, name: '1/3 службы', icon: '⅓', group: 'fraction' },
    { dpp: 146, name: '40% службы', icon: '④', group: 'percent' },
    { dpp: 182, name: 'Экватор 50%', icon: '═', group: 'equator' },
    { dpp: 200, name: '200 дпп', icon: '★', group: 'hundred' },
    { dpp: 219, name: '60% службы', icon: '⑥', group: 'percent' },
    { dpp: 220, name: 'Большая розетка', icon: '🔌', group: 'big' },
    { dpp: 222, name: 'Большие гуси-лебеди', icon: '🦢', group: 'big' },
    { dpp: 250, name: 'Невеста дембеля', icon: '💍', group: 'family' },
    { dpp: 300, name: 'Жена дембеля', icon: '💒', group: 'family' },
    { dpp: 350, name: '350 дпп', icon: '★', group: 'hundred' },
    { ddd: 350, name: '350 ддд', icon: '★', group: 'hundred' },
    { ddd: 300, name: '300 ддд', icon: '★', group: 'hundred' },
    { ddd: 250, name: '250 ддд', icon: '★', group: 'hundred' },
    { ddd: 222, name: 'Малые гуси-лебеди', icon: '🦢', group: 'small' },
    { ddd: 220, name: 'Малая розетка', icon: '🔌', group: 'small' },
    { ddd: 200, name: '200 ддд', icon: '★', group: 'hundred' },
    { ddd: 150, name: '150 ддд', icon: '★', group: 'hundred' },
    { ddd: 122, name: 'Осталась 1/3', icon: '⅓', group: 'fraction' },
    { ddd: 111, name: 'Большой заборчик', icon: '🚧', group: 'big' },
    { ddd: 100, name: '100 ддд', icon: '★', group: 'hundred' },
    { ddd: 99, name: 'Зеркала 99 ддд', icon: '🪞', group: 'mirror' },
    { ddd: 91, name: 'Осталась 1/4', icon: '¼', group: 'fraction' },
    { ddd: 88, name: 'Большие матрёшки', icon: '🪆', group: 'big' },
    { ddd: 77, name: 'Большие топорики', icon: '🪓', group: 'big' },
    { ddd: 73, name: '80% (осталось)', icon: '⑧', group: 'percent' },
    { ddd: 66, name: 'Зеркала 66 ддд', icon: '🪞', group: 'mirror' },
    { ddd: 55, name: 'Зеркала 55 ддд', icon: '🪞', group: 'mirror' },
    { ddd: 50, name: 'Водка в холодильник', icon: '🧊', group: 'tail' },
    { ddd: 44, name: 'Зеркала 44 ддд', icon: '🪞', group: 'mirror' },
    { ddd: 40, name: 'Водка на паркет', icon: '🪵', group: 'tail' },
    { ddd: 36, name: '90% (осталось)', icon: '⑨', group: 'percent' },
    { ddd: 33, name: 'Зеркала 33 ддд', icon: '🪞', group: 'mirror' },
    { ddd: 30, name: 'Водка у дверей', icon: '🚪', group: 'tail' },
    { ddd: 25, name: 'Начинаем наливать', icon: '🥃', group: 'tail' },
    { ddd: 22, name: 'Зеркала 22 ддд', icon: '🪞', group: 'mirror' },
    { ddd: 20, name: 'Пачка', icon: '📦', group: 'tail' },
    { ddd: 11, name: 'Барабанная дробь', icon: '🥁', group: 'tail' },
    { ddd: 10, name: 'Космос', icon: '🌌', group: 'tail' },
    { ddd: 3, name: 'Светофор — красный', icon: '🔴', group: 'traffic' },
    { ddd: 2, name: 'Светофор — жёлтый', icon: '🟡', group: 'traffic' },
    { ddd: 1, name: 'Светофор — зелёный', icon: '🟢', group: 'traffic' },
    { ddd: 0, name: 'Дембель 100%', icon: '🎖', group: 'end' },
  ];

  function dppToDdd(dpp) {
    return Math.max(0, TOTAL - dpp);
  }

  function eventsOnDpp(dpp) {
    return MILESTONES.filter((m) => m.dpp === dpp);
  }

  function eventsOnDdd(ddd) {
    return MILESTONES.filter((m) => m.ddd === ddd);
  }

  /** Что «празднуем» сегодня — все совпадения по дпп и ддд */
  function todayCelebrations(dpp) {
    const ddd = dppToDdd(dpp);
    const a = eventsOnDpp(dpp);
    const b = eventsOnDdd(ddd);
    const seen = new Set();
    const out = [];
    for (const e of [...a, ...b]) {
      const key = e.name;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
    return out;
  }

  /** Ближайшая веха вперёд (по календарному дню службы) */
  function nextMilestone(dpp) {
    const ddd = dppToDdd(dpp);
    let best = null;
    let bestDelta = Infinity;
    for (const m of MILESTONES) {
      if (m.dpp !== undefined && m.dpp > dpp) {
        const d = m.dpp - dpp;
        if (d < bestDelta) {
          bestDelta = d;
          best = m;
        }
      }
      if (m.ddd !== undefined && m.ddd < ddd) {
        const d = ddd - m.ddd;
        if (d > 0 && d < bestDelta) {
          bestDelta = d;
          best = m;
        }
      }
    }
    return best ? { milestone: best, daysUntil: bestDelta } : null;
  }

  /** Зона «космос / земля / хвост» для подписи */
  function serviceZone(dpp) {
    const ddd = dppToDdd(dpp);
    if (ddd <= 10) return { id: 'tail', label: 'Финиш', hint: 'пачка · космос · светофор' };
    if (ddd <= 50) return { id: 'home', label: 'До дома близко', hint: 'водка · полтинник' };
    if (ddd <= 111) return { id: 'fence', label: 'Заборчик', hint: 'большие вехи' };
    if (dpp < 182) return { id: 'small', label: 'Малые', hint: 'топорики · матрёшки · зеркала' };
    if (dpp < 250) return { id: 'big', label: 'Большие', hint: 'розетка · гуси-лебеди' };
    if (ddd > 200) return { id: 'cosmos', label: 'Космос', hint: 'ещё далеко до дембеля' };
    return { id: 'mid', label: 'Середина', hint: 'экватор позади' };
  }

  function bindSlider(root) {
    const slider = root.querySelector('[data-army-dpp]');
    if (!slider) return;
    const dppOut = root.querySelector('[data-out-dpp]');
    const dddOut = root.querySelector('[data-out-ddd]');
    const pctOut = root.querySelector('[data-out-pct]');
    const todayOut =
      root.querySelector('[data-out-today-title]') || root.querySelector('[data-out-today]');
    const nextOut = root.querySelector('[data-out-next]');
    const zoneOut = root.querySelector('[data-out-zone]');
    const ring = root.querySelector('[data-app-ring]');

    function render() {
      const dpp = Number(slider.value);
      const ddd = dppToDdd(dpp);
      const pct = ((dpp / TOTAL) * 100).toFixed(1);
      if (dppOut) dppOut.textContent = String(dpp);
      if (dddOut) dddOut.textContent = String(ddd);
      if (pctOut) pctOut.textContent = pct.replace('.', ',');
      const today = todayCelebrations(dpp);
      if (todayOut) {
        todayOut.innerHTML =
          today.length === 0
            ? '<span class="muted">Обычный день</span>'
            : today.map((t) => `<span class="pill">${t.icon} ${t.name}</span>`).join(' ');
      }
      const nxt = nextMilestone(dpp);
      if (nextOut && nxt) {
        nextOut.textContent = `${nxt.milestone.icon} ${nxt.milestone.name} · через ${nxt.daysUntil} дн.`;
      }
      const zone = serviceZone(dpp);
      if (zoneOut) zoneOut.textContent = `${zone.label} — ${zone.hint}`;
      if (ring) {
        const filled = Math.round((dpp / TOTAL) * Number(ring.dataset.count || 100));
        ring.dataset.filled = String(filled);
        if (window.__drawAppRing) window.__drawAppRing(ring);
      }
      root.dispatchEvent(new CustomEvent('army-dpp-change', { detail: { dpp, ddd, today, zone } }));
    }

    slider.addEventListener('input', render);
    render();
  }

  window.ArmyCalendarProto = {
    TOTAL,
    MILESTONES,
    dppToDdd,
    todayCelebrations,
    nextMilestone,
    serviceZone,
    bindSlider,
  };
})();
