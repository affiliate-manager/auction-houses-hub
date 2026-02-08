// ===========================
// Bridging Loan Calculator
// ===========================
// Pure client-side calculator. No backend needed.
// Shows estimated bridging loan costs and links to Lendlord.

const LoanCalc = (() => {
  'use strict';

  const BRIDGING_URL = 'https://app.lendlord.io/bridging-application?country=uk&utm_source=Lendlord&utm_campaign=auction_houses_hub';

  let overlay, panel;
  let inputPrice, inputDeposit, inputTerm, inputRate;
  let outputLoanAmount, outputMonthly, outputArrangement, outputTotal, outputLtv;
  let applyBtn;

  function init() {
    // Create the calculator overlay if it doesn't exist
    if (document.getElementById('loanCalcOverlay')) return;

    const html = `
      <div class="loan-calc-overlay" id="loanCalcOverlay">
        <div class="loan-calc-panel">
          <div class="loan-calc-header">
            <div>
              <h3>Bridging Loan Calculator</h3>
              <p>Estimate your auction finance costs</p>
            </div>
            <button class="loan-calc-close" id="loanCalcClose">&times;</button>
          </div>

          <div class="loan-calc-body">
            <div class="loan-calc-inputs">
              <div class="loan-calc-field">
                <label>Property Price</label>
                <div class="loan-calc-input-wrap">
                  <span class="loan-calc-prefix">£</span>
                  <input type="number" id="loanCalcPrice" value="200000" min="10000" step="5000">
                </div>
              </div>

              <div class="loan-calc-field">
                <label>Deposit</label>
                <div class="loan-calc-input-wrap">
                  <input type="number" id="loanCalcDeposit" value="25" min="0" max="75" step="5">
                  <span class="loan-calc-suffix">%</span>
                </div>
                <span class="loan-calc-hint">Typical: 25% (75% LTV)</span>
              </div>

              <div class="loan-calc-field">
                <label>Loan Term</label>
                <div class="loan-calc-input-wrap">
                  <input type="number" id="loanCalcTerm" value="12" min="1" max="36" step="1">
                  <span class="loan-calc-suffix">months</span>
                </div>
                <span class="loan-calc-hint">Typical: 6-18 months</span>
              </div>

              <div class="loan-calc-field">
                <label>Monthly Interest Rate</label>
                <div class="loan-calc-input-wrap">
                  <input type="number" id="loanCalcRate" value="0.75" min="0.3" max="2.0" step="0.05">
                  <span class="loan-calc-suffix">%</span>
                </div>
                <span class="loan-calc-hint">Typical: 0.55% - 1.2% per month</span>
              </div>
            </div>

            <div class="loan-calc-results">
              <div class="loan-calc-result-header">Estimated Costs</div>

              <div class="loan-calc-result-row">
                <span>Loan Amount</span>
                <strong id="loanCalcLoanAmount">£150,000</strong>
              </div>

              <div class="loan-calc-result-row">
                <span>LTV</span>
                <strong id="loanCalcLtv">75%</strong>
              </div>

              <div class="loan-calc-result-row">
                <span>Monthly Interest</span>
                <strong id="loanCalcMonthly">£1,125</strong>
              </div>

              <div class="loan-calc-result-row">
                <span>Arrangement Fee (2%)</span>
                <strong id="loanCalcArrangement">£3,000</strong>
              </div>

              <div class="loan-calc-result-row total">
                <span>Total Finance Cost</span>
                <strong id="loanCalcTotal">£16,500</strong>
              </div>

              <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-lg loan-calc-apply" id="loanCalcApply">
                Apply for Bridging Finance
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>

              <p class="loan-calc-disclaimer">
                This calculator provides estimates only. Actual rates and terms will depend on the property, borrower profile, and lender assessment. Rates shown are indicative.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Get refs
    overlay = document.getElementById('loanCalcOverlay');
    inputPrice = document.getElementById('loanCalcPrice');
    inputDeposit = document.getElementById('loanCalcDeposit');
    inputTerm = document.getElementById('loanCalcTerm');
    inputRate = document.getElementById('loanCalcRate');
    outputLoanAmount = document.getElementById('loanCalcLoanAmount');
    outputMonthly = document.getElementById('loanCalcMonthly');
    outputArrangement = document.getElementById('loanCalcArrangement');
    outputTotal = document.getElementById('loanCalcTotal');
    outputLtv = document.getElementById('loanCalcLtv');
    applyBtn = document.getElementById('loanCalcApply');

    // Close
    document.getElementById('loanCalcClose').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });

    // Recalculate on input
    [inputPrice, inputDeposit, inputTerm, inputRate].forEach(el => {
      el.addEventListener('input', calculate);
    });

    calculate();
  }

  function open(prefillPrice) {
    init();
    if (prefillPrice && prefillPrice > 0) {
      inputPrice.value = prefillPrice;
    }
    calculate();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function calculate() {
    const price = parseFloat(inputPrice.value) || 0;
    const depositPct = parseFloat(inputDeposit.value) || 0;
    const term = parseInt(inputTerm.value) || 12;
    const monthlyRate = parseFloat(inputRate.value) || 0.75;

    const loanAmount = price * (1 - depositPct / 100);
    const ltv = 100 - depositPct;
    const monthlyInterest = loanAmount * (monthlyRate / 100);
    const arrangementFee = loanAmount * 0.02; // 2% arrangement fee
    const totalInterest = monthlyInterest * term;
    const totalCost = totalInterest + arrangementFee;

    // Update outputs
    outputLoanAmount.textContent = formatCurrency(loanAmount);
    outputLtv.textContent = ltv.toFixed(0) + '%';
    outputMonthly.textContent = formatCurrency(monthlyInterest);
    outputArrangement.textContent = formatCurrency(arrangementFee);
    outputTotal.textContent = formatCurrency(totalCost);

    // Update apply button URL with values
    if (applyBtn) {
      const url = new URL(BRIDGING_URL);
      url.searchParams.set('amount', Math.round(loanAmount));
      applyBtn.href = url.toString();
    }
  }

  function formatCurrency(val) {
    return '£' + Math.round(val).toLocaleString('en-GB');
  }

  return { init, open, close };
})();

// Init calculator on DOM ready (creates it lazily on first open)
document.addEventListener('DOMContentLoaded', () => {
  // Calculator is lazy-initialized on first open, but we expose it globally
  window.LoanCalc = LoanCalc;
});
