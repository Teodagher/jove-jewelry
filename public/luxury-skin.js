/* ==========================================================
   MAISON JOVÉ — LUXURY SKIN ENHANCER (Design UI only)
   - Adds:
     1) Preset tiles section (Toi et Moi examples)
     2) Sticky "Your Piece" summary card (reads existing selections)
   - Does NOT change:
     ✅ pricing logic (it reads price already displayed if present)
     ✅ cart logic
     ✅ admin
   - It only sets existing option inputs and fires change events.
   ========================================================== */

(function(){
  // ---- Only run on customize pages (guard) ----
  var path = window.location.pathname || "";
  var isCustomize = /\/customize/i.test(path) || document.querySelector("[data-customize-page]");
  if(!isCustomize) return;

  // ---- Helper: safe query ----
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function toast(msg){
    var t = $(".mj-toast");
    if(!t){
      t = document.createElement("div");
      t.className = "mj-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("is-show");
    setTimeout(function(){ t.classList.remove("is-show"); }, 1600);
  }

  // ==========================================================
  // 1) Wrap page into premium layout (NO markup assumptions)
  // ==========================================================
  document.documentElement.classList.add("mj-customize");

  // Try to find a main content container. Fallback to body.
  var main = $("main") || $(".page") || $(".content") || document.body;

  // Optional hero injection (only if there is a page title already)
  // We avoid removing anything; we just add a styled header at top.
  var existingH1 = $("h1", main);
  if(existingH1 && !$(".mj-hero")){
    var hero = document.createElement("section");
    hero.className = "mj-hero";
    var inner = document.createElement("div");
    inner.className = "mj-hero-inner";

    // Keep the existing title text (do not change content).
    var kicker = document.createElement("div");
    kicker.className = "mj-kicker";
    kicker.textContent = "Customisation";

    var title = document.createElement("h1");
    title.textContent = existingH1.textContent.trim();

    var sub = document.createElement("p");
    sub.textContent = "Start from a signature preset, then tailor metal, stones and proportions.";

    inner.appendChild(kicker);
    inner.appendChild(title);
    inner.appendChild(sub);
    hero.appendChild(inner);

    // Insert hero before main's first child
    main.insertBefore(hero, main.firstChild);
  }

  // Find the configurator area (common patterns). If unknown, we just proceed.
  var configurator = $(".customize, .customiser, .configurator, [data-configurator]") || main;

  // Create layout only once
  if(!$(".mj-layout")){
    var layout = document.createElement("div");
    layout.className = "mj-layout";

    var left = document.createElement("div");
    var right = document.createElement("div");

    // Move configurable content into left WITHOUT deleting cart/pricing
    // We wrap: existing configurator into a panel
    var leftPanel = document.createElement("div");
    leftPanel.className = "mj-panel";
    left.appendChild(leftPanel);

    // Put configurator inside the panel (keep original DOM)
    leftPanel.appendChild(configurator);

    // Right sticky summary (new)
    var sticky = document.createElement("aside");
    sticky.className = "mj-sticky";
    sticky.innerHTML =
      '<div class="mj-kicker">Your Piece</div>' +
      '<div class="mj-summary-title">Summary</div>' +
      '<div class="mj-summary-rows" id="mjSummaryRows"></div>' +
      '<div class="mj-price"><small>Estimated total</small><strong id="mjSummaryPrice">—</strong></div>' +
      '<div style="margin-top:14px;">' +
      '  <button class="mj-btn-primary mj-btn-primary--wide" id="mjAddToCartProxy" style="width:100%;padding:12px 14px;border-radius:20px;border:1px solid rgba(15,15,15,.30);background:#0f0f0f;color:#fff;box-shadow:0 10px 26px rgba(0,0,0,.07);cursor:pointer;">Add to cart</button>' +
      '</div>' +
      '<div style="margin-top:14px;font-size:12px;color:rgba(15,15,15,.62);line-height:1.6;">' +
      '• Made to order<br>• Certified stones<br>• Free shipping (AU)<br>• Lifetime workmanship' +
      '</div>';

    right.appendChild(sticky);

    // Insert layout after hero
    var heroEl = $(".mj-hero", main);
    if(heroEl){
      main.insertBefore(layout, heroEl.nextSibling);
    } else {
      main.insertBefore(layout, main.firstChild);
    }

    layout.appendChild(left);
    layout.appendChild(right);
  }

  // ==========================================================
  // 2) Preset tiles (Toi et Moi examples) — DESIGN + convenience only
  // ==========================================================
  // Dev MUST map these to existing option controls on your current page.
  // Update selectors below to match your actual fields (no pricing touched).
  var SELECTORS = {
    // Try common name/id patterns first; dev can adjust:
    metal: 'select[name*="metal"], select[id*="metal"], input[name*="metal"]',
    stoneType: 'select[name*="stone"], select[id*="stone"], input[name*="stone"]',
    stoneAShape: 'select[name*="stoneA"], select[id*="stoneA"], select[name*="shapeA"], select[id*="shapeA"]',
    stoneBShape: 'select[name*="stoneB"], select[id*="stoneB"], select[name*="shapeB"], select[id*="shapeB"]',
    // If carat is selectable:
    stoneACarat: 'select[name*="caratA"], input[name*="caratA"], select[id*="caratA"], input[id*="caratA"]',
    stoneBCarat: 'select[name*="caratB"], input[name*="caratB"], select[id*="caratB"], input[id*="caratB"]',
    // Price display (we READ only)
    priceText: '.price, .product-price, [data-price], .customize-price, .total-price',
    // Add to cart (we CLICK existing)
    addToCart: 'button[name="add"], button[id*="add"], button[class*="add"], button[type="submit"]'
  };

  function setControlValue(control, value){
    if(!control) return false;
    var tag = (control.tagName || "").toLowerCase();

    if(tag === "select"){
      // Try exact match first
      var opts = Array.from(control.options);
      var found = opts.find(function(o){ return (o.value||"").toLowerCase() === String(value).toLowerCase(); })
               || opts.find(function(o){ return (o.textContent||"").trim().toLowerCase() === String(value).toLowerCase(); });
      if(found){
        control.value = found.value;
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    } else if(tag === "input"){
      // radio/checkbox/text
      if(control.type === "radio" || control.type === "checkbox"){
        control.checked = true;
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      } else {
        control.value = value;
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // Build preset section only if not already there
  if(!$(".mj-presets")){
    var presetsWrap = document.createElement("section");
    presetsWrap.className = "mj-presets mj-panel";

    presetsWrap.innerHTML =
      '<div class="mj-kicker">Start from a signature design</div>' +
      '<div class="mj-title" style="font-size:20px;font-weight:500;margin-top:6px;">Choose a preset, then customise everything</div>' +
      '<div class="mj-subtitle" style="margin-top:10px;">These presets only pre-select your existing options — pricing remains your current pricing.</div>' +
      '<div class="mj-preset-grid" style="margin-top:16px;" id="mjPresetGrid"></div>';

    // Insert at top of left column (inside first mj-panel)
    var leftPanel = $(".mj-layout .mj-panel");
    if(leftPanel){
      leftPanel.insertBefore(presetsWrap, leftPanel.firstChild);
    }
  }

  // IMPORTANT: Use only EXISTING image URLs already on your website.
  // Your dev should swap these with actual product / campaign image URLs already used on maisonjove.com.
  var PRESETS = [
    {
      name: "Classic Pair",
      desc: "Pear + Emerald. Balanced, timeless.",
      image: "/images/valentines-hero-1.jpg",
      apply: function(){
        setControlValue($(SELECTORS.metal), "18k Yellow Gold");
        setControlValue($(SELECTORS.stoneType), "Lab Diamond");
        setControlValue($(SELECTORS.stoneAShape), "Pear");
        setControlValue($(SELECTORS.stoneBShape), "Emerald");
        setControlValue($(SELECTORS.stoneACarat), "1.0");
        setControlValue($(SELECTORS.stoneBCarat), "1.0");
      }
    },
    {
      name: "Romantic",
      desc: "Pear + Oval. Soft, luminous.",
      image: "/images/valentines-hero-2.jpg",
      apply: function(){
        setControlValue($(SELECTORS.metal), "18k Rose Gold");
        setControlValue($(SELECTORS.stoneType), "Lab Diamond");
        setControlValue($(SELECTORS.stoneAShape), "Pear");
        setControlValue($(SELECTORS.stoneBShape), "Oval");
        setControlValue($(SELECTORS.stoneACarat), "0.9");
        setControlValue($(SELECTORS.stoneBCarat), "1.1");
      }
    },
    {
      name: "Modern",
      desc: "Emerald + Radiant. Crisp & contemporary.",
      image: "/images/valentines-hero-3.jpg",
      apply: function(){
        setControlValue($(SELECTORS.metal), "18k White Gold");
        setControlValue($(SELECTORS.stoneType), "Lab Diamond");
        setControlValue($(SELECTORS.stoneAShape), "Emerald");
        setControlValue($(SELECTORS.stoneBShape), "Radiant");
        setControlValue($(SELECTORS.stoneACarat), "1.2");
        setControlValue($(SELECTORS.stoneBCarat), "1.0");
      }
    }
  ];

  var grid = $("#mjPresetGrid");
  if(grid && grid.children.length === 0){
    PRESETS.forEach(function(p, idx){
      var tile = document.createElement("div");
      tile.className = "mj-preset-tile";
      tile.innerHTML =
        '<div class="mj-preset-media"><img src="'+p.image+'" alt="'+p.name+'" style="width:100%;height:100%;object-fit:cover;display:block;"></div>' +
        '<div class="mj-preset-body">' +
        '  <div class="mj-preset-name">'+p.name+'</div>' +
        '  <div class="mj-preset-desc">'+p.desc+'</div>' +
        '  <button type="button" style="margin-top:12px;width:100%;padding:12px 14px;border-radius:20px;border:1px solid rgba(15,15,15,.30);background:#0f0f0f;color:#fff;box-shadow:0 10px 26px rgba(0,0,0,.07);cursor:pointer;">Use this preset</button>' +
        '</div>';

      var btn = tile.querySelector("button");
      btn.addEventListener("click", function(){
        p.apply();
        toast("Preset applied — you can still change anything.");
        updateSummary();
      });

      grid.appendChild(tile);
    });
  }

  // ==========================================================
  // 3) Sticky Summary (reads existing selections + existing price display)
  // ==========================================================
  function readValue(sel){
    var el = $(sel);
    if(!el) return "—";
    if(el.tagName.toLowerCase() === "select"){
      return (el.options[el.selectedIndex] && el.options[el.selectedIndex].textContent.trim()) || "—";
    }
    if(el.tagName.toLowerCase() === "input"){
      return el.value ? String(el.value).trim() : "—";
    }
    return (el.textContent || "").trim() || "—";
  }

  function readPriceText(){
    var priceEl = $(SELECTORS.priceText);
    if(priceEl){
      var t = (priceEl.textContent || "").trim();
      if(t) return t;
    }
    return "—";
  }

  function updateSummary(){
    var rows = $("#mjSummaryRows");
    if(!rows) return;

    var metal = readValue(SELECTORS.metal);
    var stoneType = readValue(SELECTORS.stoneType);
    var aShape = readValue(SELECTORS.stoneAShape);
    var bShape = readValue(SELECTORS.stoneBShape);
    var aCarat = readValue(SELECTORS.stoneACarat);
    var bCarat = readValue(SELECTORS.stoneBCarat);

    // Build rows (pure UI)
    rows.innerHTML = "";
    function addRow(label, value){
      var r = document.createElement("div");
      r.className = "mj-row";
      r.innerHTML = "<span>"+label+"</span><span>"+value+"</span>";
      rows.appendChild(r);
    }

    addRow("Metal", metal);
    addRow("Stone Type", stoneType);
    addRow("Stone A", (aShape !== "—" ? aShape : "—") + (aCarat !== "—" ? (", "+aCarat) : ""));
    addRow("Stone B", (bShape !== "—" ? bShape : "—") + (bCarat !== "—" ? (", "+bCarat) : ""));

    var price = readPriceText();
    var priceNode = $("#mjSummaryPrice");
    if(priceNode) priceNode.textContent = price;
  }

  // Hook summary to change events (no logic changes)
  function bindChange(sel){
    $all(sel).forEach(function(el){
      el.addEventListener("change", updateSummary);
      el.addEventListener("input", updateSummary);
    });
  }
  bindChange(SELECTORS.metal);
  bindChange(SELECTORS.stoneType);
  bindChange(SELECTORS.stoneAShape);
  bindChange(SELECTORS.stoneBShape);
  bindChange(SELECTORS.stoneACarat);
  bindChange(SELECTORS.stoneBCarat);

  // Add-to-cart proxy: clicks your existing button (does not alter cart)
  var proxy = $("#mjAddToCartProxy");
  if(proxy){
    proxy.addEventListener("click", function(){
      var real = $(SELECTORS.addToCart);
      if(real){
        real.click();
      } else {
        toast("Add to cart button not found — dev: map SELECTORS.addToCart.");
      }
    });
  }

  // Initial render
  updateSummary();

})();
