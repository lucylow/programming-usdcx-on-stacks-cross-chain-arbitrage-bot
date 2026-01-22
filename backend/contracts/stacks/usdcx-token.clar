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
(define-constant ERR-INSUFFICIENT-ALLOWANCE (err u1005))
(define-constant ERR-MAX-SUPPLY-EXCEEDED (err u1006))
(define-constant ERR-INVALID-RECIPIENT (err u1007))

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
(define-data-var max-supply (optional uint) none)
(define-constant CONTRACT-OWNER tx-sender)

;; Allowance map: owner -> spender -> amount
(define-map allowances
  { owner: principal, spender: principal }
  uint
)

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

(define-private (check-max-supply (amount uint))
  (match (var-get max-supply)
    max (asserts! (<= (+ (ft-get-supply usdcx) amount) max) ERR-MAX-SUPPLY-EXCEEDED)
    (ok true)
  )
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
    (asserts! (is-some (some recipient)) ERR-INVALID-RECIPIENT)
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

;; Mint/burn allow tx-sender (direct) or contract-caller (e.g. bridge)
(define-private (can-mint-or-burn)
  (or
    (is-protocol-caller MINT-ROLE tx-sender)
    (is-protocol-caller MINT-ROLE contract-caller)
  )
)

(define-public (protocol-mint (amount uint) (recipient principal))
  (begin
    (asserts! (can-mint-or-burn) ERR-NOT-AUTHORIZED)
    (try! (check-not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (check-max-supply amount))
    (try! (ft-mint? usdcx amount recipient))
    (print { event: "mint", amount: amount, recipient: recipient, total-supply: (ft-get-supply usdcx) })
    (ok true)
  )
)

(define-public (protocol-burn (amount uint) (owner principal))
  (begin
    (asserts! (can-mint-or-burn) ERR-NOT-AUTHORIZED)
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

;; ==========================================
;; Allowance Functions (SIP-010 Standard)
;; ==========================================

(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances { owner: owner, spender: spender })))
)

(define-public (approve (spender principal) (amount uint))
  (begin
    (try! (check-not-paused))
    (asserts! (is-some (some spender)) ERR-INVALID-PRINCIPAL)
    (map-set allowances { owner: tx-sender, spender: spender } amount)
    (print { event: "approval", owner: tx-sender, spender: spender, amount: amount })
    (ok true)
  )
)

(define-public (transfer-from
  (amount uint)
  (sender principal)
  (recipient principal)
  (memo (optional (buff 34)))
)
  (let
    (
      (allowance-amount (default-to u0 (map-get? allowances { owner: sender, spender: tx-sender })))
    )
    (begin
      (try! (check-not-paused))
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      (asserts! (>= allowance-amount amount) ERR-INSUFFICIENT-ALLOWANCE)
      (asserts! (is-some (some recipient)) ERR-INVALID-RECIPIENT)
      (try! (ft-transfer? usdcx amount sender recipient))
      (map-set allowances { owner: sender, spender: tx-sender } (- allowance-amount amount))
      (match memo 
        m (print { event: "transfer-from", spender: tx-sender, from: sender, to: recipient, amount: amount, memo: m })
        (print { event: "transfer-from", spender: tx-sender, from: sender, to: recipient, amount: amount })
      )
      (ok true)
    )
  )
)

;; ==========================================
;; Batch Operations
;; ==========================================

(define-public (batch-transfer
  (recipients (list 20 { recipient: principal, amount: uint }))
)
  (begin
    (try! (check-not-paused))
    (try! (fold batch-transfer-helper recipients (ok true)))
    (ok true)
  )
)

(define-private (batch-transfer-helper
  (item { recipient: principal, amount: uint })
  (result (response bool uint))
)
  (let
    (
      (recipient (get recipient item))
      (amount (get amount item))
    )
    (begin
      (try! result)
      (asserts! (> amount u0) ERR-INVALID-AMOUNT)
      (asserts! (is-some (some recipient)) ERR-INVALID-RECIPIENT)
      (try! (ft-transfer? usdcx amount tx-sender recipient))
      (print { event: "batch-transfer", to: recipient, amount: amount })
      (ok true)
    )
  )
)

;; ==========================================
;; Supply Management
;; ==========================================

(define-public (set-max-supply (max uint))
  (begin
    (asserts! (is-protocol-caller GOVERNANCE-ROLE tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (>= max (ft-get-supply usdcx)) ERR-INVALID-AMOUNT)
    (var-set max-supply (some max))
    (print { event: "max-supply-set", max: max })
    (ok true)
  )
)

(define-read-only (get-max-supply)
  (ok (var-get max-supply))
)
