(function () {
  "use strict";

  var INQUIRY_ENDPOINT = (window.INQUIRY_ENDPOINT || "/inquiry").replace(/\/+$/, "");
  var SQM_PER_HA = 10000;

  document.addEventListener("DOMContentLoaded", function () {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    var header = document.getElementById("siteHeader");
    var nav = document.getElementById("mainNav");
    var navToggle = document.getElementById("navToggle");

    function onScroll() {
      if (window.scrollY > 24) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    var cropData = {
      tomato: { label: "tomatoes", usdPerSqm: 22, usdPerHa: 220000 },
      leaf: { label: "leafy greens", usdPerSqm: 16, usdPerHa: 160000 },
      strawberry: { label: "strawberries", usdPerSqm: 28, usdPerHa: 280000 },
      flower: { label: "flowers", usdPerSqm: 26, usdPerHa: 260000 },
      seedling: { label: "seedlings", usdPerSqm: 20, usdPerHa: 200000 },
      other: { label: "other crops", usdPerSqm: 14, usdPerHa: 140000 }
    };

    var typeData = {
      film: { label: "multi-span film", usdPerSqm: 70, usdPerHa: 700000 },
      glass: { label: "glass", usdPerSqm: 185, usdPerHa: 1850000 }
    };

    var currentUnit = "ha";
    var calcAreaInput = document.getElementById("areaInput");
    var calcUnitLabel = document.getElementById("areaUnitLabel");
    var inquiryAreaInput = document.getElementById("inquiryArea");
    var inquiryUnitLabel = document.getElementById("inquiryUnitLabel");
    var unitButtons = Array.prototype.slice.call(document.querySelectorAll("#calcUnitToggle button"));

    function setUnit(unit) {
      currentUnit = unit;
      unitButtons.forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-unit") === unit);
      });
      calcUnitLabel.textContent = unit;
      inquiryUnitLabel.textContent = unit;
    }

    unitButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setUnit(btn.getAttribute("data-unit"));
      });
    });

    function parseNumber(input) {
      var value = parseFloat(input.value);
      if (isNaN(value) || value <= 0) return null;
      return value;
    }

    function toSqm(value) {
      return currentUnit === "ha" ? value * SQM_PER_HA : value;
    }

    function formatUsd(value) {
      if (value >= 1000000) {
        return "$" + (value / 1000000).toFixed(1) + "M";
      }
      if (value >= 1000) {
        return "$" + (value / 1000).toFixed(0) + "K";
      }
      return "$" + value.toFixed(0);
    }

    var calcForm = document.getElementById("calcForm");
    var calcResult = document.getElementById("calcResult");
    var resultInvestment = document.getElementById("resultInvestment");
    var resultRevenue = document.getElementById("resultRevenue");
    var resultPayback = document.getElementById("resultPayback");

    function runCalculation(sqm, cropKey, typeKey) {
      var crop = cropData[cropKey] || cropData.other;
      var type = typeData[typeKey] || typeData.film;

      var investLow = sqm * type.usdPerSqm * 0.62;
      var investHigh = sqm * type.usdPerSqm;
      var revenueLow = sqm * crop.usdPerSqm * 0.55;
      var revenueHigh = sqm * crop.usdPerSqm;
      var paybackLow = investLow / revenueHigh;
      var paybackHigh = investHigh / revenueLow;

      return {
        investment: formatUsd(investLow) + " - " + formatUsd(investHigh),
        revenue: formatUsd(revenueLow) + " - " + formatUsd(revenueHigh) + "/yr",
        payback: paybackLow.toFixed(1) + " - " + paybackHigh.toFixed(1) + " years"
      };
    }

    calcForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var area = parseNumber(calcAreaInput);
      if (!area) {
        calcAreaInput.focus();
        return;
      }

      var result = runCalculation(
        toSqm(area),
        document.getElementById("cropSelect").value,
        document.getElementById("typeSelect").value
      );

      resultInvestment.textContent = result.investment;
      resultRevenue.textContent = result.revenue;
      resultPayback.textContent = result.payback;
      calcResult.hidden = false;
      calcResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.getElementById("toInquiryBtn").addEventListener("click", function () {
      var area = parseNumber(calcAreaInput);
      var crop = document.getElementById("cropSelect").value;
      if (area) {
        inquiryAreaInput.value = area;
      }
      inquiryCrop.value = crop;
      document.getElementById("inquiry").scrollIntoView({ behavior: "smooth" });
      setTimeout(function () {
        document.getElementById("inquiryName").focus();
      }, 700);
    });

    var inquiryForm = document.getElementById("inquiryForm");
    var inquiryCrop = document.getElementById("inquiryCrop");
    var inquiryType = document.getElementById("inquiryType");
    var formSuccess = document.getElementById("formSuccess");
    var formError = document.getElementById("formError");
    var resetFormBtn = document.getElementById("resetFormBtn");
    var submitBtn = document.getElementById("submitBtn");

    function showError(message) {
      formError.textContent = message;
      formError.classList.add("visible");
    }

    function hideError() {
      formError.textContent = "";
      formError.classList.remove("visible");
    }

    function setSubmitting(submitting) {
      submitBtn.disabled = submitting;
      submitBtn.querySelector("span").textContent = submitting ? "Submitting..." : "Submit Inquiry";
    }

    inquiryForm.addEventListener("submit", function (event) {
      event.preventDefault();
      hideError();

      var name = document.getElementById("inquiryName").value.trim();
      var email = document.getElementById("inquiryEmail").value.trim();
      var phone = document.getElementById("inquiryWhatsapp").value.trim();
      var country = document.getElementById("inquiryCountry").value.trim();
      var area = parseNumber(inquiryAreaInput);
      var message = document.getElementById("inquiryMessage").value.trim();
      var hp = document.getElementById("hpInput").value.trim();

      if (hp) {
        showInquirySuccess();
        return;
      }
      if (!name) {
        showError("Please enter your name or company.");
        document.getElementById("inquiryName").focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Please enter a valid email address.");
        document.getElementById("inquiryEmail").focus();
        return;
      }
      if (!area) {
        showError("Please enter your growing area.");
        inquiryAreaInput.focus();
        return;
      }

      var payload = {
        source: "en-site",
        name: name,
        email: email,
        phone: phone,
        country: country,
        area: area,
        unit: currentUnit,
        crop: inquiryCrop.value,
        greenhouse_type: inquiryType.value,
        message: message,
        page: location.pathname,
        submitted_at: new Date().toISOString()
      };

      setSubmitting(true);
      fetch(INQUIRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (resp) {
          if (!resp.ok) {
            throw new Error("HTTP " + resp.status);
          }
          return resp.json().catch(function () {
            return {};
          });
        })
        .then(function () {
          showInquirySuccess(name, area, inquiryCrop.value);
        })
        .catch(function () {
          setSubmitting(false);
          showError("Submission failed. Please try again later or contact us directly.");
        });
    });

    function showInquirySuccess(name, area, cropKey) {
      inquiryForm.hidden = true;
      formSuccess.hidden = false;
      var message = "Thank you. Your project details were submitted successfully and our team will prepare your tailored proposal.";
      if (name) {
        message = name + ", thank you. Your project details were submitted successfully and our team will prepare your tailored proposal.";
      }
      formSuccess.querySelector("p").textContent = message;
    }

    resetFormBtn.addEventListener("click", function () {
      inquiryForm.reset();
      formSuccess.hidden = true;
      inquiryForm.hidden = false;
    });
  });

  function fixCrossSiteLinks() {
    var isLocal = /^(127\.0\.0\.1|localhost)$/i.test(location.hostname);
    document.querySelectorAll("a[data-local][data-public]").forEach(function (link) {
      link.href = isLocal ? link.getAttribute("data-local") : link.getAttribute("data-public");
    });
  }
  fixCrossSiteLinks();
})();
