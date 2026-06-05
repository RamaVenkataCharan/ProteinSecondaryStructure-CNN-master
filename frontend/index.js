/* ============================================================
   Protein Secondary Structure Predictor — Application Logic
   Client-side prediction simulation + interactive visualization
   ============================================================ */

// ---- Q8 Structure Definitions ----
const Q8_INFO = {
  H: { name: 'Alpha Helix', category: 'Helix', color: '#ef4444' },
  G: { name: '3₁₀ Helix', category: 'Helix', color: '#f97316' },
  I: { name: 'Pi Helix', category: 'Helix', color: '#f59e0b' },
  E: { name: 'Beta Strand', category: 'Sheet', color: '#3b82f6' },
  B: { name: 'Beta Bridge', category: 'Sheet', color: '#6366f1' },
  T: { name: 'Turn', category: 'Coil', color: '#10b981' },
  S: { name: 'Bend', category: 'Coil', color: '#14b8a6' },
  L: { name: 'Loop/Coil', category: 'Coil', color: '#8b5cf6' },
};

const VALID_AA = new Set('ACDEFGHIKLMNPQRSTVWXY'.split(''));

// ---- Chou-Fasman-Inspired Propensity Scales (simplified) ----
// Higher value = higher propensity for that structure
const PROPENSITY = {
  A: { H: 1.42, E: 0.83, T: 0.66, L: 0.75 },
  C: { H: 0.70, E: 1.19, T: 1.19, L: 0.95 },
  D: { H: 1.01, E: 0.54, T: 1.46, L: 1.05 },
  E: { H: 1.51, E: 0.37, T: 0.74, L: 0.90 },
  F: { H: 1.13, E: 1.38, T: 0.60, L: 0.82 },
  G: { H: 0.57, E: 0.75, T: 1.56, L: 1.30 },
  H: { H: 1.00, E: 0.87, T: 0.95, L: 1.05 },
  I: { H: 1.08, E: 1.60, T: 0.47, L: 0.70 },
  K: { H: 1.16, E: 0.74, T: 1.01, L: 1.00 },
  L: { H: 1.21, E: 1.30, T: 0.59, L: 0.78 },
  M: { H: 1.45, E: 1.05, T: 0.60, L: 0.85 },
  N: { H: 0.67, E: 0.89, T: 1.56, L: 1.15 },
  P: { H: 0.57, E: 0.55, T: 1.52, L: 1.52 },
  Q: { H: 1.11, E: 1.10, T: 0.98, L: 0.87 },
  R: { H: 0.98, E: 0.93, T: 0.95, L: 1.05 },
  S: { H: 0.77, E: 0.75, T: 1.43, L: 1.15 },
  T: { H: 0.83, E: 1.19, T: 0.96, L: 1.00 },
  V: { H: 1.06, E: 1.70, T: 0.50, L: 0.65 },
  W: { H: 1.08, E: 1.37, T: 0.96, L: 0.75 },
  Y: { H: 0.69, E: 1.47, T: 1.14, L: 0.90 },
  X: { H: 1.00, E: 1.00, T: 1.00, L: 1.00 },
};

// ---- Sample Sequences ----
const SAMPLES = {
  'Hemoglobin β': 'MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH',
  'Insulin': 'MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT',
  'Lysozyme': 'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL',
  'GFP (partial)': 'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK',
};

// ---- Prediction Engine (Client-side Simulation) ----
function predictStructure(sequence) {
  const windowSize = 9;
  const halfWindow = Math.floor(windowSize / 2);
  const result = [];

  for (let i = 0; i < sequence.length; i++) {
    // Collect propensities in a local window
    const scores = { H: 0, E: 0, T: 0, L: 0 };
    let count = 0;

    for (let j = Math.max(0, i - halfWindow); j <= Math.min(sequence.length - 1, i + halfWindow); j++) {
      const aa = sequence[j];
      const prop = PROPENSITY[aa] || PROPENSITY['X'];
      scores.H += prop.H;
      scores.E += prop.E;
      scores.T += prop.T;
      scores.L += prop.L;
      count++;
    }

    // Average and add some position-dependent variation
    Object.keys(scores).forEach(k => scores[k] /= count);

    // Terminal regions favor coil/turn
    const relPos = i / sequence.length;
    if (relPos < 0.05 || relPos > 0.95) {
      scores.L *= 1.4;
      scores.T *= 1.2;
    }

    // Find the dominant state
    let maxKey = 'L';
    let maxVal = -1;
    Object.entries(scores).forEach(([k, v]) => {
      if (v > maxVal) {
        maxVal = v;
        maxKey = k;
      }
    });

    // Expand H to G/I with low probability for realism
    if (maxKey === 'H') {
      const r = Math.random();
      if (r < 0.05) maxKey = 'G';
      else if (r < 0.07) maxKey = 'I';
    }

    // Expand E to B with low probability
    if (maxKey === 'E' && Math.random() < 0.06) {
      maxKey = 'B';
    }

    // Turn into S sometimes
    if (maxKey === 'T' && Math.random() < 0.25) {
      maxKey = 'S';
    }

    result.push(maxKey);
  }

  // Smooth: remove isolated single-residue predictions
  for (let i = 1; i < result.length - 1; i++) {
    if (result[i] !== result[i - 1] && result[i] !== result[i + 1]) {
      result[i] = result[i - 1];
    }
  }

  return result.join('');
}

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPredictor();
  initScrollReveal();
});

// ---- Navbar ----
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });

    // Close menu on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.textContent = '☰';
      });
    });
  }
}

// ---- Predictor ----
function initPredictor() {
  const textarea = document.getElementById('sequence-input');
  const predictBtn = document.getElementById('predict-btn');
  const lengthEl = document.getElementById('seq-length');
  const validationEl = document.getElementById('seq-validation');
  const spinner = document.getElementById('dna-spinner');

  // Sample buttons
  document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (SAMPLES[name]) {
        textarea.value = SAMPLES[name];
        updateSeqInfo();
      }
    });
  });

  // Real-time validation
  textarea.addEventListener('input', updateSeqInfo);

  function updateSeqInfo() {
    const seq = textarea.value.trim().toUpperCase().replace(/\s+/g, '');
    lengthEl.textContent = seq.length;

    if (seq.length === 0) {
      validationEl.className = 'seq-validation';
      validationEl.innerHTML = '';
      return;
    }

    const valid = seq.split('').every(c => VALID_AA.has(c));
    validationEl.className = 'seq-validation ' + (valid ? 'valid' : 'invalid');
    validationEl.innerHTML = valid
      ? '✓ Valid sequence'
      : '✗ Invalid characters detected';
  }

  // Predict
  predictBtn.addEventListener('click', () => {
    const raw = textarea.value.trim().toUpperCase().replace(/\s+/g, '');

    if (!raw) {
      shakeElement(textarea);
      return;
    }

    if (!raw.split('').every(c => VALID_AA.has(c))) {
      shakeElement(textarea);
      return;
    }

    // Show loading
    predictBtn.classList.add('btn-loading');
    predictBtn.disabled = true;
    spinner.classList.add('active');

    // Simulate async prediction (slight delay for UX)
    setTimeout(() => {
      const structure = predictStructure(raw);
      displayResults(raw, structure);

      predictBtn.classList.remove('btn-loading');
      predictBtn.disabled = false;
      spinner.classList.remove('active');

      // Scroll to results
      document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1200);
  });
}

// ---- Display Results ----
function displayResults(sequence, structure) {
  const resultsSection = document.getElementById('results');
  resultsSection.classList.add('visible');

  // 1. Stats cards
  const counts = {};
  for (const ch of structure) counts[ch] = (counts[ch] || 0) + 1;
  const total = structure.length;

  const helixCount = (counts['H'] || 0) + (counts['G'] || 0) + (counts['I'] || 0);
  const sheetCount = (counts['E'] || 0) + (counts['B'] || 0);
  const coilCount = (counts['T'] || 0) + (counts['S'] || 0) + (counts['L'] || 0);

  animateCounter('helix-percent', helixCount / total * 100);
  animateCounter('sheet-percent', sheetCount / total * 100);
  animateCounter('coil-percent', coilCount / total * 100);

  // 2. Alignment view
  buildAlignmentView(sequence, structure);

  // 3. Bar chart
  buildBarChart(counts, total);
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  const duration = 1000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = (eased * target).toFixed(1) + '%';
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function buildAlignmentView(sequence, structure) {
  const container = document.getElementById('alignment-view');

  // Process in chunks of a reasonable width
  const chunkSize = Math.min(60, sequence.length);
  let html = '';

  for (let start = 0; start < sequence.length; start += chunkSize) {
    const seqChunk = sequence.slice(start, start + chunkSize);
    const strChunk = structure.slice(start, start + chunkSize);

    html += '<div class="alignment-block" style="margin-bottom: 12px;">';

    // Position row
    html += '<div class="alignment-row"><span class="alignment-label" style="color: var(--text-muted); font-size: 0.65rem;">' + (start + 1) + '</span>';
    html += '<div class="alignment-chars">';
    // Ruler ticks
    for (let i = 0; i < seqChunk.length; i++) {
      const pos = start + i + 1;
      const showTick = pos % 10 === 0;
      html += `<span class="char" style="color: var(--text-muted); font-size: 0.55rem; opacity: ${showTick ? 1 : 0};">${showTick ? pos : '·'}</span>`;
    }
    html += '</div></div>';

    // Sequence row
    html += '<div class="alignment-row"><span class="alignment-label">Seq</span>';
    html += '<div class="alignment-chars">';
    for (const ch of seqChunk) {
      html += `<span class="char seq-char">${ch}</span>`;
    }
    html += '</div></div>';

    // Structure row
    html += '<div class="alignment-row"><span class="alignment-label">Str</span>';
    html += '<div class="alignment-chars">';
    for (const ch of strChunk) {
      html += `<span class="char structure-char" data-ss="${ch}" data-tooltip="${Q8_INFO[ch]?.name || ch}">${ch}</span>`;
    }
    html += '</div></div>';

    html += '</div>';
  }

  container.innerHTML = html;

  // Animate in with staggered delay
  const chars = container.querySelectorAll('.structure-char');
  chars.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'scale(0.5)';
    setTimeout(() => {
      el.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    }, Math.min(i * 8, 800));
  });
}

function buildBarChart(counts, total) {
  const container = document.getElementById('bar-chart');
  const states = ['H', 'E', 'L', 'T', 'S', 'G', 'B', 'I'];

  let html = '';
  for (const ss of states) {
    const count = counts[ss] || 0;
    const percent = total > 0 ? (count / total * 100) : 0;
    const info = Q8_INFO[ss];

    html += `
      <div class="bar-row">
        <span class="bar-label">
          <span class="color-dot" style="background: ${info.color}"></span>
          ${info.name}
        </span>
        <div class="bar-track">
          <div class="bar-fill" data-ss="${ss}" data-percent="${percent}" style="width: 0%;">
            <span class="bar-value">${count}</span>
          </div>
        </div>
        <span class="bar-percent">${percent.toFixed(1)}%</span>
      </div>
    `;
  }

  container.innerHTML = html;

  // Animate bars
  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.percent + '%';
      });
    }, 100);
  });
}

// ---- Scroll Reveal ----
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// ---- Utilities ----
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.style.animation = 'shake 0.5s ease';
  setTimeout(() => { el.style.animation = ''; }, 500);

  // Add shake keyframes if not present
  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `@keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }`;
    document.head.appendChild(style);
  }
}
