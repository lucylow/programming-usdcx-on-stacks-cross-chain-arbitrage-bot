;; USDCx: USDC-backed stablecoin on Stacks
;; Implements SIP-010 fungible token standard with role-based access control

;; ==========================================
;; Trait Implementation
;; ==========================================

(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ==========================================
;; Constants & Error Codes
;; ==========================================

(define-constant TOKEN-NAME "Circle USD (USDCx)")
(define-constant TOKEN-SYMBOL "USDCx")
(define-constant TOKEN-DECIMALS u6)
(define-constant TOKEN-URI u"https://www.circle.com/usdc")

(define-constant GOVERNANCE-ROLE "governance")
(define-constant MINT-ROLE "mint")
(define-constant PAUSE-ROLE "pause")

(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-INVALID-AMOUNT (err u1001))
(define-constant ERR-INSUFFICIENT-BALANCE (err u1002))
(define-constant ERR-PROTOCOL-PAUSED (err u1003))
(define-constant ERR-INVALID-PRINCIPAL (err u1004))

;; ==========================================
;; Data Variables & Maps
;; ==========================================

(define-fungible-token usdcx)

(define-data-var token-name (string-ascii 32) TOKEN-NAME)
(define-data-var token-symbol (string-ascii 10) TOKEN-SYMBOL)
(define-data-var token-uri (optional (string-utf8 256)) (some TOKEN-URI))

(define-map roles 
  { role: (string-ascii 20), account: principal } 
  { enabled: bool }
)

(define-data-var protocol-paused bool false)
(define-constant CONTRACT-OWNER tx-sender)

;; Grant deployer governance role
(map-set roles 
  { role: GOVERNANCE-ROLE, account: CONTRACT-OWNER } 
  { enabled: true }
)

;; ==========================================
;; Private Helper Functions
;; ==========================================

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

;; ==========================================
;; SIP-010 Standard Functions
;; ==========================================

(define-public (transfer 
  (amount uint) 
  (sender principal) 
  (recipient principal) 
  (memo (optional (buff 34)))
)
  (begin
    ;; Allow tx-sender or contract-caller (e.g. vault withdrawing on behalf of operator)
    (asserts!
      (or (is-eq sender tx-sender) (is-eq sender contract-caller))
      ERR-NOT-AUTHORIZED
    )
    (try! (check-not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-transfer? usdcx amount sender recipient))
    (match memo 
      m (print { event: "transfer", from: sender, to: recipient, amount: amount, memo: m })
      (print { event: "transfer", from: sender, to: recipient, amount: amount })
    )
    (ok true)
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usdcx account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply usdcx))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; ==========================================
;; Protocol Functions (Privileged)
;; ==========================================

(define-public (protocol-mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-protocol-caller MINT-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (try! (check-not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-mint? usdcx amount recipient))
    (print { event: "mint", amount: amount, recipient: recipient, total-supply: (ft-get-supply usdcx) })
    (ok true)
  )
)

(define-public (protocol-burn (amount uint) (owner principal))
  (begin
    (asserts! (is-protocol-caller MINT-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (try! (check-not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-burn? usdcx amount owner))
    (print { event: "burn", amount: amount, owner: owner, total-supply: (ft-get-supply usdcx) })
    (ok true)
  )
)

(define-public (update-role 
  (role (string-ascii 20)) 
  (account principal) 
  (enabled bool)
)
  (begin
    (asserts! (is-protocol-caller GOVERNANCE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (map-set roles { role: role, account: account } { enabled: enabled })
    (print { event: "role-updated", role: role, account: account, enabled: enabled })
    (ok true)
  )
)

(define-public (protocol-pause)
  (begin
    (asserts! (is-protocol-caller PAUSE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused true)
    (print { event: "protocol-paused" })
    (ok true)
  )
)

(define-public (protocol-unpause)
  (begin
    (asserts! (is-protocol-caller PAUSE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused false)
    (print { event: "protocol-unpaused" })
    (ok true)
  )
)

(define-read-only (is-paused)
  (ok (var-get protocol-paused))
)

(define-read-only (has-role (role (string-ascii 20)) (account principal))
  (ok (is-protocol-caller role account))
)
