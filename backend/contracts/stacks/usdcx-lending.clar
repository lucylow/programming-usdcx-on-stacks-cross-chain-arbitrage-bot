;; USDCx Lending Pool Contract
;; Allows users to lend USDCx and earn interest, or borrow USDCx with collateral
;; Implements a simple lending protocol with interest rate model

(define-constant ERR-NOT-AUTHORIZED (err u4000))
(define-constant ERR-INVALID-AMOUNT (err u4001))
(define-constant ERR-INSUFFICIENT-BALANCE (err u4002))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u4003))
(define-constant ERR-PROTOCOL-PAUSED (err u4004))
(define-constant ERR-INVALID-PRINCIPAL (err u4005))
(define-constant ERR-INSUFFICIENT-COLLATERAL (err u4006))
(define-constant ERR-BORROW-LIMIT-EXCEEDED (err u4007))
(define-constant ERR-LOAN-NOT-FOUND (err u4008))
(define-constant ERR-LOAN-ACTIVE (err u4009))
(define-constant ERR-INVALID-INTEREST-RATE (err u4010))

;; Interest rate constants (basis points per block)
(define-constant BASE_LENDING_RATE u50)    ;; 0.5% per block (annualized ~5%)
(define-constant BASE_BORROWING_RATE u100) ;; 1% per block (annualized ~10%)
(define-constant UTILIZATION_THRESHOLD u8000) ;; 80% utilization threshold
(define-constant MAX_UTILIZATION u9500)    ;; 95% max utilization
(define-constant COLLATERAL_RATIO u15000)  ;; 150% collateralization ratio (150%)

(define-constant GOVERNANCE-ROLE "governance")
(define-constant PAUSE-ROLE "pause")

;; Lending position
(define-map lenders
  principal
  {
    supplied-amount: uint,
    interest-earned: uint,
    last-update-block: uint
  }
)

;; Borrowing position
(define-map borrowers
  principal
  {
    borrowed-amount: uint,
    interest-owed: uint,
    collateral-amount: uint,
    last-update-block: uint,
    active: bool
  }
)

;; Pool state
(define-data-var total-supplied uint u0)
(define-data-var total-borrowed uint u0)
(define-data-var total-collateral uint u0)
(define-data-var protocol-paused bool false)
(define-data-var governance principal tx-sender)

;; Role management
(define-map roles
  { role: (string-ascii 20), account: principal }
  { enabled: bool }
)

;; Initialize roles
(map-set roles
  { role: GOVERNANCE-ROLE, account: tx-sender }
  { enabled: true }
)

(map-set roles
  { role: PAUSE-ROLE, account: tx-sender }
  { enabled: true }
)

;; Helper functions
(define-private (is-protocol-caller (role (string-ascii 20)) (caller principal))
  (default-to false
    (get enabled
      (map-get? roles { role: role, account: caller })
    )
  )
)

(define-private (check-not-paused)
  (asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
)

;; Calculate utilization rate (0-10000 basis points)
(define-private (calculate-utilization)
  (let
    (
      (supplied (var-get total-supplied))
      (borrowed (var-get total-borrowed))
    )
    (if (is-eq supplied u0)
      (ok u0)
      (ok (/ (* borrowed u10000) supplied))
    )
  )
)

;; Calculate dynamic interest rate based on utilization
(define-private (calculate-lending-rate (utilization uint))
  (if (>= utilization UTILIZATION_THRESHOLD)
    ;; High utilization: increase rate
    (+ BASE_LENDING_RATE (/ (* (- utilization UTILIZATION_THRESHOLD) u10) u100))
    ;; Low utilization: base rate
    (ok BASE_LENDING_RATE)
  )
)

(define-private (calculate-borrowing-rate (utilization uint))
  (if (>= utilization UTILIZATION_THRESHOLD)
    ;; High utilization: increase rate significantly
    (+ BASE_BORROWING_RATE (/ (* (- utilization UTILIZATION_THRESHOLD) u20) u100))
    ;; Low utilization: base rate
    (ok BASE_BORROWING_RATE)
  )
)

;; Calculate interest accrued
(define-private (calculate-interest
  (principal uint)
  (rate-bps uint)
  (blocks-elapsed uint)
)
  (/ (* principal rate-bps blocks-elapsed) u10000)
)

;; Update lender interest
(define-private (update-lender-interest (lender principal))
  (let
    (
      (lender-data (unwrap-panic (map-get? lenders lender)))
      (supplied (get supplied-amount lender-data))
      (last-block (get last-update-block lender-data))
      (blocks-elapsed (- block-height last-block))
      (utilization (unwrap-panic (calculate-utilization)))
      (lending-rate (unwrap-panic (calculate-lending-rate utilization)))
      (interest (calculate-interest supplied lending-rate blocks-elapsed))
    )
    (begin
      (map-set lenders lender
        {
          supplied-amount: supplied,
          interest-earned: (+ (get interest-earned lender-data) interest),
          last-update-block: block-height
        }
      )
      (ok interest)
    )
  )
)

;; Update borrower interest
(define-private (update-borrower-interest (borrower principal))
  (let
    (
      (borrower-data (unwrap-panic (map-get? borrowers borrower)))
      (borrowed (get borrowed-amount borrower-data))
      (last-block (get last-update-block borrower-data))
      (blocks-elapsed (- block-height last-block))
      (utilization (unwrap-panic (calculate-utilization)))
      (borrowing-rate (unwrap-panic (calculate-borrowing-rate utilization)))
      (interest (calculate-interest borrowed borrowing-rate blocks-elapsed))
    )
    (begin
      (map-set borrowers borrower
        {
          borrowed-amount: borrowed,
          interest-owed: (+ (get interest-owed borrower-data) interest),
          collateral-amount: (get collateral-amount borrower-data),
          last-update-block: block-height,
          active: (get active borrower-data)
        }
      )
      (ok interest)
    )
  )
)

;; ==========================================
;; Public Functions
;; ==========================================

;; Supply USDCx to the lending pool
(define-public (supply (amount uint))
  (let
    (
      (lender tx-sender)
      (lender-data (map-get? lenders lender))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      
      ;; Transfer USDCx from lender to contract
      (try! (contract-call? .usdcx-token transfer amount lender (as-contract tx-sender) none))
      
      ;; Update lender position
      (match lender-data
        existing (begin
          (try! (update-lender-interest lender))
          (let
            (
              (updated-data (unwrap-panic (map-get? lenders lender)))
              (new-supplied (+ (get supplied-amount updated-data) amount))
            )
            (map-set lenders lender
              {
                supplied-amount: new-supplied,
                interest-earned: (get interest-earned updated-data),
                last-update-block: block-height
              }
            )
          )
        )
        (map-set lenders lender
          {
            supplied-amount: amount,
            interest-earned: u0,
            last-update-block: block-height
          }
        )
      )
      
      (var-set total-supplied (+ (var-get total-supplied) amount))
      
      (print {
        event: "supplied",
        lender: lender,
        amount: amount,
        total-supplied: (var-get total-supplied)
      })
      
      (ok amount)
    )
  )
)

;; Withdraw supplied USDCx (with accrued interest)
(define-public (withdraw (amount uint))
  (let
    (
      (lender tx-sender)
      (lender-data (unwrap-panic (map-get? lenders lender)))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      
      ;; Update interest first
      (try! (update-lender-interest lender))
      
      (let
        (
          (updated-data (unwrap-panic (map-get? lenders lender)))
          (supplied (get supplied-amount updated-data))
          (interest (get interest-earned updated-data))
          (total-available (+ supplied interest))
        )
        (begin
          (asserts! (>= total-available amount) ERR-INSUFFICIENT-BALANCE)
          
          ;; Check available liquidity (consider borrowed amount)
          (let
            (
              (available-liquidity (- (var-get total-supplied) (var-get total-borrowed)))
            )
            (asserts! (>= available-liquidity amount) ERR-INSUFFICIENT-LIQUIDITY)
            
            ;; Calculate how much comes from principal vs interest
            (let
              (
                (withdraw-from-principal (if (>= supplied amount) amount supplied))
                (withdraw-from-interest (if (>= supplied amount) u0 (- amount supplied)))
              )
              (begin
                ;; Mint interest if needed
                (if (> withdraw-from-interest u0)
                  (try! (contract-call? .usdcx-token protocol-mint withdraw-from-interest lender))
                )
                
                ;; Transfer principal
                (if (> withdraw-from-principal u0)
                  (try! (contract-call? .usdcx-token transfer withdraw-from-principal (as-contract tx-sender) lender none))
                )
                
                ;; Update lender position
                (map-set lenders lender
                  {
                    supplied-amount: (- supplied withdraw-from-principal),
                    interest-earned: (- interest withdraw-from-interest),
                    last-update-block: block-height
                  }
                )
                
                (var-set total-supplied (- (var-get total-supplied) withdraw-from-principal))
                
                (print {
                  event: "withdrawn",
                  lender: lender,
                  amount: amount,
                  from-principal: withdraw-from-principal,
                  from-interest: withdraw-from-interest
                })
                
                (ok amount)
              )
            )
          )
        )
      )
    )
  )
)

;; Borrow USDCx with collateral
(define-public (borrow (amount uint) (collateral-amount uint))
  (let
    (
      (borrower tx-sender)
      (borrower-data (map-get? borrowers borrower))
      (utilization (unwrap-panic (calculate-utilization)))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      (asserts! (> collateral-amount u0) ERR-INVALID-AMOUNT)
      (asserts! (< utilization MAX_UTILIZATION) ERR-INSUFFICIENT-LIQUIDITY)
      
      ;; Check collateral ratio: (collateral * 10000) / (borrowed + amount) >= COLLATERAL_RATIO
      (match borrower-data
        existing (begin
          (try! (update-borrower-interest borrower))
          (let
            (
              (updated-data (unwrap-panic (map-get? borrowers borrower)))
              (total-borrowed (+ (get borrowed-amount updated-data) (get interest-owed updated-data)))
              (new-borrowed (+ total-borrowed amount))
              (total-collateral (+ (get collateral-amount updated-data) collateral-amount))
              (collateral-ratio (/ (* total-collateral u10000) new-borrowed))
            )
            (asserts! (>= collateral-ratio COLLATERAL_RATIO) ERR-INSUFFICIENT-COLLATERAL)
            
            ;; Transfer collateral from borrower
            (try! (contract-call? .usdcx-token transfer collateral-amount borrower (as-contract tx-sender) none))
            
            ;; Update borrower position
            (map-set borrowers borrower
              {
                borrowed-amount: (+ (get borrowed-amount updated-data) amount),
                interest-owed: (get interest-owed updated-data),
                collateral-amount: total-collateral,
                last-update-block: block-height,
                active: true
              }
            )
          )
        )
        (begin
          ;; New borrower: check collateral ratio
          (let
            (
              (collateral-ratio (/ (* collateral-amount u10000) amount))
            )
            (asserts! (>= collateral-ratio COLLATERAL_RATIO) ERR-INSUFFICIENT-COLLATERAL)
            
            ;; Transfer collateral
            (try! (contract-call? .usdcx-token transfer collateral-amount borrower (as-contract tx-sender) none))
            
            ;; Create borrower position
            (map-set borrowers borrower
              {
                borrowed-amount: amount,
                interest-owed: u0,
                collateral-amount: collateral-amount,
                last-update-block: block-height,
                active: true
              }
            )
          )
        )
      )
      
      ;; Transfer borrowed amount to borrower
      (try! (contract-call? .usdcx-token transfer amount (as-contract tx-sender) borrower none))
      
      (var-set total-borrowed (+ (var-get total-borrowed) amount))
      (var-set total-collateral (+ (var-get total-collateral) collateral-amount))
      
      (print {
        event: "borrowed",
        borrower: borrower,
        amount: amount,
        collateral: collateral-amount
      })
      
      (ok amount)
    )
  )
)

;; Repay borrowed USDCx
(define-public (repay (amount uint))
  (let
    (
      (borrower tx-sender)
      (borrower-data (unwrap-panic (map-get? borrowers borrower)))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      (asserts! (get active borrower-data) ERR-LOAN-NOT-FOUND)
      
      ;; Update interest first
      (try! (update-borrower-interest borrower))
      
      (let
        (
          (updated-data (unwrap-panic (map-get? borrowers borrower)))
          (borrowed (get borrowed-amount updated-data))
          (interest (get interest-owed updated-data))
          (total-owed (+ borrowed interest))
        )
        (begin
          (asserts! (>= amount total-owed) ERR-INVALID-AMOUNT)
          
          ;; Transfer repayment from borrower
          (try! (contract-call? .usdcx-token transfer total-owed borrower (as-contract tx-sender) none))
          
          ;; Return excess collateral if any
          (let
            (
              (collateral (get collateral-amount updated-data))
              (excess (if (> amount total-owed) (- amount total-owed) u0))
            )
            (begin
              ;; Return collateral
              (if (> collateral u0)
                (try! (contract-call? .usdcx-token transfer collateral (as-contract tx-sender) borrower none))
              )
              
              ;; Mark loan as inactive
              (map-set borrowers borrower
                {
                  borrowed-amount: u0,
                  interest-owed: u0,
                  collateral-amount: u0,
                  last-update-block: block-height,
                  active: false
                }
              )
              
              (var-set total-borrowed (- (var-get total-borrowed) borrowed))
              (var-set total-collateral (- (var-get total-collateral) collateral))
              
              (print {
                event: "repaid",
                borrower: borrower,
                amount: total-owed,
                collateral-returned: collateral
              })
              
              (ok total-owed)
            )
          )
        )
      )
    )
  )
)

;; ==========================================
;; Read-Only Functions
;; ==========================================

(define-read-only (get-lender-position (lender principal))
  (ok (map-get? lenders lender))
)

(define-read-only (get-borrower-position (borrower principal))
  (ok (map-get? borrowers borrower))
)

(define-read-only (get-pool-stats)
  (ok {
    total-supplied: (var-get total-supplied),
    total-borrowed: (var-get total-borrowed),
    total-collateral: (var-get total-collateral),
    utilization: (unwrap-panic (calculate-utilization)),
    lending-rate: (unwrap-panic (calculate-lending-rate (unwrap-panic (calculate-utilization)))),
    borrowing-rate: (unwrap-panic (calculate-borrowing-rate (unwrap-panic (calculate-utilization))))
  })
)

;; ==========================================
;; Governance Functions
;; ==========================================

(define-public (update-role
  (role (string-ascii 20))
  (account principal)
  (enabled bool)
)
  (begin
    (asserts! (is-protocol-caller GOVERNANCE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (map-set roles { role: role, account: account } { enabled: enabled })
    (ok true)
  )
)

(define-public (protocol-pause)
  (begin
    (asserts! (is-protocol-caller PAUSE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused true)
    (ok true)
  )
)

(define-public (protocol-unpause)
  (begin
    (asserts! (is-protocol-caller PAUSE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused false)
    (ok true)
  )
)

