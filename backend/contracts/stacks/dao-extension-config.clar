;; contracts/dao-extension-config.clar
;; Config extension controlled by the DAO

(define-data-var important-parameter uint u0)
(define-data-var fee-percentage uint u30) ;; 0.3% default
(define-data-var min-trade-amount uint u1000000) ;; 1 USDC minimum
(define-data-var max-slippage uint u100) ;; 1% max slippage

(define-constant ERR-UNAUTHORIZED (err u200))

;; DAO core contract reference
(define-constant DAO-CORE .simple-dao)

;; Execute proposal - called by DAO
(define-public (execute-proposal (value uint) (caller principal))
  (begin
    (asserts! (is-eq contract-caller DAO-CORE) ERR-UNAUTHORIZED)
    (var-set important-parameter value)
    (ok true)
  )
)

;; Set fee percentage via DAO
(define-public (set-fee-percentage (value uint) (caller principal))
  (begin
    (asserts! (is-eq contract-caller DAO-CORE) ERR-UNAUTHORIZED)
    (var-set fee-percentage value)
    (ok true)
  )
)

;; Set min trade amount via DAO
(define-public (set-min-trade-amount (value uint) (caller principal))
  (begin
    (asserts! (is-eq contract-caller DAO-CORE) ERR-UNAUTHORIZED)
    (var-set min-trade-amount value)
    (ok true)
  )
)

;; Set max slippage via DAO
(define-public (set-max-slippage (value uint) (caller principal))
  (begin
    (asserts! (is-eq contract-caller DAO-CORE) ERR-UNAUTHORIZED)
    (var-set max-slippage value)
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-important-parameter)
  (ok (var-get important-parameter))
)

(define-read-only (get-fee-percentage)
  (ok (var-get fee-percentage))
)

(define-read-only (get-min-trade-amount)
  (ok (var-get min-trade-amount))
)

(define-read-only (get-max-slippage)
  (ok (var-get max-slippage))
)

(define-read-only (get-all-config)
  (ok {
    important-parameter: (var-get important-parameter),
    fee-percentage: (var-get fee-percentage),
    min-trade-amount: (var-get min-trade-amount),
    max-slippage: (var-get max-slippage)
  })
)
